export enum DRError {
    invalidSharedSecret = "Shared secret must be 32 bytes.",
    dhKeyGenerationFailed = "DH keypair could not be created.",
    dhKeyExchangeFailed = "DH failed.",
    messageChainRatchetStepFailed = "Could not do ratchet step in message chain.",
    encryptionFailed = "Encryption failed.",
    decryptionFailed = "Decryption failed.",
    exceedMaxSkip = "Cannot skip more messages than defined by MAX_SKIP.",
    remotePublicKeyMissing = "The other party's public key is not available.",
    discardOldMessage = "Message is being discarded because it is older than the oldest cached message."
}
