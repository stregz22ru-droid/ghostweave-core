# GHOSTWEAVE Official Profile v1.0 & Integration Guide

**Status:** DRAFT
**Version:** 1.0
**Last Updated:** 2026-06-28
**Protocol Compatibility:** GHOSTWEAVE Core v1.0 (RFC Candidate)

---

## 1. Purpose (Profile)

This document defines the **Official Profile v1.0** for the GHOSTWEAVE protocol and provides an integration guide for implementers.

A Profile is a concrete specification of:

* Algorithms
* Formats
* Identity mechanisms
* Timestamp handling
* Signature schemes
* Export formats

This combined document serves as:

* The **reference configuration** for all GHOSTWEAVE implementations.
* The **first test** of Core independence (Profile must not require Core changes).
* The **baseline** for future Profiles (Medical, Finance, Compliance, etc.).
* The **integration blueprint** for connecting GHOSTWEAVE with external systems, AI platforms, and enterprise infrastructure.

---

## 2. Profile Identity

| Field                | Value                   |
| -------------------- | ----------------------- |
| **Profile Name**     | `ghostweave-profile-v1` |
| **Profile Version**  | `1.0.0`                 |
| **Protocol Version** | `GWP/1.0`               |
| **Status**           | Official                |

---

## 3. Selected Algorithms (Profile)

### 3.1 Hash Algorithm

| Parameter          | Value                                     |
| ------------------ | ----------------------------------------- |
| **Algorithm**      | SHA-256 (FIPS 180-4)                      |
| **Output Length**  | 256 bits / 64 hex characters              |
| **Input**          | Canonical Envelope (excluding hash field) |
| **Implementation** | Any FIPS-compliant SHA-256 implementation |

**Justification:** SHA-256 is widely supported, cryptographically secure, and well-audited.

---

### 3.2 Canonical Serialization

| Parameter          | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Standard**       | RFC 8785 (JSON Canonicalization Scheme)                                |
| **Rules**          | Keys sorted lexicographically, no extra whitespace, no trailing commas |
| **Omitted Fields** | `hash` field is excluded from canonical serialization                  |
| **Null Values**    | Optional fields are included with `null` (not omitted)                 |

**Justification:** RFC 8785 ensures deterministic serialization across implementations.

---

### 3.3 Signature Scheme

| Parameter            | Value                               |
| -------------------- | ----------------------------------- |
| **Algorithm**        | Ed25519 (RFC 8032)                  |
| **Key Length**       | 256 bits                            |
| **Signature Length** | 512 bits / 64 bytes                 |
| **Signing Input**    | Canonical Envelope (including hash) |
| **Verification**     | Standard Ed25519 verification       |

**Justification:** Ed25519 is fast, secure, and widely available in cryptographic libraries.

---

### 3.4 Payload Format

| Parameter      | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| **Format**     | Opaque (Core does not interpret)                           |
| **Encoding**   | Implementation-defined (recommended: JSON, Protobuf, CBOR) |
| **Validation** | Profile-level (Core does not validate)                     |

**Justification:** Payload opacity ensures Core remains future-proof.

---

### 3.5 Identity Binding

| Parameter              | Value                                          |
| ---------------------- | ---------------------------------------------- |
| **Identity Provider**  | Implementation-defined                         |
| **Identity Format**    | Implementation-defined                         |
| **Identity Interface** | Core `identity` field in Envelope              |
| **Trust Model**        | Profile-level (Core does not trust identities) |

**Justification:** Core defines only the Interface. Identity systems evolve.

---

### 3.6 Timestamp Handling

| Parameter       | Value                                               |
| --------------- | --------------------------------------------------- |
| **Format**      | Unix epoch milliseconds (integer)                   |
| **Trust Model** | Profile-level (Core does not validate time)         |
| **Ordering**    | Implementations SHOULD maintain chronological order |
| **Validation**  | Profile-level (if needed)                           |

**Justification:** Time trust is context-dependent. Core stores timestamp as metadata.

---

### 3.7 Anchor

