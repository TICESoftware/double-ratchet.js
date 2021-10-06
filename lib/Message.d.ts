import { Bytes, PublicKey } from '.';
export interface Message {
    readonly header: Header;
    readonly cipher: Bytes;
}
export declare class Header {
    readonly publicKey: PublicKey;
    readonly numberOfMessagesInPreviousSendingChain: number;
    readonly messageNumber: number;
    get bytes(): Bytes;
    constructor(publicKey: PublicKey, numberOfMessagesInPreviousSendingChain: number, messageNumber: number);
}
//# sourceMappingURL=Message.d.ts.map