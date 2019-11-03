import { Bytes, PublicKey } from '.';
import { CryptoKX } from 'libsodium-wrappers';
export declare function sessionKeyPair(publicKey: PublicKey, secretKey: Bytes, otherPublicKey: PublicKey, side: Side): Promise<CryptoKX>;
export declare enum Side {
    sending = 0,
    receiving = 1
}
//# sourceMappingURL=SessionKeyPair.d.ts.map