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
        let bytes = new Uint8Array(this.publicKey.length+8+8);
        bytes.set(this.publicKey);
        bytes.set(numberToBytes(this.numberOfMessagesInPreviousSendingChain), this.publicKey.length);
        bytes.set(numberToBytes(this.messageNumber), this.publicKey.length+8);
        return bytes;
    }

    constructor(publicKey: PublicKey, numberOfMessagesInPreviousSendingChain: number, messageNumber: number) {
        this.publicKey = publicKey;
        this.numberOfMessagesInPreviousSendingChain = numberOfMessagesInPreviousSendingChain;
        this.messageNumber = messageNumber;
    }
}

function numberToBytes(value: number): Bytes {
    let byteArray = new Uint8Array(8);

    for (let index = byteArray.length; index > 0; index--) {
        const byte = value & 0xff;
        byteArray[index-1] = byte;
        value = (value - byte) / 256;
    }

    return byteArray;
}
