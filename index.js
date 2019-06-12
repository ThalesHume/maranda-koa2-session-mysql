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
    get data() { return JSON.parse(JSON.stringify(this.getDataValue('data') || {})); }
    set data(value) { this.setDataValue('data', value); }
    get expiry() { return this.expiryTo.getTime() - this.createAt.getTime(); }
    set expiry(value) { this.expiryTo = new Date(this.createAt.getTime() + value); }
    gc() { return Session.destroy({ where: { expiryTo: { [sequelize_1.Op.lt]: new Date() } } }); }
}
function SessionMiddware(sequelize, initOptions) {
    const { tableName = undefined, gcType = 'auto', gcProbMolecular = 1, gcProbDenominator = 100, sync = true, force = false, sessKey = 'koa2:sess', logger = true, } = initOptions || {};
    Session.sessKey = sessKey;
    Session.gcType = gcType;
    Session.gcProbMolecular = Math.abs(gcProbMolecular);
    Session.gcProbDenominator = Math.abs(gcProbDenominator);
    Session.init({
        id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true, defaultValue: sequelize_1.DataTypes.UUIDV4 },
        data: { type: sequelize_1.DataTypes.JSON, defaultValue: {} },
        expiryTo: { type: sequelize_1.DataTypes.DATE, defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
        createAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW }
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
        const sessKey = ctx.cookies.get(Session.sessKey);
        if (sessKey) {
            const session = yield Session.findOne({ where: { id: sessKey } });
            ctx.session = session && session.expiryTo.getTime() > Date.now() ? session : Session.build();
        }
        else {
            ctx.session = Session.build();
        }
        yield next();
        if (ctx.session.changed()) {
            if (ctx.session.isNewRecord || ctx.session.changed('expiryTo')) {
                if (ctx.session.changed('expiryTo')) {
                    ctx.cookies.set(Session.sessKey, ctx.session.id, { path: '/', overwrite: true, expires: ctx.session.expiryTo });
                }
                else {
                    ctx.cookies.set(Session.sessKey, ctx.session.id, { path: '/', overwrite: true });
                }
            }
            yield ctx.session.save();
        }
        if (Session.gcType == 'auto' && Math.random() * Session.gcProbDenominator <= Session.gcProbMolecular) {
            if (logger == true)
                console.log(`[${Date()}]: Auto collect ${yield ctx.session.gc()} session garbage.`);
            if (typeof logger == 'function')
                logger(yield ctx.session.gc());
        }
    });
}
exports.default = SessionMiddware;
__export(require("sequelize"));
