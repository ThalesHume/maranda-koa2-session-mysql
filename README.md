# useage

##### npm i --save maranda-koa2-session-mysql

### for the complete maranda koa server case, with static, session-mysql, koabody, router

### please visit https://github.com/yu87109/maranda-koa-server-example

### this example is used for ts, if you are js user, if can use as almost the same, just delete the type define.

app.ts
```typescript
import Session, { Sequelize } from 'maranda-koa2-session-mysql'

import Koa from 'koa';

interface sessionData extends Session.DataType{
    name:string,
    id: number,
    stauts:boolean,
    friend: sessionData,
    group: [number,string,sessionData]
}
export interface Ctx extends Session.Ctx<sessionData> { 
    //if have other context
}
const app = new Koa<any, Ctx>();
const sequelize = new Sequelize('xxx', 'xxx', 'xxx', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
})
//you can set the gc probability whith molecula and denominato(this example 5/1000, default 1/100), tableName(custom tablename, default sessions), gcType('auto' or 'manul', if you set it to 'manul, you may do the session gc work by your self), ... 
//you mast ensure that there is not table named 'sessions' or your custom tablename in your database_schema
app.use(Session.middware(
    sequelize,
    {
        gcOpts: { probDenominator: 1, probMolecular: 100, type: 'auto' },
        defaultExpiry: 24 * 60 * 60 * 1000 //if the client close without set the session expiry, the some client will not create session again in 1 day, 
    }
));
app.use((ctx, next) => {
    if (ctx.path == '/'){
        if (ctx.session.isNewRecord) { // if true means that there is no session or the session has been expired of the request 
            ctx.body = `please login`
        }else{
            ...
        }
    }
});
app.use((ctx, next) => {
    if(ctx.path == '/login'){
        const userCode = 'ss',
            passWord = 'sss',
            expiry = 5*24*60*60*1000; //5 days
        ....
        ctx.session.data.friend.id = 'xxx';
        ctx.session.data.id = code;
        ctx.session.expiryTo = new Date(Date.now()+expiry);
        //or you can set expiry as :
        ctx.session.expiry = expiry; //means ctx.session.expiryTo = new Date(ctx.session.createAt.getTime() + expiry)
        // if you do not set expiry or the expiryTo, we set cookie by defult, means when you close the window, the session cookie will be deleted
        // if you do save session data manully, like 'ctx.session.save()', you must set the cookies by your self, like 'ctx.cookie.set(...)'
        await next();
        //do not set your session data after next, because it will never work only if you do save session data munully, like 'ctx.session.save()', and then set the cookies by your self
        ....
    }
});
app.use((ctx, next) => {
    if (ctx.path == '/logout' && !ctx.session.isNewRecord) {
        await ctx.session.destroy();
    }
});

app.listen(80);
```


---

[for more Versions, click see the changelog](./CHANGELOG.md)
