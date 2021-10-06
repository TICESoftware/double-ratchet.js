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
exports.MessageChain = void 0;
const libsodium_wrappers_1 = require("libsodium-wrappers");
const _1 = require(".");
class MessageChain {
    constructor(chainKey) {
        this.messageKeyInput = new Uint8Array(1).fill(1);
        this.chainKeyInput = new Uint8Array(1).fill(2);
        this.chainKey = chainKey;
    }
    // KDF_CK(ck)
    nextMessageKey() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.chainKey) {
                throw Error(_1.DRError.messageChainRatchetStepFailed);
            }
            yield libsodium_wrappers_1.ready;
            const messageKey = libsodium_wrappers_1.crypto_auth(this.messageKeyInput, this.chainKey);
            const newChainKey = libsodium_wrappers_1.crypto_auth(this.chainKeyInput, this.chainKey);
            this.chainKey = newChainKey;
            return messageKey;
        });
    }
}
exports.MessageChain = MessageChain;
//# sourceMappingURL=MessageChain.js.map