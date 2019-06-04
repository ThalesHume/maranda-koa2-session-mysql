import { Sequelize, Model, QueryTypes, DataTypes } from 'sequelize';
import { ParameterizedContext } from 'koa';
import dottie from "dottie";

class Session extends Model {
  private sid: string;
  private data: object;
  private expiry: number;
  private CreateAt: number;
  
  public get Sid() : string {
    return this.sid;
  }
  public get createTime() : number {
    return this.CreateAt;
  }
  public get expiryTime() : number {
    return this.CreateAt +  this.expiry;
  }
  public set expiryTime(v : number) {
    this.expiry = v - this.CreateAt;
  }
  
  public get Sdata() : any {
    return JSON.parse(JSON.stringify(this.data));
  }
  
  public set Sdata(v : any) {
    this.setDataValue();
  }
  
  
  gc() { return Session.GC() };

  static readonly sessKey: string = 'koa2:sess';
  static gc_probability: number;
  static gc_type: boolean;
  static GC() {
    const schema = Session.getTableName();
    let tableName: string;
    if (typeof schema == 'string') {
      tableName = `\`${schema}\``;
    } else {
      tableName = `\`${schema.schema}\`${schema.delimiter}\`${schema.tableName}\``
    }
    const sql = `DELETE FROM ${tableName} WHERE \`create_at\` < unix_timestamp(now())*1000 - \`expiry\``;
    return (<Sequelize>(Session.sequelize)).query(sql, { type: QueryTypes.BULKDELETE, logging: false });
  }
}
interface SessionCtx { Session: Session }
interface initOptions {
  tableName?: string,
  gc_type?: boolean,
  gc_probability?: number,
  sync?: boolean,
  force?: boolean,
}
function SessionMiddware<T extends SessionCtx>(sequelize: Sequelize, initOptions?: initOptions) {
  const { 
    tableName = undefined, 
    gc_type = true, 
    gc_probability = 1,
    sync = true,
    force = false
  } = initOptions || {};
  Session.gc_type = gc_type;
  Session.gc_probability = Math.round(gc_probability);
  Session.init(
    {
      sid: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      data: { type: DataTypes.JSON, defaultValue: {}},
      expiry: { type: DataTypes.INTEGER, defaultValue: 2 * 60 * 1000},
      CreateAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, 
    { 
      sequelize, 
      tableName, 
      timestamps: false, 
      underscored: true, 
      paranoid: false, 
    }
  )
  if (sync) Session.sync({ force, logging: false }).catch(e => console.log(e));
  return async (ctx: ParameterizedContext<any, T>, next: () => Promise<any>) => {
    const sid = ctx.cookies.get(Session.sessKey);
    if (sid) {
      const session = await Session.findOne({ where: { sid }, logging: false });
      ctx.Session = session && (Date.now() - session.CreateAt < session.expiry) ? session : Session.build();
    } else {
      ctx.Session = Session.build();
    }
    await next();
    if (ctx.Session.changed()) {
      if (ctx.Session.isNewRecord){
        ctx.cookies.set(Session.sessKey, ctx.Session.sid, { path: '/', overwrite: true, maxAge:ctx.Session.expiry }) 
      }
      await ctx.Session.save();
    }
    if (Session.gc_type && Math.round(Math.random() * 100) <= Session.gc_probability) {
      console.log(`[${Date()}]: collect ${await Session.GC()} session garbage.`)
    }
  }
}
export default SessionMiddware;
export * from 'sequelize';
