import {TextEncoder} from 'text-encoding-utf-8';
import {Bytes, PublicKey} from '.';

export interface Message {
    readonly header: Header;
    readonly cipher: Bytes;
}

export class Header {
    readonly publicKey: PublicKey;
    readonly numberOfMessagesInPreviousSendingChain: number;
    readonly messageNumber: number;

    get bytes(): Bytes {
        return new TextEncoder().encode(JSON.stringify(this));
    }

    constructor(publicKey: PublicKey, numberOfMessagesInPreviousSendingChain: number, messageNumber: number) {
        this.publicKey = publicKey;
        this.numberOfMessagesInPreviousSendingChain = numberOfMessagesInPreviousSendingChain;
        this.messageNumber = messageNumber;
    }
}
