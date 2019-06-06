import { Sequelize, Model, DataTypes, Op } from 'sequelize';
import { ParameterizedContext } from 'koa';

class Session extends Model {
  public static gc_prob_molecular: number;
  public static gc_prob_denominator: number;
  public static gc_type: 'auto' | 'manul';
  public static sessKey: string;

  readonly SessKey: string;
  readonly CreateAt: Date;
  ExpiryTo: Date;
  get SessData(): object { return JSON.parse(JSON.stringify(this.getDataValue('SessData') || {})); }
  set SessData(value: object) { this.setDataValue('SessData', value); }
  get expiry(): number { return this.ExpiryTo.getTime() - this.CreateAt.getTime(); }
  set expiry(value: number) { this.ExpiryTo = new Date(this.CreateAt.getTime() + value); }
  GC() { return Session.destroy({ where: { ExpiryTo: { [Op.lt]: new Date() } } }); }
}
interface SessionCtx { Session: Session }
interface initOptions {
  tableName?: string,
  gc_type?: 'auto' | 'manul',
  gc_prob_denominator?: number,
  gc_prob_molecular?: number,
  sync?: boolean,
  force?: boolean,
  sessKey?: string
}
function SessionMiddware<T extends SessionCtx>(sequelize: Sequelize, initOptions?: initOptions) {
  const {
    tableName = undefined,
    gc_type = 'auto',
    gc_prob_molecular = 1,
    gc_prob_denominator = 100,
    sync = true,
    force = false,
    sessKey = 'koa2:sess',
  } = initOptions || {};
  Session.sessKey = sessKey;
  Session.gc_type = gc_type;
  Session.gc_prob_molecular = Math.abs(gc_prob_molecular);
  Session.gc_prob_denominator = Math.abs(gc_prob_denominator);
  Session.init(
    {
      SessKey: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      SessData: { type: DataTypes.JSON, defaultValue: {} },
      ExpiryTo: { type: DataTypes.DATE, defaultValue: () => new Date(Date.now() + 2 * 60 * 1000) },
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
  if (sync) Session.sync({ force }).catch(e => console.log(e));
  return async (ctx: ParameterizedContext<any, T>, next: () => Promise<any>) => {
    const SessKey = ctx.cookies.get(Session.sessKey);
    if (SessKey) {
      const session = await Session.findOne({ where: { SessKey } });
      ctx.Session = session && session.ExpiryTo.getTime() > Date.now() ? session : Session.build();
    } else {
      ctx.Session = Session.build();
    }
    await next();
    if (ctx.Session.changed()) {
      if (ctx.Session.isNewRecord || ctx.Session.changed('ExpiryTo') || ctx.Session.changed('SessKey')) {
        ctx.cookies.set(Session.sessKey, ctx.Session.SessKey, { path: '/', overwrite: true, expires: ctx.Session.ExpiryTo })
      }
      await ctx.Session.save();
    }
    if (Session.gc_type == 'auto' && Math.random() * Session.gc_prob_denominator <= Session.gc_prob_molecular) {
      console.log(`[${Date()}]: Auto collect ${await ctx.Session.GC()} session garbage.`)
    }
  }
}
export default SessionMiddware;
export * from 'sequelize';
