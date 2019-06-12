import { Sequelize, Model, DataTypes, Op } from 'sequelize';
import { ParameterizedContext } from 'koa';

class Session extends Model {
  public static gcProbMolecular: number;
  public static gcProbDenominator: number;
  public static gcType: 'auto' | 'manul';
  public static sessKey: string;

  readonly id: string;
  readonly createAt: Date;
  expiryTo: Date;
  get data(): object { return JSON.parse(JSON.stringify(this.getDataValue('data') || {})); }
  set data(value: object) { this.setDataValue('data', value); }
  get expiry(): number { return this.expiryTo.getTime() - this.createAt.getTime(); }
  set expiry(value: number) { this.expiryTo = new Date(this.createAt.getTime() + value); }
  gc() { return Session.destroy({ where: { expiryTo: { [Op.lt]: new Date() } } }); }
}
interface SessionCtx { session: Session }
interface SessionInitOptions {
  tableName?: string,
  gcType?: 'auto' | 'manul',
  gcProbDenominator?: number,
  gcProbMolecular?: number,
  sync?: boolean,
  force?: boolean,
  sessKey?: string,
  logger?: boolean | ((num: number) => any)
}
function SessionMiddware<T extends SessionCtx>(sequelize: Sequelize, initOptions?: SessionInitOptions) {
  const {
    tableName = undefined,
    gcType = 'auto',
    gcProbMolecular = 1,
    gcProbDenominator = 100,
    sync = true,
    force = false,
    sessKey = 'koa2:sess',
    logger = true,
  } = initOptions || {};
  Session.sessKey = sessKey;
  Session.gcType = gcType;
  Session.gcProbMolecular = Math.abs(gcProbMolecular);
  Session.gcProbDenominator = Math.abs(gcProbDenominator);
  Session.init(
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      data: { type: DataTypes.JSON, defaultValue: {} },
      expiryTo: { type: DataTypes.DATE, defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
      createAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
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
    const sessKey = ctx.cookies.get(Session.sessKey);
    if (sessKey) {
      const session = await Session.findOne({ where: { id:sessKey } });
      ctx.session = session && session.expiryTo.getTime() > Date.now() ? session : Session.build();
    } else {
      ctx.session = Session.build();
    }
    await next();
    if (ctx.session.changed()) {
      if (ctx.session.isNewRecord || ctx.session.changed('expiryTo')) {
        if (ctx.session.changed('expiryTo')) {
          ctx.cookies.set(Session.sessKey, ctx.session.id, { path: '/', overwrite: true, expires: ctx.session.expiryTo })
        } else {
          ctx.cookies.set(Session.sessKey, ctx.session.id, { path: '/', overwrite: true });
        }
      }
      await ctx.session.save();
    }
    if (Session.gcType == 'auto' && Math.random() * Session.gcProbDenominator <= Session.gcProbMolecular) {
      if (logger == true) console.log(`[${Date()}]: Auto collect ${await ctx.session.gc()} session garbage.`)
      if (typeof logger == 'function') logger(await ctx.session.gc());
    }
  }
}
export default SessionMiddware;
export * from 'sequelize';
