import {Bytes, PublicKey} from '.';
import {ready as sodiumReady, crypto_kx_client_session_keys, crypto_kx_server_session_keys, CryptoKX} from 'libsodium-wrappers';

export async function sessionKeyPair(publicKey: PublicKey, secretKey: Bytes, otherPublicKey: PublicKey, side: Side): Promise<CryptoKX> {
    await sodiumReady;
    if (side == Side.receiving) {
        return crypto_kx_client_session_keys(publicKey, secretKey, otherPublicKey);
    } else {
        return crypto_kx_server_session_keys(publicKey, secretKey, otherPublicKey);
    }
}

export enum Side {
    sending,
    receiving
}
