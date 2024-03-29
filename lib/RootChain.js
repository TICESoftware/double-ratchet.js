"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootChain = void 0;
const sodium_hkdf_1 = require("sodium-hkdf");
const _1 = require(".");
class RootChain {
    constructor(info, rootKey, keyPair, remotePublicKey) {
        this.info = info;
        this.rootKey = rootKey;
        this.keyPair = keyPair;
        this.remotePublicKey = remotePublicKey;
    }
    ratchetStep(side) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.remotePublicKey) {
                throw Error(_1.DRError.remotePublicKeyMissing);
            }
            const dhResult = yield this.dh(this.keyPair, this.remotePublicKey, side);
            const { rootKey, chainKey } = yield this.deriveFromRootKDF(this.rootKey, dhResult, this.info);
            this.rootKey = rootKey;
            return chainKey;
        });
    }
    dh(keyPair, publicKey, side) {
        return __awaiter(this, void 0, void 0, function* () {
            const dh = yield (0, _1.sessionKeyPair)(keyPair.publicKey, keyPair.privateKey, publicKey, side);
            return side == _1.Side.sending ? dh.sharedTx : dh.sharedRx;
        });
    }
    deriveFromRootKDF(rootKey, dhOut, info) {
        return __awaiter(this, void 0, void 0, function* () {
            const derivedKey = yield (0, sodium_hkdf_1.deriveHKDFKey)(dhOut, 64, rootKey, info);
            return { rootKey: derivedKey.slice(0, 32), chainKey: derivedKey.slice(32) };
        });
    }
}
exports.RootChain = RootChain;
//# sourceMappingURL=RootChain.js.map