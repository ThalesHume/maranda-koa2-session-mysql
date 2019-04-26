#useage

npm i --save maranda-koa2-session-mysql

app.ts
```
import * as Session from 'maranda-koa2-session-mysq'
import Koa from 'koa';
import router from "koa-router";
import {Sequelize} from 'sequelize';

//if have other context
const app = new Koa<any, others & Session.Ctx>();
//you can set the gc_probability(this example means:number/100, default 10/100), tableName(custom tablename,default sessions), gc_type(Session Garbage Collection type, default true, mean the session gc work will do auto, if you set it false, you may do the session gc work by your self)
// you mast ensure that there is not table named 'sessions' or your custom tablename in your database_schema
Session.Init(new sequelize('database_schema', 'username', 'password', {
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
}),{gc_probability:15});

app.use(Session.Middware);

router.get('/', (ctx, next) => {
    if (!ctx.SessKey) {throw `请登录...`}
    ...
});
router.get('/login', (ctx, next) => {
    let UserCode = 'ss',
        PassWord = 'sss',
        SessionExpiry = 5*24*60*60*1000; //5 days
    ....
    await Session.Create(ctx, SessionExpiry, {UserCode, UserName})
    ....
});
router.post('/logout', (ctx, next) => {
    if (!ctx.SessKey) {throw `请登录...`}
    ....
    SessionDestory(ctx);
    ....
});



app.use(router.routers())
app.listen(80);0
```