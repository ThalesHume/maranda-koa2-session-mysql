import { Sequelize, Model } from 'sequelize';
import { ParameterizedContext } from 'koa';

declare class Session extends Model {
  readonly id: string;
  readonly createAt: Date;
  expiryTo: Date;
  data: object;
  expiry: number;
  gc():Promise<number>;
}
export interface SessionCtx { session: Session }
export interface initOptions {
  tableName?: string,
  gcType?: 'auto' | 'manul',
  gcProbDenominator?: number,
  gcProbMolecular?: number,
  sync?: boolean,
  force?: boolean,
  sessKey?: string,
  logger?: boolean | ((num: number) => any)
}
declare function sessionMiddware<T extends SessionCtx>(sequelize: Sequelize, initOptions?: initOptions): (ctx: ParameterizedContext<any, T>, next: () => Promise<any>) => Promise<void>
export default sessionMiddware;
export * from 'sequelize';
