import {ChainKey, PublicKey, RootKey, MessageKeyCacheState} from '.';
import {KeyPair} from 'libsodium-wrappers';

export interface SessionState {
    readonly info: string;
    readonly maxSkip: number;
    readonly maxCache: number;

    readonly rootKey: RootKey;
    readonly rootChainKeyPair: KeyPair;
    readonly rootChainRemotePublicKey: PublicKey | undefined;
    readonly sendingChainKey: ChainKey | undefined;
    readonly receivingChainKey: ChainKey | undefined;

    readonly sendMessageNumber: number;
    readonly receivedMessageNumber: number;
    readonly previousSendingChainLength: number;
    readonly messageKeyCacheState: MessageKeyCacheState;
}
