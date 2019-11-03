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
const _1 = require(".");
const libsodium_wrappers_1 = require("libsodium-wrappers");
const text_encoding_utf_8_1 = require("text-encoding-utf-8");
function setUp(maxSkip, maxCache) {
    return __awaiter(this, void 0, void 0, function* () {
        yield libsodium_wrappers_1.ready;
        const info = "DoubleRatchetTest";
        const sharedSecret = libsodium_wrappers_1.from_hex('00112233445566778899AABBCCDDEEFF00112233445566778899AABBCCDDEEFF');
        const bob = yield _1.DoubleRatchet.init(info, maxCache ? maxCache : 20, maxSkip ? maxSkip : 20, sharedSecret);
        const alice = yield _1.DoubleRatchet.init(info, maxCache ? maxCache : 20, maxSkip ? maxSkip : 20, sharedSecret, bob.publicKey());
        return { sharedSecret: sharedSecret, info: info, bob: bob, alice: alice };
    });
}
test('ratchetSteps', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp();
    try {
        const bobPublicKeySnapshot = bob.publicKey();
        const message = new text_encoding_utf_8_1.TextEncoder().encode("aliceToBob");
        const encryptedMessage = yield alice.encrypt(message);
        const decryptedMessage = yield bob.decrypt(encryptedMessage);
        expect(message).toEqual(decryptedMessage);
        expect(bob.publicKey()).not.toEqual(bobPublicKeySnapshot);
        const alicePublicKeySnapshot = alice.publicKey();
        const response = new text_encoding_utf_8_1.TextEncoder().encode("bobToAlice");
        const encryptedResponse = yield bob.encrypt(response);
        const decryptedResponse = yield alice.decrypt(encryptedResponse);
        expect(response).toEqual(decryptedResponse);
        expect(alice.publicKey()).not.toEqual(alicePublicKeySnapshot);
    }
    catch (error) {
        fail(error);
    }
}));
test('unidirectionalConversation', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp();
    try {
        const alicePublicKeySnapshot = alice.publicKey();
        for (let i = 0; i <= 1; i++) {
            const message = new text_encoding_utf_8_1.TextEncoder().encode('aliceToBob');
            const encryptedMessage = yield alice.encrypt(message);
            const decryptedMessage = yield bob.decrypt(encryptedMessage);
            expect(message).toEqual(decryptedMessage);
        }
        expect(alice.publicKey()).toEqual(alicePublicKeySnapshot);
    }
    catch (error) {
        fail(error);
    }
}));
test('lostMessages', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp();
    try {
        let delayedMessages = [];
        for (let i = 0; i <= 2; i++) {
            const message = new text_encoding_utf_8_1.TextEncoder().encode('aliceToBob' + String(i));
            const encryptedMessage = yield alice.encrypt(message);
            delayedMessages.push(encryptedMessage);
        }
        for (let i = 2; i >= 0; i--) {
            const decryptedMessage = yield bob.decrypt(delayedMessages[i]);
            expect(decryptedMessage).toEqual(new text_encoding_utf_8_1.TextEncoder().encode('aliceToBob' + String(i)));
        }
    }
    catch (error) {
        fail(error);
    }
}));
test('lostMessagesAndRatchetStep', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp();
    try {
        const message = new text_encoding_utf_8_1.TextEncoder().encode('aliceToBob');
        for (let i = 0; i <= 1; i++) {
            const encryptedMessage = yield alice.encrypt(message);
            yield bob.decrypt(encryptedMessage);
        }
        let delayedMessages = [];
        for (let i = 0; i <= 1; i++) {
            if (i == 1) {
                // Ratchet step
                const rsMessage = yield bob.encrypt(message);
                yield alice.decrypt(rsMessage);
            }
            const loopMessage = new text_encoding_utf_8_1.TextEncoder().encode('aliceToBob' + String(i));
            const encryptedMessage = yield alice.encrypt(loopMessage);
            delayedMessages.push(encryptedMessage);
        }
        const successfulMessage = new text_encoding_utf_8_1.TextEncoder().encode('aliceToBob2');
        const successfulEncryptedRatchetMessage = yield alice.encrypt(successfulMessage);
        const successfulPlaintest = yield bob.decrypt(successfulEncryptedRatchetMessage);
        expect(successfulPlaintest).toEqual(successfulMessage);
        for (let i = 1; i >= 0; i--) {
            const decryptedMessage = yield bob.decrypt(delayedMessages[i]);
            expect(decryptedMessage).toEqual(new text_encoding_utf_8_1.TextEncoder().encode('aliceToBob' + String(i)));
        }
    }
    catch (error) {
        fail(error);
    }
}));
test('exceedMaxSkipMessages', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp(1, 2);
    try {
        const messageBytes = new text_encoding_utf_8_1.TextEncoder().encode("Message");
        for (let i = 0; i <= 1; i++) {
            yield alice.encrypt(messageBytes);
        }
        const encryptedMessage = yield alice.encrypt(messageBytes);
        yield bob.decrypt(encryptedMessage);
        fail();
    }
    catch (error) {
        if (error.message != _1.DRError.exceedMaxSkip) {
            fail();
        }
    }
}));
test('exceedMaxCacheMessageKeys', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp(20, 1);
    let delayedMessages = [];
    try {
        for (let i = 0; i <= 2; i++) {
            const message = new text_encoding_utf_8_1.TextEncoder().encode("aliceToBob" + String(i));
            const encryptedMessage = yield alice.encrypt(message);
            delayedMessages.push(encryptedMessage);
        }
        for (let i = 2; i > 0; i--) {
            const plaintext = yield bob.decrypt(delayedMessages[i]);
            expect(plaintext.join()).toEqual(new text_encoding_utf_8_1.TextEncoder().encode("aliceToBob" + String(i)).join());
        }
    }
    catch (error) {
        fail(error);
    }
    try {
        yield bob.decrypt(delayedMessages[0]);
    }
    catch (error) {
        if (error.message != _1.DRError.discardOldMessage) {
            fail(error);
        }
    }
}));
test('encryptAssociatedData', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp();
    try {
        const te = new text_encoding_utf_8_1.TextEncoder();
        const message = te.encode("aliceToBob");
        const associatedData = te.encode("AD");
        const encryptedMessage = yield alice.encrypt(message, associatedData);
        const decryptedMessage = yield bob.decrypt(encryptedMessage, associatedData);
        expect(message.join()).toEqual(decryptedMessage.join());
    }
    catch (error) {
        fail(error);
    }
}));
test('reinitializeSession', () => __awaiter(void 0, void 0, void 0, function* () {
    const { sharedSecret, info, alice, bob } = yield setUp(20, 1);
    const te = new text_encoding_utf_8_1.TextEncoder();
    const td = new text_encoding_utf_8_1.TextDecoder();
    try {
        const message = "aliceToBob";
        const encryptedMessage = yield alice.encrypt(te.encode(message));
        const plaintext = yield bob.decrypt(encryptedMessage);
        expect(td.decode(plaintext)).toEqual(message);
    }
    catch (error) {
        fail(error);
    }
    const bobS = _1.DoubleRatchet.initFrom(bob.sessionState);
    const aliceS = _1.DoubleRatchet.initFrom(alice.sessionState);
    try {
        const messageAliceToBob = "aliceToBob";
        const encryptedMessageAliceToBob = yield alice.encrypt(te.encode(messageAliceToBob));
        const plaintextAliceToBob = yield bob.decrypt(encryptedMessageAliceToBob);
        expect(td.decode(plaintextAliceToBob)).toEqual(messageAliceToBob);
        const messageBobToAlice = "bobToAlice";
        const encryptedMessageBobToAlice = yield bob.encrypt(te.encode(messageBobToAlice));
        const plaintextBobToAlice = yield alice.decrypt(encryptedMessageBobToAlice);
        expect(td.decode(plaintextBobToAlice)).toEqual(messageBobToAlice);
    }
    catch (error) {
        fail(error);
    }
}));
//# sourceMappingURL=index.test.js.map