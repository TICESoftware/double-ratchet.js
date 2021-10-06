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
exports.equalBytes = exports.crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce = exports.crypto_aead_xchacha20poly1305_ietf_encrypt_with_nonce = exports.DoubleRatchet = void 0;
const libsodium_wrappers_1 = require("libsodium-wrappers");
const _1 = require(".");
class DoubleRatchet {
    constructor(maxSkip, rootChain, sendingChain, receivingChain, sendMessageNumber, receivedMessageNumber, previousSendingChainLength, messageKeyCache) {
        this.maxSkip = maxSkip;
        this.rootChain = rootChain;
        this.sendingChain = sendingChain;
        this.receivingChain = receivingChain;
        this.sendMessageNumber = sendMessageNumber;
        this.receivedMessageNumber = receivedMessageNumber;
        this.previousSendingChainLength = previousSendingChainLength;
        this.messageKeyCache = messageKeyCache;
    }
    publicKey() {
        return this.rootChain.keyPair.publicKey;
    }
    get sessionState() {
        return {
            rootKey: this.rootChain.rootKey,
            rootChainKeyPair: this.rootChain.keyPair,
            rootChainRemotePublicKey: this.rootChain.remotePublicKey,
            sendingChainKey: this.sendingChain.chainKey,
            receivingChainKey: this.receivingChain.chainKey,
            sendMessageNumber: this.sendMessageNumber,
            receivedMessageNumber: this.receivedMessageNumber,
            previousSendingChainLength: this.previousSendingChainLength,
            messageKeyCacheState: this.messageKeyCache.cacheState,
            info: this.rootChain.info,
            maxSkip: this.maxSkip,
            maxCache: this.messageKeyCache.maxCache
        };
    }
    static stringifyKeyPair(keyPair) {
        const item = { publicKey: Array.from(keyPair.publicKey), privateKey: Array.from(keyPair.privateKey), keyType: keyPair.keyType };
        return JSON.stringify(item);
    }
    static parseKeyPair(stringified) {
        const item = JSON.parse(stringified);
        return { publicKey: Uint8Array.from(item.publicKey), privateKey: Uint8Array.from(item.privateKey), keyType: item.keyType };
    }
    static sessionStateBlob(sessionState) {
        const item = {
            rootKey: Array.from(sessionState.rootKey),
            rootChainKeyPair: DoubleRatchet.stringifyKeyPair(sessionState.rootChainKeyPair),
            rootChainRemotePublicKey: sessionState.rootChainRemotePublicKey ? Array.from(sessionState.rootChainRemotePublicKey) : undefined,
            sendingChainKey: sessionState.sendingChainKey !== undefined ? Array.from(sessionState.sendingChainKey) : undefined,
            receivingChainKey: sessionState.receivingChainKey !== undefined ? Array.from(sessionState.receivingChainKey) : undefined,
            sendMessageNumber: sessionState.sendMessageNumber,
            receivedMessageNumber: sessionState.receivedMessageNumber,
            previousSendingChainLength: sessionState.previousSendingChainLength,
            messageKeyCacheState: sessionState.messageKeyCacheState.map((msg) => ({ publicKey: Array.from(msg.publicKey), messageNumber: msg.messageNumber, messageKey: Array.from(msg.messageKey) })),
            info: sessionState.info,
            maxSkip: sessionState.maxSkip,
            maxCache: sessionState.maxCache,
        };
        return JSON.stringify(item);
    }
    static initSessionStateBlob(blob) {
        const item = JSON.parse(blob);
        const sessionState = {
            rootKey: Uint8Array.from(item.rootKey),
            rootChainKeyPair: DoubleRatchet.parseKeyPair(item.rootChainKeyPair),
            rootChainRemotePublicKey: item.rootChainRemotePublicKey ? Uint8Array.from(item.rootChainRemotePublicKey) : undefined,
            sendingChainKey: item.sendingChainKey !== undefined ? Uint8Array.from(item.sendingChainKey) : undefined,
            receivingChainKey: item.receivingChainKey !== undefined ? Uint8Array.from(item.receivingChainKey) : undefined,
            sendMessageNumber: item.sendMessageNumber,
            receivedMessageNumber: item.receivedMessageNumber,
            previousSendingChainLength: item.previousSendingChainLength,
            messageKeyCacheState: item.messageKeyCacheState.map((msg) => ({ publicKey: Uint8Array.from(msg.publicKey), messageNumber: msg.messageNumber, messageKey: Uint8Array.from(msg.messageKey) })),
            info: item.info,
            maxSkip: item.maxSkip,
            maxCache: item.maxCache,
        };
        return DoubleRatchet.initFrom(sessionState);
    }
    static init(info, maxCache, maxSkip, sharedSecret, remotePublicKey, keyPair) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sharedSecret.length != 32) {
                throw Error(_1.DRError.invalidSharedSecret);
            }
            let rootKeyPair;
            if (keyPair) {
                rootKeyPair = keyPair;
            }
            else {
                yield libsodium_wrappers_1.ready;
                rootKeyPair = libsodium_wrappers_1.crypto_kx_keypair();
            }
            const rootChain = new _1.RootChain(info, sharedSecret, rootKeyPair, remotePublicKey);
            const sendingChain = new _1.MessageChain();
            if (remotePublicKey) {
                sendingChain.chainKey = yield rootChain.ratchetStep(_1.Side.sending);
            }
            return new DoubleRatchet(maxSkip, rootChain, sendingChain, new _1.MessageChain(), 0, 0, 0, new _1.MessageKeyCache(maxCache));
        });
    }
    static initFrom(sessionState) {
        const rootChain = new _1.RootChain(sessionState.info, sessionState.rootKey, sessionState.rootChainKeyPair, sessionState.rootChainRemotePublicKey);
        return new DoubleRatchet(sessionState.maxSkip, rootChain, new _1.MessageChain(sessionState.sendingChainKey), new _1.MessageChain(sessionState.receivingChainKey), sessionState.sendMessageNumber, sessionState.receivedMessageNumber, sessionState.previousSendingChainLength, new _1.MessageKeyCache(sessionState.maxCache, sessionState.messageKeyCacheState));
    }
    encrypt(plaintext, associatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageKey = yield this.sendingChain.nextMessageKey();
            const header = new _1.Header(this.rootChain.keyPair.publicKey, this.previousSendingChainLength, this.sendMessageNumber);
            this.sendMessageNumber++;
            let headerData = header.bytes;
            if (associatedData) {
                const headerWithoutAD = headerData;
                headerData = new Uint8Array(headerWithoutAD.length + associatedData.length);
                headerData.set(headerWithoutAD);
                headerData.set(associatedData, headerWithoutAD.length);
            }
            return {
                cipher: crypto_aead_xchacha20poly1305_ietf_encrypt_with_nonce(plaintext, messageKey, headerData),
                header: header
            };
        });
    }
    decrypt(message, associatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedMessageKey = this.messageKeyCache.getMessageKey(message.header.messageNumber, message.header.publicKey);
            if (cachedMessageKey) {
                return this.decryptWithKey(message, cachedMessageKey, associatedData);
            }
            if (equalBytes(message.header.publicKey, this.rootChain.remotePublicKey) && message.header.messageNumber < this.receivedMessageNumber) {
                throw Error(_1.DRError.discardOldMessage);
            }
            const remotePublicKey = this.rootChain.remotePublicKey ? this.rootChain.remotePublicKey : message.header.publicKey;
            if (!equalBytes(message.header.publicKey, this.rootChain.remotePublicKey)) {
                yield this.skipReceivedMessages(message.header.numberOfMessagesInPreviousSendingChain, remotePublicKey);
                yield this.doubleRatchetStep(message.header.publicKey);
            }
            yield this.skipReceivedMessages(message.header.messageNumber, message.header.publicKey);
            const messageKey = yield this.receivingChain.nextMessageKey();
            const plaintext = yield this.decryptWithKey(message, messageKey, associatedData);
            this.receivedMessageNumber++;
            return plaintext;
        });
    }
    decryptWithKey(message, key, associatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            let headerData = message.header.bytes;
            if (associatedData) {
                const headerWithoutAD = headerData;
                headerData = new Uint8Array(headerWithoutAD.length + associatedData.length);
                headerData.set(headerWithoutAD);
                headerData.set(associatedData, headerWithoutAD.length);
            }
            yield libsodium_wrappers_1.ready;
            return crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce(message.cipher, key, headerData);
        });
    }
    skipReceivedMessages(untilNextMessageNumber, remotePublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (untilNextMessageNumber - this.receivedMessageNumber > this.maxSkip) {
                throw Error(_1.DRError.exceedMaxSkip);
            }
            while (this.receivedMessageNumber < untilNextMessageNumber) {
                const skippedMessageKey = yield this.receivingChain.nextMessageKey();
                this.messageKeyCache.add(skippedMessageKey, this.receivedMessageNumber, remotePublicKey);
                this.receivedMessageNumber++;
            }
        });
    }
    doubleRatchetStep(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            this.previousSendingChainLength = this.sendMessageNumber;
            this.sendMessageNumber = 0;
            this.receivedMessageNumber = 0;
            this.rootChain.remotePublicKey = publicKey;
            this.receivingChain.chainKey = yield this.rootChain.ratchetStep(_1.Side.receiving);
            yield libsodium_wrappers_1.ready;
            this.rootChain.keyPair = libsodium_wrappers_1.crypto_kx_keypair();
            this.sendingChain.chainKey = yield this.rootChain.ratchetStep(_1.Side.sending);
        });
    }
}
exports.DoubleRatchet = DoubleRatchet;
function crypto_aead_xchacha20poly1305_ietf_encrypt_with_nonce(message, secretKey, additionalData) {
    const nonce = libsodium_wrappers_1.randombytes_buf(libsodium_wrappers_1.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const cipher = libsodium_wrappers_1.crypto_aead_xchacha20poly1305_ietf_encrypt(message, additionalData ? additionalData : null, null, nonce, secretKey);
    let nonceAndCipher = new Uint8Array(nonce.length + cipher.length);
    nonceAndCipher.set(nonce);
    nonceAndCipher.set(cipher, nonce.length);
    return nonceAndCipher;
}
exports.crypto_aead_xchacha20poly1305_ietf_encrypt_with_nonce = crypto_aead_xchacha20poly1305_ietf_encrypt_with_nonce;
function crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce(nonceAndCipher, secretKey, additionalData) {
    const nonce = new Uint8Array(nonceAndCipher.slice(0, libsodium_wrappers_1.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES));
    const ciphertext = new Uint8Array(nonceAndCipher.slice(libsodium_wrappers_1.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES));
    const plaintext = libsodium_wrappers_1.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ciphertext, additionalData ? additionalData : null, nonce, secretKey);
    return plaintext;
}
exports.crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce = crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce;
function equalBytes(lhs, rhs) {
    if (!rhs) {
        return false;
    }
    else {
        return lhs.join() == rhs.join();
    }
}
exports.equalBytes = equalBytes;
//# sourceMappingURL=DoubleRatchet.js.map