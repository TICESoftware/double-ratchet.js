"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRError = void 0;
var DRError;
(function (DRError) {
    DRError["invalidSharedSecret"] = "Shared secret must be 32 bytes.";
    DRError["dhKeyGenerationFailed"] = "DH keypair could not be created.";
    DRError["dhKeyExchangeFailed"] = "DH failed.";
    DRError["messageChainRatchetStepFailed"] = "Could not do ratchet step in message chain.";
    DRError["encryptionFailed"] = "Encryption failed.";
    DRError["decryptionFailed"] = "Decryption failed.";
    DRError["exceedMaxSkip"] = "Cannot skip more messages than defined by MAX_SKIP.";
    DRError["remotePublicKeyMissing"] = "The other party's public key is not available.";
    DRError["discardOldMessage"] = "Message is being discarded because it is older than the oldest cached message.";
})(DRError = exports.DRError || (exports.DRError = {}));
//# sourceMappingURL=DRError.js.map