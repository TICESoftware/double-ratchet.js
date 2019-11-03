import {KeyPair} from 'libsodium-wrappers';
import {deriveHKDFKey} from 'hkdf.js';
import {Bytes, PublicKey, ChainKey, DRError, Side, sessionKeyPair} from '.';

export type RootKey = Uint8Array;

export class RootChain {
    keyPair: KeyPair;
    remotePublicKey: PublicKey | undefined;
    rootKey: RootKey;
    readonly info: string;

    constructor(info: string, rootKey: RootKey, keyPair: KeyPair, remotePublicKey?: PublicKey) {
        this.info = info;
        this.rootKey = rootKey;
        this.keyPair = keyPair;
        this.remotePublicKey = remotePublicKey;
    }

    async ratchetStep(side: Side): Promise<ChainKey> {
        if (!this.remotePublicKey) {
            throw Error(DRError.remotePublicKeyMissing);
        }

        const dhResult = await this.dh(this.keyPair, this.remotePublicKey, side);
        const {rootKey, chainKey} = await this.deriveFromRootKDF(this.rootKey, dhResult, this.info);
        this.rootKey = rootKey;
        return chainKey;
    }

    async dh(keyPair: KeyPair, publicKey: PublicKey, side: Side): Promise<Bytes> {
        const dh = await sessionKeyPair(keyPair.publicKey, keyPair.privateKey, publicKey, side);
        return side == Side.sending ? dh.sharedTx : dh.sharedRx;
    }

    async deriveFromRootKDF(rootKey: Bytes, dhOut: Bytes, info: string): Promise<{rootKey: Bytes, chainKey: Bytes}> {
        const derivedKey = await deriveHKDFKey(dhOut, 64, rootKey, info);
        return {rootKey: derivedKey.slice(0, 32), chainKey: derivedKey.slice(32)};
    }
}
