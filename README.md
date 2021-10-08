# DoubleRatchet

Implementation of the [Double Ratchet](https://www.signal.org/docs/specifications/doubleratchet/#external-functions) protocol in Swift. The cryptographic operations are provided by [libsodium](https://github.com/jedisct1/libsodium) entirely.

## Installation

```bash
$ yarn add double-ratchet-ts
or
$ npm i --save double-ratchet-ts
```

## Usage

Alice and Bob calculate a shared secret using a secure channel. After that one party can start the conversation as soon as she gets to know the public key of the other one.

```typescript
import {DoubleRatchet} from "double-ratchet-ts";

const sharedSecret = new Uint8Array(32).fill(1);
const info = "DoubleRatchetExample";

const bob = await DoubleRatchet.init(info, 20, 20, sharedSecret, undefined, undefined);

// Bob sends his public key to Alice using another channel
// sendToAlice(bob.publicKey())

const alice = await DoubleRatchet.init(info, 20, 20, sharedSecret, bob.publicKey(), undefined);

// Now the conversation begins
const message = Uint8Array.from(Array.from("Hello, Bob!").map(letter => letter.charCodeAt(0)));

const encryptedMessage = await alice.encrypt(message);
const decryptedMessage = await bob.decrypt(encryptedMessage);

console.log(String.fromCharCode(...decryptedMessage)); // Hello, Bob!
```
