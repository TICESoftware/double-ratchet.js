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
const libsodium_wrappers_1 = require("libsodium-wrappers");
function sessionKeyPair(publicKey, secretKey, otherPublicKey, side) {
    return __awaiter(this, void 0, void 0, function* () {
        yield libsodium_wrappers_1.ready;
        if (side == Side.receiving) {
            return libsodium_wrappers_1.crypto_kx_client_session_keys(publicKey, secretKey, otherPublicKey);
        }
        else {
            return libsodium_wrappers_1.crypto_kx_server_session_keys(publicKey, secretKey, otherPublicKey);
        }
    });
}
exports.sessionKeyPair = sessionKeyPair;
var Side;
(function (Side) {
    Side[Side["sending"] = 0] = "sending";
    Side[Side["receiving"] = 1] = "receiving";
})(Side = exports.Side || (exports.Side = {}));
//# sourceMappingURL=SessionKeyPair.js.map