| Parameter           | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| **Anchor Provider** | NONE (no external anchoring)                                        |
| **Reason**          | Core must remain independent of blockchain or timestamping services |
| **Future**          | Profiles MAY add anchoring (RFC3161, SCITT, Blockchain)             |

**Justification:** Anchoring is optional. Core does not require it.

---

### 3.8 ReplayResult Schema

| Field                            | Type      | Description                          |
| -------------------------------- | --------- | ------------------------------------ |
| `status`                         | enum      | `VALID`, `INVALID`, `PARTIAL`        |
| `verifiedChain`                  | Event[]   | Verified events (if status is VALID) |
| `verificationReport`             | object    | Detailed report of verification      |
| `verificationReport.totalEvents` | integer   | Total events processed               |
| `verificationReport.verified`    | integer   | Verified events                      |
| `verificationReport.invalid`     | integer   | Invalid events                       |
| `verificationReport.missing`     | integer   | Missing events                       |
| `missingEvents`                  | EventId[] | IDs of missing events (if any)       |
| `brokenLinks`                    | array     | Broken chain links (if any)          |
| `brokenLinks[].index`            | integer   | Event index                          |
| `brokenLinks[].expected`         | string    | Expected previous_hash               |
| `brokenLinks[].actual`           | string    | Actual previous_hash                 |
| `warnings`                       | string[]  | Validation warnings                  |

---

### 3.9 Export Format

| Parameter      | Value                                                  |
| -------------- | ------------------------------------------------------ |
| **Format**     | Canonical JSON (RFC 8785)                              |
| **Content**    | Full event chain                                       |
| **Metadata**   | Protocol version, Profile identifier, Export timestamp |
| **Validation** | Export package MUST be verifiable by Core              |

**Justification:** Canonical JSON ensures cross-implementation compatibility.

---

## 4. Conformance Requirements (Profile)

### 4.1 Core Conformance

A Profile-conformant implementation MUST:

* Implement all Core invariants.
* Use SHA-256 for hash computation.
* Use RFC 8785 for canonical serialization.
* Use Ed25519 for signatures (if enabled).
* Implement ReplayResult schema.
* Export in Canonical JSON.

### 4.2 Profile Conformance

A Profile-conformant implementation MAY:

* Add Identity providers.
* Add Anchoring mechanisms.
* Add Payload validation.
* Add timestamp validation.

### 4.3 High-Assurance Conformance

A High-Assurance implementation MUST additionally:

* Use hardware-backed key storage.
* Perform external audits.
* Provide verifiable timestamps.
* Support SCITT or RFC3161 anchoring.

---

## 5. Migration Rules (Profile)

### 5.1 Backward Compatibility

A new Profile version:

* MAY introduce new fields.
* MAY introduce new hash algorithms.
* MAY introduce new extension points.

A new Profile version:

* MUST NOT change canonicalization of existing events.
* MUST NOT change field order of old versions.
* MUST NOT break verification of old chains.

### 5.2 Version String

* Profile version string: `ghostweave-profile-v1.0.0`
* Protocol version string: `GWP/1.0`

---

## 6. Test Vectors (Profile)

### 6.1 Genesis Event

```json
{
  "id": "evt_test_genesis",
  "timestamp": 1700000000000,
  "type": "genesis",
  "source": "test",
  "previous_hash": "0000000000000000000000000000000000000000000000000000000000000000",
  "payload": {
    "message": "Genesis"
  },
  "metadata": {
    "test": true
  },
  "hash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### 6.2 Hash Computation

**Input (Canonical Envelope without hash):**

```json
{"id":"evt_test","timestamp":1700000001000,"type":"test","source":"test","previous_hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","payload":{"message":"Test"},"metadata":null}
```

**Expected SHA-256:**

```text
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
```

---

## 7. Integration Principles (Guide)

### 7.1 Protocol Independence

* GHOSTWEAVE is a protocol, not a platform.
* Core is independent of your existing infrastructure.
* Integrate via Profiles, not code.

### 7.2 Layered Integration

```text
Application
    │
    ▼
GHOSTWEAVE Profile
    │
    ▼
GHOSTWEAVE Core
    │
    ▼
Storage / Transport / Infrastructure
```
