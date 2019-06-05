import { Sequelize, Model, QueryTypes, DataTypes, Op } from 'sequelize';
import { ParameterizedContext } from 'koa';

class Session extends Model {
  public static gc_probability: number;
  public static gc_type: 'auto'|'manul';
  public static sessKey: string;

  readonly SessKey: string;
  readonly CreateAt: Date;
  ExpiryTo: Date;
  get SessData(): object { return JSON.parse(JSON.stringify(this.getDataValue('SessData')||{})); }
  set SessData(value:object) { this.setDataValue('SessData', value); }
  get expiry(): number { return this.ExpiryTo.getTime() - this.CreateAt.getTime(); }
  set expiry(value: number) { this.ExpiryTo = new Date(this.CreateAt.getTime() + value); }
  GC() { return Session.destroy({where:{ExpiryTo:{[Op.lt]:new Date()}}, logging:false});}
}
interface SessionCtx { Session: Session }
interface initOptions {
  tableName?: string,
  gc_type?: 'auto'|'manul',
  gc_probability?: number,
  sync?: boolean,
  force?: boolean,
  sessKey?: string
}
function SessionMiddware<T extends SessionCtx>(sequelize: Sequelize, initOptions?: initOptions) {
  const { 
    tableName = undefined, 
    gc_type = 'auto', 
    gc_probability = 20,
    sync = true,
    force = false,
    sessKey = 'koa2:sess',
  } = initOptions || {};
  Session.sessKey = sessKey;
  Session.gc_type = gc_type;
  Session.gc_probability = Math.round(gc_probability);
  Session.init(
    {
      SessKey: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      SessData: { type: DataTypes.JSON, defaultValue: {} },
      ExpiryTo: { type: DataTypes.DATE, defaultValue: ()=>new Date(Date.now()+2*60*1000) },
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
    const SessKey = ctx.cookies.get(Session.sessKey);
    if (SessKey) {
      const session = await Session.findOne({ where: { SessKey }, logging: false });
      ctx.Session = session && session.ExpiryTo.getTime() > Date.now() ? session : Session.build();
    } else {
      ctx.Session = Session.build();
    }
    await next();
    if (ctx.Session.changed()) {
      if (ctx.Session.isNewRecord || ctx.Session.changed('ExpiryTo') || ctx.Session.changed('SessKey')){
        ctx.cookies.set(Session.sessKey, ctx.Session.SessKey, { path: '/', overwrite: true, expires: ctx.Session.ExpiryTo }) 
      }
      await ctx.Session.save();
    }
    if (Session.gc_type == 'auto' && Math.round(Math.random() * 100) <= Session.gc_probability) {
      console.log(`[${Date()}]: Auto collect ${await ctx.Session.GC()} session garbage.`)
    }
  }
}
export default SessionMiddware;
export * from 'sequelize';
