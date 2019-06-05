# useage

##### npm i --save maranda-koa2-session-mysql

### for the complete maranda koa server case, with static, session-mysql, koabody, router

### please visit https://github.com/yu87109/maranda-koa-server-example

### this example is used for ts, if you are js user, if can use as almost the same, just delete the type define.

app.ts
```typescript
import SessionMiddware, { Sequelize, SessionCtx } from 'maranda-koa2-session-mysql'

import Koa from 'koa';

interface ctx extends SessionCtx{
    //if have other context
}
const app = new Koa<any, ctx>();
const sequelize = new Sequelize('xxx', 'xxx', 'xxx', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
})
//you can set the gc_probability(this example 5/100, default 1/100), tableName(custom tablename, default sessions), gc_type('auto' or 'manul', if you set it to 'manul, you may do the session gc work by your self)
// you mast ensure that there is not table named 'sessions' or your custom tablename in your database_schema
app.use(SessionMiddware(sequelize,{gc_probability:5}));
app.use((ctx, next) => {
    if (ctx.path == '/'){
        if (ctx.Session.isNewRecord) {
            ctx.body = `please login`
        }else{
            ...
        }
    }
});
app.use((ctx, next) => {
    if(ctx.path == '/login'){
        const UserCode = 'ss',
            PassWord = 'sss',
            Expiry = 5*24*60*60*1000; //5 days
        ....
        ctx.Session.SessData = {
            UserCode
        }
        //default session expiry is set 2 minutes after create time
        ctx.Session.ExpiryTo = new Date(Date.now()+expiry);
        //or you can set expiry as :
        ctx.Session.expiry = Expiry; 
        // if you do save session data manul, like 'ctx.session.save()', you must set the cookies by your self, like 'ctx.cookie.set(...)', not recommond
        await next();
        //do not set your session data after next, because it will never work
        ....
    }
});
app.use((ctx, next) => {
    if (ctx.path == '/logout' && !ctx.Session.isNewRecord) {
        await ctx.Session.destroy();
    }
});

app.listen(80);
```


---

[for more Versions, click see the changelog](./CHANGELOG.md)
