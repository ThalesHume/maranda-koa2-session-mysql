# useage

##### npm i --save maranda-koa2-session-mysql

### for the complete maranda koa server case, with static, session-mysql, koabody, router

### please visit https://github.com/yu87109/maranda-koa-server-example

### this example is used for ts, if you are js user, if can use as almost the same, just delete the type define.

app.ts
```typescript
import SessionMiddware, { Sequelize, SessionCtx } from 'maranda-koa2-session-mysql'

import Koa from 'koa';

//if have other context
const app = new Koa<any, others & Session.Ctx>();
//you can set the gc_probability(this example 5/100, default 1/100), tableName(custom tablename,default sessions), gc_type(Session Garbage Collection type, default true, mean the session gc work will do auto, if you set it false, you may do the session gc work by your self)
// you mast ensure that there is not table named 'sessions' or your custom tablename in your database_schema
const sequelize = new Sequelize('xxx', 'xxx', 'xxx', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
})
Session.Init(sequelize, {gc_probability:5});
export {Session, sequelize, Model, ModelAttributes, DataTypes, Op};

app.use(Session.Middware);
app.use((ctx, next) => {
    if (ctx.path == '/' && ctx.method == 'GET'){
        if (!ctx.SessKey) {
            ctx.body = `please login`
        }else{
            ...
        }
    }
});
app.use((ctx, next) => {
    if(ctx.path == '/login' && ctx.method == 'GET'){
        const UserCode = 'ss',
            PassWord = 'sss',
            SessionExpiry = 5*24*60*60*1000; //5 days
        ....
        await Session.Create(ctx, SessionExpiry, {UserCode, UserName})
        ....
    }
});
app.use((ctx, next) => {
    try{
        if (ctx.path == '/logout' && ctx.method == 'POST' && !ctx.SessKey) {
            throw `请登录...`
        }else{
            ....
            await Session.Destroy(ctx);
            ....
            throw `请登录...`
        }
    }catch(e){
        if(e == '请登录...'){ 
            ctx.body = `<script>window.location.href="/"; </script>`
        }
        ...
    }
});

app.listen(80);
```


---

[for more Versions, click see the changelog](./CHANGELOG.md)
