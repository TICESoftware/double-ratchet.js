import {PublicKey} from '.';

export type MessageKey = Uint8Array;

export type MessageKeyCacheState = MessageKeyCacheEntry[];
export interface MessageKeyCacheEntry {
    readonly publicKey: PublicKey;
    readonly messageNumber: number;
    readonly messageKey: MessageKey;
}

interface MessageKeyDict {
    index: MessageIndex;
    key: MessageKey;
}

export class MessageKeyCache {
    skippedMessageKeys: MessageKeyDict[];
    messageKeyCache: MessageIndex[];
    readonly maxCache: number;

    get cacheState(): MessageKeyCacheState {
        return this.messageKeyCache.map(x => {
            const skippedMessageKey = this.skippedMessageKeys.find(el => messageIndexEqual(x, el.index)) as MessageKeyDict;
            return {publicKey: x.publicKey, messageNumber: x.messageNumber, messageKey: skippedMessageKey.key}
        });
    }

    constructor(maxCache: number, cacheState?: MessageKeyCacheState) {
        this.maxCache = maxCache;
        this.skippedMessageKeys = [];
        this.messageKeyCache = [];

        if (cacheState) {
            cacheState.forEach(x => this.add(x.messageKey, x.messageNumber, x.publicKey));
        }
    }

    add(messageKey: MessageKey, messageNumber: number, publicKey: PublicKey) {
        const messageIndex = {publicKey: publicKey, messageNumber: messageNumber};
        this.skippedMessageKeys.push({index: messageIndex, key: messageKey});
        this.messageKeyCache.push(messageIndex);

        while (this.messageKeyCache.length > this.maxCache) {
            const removedIndex = this.messageKeyCache.shift();
            this.skippedMessageKeys = this.skippedMessageKeys.filter(el => !messageIndexEqual(el.index, removedIndex));
        }
    }

    getMessageKey(messageNumber: number, publicKey: PublicKey): MessageKey | undefined {
        const messageIndex = {publicKey: publicKey, messageNumber: messageNumber};
        const messageKey = this.skippedMessageKeys.find(el => messageIndexEqual(el.index, messageIndex)); //(v, idx, arr) => {v.index.messageNumber == messageIndex.messageNumber && v.index.publicKey == messageIndex.publicKey});

        if (messageKey) {
            this.messageKeyCache = this.messageKeyCache.filter(el => !messageIndexEqual(el, messageIndex)); //v, idx, array) => {v != messageIndex});
            this.skippedMessageKeys = this.skippedMessageKeys.filter(el => !messageIndexEqual(el.index, messageIndex)); //(v, idx, arr) => {v.index != messageIndex});
            return messageKey.key;
        } else {
            return undefined;
        }
    }
}

export interface MessageIndex {
    readonly publicKey: PublicKey;
    readonly messageNumber: number;
}

function messageIndexEqual(lhs: MessageIndex, rhs: MessageIndex | undefined): boolean {
    if (!rhs) { return false; }
    return lhs.messageNumber == rhs.messageNumber && lhs.publicKey.join() == rhs.publicKey.join();
}
