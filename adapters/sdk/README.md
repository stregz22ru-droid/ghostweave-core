# GHOSTWEAVE SDK — Reference Implementation v1.0

**Status:** ✅ READY
**Version:** 1.0.0
**Protocol:** GWP/1.0
**Profile:** ghostweave-profile-v1.0.0

---

## 📌 Overview

This is the **official TypeScript SDK** for GHOSTWEAVE Core v1.0.

It provides a **reference implementation** of the protocol, allowing developers to:

* Create and manage event chains
* Verify integrity and continuity
* Replay evidence chains
* Work with Profiles
* Build extensions

**Key principle:** SDK is a Reference Implementation, not the Definition of the Protocol.
In case of any discrepancy, the RFC is the source of truth.

---

## 📦 Installation

```bash
npm install @ghostweave/core-sdk
```

Or using yarn:

```bash
yarn add @ghostweave/core-sdk
```

---

## 🚀 Quick Start

```typescript id="kq7w9a"
import {
  createChain,
  createGenesisEvent,
  appendToChain,
  verifyChain,
  replayChain,
  officialProfileV1,
  profileManager
} from '@ghostweave/core-sdk';

// 1. Set up profile
profileManager.registerProfile(officialProfileV1);
profileManager.setActiveProfile(officialProfileV1.id);

// 2. Create chain
const chain = createChain({ name: 'My Chain' });

// 3. Create genesis event
const genesis = createGenesisEvent(
  'system.init',
  'my-app',
  { message: 'Chain started' }
);

appendToChain(chain, genesis);

// 4. Append events
const event1 = createEvent({
  type: 'user.login',
  source: 'web-app',
  payload: {
    userId: '123',
    timestamp: Date.now()
  }
});

appendToChain(chain, event1);

// 5. Verify chain
const result = verifyChain(chain);

if (result.status === 'VALID') {
  console.log('✅ Chain is valid');
}

// 6. Replay evidence
const replay = replayChain(chain);

console.log(`Evidence: ${replay.verifiedChain.length} events`);
```

---

## 📁 Structure

```text id="gq8x2m"
sdk/
├── src/
│   ├── types/          # All type definitions
│   ├── core/           # Core logic (event, chain, verification, replay)
│   ├── utils/          # Utilities (crypto, canonical)
│   ├── profile/        # Profile management (manager, official-v1)
│   └── index.ts        # Entry point
├── tests/              # Unit and integration tests
├── examples/           # Usage examples
├── dist/               # Compiled output
├── package.json        # NPM configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

---

## 📚 API Reference

| Module                | Description                         |
| --------------------- | ----------------------------------- |
| `core/event`          | Create, validate, and manage events |
| `core/chain`          | Manage event chains                 |
| `core/verification`   | Verify integrity and continuity     |
| `core/replay`         | Reconstruct evidence chains         |
| `profile/manager`     | Load and manage profiles            |
| `profile/official-v1` | Official Profile v1.0               |
| `utils/crypto`        | Cryptographic utilities             |
| `utils/canonical`     | RFC 8785 serialization              |

---

## 🧪 Testing

```bash
npm test
```

Or watch mode:

```bash
npm run test:watch
```

---

## 🔧 Building

```bash
npm run build
```

---

## 📄 License

MIT

---

## 🔗 Related Documents

* Protocol Specification
* Official Profile v1.0
* Developer Guide
* API Reference

---
