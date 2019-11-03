"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const text_encoding_utf_8_1 = require("text-encoding-utf-8");
class Header {
    constructor(publicKey, numberOfMessagesInPreviousSendingChain, messageNumber) {
        this.publicKey = publicKey;
        this.numberOfMessagesInPreviousSendingChain = numberOfMessagesInPreviousSendingChain;
        this.messageNumber = messageNumber;
    }
    get bytes() {
        return new text_encoding_utf_8_1.TextEncoder().encode(JSON.stringify(this));
    }
}
exports.Header = Header;
//# sourceMappingURL=Message.js.map