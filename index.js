"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
class Session extends sequelize_1.Model {
    gc() { return Session.GC(); }
    ;
    static GC() {
        const schema = Session.getTableName();
        let tableName;
        if (typeof schema == 'string') {
            tableName = `\`${schema}\``;
        }
        else {
            tableName = `\`${schema.schema}\`${schema.delimiter}\`${schema.tableName}\``;
        }
        const sql = `DELETE FROM ${tableName} WHERE \`create_at\` < unix_timestamp(now())*1000 - \`expiry\``;
        return (Session.sequelize).query(sql, { type: sequelize_1.QueryTypes.BULKDELETE, logging: false });
    }
}
Session.sessKey = 'koa2:sess';
function SessionMiddware(sequelize, initOptions) {
    const { tableName = undefined, gc_type = true, gc_probability = 1, sync = true, force = false } = initOptions || {};
    Session.gc_type = gc_type;
    Session.gc_probability = Math.round(gc_probability);
    Session.init({
        sid: { type: sequelize_1.CHAR(36), primaryKey: true, defaultValue: sequelize_1.UUIDV4 },
        data: { type: sequelize_1.JSON, defaultValue: {} },
        expiry: { type: sequelize_1.INTEGER, defaultValue: 2 * 60 * 1000 },
        CreateAt: { type: sequelize_1.DATE, defaultValue: sequelize_1.NOW }
    }, {
        sequelize,
        tableName,
        timestamps: false,
        underscored: true,
        paranoid: false,
    });
    if (sync)
        Session.sync({ force, logging: false }).catch(e => console.log(e));
    return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
        const sid = ctx.cookies.get(Session.sessKey);
        if (sid) {
            const session = yield Session.findOne({ where: { sid }, logging: false });
            ctx.Session = session && (Date.now() - session.CreateAt < session.expiry) ? session : Session.build();
        }
        else {
            ctx.Session = Session.build();
        }
        yield next();
        if (ctx.Session.changed()) {
            if (ctx.Session.isNewRecord) {
                ctx.cookies.set(Session.sessKey, ctx.Session.sid, { path: '/', overwrite: true, maxAge: ctx.Session.expiry });
            }
            yield ctx.Session.save();
        }
        if (Session.gc_type && Math.round(Math.random() * 100) <= Session.gc_probability) {
            console.log(`[${Date()}]: collect ${yield Session.GC()} session garbage.`);
        }
    });
}
exports.default = SessionMiddware;
__export(require("sequelize"));
