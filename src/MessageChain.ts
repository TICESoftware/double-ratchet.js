import {ready as sodiumReady, crypto_auth} from 'libsodium-wrappers';
import {Bytes, DRError} from '.';

export type ChainKey = Uint8Array;

export class MessageChain {
    readonly messageKeyInput = new Uint8Array(1).fill(1);
    readonly chainKeyInput = new Uint8Array(1).fill(2);
    chainKey: ChainKey | undefined;

    constructor(chainKey?: ChainKey) {
        this.chainKey = chainKey;
    }

    // KDF_CK(ck)
    async nextMessageKey(): Promise<Bytes> {
        if (!this.chainKey) {
            throw Error(DRError.messageChainRatchetStepFailed);
        }
        await sodiumReady;
        const messageKey = crypto_auth(this.messageKeyInput, this.chainKey);
        const newChainKey = crypto_auth(this.chainKeyInput, this.chainKey);
        this.chainKey = newChainKey;
        return messageKey;
    }
}
