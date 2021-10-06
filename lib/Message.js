"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
class Header {
    constructor(publicKey, numberOfMessagesInPreviousSendingChain, messageNumber) {
        this.publicKey = publicKey;
        this.numberOfMessagesInPreviousSendingChain = numberOfMessagesInPreviousSendingChain;
        this.messageNumber = messageNumber;
    }
    get bytes() {
        let bytes = new Uint8Array(this.publicKey.length + 8 + 8);
        bytes.set(this.publicKey);
        bytes.set(numberToBytes(this.numberOfMessagesInPreviousSendingChain), this.publicKey.length);
        bytes.set(numberToBytes(this.messageNumber), this.publicKey.length + 8);
        return bytes;
    }
}
exports.Header = Header;
function numberToBytes(value) {
    let byteArray = new Uint8Array(8);
    for (let index = byteArray.length; index > 0; index--) {
        const byte = value & 0xff;
        byteArray[index - 1] = byte;
        value = (value - byte) / 256;
    }
    return byteArray;
}
//# sourceMappingURL=Message.js.map