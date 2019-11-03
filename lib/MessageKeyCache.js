"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MessageKeyCache {
    constructor(maxCache, cacheState) {
        this.maxCache = maxCache;
        this.skippedMessageKeys = [];
        this.messageKeyCache = [];
        if (cacheState) {
            cacheState.forEach(x => this.add(x.messageKey, x.messageNumber, x.publicKey));
        }
    }
    get cacheState() {
        return this.messageKeyCache.map(x => {
            const skippedMessageKey = this.skippedMessageKeys.find(el => messageIndexEqual(x, el.index));
            return { publicKey: x.publicKey, messageNumber: x.messageNumber, messageKey: skippedMessageKey.key };
        });
    }
    add(messageKey, messageNumber, publicKey) {
        const messageIndex = { publicKey: publicKey, messageNumber: messageNumber };
        this.skippedMessageKeys.push({ index: messageIndex, key: messageKey });
        this.messageKeyCache.push(messageIndex);
        while (this.messageKeyCache.length > this.maxCache) {
            const removedIndex = this.messageKeyCache.shift();
            this.skippedMessageKeys = this.skippedMessageKeys.filter(el => !messageIndexEqual(el.index, removedIndex));
        }
    }
    getMessageKey(messageNumber, publicKey) {
        const messageIndex = { publicKey: publicKey, messageNumber: messageNumber };
        const messageKey = this.skippedMessageKeys.find(el => messageIndexEqual(el.index, messageIndex)); //(v, idx, arr) => {v.index.messageNumber == messageIndex.messageNumber && v.index.publicKey == messageIndex.publicKey});
        if (messageKey) {
            this.messageKeyCache = this.messageKeyCache.filter(el => !messageIndexEqual(el, messageIndex)); //v, idx, array) => {v != messageIndex});
            this.skippedMessageKeys = this.skippedMessageKeys.filter(el => !messageIndexEqual(el.index, messageIndex)); //(v, idx, arr) => {v.index != messageIndex});
            return messageKey.key;
        }
        else {
            return undefined;
        }
    }
}
exports.MessageKeyCache = MessageKeyCache;
function messageIndexEqual(lhs, rhs) {
    if (!rhs) {
        return false;
    }
    return lhs.messageNumber == rhs.messageNumber && lhs.publicKey.join() == rhs.publicKey.join();
}
//# sourceMappingURL=MessageKeyCache.js.map