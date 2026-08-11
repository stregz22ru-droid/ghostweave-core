# ADR-0008: Crypto Profiles

**Status:** Draft
**Date:** 2026-07-01
**Author:** Development Team
**Target:** GHOSTWEAVE Core v2.0 (or later)
**Compatibility:** Backward-compatible with Core v1.0

---

## 1. Context

GHOSTWEAVE Core currently hardcodes cryptographic algorithms:

- Hash: SHA-256
- Signature: Ed25519

This creates several limitations:

- **No flexibility** — algorithms cannot be changed without Core updates.
- **No future-proofing** — post-quantum algorithms cannot be introduced.
- **No profile-specific crypto** — all implementations must use the same algorithms.
- **No pluggability** — cannot use hardware-backed crypto or specialized libraries.

---

## 2. Decision

Introduce **Crypto Profiles** as a pluggable abstraction layer in Core.

### 2.1 Core Interfaces (no implementation)

// src/core/crypto/CryptoProfile.ts

export interface CryptoProfile {
  id: string;
  version: string;
  hash: HashProvider;
  signature: SignatureProvider;
  key: KeyProvider;
}

export interface HashProvider {
  algorithm: string;
  hash(data: string | Buffer): string;
}

export interface SignatureProvider {
  algorithm: string;
  sign(privateKey: string, data: string): string;
  verify(publicKey: string, data: string, signature: string): boolean;
}

export interface KeyProvider {
  generateKeyPair(): { publicKey: string; privateKey: string };
  publicKeyFromPrivate(privateKey: string): string;
}

### 2.2 Default Profile (for v1.0 compatibility)

// src/core/crypto/defaultProfile.ts

export const defaultCryptoProfile: CryptoProfile = {
  id: 'ghostweave-crypto-v1',
  version: '1.0.0',
  hash: {
    algorithm: 'SHA-256',
    hash: (data: string | Buffer): string => {
      return sha256(data);
    }
  },
  signature: {
    algorithm: 'Ed25519',
    sign: (privateKey: string, data: string): string => {
      return signEd25519(privateKey, data);
    },
    verify: (publicKey: string, data: string, signature: string): boolean => {
      return verifyEd25519(publicKey, data, signature);
    }
  },
  key: {
    generateKeyPair: (): { publicKey: string; privateKey: string } => {
      return generateEd25519KeyPair();
    },
    publicKeyFromPrivate: (privateKey: string): string => {
      return deriveEd25519PublicKey(privateKey);
    }
  }
};

### 2.3 Profile Integration

// src/core/types.ts

export interface CanonicalEvent {
  // ... existing fields ...
  cryptoProfile?: string;  // Optional reference to CryptoProfile ID
}

---

## 3. Consequences

### Positive

| Advantage | Description |
|-----------|-------------|
| **Flexibility** | Profiles can be switched without Core changes. |
| **Future-proofing** | Post-quantum algorithms can be introduced as new Profiles. |
| **Profile-specific crypto** | Different Profiles can use different algorithms. |
| **Pluggability** | Hardware-backed crypto can be integrated. |

### Negative

| Disadvantage | Description |
|--------------|-------------|
| **Complexity** | Adds abstraction layer. |
| **Compatibility** | Requires careful handling of default Profile. |
| **Migration** | Existing events must remain verifiable with default Profile. |

---

## 4. Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|----------------------|
| Keep algorithms hardcoded | No flexibility, no future-proofing. |
| Allow algorithm selection via JSON Schema | Does not address pluggability or hardware integration. |
| Use external crypto library directly | Creates dependency on specific library; not portable. |

---

## 5. Migration Path

1. **Step 1**: Introduce interfaces and default Profile (no breaking changes).
2. **Step 2**: Update SDK to support custom Profiles.
3. **Step 3**: Update Certification Kit to test custom Profiles.
4. **Step 4**: Mark default Profile as `v1.0` and allow Profiles in v2.0.

---

## 6. References

- [RFC-001: Replay Metadata Separation](../rfcs/RFC-001-Replay-Metadata-Separation.md)
- [ADR-0001: Payload is Opaque](ADR-0001-payload-opaque.md)
- [Independent Audit Report (2026-06-30)](../auditor/README.md)

---

## 7. Approval

| Role | Status |
|------|--------|
| Architecture Board | ⏳ Pending |
| Core Maintainers | ⏳ Pending |
| Security Review | ⏳ Pending |

---

**This ADR is part of the GHOSTWEAVE Core v1.x Evolution Program.**