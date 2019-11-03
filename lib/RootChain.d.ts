import { KeyPair } from 'libsodium-wrappers';
import { Bytes, PublicKey, ChainKey, Side } from '.';
export declare type RootKey = Uint8Array;
export declare class RootChain {
    keyPair: KeyPair;
    remotePublicKey: PublicKey | undefined;
    rootKey: RootKey;
    readonly info: string;
    constructor(info: string, rootKey: RootKey, keyPair: KeyPair, remotePublicKey?: PublicKey);
    ratchetStep(side: Side): Promise<ChainKey>;
    dh(keyPair: KeyPair, publicKey: PublicKey, side: Side): Promise<Bytes>;
    deriveFromRootKDF(rootKey: Bytes, dhOut: Bytes, info: string): Promise<{
        rootKey: Bytes;
        chainKey: Bytes;
    }>;
}
//# sourceMappingURL=RootChain.d.ts.map