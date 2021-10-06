import { PublicKey } from '.';
export declare type MessageKey = Uint8Array;
export declare type MessageKeyCacheState = MessageKeyCacheEntry[];
export interface MessageKeyCacheEntry {
    readonly publicKey: PublicKey;
    readonly messageNumber: number;
    readonly messageKey: MessageKey;
}
interface MessageKeyDict {
    index: MessageIndex;
    key: MessageKey;
}
export declare class MessageKeyCache {
    skippedMessageKeys: MessageKeyDict[];
    messageKeyCache: MessageIndex[];
    readonly maxCache: number;
    get cacheState(): MessageKeyCacheState;
    constructor(maxCache: number, cacheState?: MessageKeyCacheState);
    add(messageKey: MessageKey, messageNumber: number, publicKey: PublicKey): void;
    getMessageKey(messageNumber: number, publicKey: PublicKey): MessageKey | undefined;
}
export interface MessageIndex {
    readonly publicKey: PublicKey;
    readonly messageNumber: number;
}
export {};
//# sourceMappingURL=MessageKeyCache.d.ts.map