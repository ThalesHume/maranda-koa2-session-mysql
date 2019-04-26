#useage

npm i --save maranda-koa2-session-mysql

app.ts
```
import * as Session from 'maranda-koa2-session-mysq'
import Koa from 'koa';
import router from "koa-router";
Router = require('koa-router');
import {Sequelize} from 'sequelize';

const app = new Koa<any, others & Session.Ctx>();//if have other context
//you can set the gc_probability(this example means:10/100), tableName(custom tablename,default sessions), gc_type(Session Garbage Collection type, default true, mean the session gc work will do auto, if you set it false, you may do the session gc work by your self)
// you mast ensure that there is not table named 'sessions' or your custom tablename in your database_schema
Session.Init(new sequelize('database_schema', 'username', 'password', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
}),{gc_probability:10});

app.use(Session.Middware);

router.get('/', (ctx, next) => {
    if (!ctx.SessKey) {throw `请登录...`}
    ...
});
router.get('/login', (ctx, next) => {
    let UserCode = <string>(ctx.request.body.UserCode),
        PassWord = <string>(ctx.request.body.PassWord),
        SessionExpiry = <number>(ctx.request.body.Expiry);
    ....
    await Session.Create(ctx, SessionExpiry, {UserCode:user.UserCode, UserName:user.UserName})
    ....
});
router.post('/logout', (ctx, next) => {
    ....
    SessionDestory(ctx);
    ....
});



app.use(router.routers())
app.listen(80);0
```