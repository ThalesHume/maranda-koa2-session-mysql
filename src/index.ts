import { Sequelize, Model, DataTypes, Op } from 'sequelize';
import { ParameterizedContext } from 'koa';

class Session<T extends Session.DataType> extends Model {
  readonly id: string;
  readonly createAt: Date;
  expiryTo: Date;
  data: T = this.__proxyData(this.getDataValue('data'));
  //get data(): object { return JSON.parse(JSON.stringify(this.getDataValue('data'))); }
  //set data(value: object) { JSON.stringify(value) == JSON.stringify(this.getDataValue('data')) || this.setDataValue('data', value); } 
  get expiry(): number { return this.expiryTo.getTime() - this.createAt.getTime(); }
  set expiry(value: number) { this.expiryTo = new Date(this.createAt.getTime() + value); }
  async gc() { return await Session.destroy({ where: { expiryTo: { [Op.lt]: new Date() } } }); }

  private __proxyData<T extends Session.DataType>(target: T): T {
    return new Proxy(target, {
      set: (target, key, value) => {
        this.changed('data', true);
        return Reflect.set(target, key, value);
      },
      get: (target, key: string | number) => {
        return typeof target[key] !== 'object' ? target[key] : this.__proxyData(<T>target[key]);
      }
    })
  }
}
namespace Session {
  interface Ctx<T extends DataType> { session: Session<T> }
  interface InitOptions {
    tableName?: string,
    gcOpts: {
      type?: 'auto' | 'manul',
      probDenominator?: number,
      probMolecular?: number
    },
    sync?: {
      enable: boolean,
      force: boolean
    },
    sessKey?: string,
    logger?: boolean | ((num: number) => any),
    defaultExpiry?: number
  }
  export interface DataType {
    [key: string]: number | string | boolean | DataType | Array<number | string | boolean | DataType> | undefined
    [index: number]: number | string | boolean | DataType | Array<number | string | boolean | DataType> | undefined
  }
  export function middware<T extends Ctx<DataType>>(sequelize: Sequelize, initOptions?: InitOptions) {
    const {
      tableName = undefined,
      gcOpts = { type: 'auto', probMolecular: 1, probDenominator: 100 },
      sync = { enable: false, force: false },
      sessKey = 'koa2:sess',
      logger = true,
      defaultExpiry = 24 * 60 * 60 * 1000
    } = initOptions || {};
    Session.init(
      {
        id: { type: DataTypes.CHAR(36), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        data: { type: DataTypes.JSON, defaultValue: {} },
        expiryTo: { type: DataTypes.DATE, defaultValue: () => new Date(Date.now() + defaultExpiry) },
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
    if (sync && sync.enable) Session.sync({ force: sync.force }).catch(e => console.log(e));
    return async (ctx: ParameterizedContext<any, T>, next: () => Promise<any>) => {
      const id = ctx.cookies.get(sessKey);
      if (id) {
        const session = await Session.findOne({ where: { id } });
        ctx.session = session && session.expiryTo.getTime() > Date.now() ? session : Session.build();
      } else {
        ctx.session = Session.build();
      }
      await next();
      if (ctx.session.changed()) {
        if (ctx.session.isNewRecord || ctx.session.changed('expiryTo')) {
          if (ctx.session.changed('expiryTo')) {
            ctx.cookies.set(sessKey, ctx.session.id, { path: '/', overwrite: true, expires: ctx.session.expiryTo })
          } else {
            ctx.cookies.set(sessKey, ctx.session.id, { path: '/', overwrite: true });
          }
        }
        await ctx.session.save();
      }
      if (gcOpts.type == 'auto' && Math.random() * Math.abs(gcOpts.probDenominator!) <= Math.abs(gcOpts.probMolecular!)) {
        if (logger == true) console.log(`[${Date()}]: Auto collect ${await ctx.session.gc()} session garbage.`)
        if (typeof logger == 'function') logger(await ctx.session.gc());
      }
    }
  }
}
export default Session;
export * from 'sequelize';

