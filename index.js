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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const uuid_js_1 = __importDefault(require("uuid-js"));
class Session extends sequelize_1.Model {
}
Session.sessKey = 'koa2:sess';
Session.sessAge = 60 * 60 * 24 * 1000;
(function (Session) {
    function Init(sequelize, initOptions) {
        const { tableName = undefined, gc_type = true, gc_probability = 1 } = initOptions || {};
        Session.gc_type = gc_type;
        Session.gc_probability = Math.round(gc_probability);
        Session.init({
            sid: {
                type: sequelize_1.DataTypes.STRING,
                primaryKey: true,
            },
            data: sequelize_1.DataTypes.STRING,
            expiry: sequelize_1.DataTypes.BIGINT({ length: 11 }),
            CreateAt: sequelize_1.DataTypes.BIGINT({ length: 11 }),
        }, {
            sequelize,
            timestamps: false,
            underscored: true,
            paranoid: false,
            tableName,
        });
        Session.sync({ force: false, logging: false }).catch((e) => { console.log(e); });
    }
    Session.Init = Init;
    function GC() {
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
    Session.GC = GC;
    function Middware(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Session.gc_type && Math.round(Math.random() * 100) <= Session.gc_probability) {
                console.log(`[${Date()}]: collect ${yield GC()} session garbage.`);
            }
            ctx.Session = {};
            let sid = ctx.cookies.get(Session.sessKey), session;
            if (sid) {
                session = yield Session.findOne({ where: { sid }, logging: false });
                if (session && (Date.now() - session.CreateAt < session.expiry)) {
                    Object.assign(ctx.Session, JSON.parse(session.data));
                    ctx.SessKey = sid;
                }
            }
            const oldsess = JSON.stringify(ctx.Session);
            yield next();
            const newsess = JSON.stringify(ctx.Session);
            if (oldsess !== newsess && ctx.SessKey) {
                yield Session.update({ data: newsess }, { where: { sid: ctx.SessKey }, logging: false });
            }
        });
    }
    Session.Middware = Middware;
    function Create(ctx, expiry, SessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const date = Date.now(), uuid = uuid_js_1.default.create().toString();
            const session = yield Session.create({
                sid: uuid,
                data: SessionData == undefined ? null : JSON.stringify(SessionData),
                CreateAt: date,
                expiry: expiry == undefined ? Session.sessAge : expiry
            }, { logging: false });
            ctx.cookies.set(Session.sessKey, uuid, { path: '/', overwrite: true, maxAge: expiry == undefined ? Session.sessAge : expiry });
            return session;
        });
    }
    Session.Create = Create;
    function Destroy(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            let session = yield Session.update({ expiry: 0 }, { where: { sid: (ctx.SessKey) }, logging: false });
            ctx.SessKey = undefined;
            return session;
        });
    }
    Session.Destroy = Destroy;
})(Session || (Session = {}));
exports.default = Session;
__export(require("sequelize"));
