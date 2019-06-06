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
    get SessData() { return JSON.parse(JSON.stringify(this.getDataValue('SessData') || {})); }
    set SessData(value) { this.setDataValue('SessData', value); }
    get expiry() { return this.ExpiryTo.getTime() - this.CreateAt.getTime(); }
    set expiry(value) { this.ExpiryTo = new Date(this.CreateAt.getTime() + value); }
    GC() { return Session.destroy({ where: { ExpiryTo: { [sequelize_1.Op.lt]: new Date() } } }); }
}
function SessionMiddware(sequelize, initOptions) {
    const { tableName = undefined, gc_type = 'auto', gc_prob_molecular = 1, gc_prob_denominator = 100, sync = true, force = false, sessKey = 'koa2:sess', } = initOptions || {};
    Session.sessKey = sessKey;
    Session.gc_type = gc_type;
    Session.gc_prob_molecular = Math.abs(gc_prob_molecular);
    Session.gc_prob_denominator = Math.abs(gc_prob_denominator);
    Session.init({
        SessKey: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true, defaultValue: sequelize_1.DataTypes.UUIDV4 },
        SessData: { type: sequelize_1.DataTypes.JSON, defaultValue: {} },
        ExpiryTo: { type: sequelize_1.DataTypes.DATE, defaultValue: () => new Date(Date.now() + 2 * 60 * 1000) },
        CreateAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW }
    }, {
        sequelize,
        tableName,
        timestamps: false,
        underscored: true,
        paranoid: false,
    });
    if (sync)
        Session.sync({ force }).catch(e => console.log(e));
    return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
        const SessKey = ctx.cookies.get(Session.sessKey);
        if (SessKey) {
            const session = yield Session.findOne({ where: { SessKey } });
            ctx.Session = session && session.ExpiryTo.getTime() > Date.now() ? session : Session.build();
        }
        else {
            ctx.Session = Session.build();
        }
        yield next();
        if (ctx.Session.changed()) {
            if (ctx.Session.isNewRecord || ctx.Session.changed('ExpiryTo') || ctx.Session.changed('SessKey')) {
                ctx.cookies.set(Session.sessKey, ctx.Session.SessKey, { path: '/', overwrite: true, expires: ctx.Session.ExpiryTo });
            }
            yield ctx.Session.save();
        }
        if (Session.gc_type == 'auto' && Math.random() * Session.gc_prob_denominator <= Session.gc_prob_molecular) {
            console.log(`[${Date()}]: Auto collect ${yield ctx.Session.GC()} session garbage.`);
        }
    });
}
exports.default = SessionMiddware;
__export(require("sequelize"));
