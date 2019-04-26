import {Sequelize, Model} from 'sequelize';
import {ParameterizedContext} from 'koa';

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
declare class Session extends Model{
    sid: string;
    data: string;
    expiry: number;
    CreateAt: number;
    static readonly sessKey:string;
    static readonly sessAge:number;
    static gc_probability:number;
    static gc_type:boolean;
}
declare function Init(sequelize:Sequelize, initOptions?:initOptions):void
declare function GC():Promise<number>
declare function Middware<T extends Ctx>(ctx:ParameterizedContext<any, T>, next:()=>Promise<any>):any
declare function Create<T extends Ctx>(ctx:ParameterizedContext<any,T>, expiry?:number, SessionData?:T['Session']):Promise<Session>
declare function Destroy<T extends Ctx>(ctx:ParameterizedContext<any,T>):Promise<[number,Session[]]>

export {Ctx, initOptions, Init, Middware, Create, Destroy, GC}