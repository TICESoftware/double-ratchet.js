import {Bytes, DoubleRatchet, DRError, Message, Header} from '.';
import {ready as sodiumReady, from_hex, to_hex} from 'libsodium-wrappers';
import {TextEncoder, TextDecoder} from 'text-encoding-utf-8';

async function setUp(maxSkip?: number, maxCache?: number): Promise<{sharedSecret: Bytes, info: string, alice: DoubleRatchet, bob: DoubleRatchet}> {
    await sodiumReady;
    const info = "DoubleRatchetTest";
    const sharedSecret = from_hex('00112233445566778899AABBCCDDEEFF00112233445566778899AABBCCDDEEFF');
    const bob = await DoubleRatchet.init(info, maxCache ? maxCache : 20, maxSkip ? maxSkip : 20, sharedSecret);
    const alice = await DoubleRatchet.init(info, maxCache ? maxCache : 20, maxSkip ? maxSkip : 20, sharedSecret, bob.publicKey());

    return {sharedSecret: sharedSecret, info: info, bob: bob, alice: alice}
}

test('ratchetSteps', async () => {
    const {sharedSecret, info, alice, bob} = await setUp();
    try {
        const bobPublicKeySnapshot = bob.publicKey();
        const message = new TextEncoder().encode("aliceToBob");
        const encryptedMessage = await alice.encrypt(message);
        const decryptedMessage = await bob.decrypt(encryptedMessage);

        expect(message).toEqual(decryptedMessage);
        expect(bob.publicKey()).not.toEqual(bobPublicKeySnapshot);

        const alicePublicKeySnapshot = alice.publicKey();
        const response = new TextEncoder().encode("bobToAlice");
        const encryptedResponse = await bob.encrypt(response);
        const decryptedResponse = await alice.decrypt(encryptedResponse);

        expect(response).toEqual(decryptedResponse);
        expect(alice.publicKey()).not.toEqual(alicePublicKeySnapshot);
    } catch(error) {
        fail(error);
    }
});

test('unidirectionalConversation', async () => {
    const {sharedSecret, info, alice, bob} = await setUp();
    try {
        const alicePublicKeySnapshot = alice.publicKey();

        for (let i = 0; i <= 1; i++) {
            const message = new TextEncoder().encode('aliceToBob');
            const encryptedMessage = await alice.encrypt(message);
            const decryptedMessage = await bob.decrypt(encryptedMessage);
            expect(message).toEqual(decryptedMessage);
        }

        expect(alice.publicKey()).toEqual(alicePublicKeySnapshot);
    } catch(error) {
        fail(error);
    }
});

test('lostMessages', async () => {
    const {sharedSecret, info, alice, bob} = await setUp();
    try {
        let delayedMessages: Message[] = [];
        for (let i = 0; i <= 2; i++) {
            const message = new TextEncoder().encode('aliceToBob' + String(i));
            const encryptedMessage = await alice.encrypt(message);
            delayedMessages.push(encryptedMessage);
        }

        for (let i = 2; i >= 0; i--) {
            const decryptedMessage = await bob.decrypt(delayedMessages[i]);
            expect(decryptedMessage).toEqual(new TextEncoder().encode('aliceToBob' + String(i)));
        }
    } catch(error) {
        fail(error);
    }
});

test('lostMessagesAndRatchetStep', async () => {
    const {sharedSecret, info, alice, bob} = await setUp();
    try {
        const message = new TextEncoder().encode('aliceToBob');

        for (let i = 0; i <= 1; i++) {
            const encryptedMessage = await alice.encrypt(message);
            await bob.decrypt(encryptedMessage);
        }

        let delayedMessages: Message[] = [];
        for (let i = 0; i <= 1; i++) {
            if (i == 1) {
                // Ratchet step
                const rsMessage = await bob.encrypt(message);
                await alice.decrypt(rsMessage);
            }
            const loopMessage = new TextEncoder().encode('aliceToBob' + String(i));
            const encryptedMessage = await alice.encrypt(loopMessage);
            delayedMessages.push(encryptedMessage);
        }

        const successfulMessage = new TextEncoder().encode('aliceToBob2');
        const successfulEncryptedRatchetMessage = await alice.encrypt(successfulMessage);
        const successfulPlaintest = await bob.decrypt(successfulEncryptedRatchetMessage);
        expect(successfulPlaintest).toEqual(successfulMessage);

        for (let i = 1; i >= 0; i--) {
            const decryptedMessage = await bob.decrypt(delayedMessages[i]);
            expect(decryptedMessage).toEqual(new TextEncoder().encode('aliceToBob' + String(i)));
        }
    } catch(error) {
        fail(error);
    }
});

