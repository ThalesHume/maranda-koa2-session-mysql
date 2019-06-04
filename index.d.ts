import { Sequelize, Model } from 'sequelize';
import { ParameterizedContext } from 'koa';

declare class Session extends Model {
  sid: string;
  data: any;
  expiry: number;
  CreateAt: number;
  gc():Promise<number>;

  static readonly sessKey:string;
  static gc_probability: number;
  static gc_type: boolean;
  static GC():Promise<number>
}
export interface SessionCtx { Session: Session }
interface initOptions {
  tableName?: string,
  gc_type?: boolean,
  gc_probability?: number,
  sync?: boolean,
  force?: boolean,
}
declare function SessionMiddware<T extends SessionCtx>(sequelize: Sequelize, initOptions?: initOptions): (ctx: ParameterizedContext<any, T>, next: () => Promise<any>) => Promise<void>
export default SessionMiddware;
export * from 'sequelize';
