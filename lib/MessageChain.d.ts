import { Bytes } from '.';
export declare type ChainKey = Uint8Array;
export declare class MessageChain {
    readonly messageKeyInput: Uint8Array;
    readonly chainKeyInput: Uint8Array;
    chainKey: ChainKey | undefined;
    constructor(chainKey?: ChainKey);
    nextMessageKey(): Promise<Bytes>;
}
//# sourceMappingURL=MessageChain.d.ts.map