test('exceedMaxSkipMessages', async () => {
    const {sharedSecret, info, alice, bob} = await setUp(1, 2);
    try {
        const messageBytes = new TextEncoder().encode("Message");
        for (let i = 0; i <= 1; i++) {
            await alice.encrypt(messageBytes);
        }

        const encryptedMessage = await alice.encrypt(messageBytes);
        await bob.decrypt(encryptedMessage);
        fail();
    } catch(error: any) {
        if (error.message != DRError.exceedMaxSkip) {
            fail();
        }
    }
});

test('exceedMaxCacheMessageKeys', async () => {
    const {sharedSecret, info, alice, bob} = await setUp(20, 1);
    let delayedMessages: Message[] = [];

    try {
        for (let i = 0; i <= 2; i++) {
            const message = new TextEncoder().encode("aliceToBob" + String(i));
            const encryptedMessage = await alice.encrypt(message);
            delayedMessages.push(encryptedMessage);
        }

        for (let i = 2; i > 0; i--) {
            const plaintext = await bob.decrypt(delayedMessages[i]);
            expect(plaintext.join()).toEqual(new TextEncoder().encode("aliceToBob" + String(i)).join());
        }
    } catch(error) {
        fail(error);
    }

    try {
        await bob.decrypt(delayedMessages[0]);
    } catch(error: any) {
        if (error.message != DRError.discardOldMessage) {
            fail(error);
        }
    }
});

test('encryptAssociatedData', async () => {
    const {sharedSecret, info, alice, bob} = await setUp();
    try {
        const te = new TextEncoder();
        const message = te.encode("aliceToBob");
        const associatedData = te.encode("AD");
        const encryptedMessage = await alice.encrypt(message, associatedData);
        const decryptedMessage = await bob.decrypt(encryptedMessage, associatedData);
        expect(message.join()).toEqual(decryptedMessage.join());
    } catch(error) {
        fail(error);
    }
});

test('reinitializeSession', async () => {
    const {sharedSecret, info, alice, bob} = await setUp(20, 1);
    const te = new TextEncoder();
    const td = new TextDecoder();
    try {
        const message = "aliceToBob";
        const encryptedMessage = await alice.encrypt(te.encode(message));
        const plaintext = await bob.decrypt(encryptedMessage);
        expect(td.decode(plaintext)).toEqual(message);
    } catch(error) {
        fail(error);
    }

    const bobS = DoubleRatchet.initFrom(bob.sessionState);
    const aliceS = DoubleRatchet.initFrom(alice.sessionState);

    try {
        const messageAliceToBob = "aliceToBob";
        const encryptedMessageAliceToBob = await alice.encrypt(te.encode(messageAliceToBob));
        const plaintextAliceToBob = await bob.decrypt(encryptedMessageAliceToBob);
        expect(td.decode(plaintextAliceToBob)).toEqual(messageAliceToBob);

        const messageBobToAlice = "bobToAlice";
        const encryptedMessageBobToAlice = await bob.encrypt(te.encode(messageBobToAlice));
        const plaintextBobToAlice = await alice.decrypt(encryptedMessageBobToAlice);
        expect(td.decode(plaintextBobToAlice)).toEqual(messageBobToAlice);
    } catch(error) {
        fail(error);
    }
});

test('encodeHeaderBytes', async () => {
    await sodiumReady;
    const pubKey = from_hex("0efd0d78c9ba26b39588848ddf69b02807fb85916c2b004d7af759f932544443");
    const headerBytesShouldBe = "0efd0d78c9ba26b39588848ddf69b02807fb85916c2b004d7af759f93254444300000000499602d2000000024cb016ea";

    const header = new Header(pubKey, 1234567890, 9876543210);
    expect(to_hex(header.bytes)).toEqual(headerBytesShouldBe);
});
