import {
    crypto_aead_xchacha20poly1305_ietf_decrypt,
    crypto_aead_xchacha20poly1305_ietf_encrypt,
    crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
    crypto_kx_keypair,
    KeyPair,
    randombytes_buf,
    ready as sodiumReady
} from 'libsodium-wrappers';
import {
    Bytes,
    DRError,
    Header,
    Message,
    MessageChain,
    MessageKey,
    MessageKeyCache,
	MessageKeyCacheEntry,
    PublicKey,
    RootChain,
    SessionState,
    Side
} from '.';

export class DoubleRatchet {
    readonly maxSkip: number;

    private rootChain: RootChain;
    private sendingChain: MessageChain;
    private receivingChain: MessageChain;

    private sendMessageNumber: number;
    private receivedMessageNumber: number;
    private previousSendingChainLength: number;
    private messageKeyCache: MessageKeyCache;

    publicKey(): PublicKey {
        return this.rootChain.keyPair.publicKey;
    }

    get sessionState(): SessionState {
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
        }
    }

    private constructor(maxSkip: number, rootChain: RootChain, sendingChain: MessageChain, receivingChain: MessageChain, sendMessageNumber: number, receivedMessageNumber: number, previousSendingChainLength: number, messageKeyCache: MessageKeyCache) {
        this.maxSkip = maxSkip;
        this.rootChain = rootChain;
        this.sendingChain = sendingChain;
        this.receivingChain = receivingChain;
        this.sendMessageNumber = sendMessageNumber;
        this.receivedMessageNumber = receivedMessageNumber;
        this.previousSendingChainLength = previousSendingChainLength;
        this.messageKeyCache = messageKeyCache;
    }

	static stringifyKeyPair(keyPair: KeyPair): string {
        const item = { publicKey: Array.from(keyPair.publicKey), privateKey: Array.from(keyPair.privateKey), keyType: keyPair.keyType };
        return JSON.stringify(item);
    }
    static parseKeyPair(stringified: string): KeyPair {
        const item = JSON.parse(stringified);
        return { publicKey: Uint8Array.from(item.publicKey), privateKey: Uint8Array.from(item.privateKey), keyType: item.keyType };
    }

    static sessionStateBlop(dr: SessionState): string {
        const sessionState = {
            rootKey: Array.from(dr.rootKey),
            rootChainKeyPair: DoubleRatchet.stringifyKeyPair(dr.rootChainKeyPair),
            rootChainRemotePublicKey: dr.rootChainRemotePublicKey ? Array.from(dr.rootChainRemotePublicKey) : undefined,
            sendingChainKey: dr.sendingChainKey !== undefined ? Array.from(dr.sendingChainKey) : undefined,
            receivingChainKey: dr.receivingChainKey !== undefined ? Array.from(dr.receivingChainKey) : undefined,
            sendMessageNumber: dr.sendMessageNumber,
            receivedMessageNumber: dr.receivedMessageNumber,
            previousSendingChainLength: dr.previousSendingChainLength,
            messageKeyCacheState: dr.messageKeyCacheState.map((msg) => ({ publicKey: Array.from(msg.publicKey), messageNumber: msg.messageNumber, messageKey: Array.from(msg.messageKey) })),
            info: dr.info,
            maxSkip: dr.maxSkip,
            maxCache: dr.maxCache,
        };
        return JSON.stringify(sessionState);
    }

    static initSessionStateBlop(storedItem : string): DoubleRatchet {
        const item = JSON.parse(storedItem);
        const sessionState = {
            rootKey: Uint8Array.from(item.rootKey),
            rootChainKeyPair: DoubleRatchet.parseKeyPair(item.rootChainKeyPair),
            rootChainRemotePublicKey: item.rootChainRemotePublicKey ? Uint8Array.from(item.rootChainRemotePublicKey) : undefined,
            sendingChainKey: item.sendingChainKey !== undefined ? Uint8Array.from(item.sendingChainKey) : undefined,
            receivingChainKey: item.receivingChainKey !== undefined ? Uint8Array.from(item.receivingChainKey) : undefined,
            sendMessageNumber: item.sendMessageNumber,
            receivedMessageNumber: item.receivedMessageNumber,
            previousSendingChainLength: item.previousSendingChainLength,
            messageKeyCacheState: item.messageKeyCacheState.map((msg: MessageKeyCacheEntry) => ({ publicKey: Uint8Array.from(msg.publicKey), messageNumber: msg.messageNumber, messageKey: Uint8Array.from(msg.messageKey) })),
            info: item.info,
            maxSkip: item.maxSkip,
            maxCache: item.maxCache,
        };
        return DoubleRatchet.initFrom(sessionState);
    }

    static async init(info: string, maxCache: number, maxSkip: number, sharedSecret: Bytes, remotePublicKey?: PublicKey, keyPair?: KeyPair): Promise<DoubleRatchet> {
        if (sharedSecret.length != 32) {
            throw Error(DRError.invalidSharedSecret);
        }
        let rootKeyPair: KeyPair;
        if (keyPair) {
            rootKeyPair = keyPair;
        } else {
            await sodiumReady;
            rootKeyPair = crypto_kx_keypair();
        }

        const rootChain = new RootChain(info, sharedSecret, rootKeyPair, remotePublicKey);
        const sendingChain = new MessageChain();
        if (remotePublicKey) {
            sendingChain.chainKey = await rootChain.ratchetStep(Side.sending);
        }
        return new DoubleRatchet(maxSkip, rootChain, sendingChain, new MessageChain(), 0, 0, 0, new MessageKeyCache(maxCache));
    }

    static initFrom(sessionState: SessionState): DoubleRatchet {
        const rootChain = new RootChain(sessionState.info, sessionState.rootKey, sessionState.rootChainKeyPair, sessionState.rootChainRemotePublicKey);
        return new DoubleRatchet(
            sessionState.maxSkip,
            rootChain,
            new MessageChain(sessionState.sendingChainKey),
            new MessageChain(sessionState.receivingChainKey),
            sessionState.sendMessageNumber,
            sessionState.receivedMessageNumber,
            sessionState.previousSendingChainLength,
            new MessageKeyCache(sessionState.maxCache, sessionState.messageKeyCacheState)
        );
    }

    async encrypt(plaintext: Bytes, associatedData?: Bytes): Promise<Message> {
        const messageKey = await this.sendingChain.nextMessageKey();
        const header = new Header(this.rootChain.keyPair.publicKey, this.previousSendingChainLength, this.sendMessageNumber);
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
        }
    }

    async decrypt(message: Message, associatedData?: Bytes): Promise<Bytes> {
        const cachedMessageKey = this.messageKeyCache.getMessageKey(message.header.messageNumber, message.header.publicKey);
        if (cachedMessageKey) {
            return this.decryptWithKey(message, cachedMessageKey, associatedData);
        }

        if (equalBytes(message.header.publicKey, this.rootChain.remotePublicKey) && message.header.messageNumber < this.receivedMessageNumber) {
            throw Error(DRError.discardOldMessage);
        }

        const remotePublicKey = this.rootChain.remotePublicKey ? this.rootChain.remotePublicKey : message.header.publicKey;
        if (!equalBytes(message.header.publicKey, this.rootChain.remotePublicKey)) {
            await this.skipReceivedMessages(message.header.numberOfMessagesInPreviousSendingChain, remotePublicKey);
            await this.doubleRatchetStep(message.header.publicKey);
        }

        await this.skipReceivedMessages(message.header.messageNumber, message.header.publicKey);

        const messageKey = await this.receivingChain.nextMessageKey();
        const plaintext = await this.decryptWithKey(message, messageKey, associatedData);
        this.receivedMessageNumber++;
        return plaintext;
    }

    async decryptWithKey(message: Message, key: MessageKey, associatedData?: Bytes): Promise<Bytes> {
        let headerData = message.header.bytes;
        if (associatedData) {
            const headerWithoutAD = headerData;
            headerData = new Uint8Array(headerWithoutAD.length + associatedData.length);
            headerData.set(headerWithoutAD);
            headerData.set(associatedData, headerWithoutAD.length);
        }

        await sodiumReady;
        return crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce(message.cipher, key, headerData);
    }

    async skipReceivedMessages(untilNextMessageNumber: number, remotePublicKey: PublicKey) {
        if (untilNextMessageNumber - this.receivedMessageNumber > this.maxSkip) {
            throw Error(DRError.exceedMaxSkip);
        }

        while (this.receivedMessageNumber < untilNextMessageNumber) {
            const skippedMessageKey = await this.receivingChain.nextMessageKey();
            this.messageKeyCache.add(skippedMessageKey, this.receivedMessageNumber, remotePublicKey);
            this.receivedMessageNumber++;
        }
    }

    async doubleRatchetStep(publicKey: PublicKey) {
        this.previousSendingChainLength = this.sendMessageNumber;
        this.sendMessageNumber = 0;
        this.receivedMessageNumber = 0;
        this.rootChain.remotePublicKey = publicKey;
        this.receivingChain.chainKey = await this.rootChain.ratchetStep(Side.receiving);

        await sodiumReady;
        this.rootChain.keyPair = crypto_kx_keypair();

        this.sendingChain.chainKey = await this.rootChain.ratchetStep(Side.sending);
    }
}

