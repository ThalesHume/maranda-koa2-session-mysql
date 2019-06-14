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
    constructor() {
        super(...arguments);
        this.data = this.__proxyData(this.getDataValue('data'));
    }
    //get data(): object { return JSON.parse(JSON.stringify(this.getDataValue('data'))); }
    //set data(value: object) { JSON.stringify(value) == JSON.stringify(this.getDataValue('data')) || this.setDataValue('data', value); } 
    get expiry() { return this.expiryTo.getTime() - this.createAt.getTime(); }
    set expiry(value) { this.expiryTo = new Date(this.createAt.getTime() + value); }
    gc() {
        return __awaiter(this, void 0, void 0, function* () { return yield Session.destroy({ where: { expiryTo: { [sequelize_1.Op.lt]: new Date() } } }); });
    }
    __proxyData(target) {
        return new Proxy(target, {
            set: (target, key, value) => {
                this.changed('data', true);
                return Reflect.set(target, key, value);
            },
            get: (target, key) => {
                return typeof target[key] !== 'object' ? target[key] : this.__proxyData(target[key]);
            }
        });
    }
}
(function (Session) {
    function middware(sequelize, initOptions) {
        const { tableName = undefined, gcOpts = { type: 'auto', probMolecular: 1, probDenominator: 100 }, sync = { enable: false, force: false }, sessKey = 'koa2:sess', logger = true, defaultExpiry = 24 * 60 * 60 * 1000 } = initOptions || {};
        Session.init({
            id: { type: sequelize_1.DataTypes.CHAR(36), primaryKey: true, defaultValue: sequelize_1.DataTypes.UUIDV4 },
            data: { type: sequelize_1.DataTypes.JSON, defaultValue: {} },
            expiryTo: { type: sequelize_1.DataTypes.DATE, defaultValue: () => new Date(Date.now() + defaultExpiry) },
            createAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW }
        }, {
            sequelize,
            tableName,
            timestamps: false,
            underscored: true,
            paranoid: false,
        });
        if (sync && sync.enable)
            Session.sync({ force: sync.force }).catch(e => console.log(e));
        return (ctx, next) => __awaiter(this, void 0, void 0, function* () {
            const id = ctx.cookies.get(sessKey);
            if (id) {
                const session = yield Session.findOne({ where: { id } });
                ctx.session = session && session.expiryTo.getTime() > Date.now() ? session : Session.build();
            }
            else {
                ctx.session = Session.build();
            }
            yield next();
            if (ctx.session.changed()) {
                if (ctx.session.isNewRecord || ctx.session.changed('expiryTo')) {
                    if (ctx.session.changed('expiryTo')) {
                        ctx.cookies.set(sessKey, ctx.session.id, { path: '/', overwrite: true, expires: ctx.session.expiryTo });
                    }
                    else {
                        ctx.cookies.set(sessKey, ctx.session.id, { path: '/', overwrite: true });
                    }
                }
                yield ctx.session.save();
            }
            if (gcOpts.type == 'auto' && Math.random() * Math.abs(gcOpts.probDenominator) <= Math.abs(gcOpts.probMolecular)) {
                if (logger == true)
                    console.log(`[${Date()}]: Auto collect ${yield ctx.session.gc()} session garbage.`);
                if (typeof logger == 'function')
                    logger(yield ctx.session.gc());
            }
        });
    }
    Session.middware = middware;
})(Session || (Session = {}));
exports.default = Session;
__export(require("sequelize"));
