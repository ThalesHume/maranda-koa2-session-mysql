import { Sequelize, Model } from 'sequelize';
import { ParameterizedContext } from 'koa';
declare class Session<T extends Session.DataType> extends Model {
    readonly id: string;
    readonly createAt: Date;
    expiryTo: Date;
    data: T;
    expiry: number;
    gc(): Promise<number>;
    private __proxyData;
}
declare namespace Session {
    interface Ctx<T extends DataType> {
        session: Session<T>;
    }
    interface InitOptions {
        tableName?: string;
        gcOpts: {
            type?: 'auto' | 'manul';
            probDenominator?: number;
            probMolecular?: number;
        };
        sync?: {
            enable: boolean;
            force: boolean;
        };
        sessKey?: string;
        logger?: boolean | ((num: number) => any);
        defaultExpiry?: number;
    }
    interface DataType {
        [key: string]: number | string | boolean | DataType | Array<number | string | boolean | DataType>;
        [index: number]: number | string | boolean | DataType | Array<number | string | boolean | DataType>;
    }
    function middware<T extends Ctx<DataType>>(sequelize: Sequelize, initOptions?: InitOptions): (ctx: ParameterizedContext<any, T>, next: () => Promise<any>) => Promise<void>;
}
export default Session;
export * from 'sequelize';