export function crypto_aead_xchacha20poly1305_ietf_encrypt_with_nonce(message: Bytes, secretKey: Bytes, additionalData?: Bytes): Bytes {
    const nonce = randombytes_buf(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const cipher = crypto_aead_xchacha20poly1305_ietf_encrypt(message, additionalData ? additionalData : null, null, nonce, secretKey);
    let nonceAndCipher = new Uint8Array(nonce.length + cipher.length);
    nonceAndCipher.set(nonce);
    nonceAndCipher.set(cipher, nonce.length);
    return nonceAndCipher;
}

export function crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce(nonceAndCipher: Bytes, secretKey: Bytes, additionalData?: Bytes): Bytes {
    const nonce = new Uint8Array(nonceAndCipher.slice(0, crypto_aead_xchacha20poly1305_ietf_NPUBBYTES));
    const ciphertext = new Uint8Array(nonceAndCipher.slice(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES));
    const plaintext = crypto_aead_xchacha20poly1305_ietf_decrypt(null, ciphertext, additionalData ? additionalData : null, nonce, secretKey);
    return plaintext;
}

export function equalBytes(lhs: Bytes, rhs?: Bytes): boolean {
    if (!rhs) {
        return false;
    } else {
        return lhs.join() == rhs.join();
    }
}
