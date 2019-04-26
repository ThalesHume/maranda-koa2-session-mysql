import {Sequelize, DataTypes, Model, QueryTypes, QueryInterface} from 'sequelize';
import {ParameterizedContext} from 'koa';
import UUID from 'uuid-js';

interface Ctx{
    Session: {
        [key: string]: string | number;
    },
    SessKey?:string
}
interface initOptions{
    tableName?:string, 
    gc_type?:boolean, 
    gc_probability?:number
}
class Session extends Model{
    sid: string;
    data: string;
    expiry: number;
    CreateAt: number;
    static readonly sessKey:string = 'koa2:sess';
    static readonly sessAge:number = 60*60*24*1000;
    static gc_probability:number;
    static gc_type:boolean;
}
function Init(sequelize:Sequelize, initOptions?:initOptions){
    const {tableName = undefined, gc_type = true, gc_probability = 10} = initOptions || {};
    Session.gc_type = gc_type;
    Session.gc_probability = Math.round(gc_probability);
    Session.init({
        sid: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        data: DataTypes.STRING,
        expiry: DataTypes.BIGINT({length: 11}),
        CreateAt: DataTypes.BIGINT({length: 11}),
    },{
        sequelize,
        timestamps: false,
        underscored: true,
        paranoid:false,
        tableName,
    })
    Session.sync({force:false,logging:false}).catch((e)=>{console.log(e)});
}
function GC(){
    const schema = Session.getTableName();
    let tableName:string;
    if (typeof schema == 'string') {
        tableName = `\`${schema}\``;
    } else {
        tableName = `\`${schema.schema}\`${schema.delimiter}\`${schema.tableName}\``
    }
    const sql = `DELETE FROM ${tableName} WHERE \`create_at\` < unix_timestamp(now())*1000 - \`expiry\``;
    return (<Sequelize>(Session.sequelize)).query(sql, {type:QueryTypes.BULKDELETE, logging:false});

}
async function Middware<T extends Ctx>(ctx:ParameterizedContext<any, T>, next:()=>Promise<any>){
    if (Session.gc_type && Math.round(Math.random()*100) <= Session.gc_probability) {
        console.log(`[${Date()}]: collect ${await GC()} session garbage.`)
    }
    ctx.Session = {};
    let sid = ctx.cookies.get(Session.sessKey), session:Session|null;
    if (sid) {
        session = await Session.findOne({where:{sid},logging:false});
        if (session && (Date.now() - session.CreateAt < session.expiry)) {
            Object.assign(ctx.Session, JSON.parse(session.data))
            ctx.SessKey = sid;
        }
    }
    const oldsess = JSON.stringify(ctx.Session);
    await next();
    const newsess = JSON.stringify(ctx.Session);
    if(oldsess !== newsess && ctx.SessKey){
        await Session.update({data: newsess},{where:{sid:ctx.SessKey},logging:false});
    }
}
async function Create<T extends Ctx>(ctx:ParameterizedContext<any,T>, expiry?:number, SessionData?:T['Session']){
    const date = Date.now(), uuid = UUID.create().toString();
    const session = await Session.create({
        sid: uuid,
        data: SessionData == undefined ? null : JSON.stringify(SessionData),
        CreateAt: date,
        expiry: expiry == undefined ? Session.sessAge : expiry
    },{logging:false});
    ctx.cookies.set(Session.sessKey, uuid, {path: '/',overwrite: true,maxAge: expiry == undefined ? Session.sessAge : expiry})
    return session;
}
function Destroy<T extends Ctx>(ctx:ParameterizedContext<any,T>){
    let session = Session.update({expiry: 0}, {where:{sid:<string>(ctx.SessKey)},logging:false});
    delete ctx.SessKey;
    return session;
}

export {Init, Middware, Create, Destroy, GC}