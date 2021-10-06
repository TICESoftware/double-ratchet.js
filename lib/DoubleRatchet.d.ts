import { KeyPair } from 'libsodium-wrappers';
import { Bytes, Message, MessageKey, PublicKey, SessionState } from '.';
export declare class DoubleRatchet {
    readonly maxSkip: number;
    private rootChain;
    private sendingChain;
    private receivingChain;
    private sendMessageNumber;
    private receivedMessageNumber;
    private previousSendingChainLength;
    private messageKeyCache;
    publicKey(): PublicKey;
    get sessionState(): SessionState;
    private constructor();
    static stringifyKeyPair(keyPair: KeyPair): string;
    static parseKeyPair(stringified: string): KeyPair;
    static sessionStateBlob(sessionState: SessionState): string;
    static initSessionStateBlob(blob: string): DoubleRatchet;
    static init(info: string, maxCache: number, maxSkip: number, sharedSecret: Bytes, remotePublicKey?: PublicKey, keyPair?: KeyPair): Promise<DoubleRatchet>;
    static initFrom(sessionState: SessionState): DoubleRatchet;
    encrypt(plaintext: Bytes, associatedData?: Bytes): Promise<Message>;
    decrypt(message: Message, associatedData?: Bytes): Promise<Bytes>;
    decryptWithKey(message: Message, key: MessageKey, associatedData?: Bytes): Promise<Bytes>;
    skipReceivedMessages(untilNextMessageNumber: number, remotePublicKey: PublicKey): Promise<void>;
    doubleRatchetStep(publicKey: PublicKey): Promise<void>;
}
export declare function crypto_aead_xchacha20poly1305_ietf_encrypt_with_nonce(message: Bytes, secretKey: Bytes, additionalData?: Bytes): Bytes;
export declare function crypto_aead_xchacha20poly1305_ietf_decrypt_with_nonce(nonceAndCipher: Bytes, secretKey: Bytes, additionalData?: Bytes): Bytes;
export declare function equalBytes(lhs: Bytes, rhs?: Bytes): boolean;
//# sourceMappingURL=DoubleRatchet.d.ts.map