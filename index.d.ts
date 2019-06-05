import { Sequelize, Model } from 'sequelize';
import { ParameterizedContext } from 'koa';

declare class Session extends Model {
  readonly sid: string;
  readonly CreateAt: Date;
  expiry: number;
  data: object
  ExpiryTo: Date;
  gc():Promise<number>;
  static readonly sessKey:string;
  static gc_probability: number;
  static gc_type: boolean;
  static GC():Promise<number>
}
export interface SessionCtx { Session: Session }
export interface initOptions {
  tableName?: string,
  gc_type?: 'auto'|'manul',
  gc_probability?: number,
  sync?: boolean,
  force?: boolean,
  sessKey?: string
}
declare function SessionMiddware<T extends SessionCtx>(sequelize: Sequelize, initOptions?: initOptions): (ctx: ParameterizedContext<any, T>, next: () => Promise<any>) => Promise<void>
export default SessionMiddware;
export * from 'sequelize';
