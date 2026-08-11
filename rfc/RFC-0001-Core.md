# RFC 0001: GHOSTWEAVE CORE SPECIFICATION

**Status:** Draft  
**Category:** Standards Track  
**Date:** 2026-06-27  

---

## Abstract

This document specifies the GHOSTWEAVE Core, a domain-agnostic infrastructure layer for recording, linking, and verifying AI-generated decisions and data transformations. The Core provides a "Trust Layer" that ensures all actions are immutable, attributable, and reproducible, independent of the underlying application logic.

## 1. Introduction

The proliferation of autonomous AI systems has created a crisis of accountability. Decisions made by algorithms are often opaque, unrecorded, and irreproducible. GHOSTWEAVE Core addresses this by providing a standardized, cryptographic foundation for "Accountable Knowledge Infrastructure."

### 1.1 Requirements Language
The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHOULD", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## 2. Core Concepts

### 2.1 The Canonical Event
The atomic unit of the system is the `CanonicalEvent`. It encapsulates the input (context), the output (decision), the environment (replay metadata), and the attribution (identity).

### 2.2 The Hash Chain
Events are linked via SHA-256 hashes. Each event contains the hash of its predecessor (`parentHash`), forming a single, immutable history.

### 2.3 Replay Capability
A compliant implementation MUST be able to reproduce a decision given the original event, its evidence, and the processor version.

## 3. Data Model

### 3.1 Canonical Event Structure
A Canonical Event MUST contain the following fields:
*   `eventId` (UUID v7)
*   `parentHash` (SHA-256 or null)
*   `timestamp` (ISO 8601)
*   `actorId` (String)
*   `contextHash` (SHA-256)
*   `decisionHash` (SHA-256)
*   `evidence` (Array of SHA-256)
*   `replayMetadata` (Object)
*   `signature` (Ed25519)

### 3.2 Serialization
Events MUST be serialized using Canonical JSON (sorted keys, no whitespace) before hashing or signing.

## 4. Protocol Requirements

### 4.1 Ingestion
A compliant node MUST reject any event that:
1.  Fails schema validation.
2.  Has an invalid signature.
3.  Has a `parentHash` that does not match the hash of the latest stored event.

### 4.2 Verification
A compliant node MUST expose a `Verify(EventID)` endpoint that returns:
*   `isValid` (Boolean)
*   `checks` (Object detailing schema, signature, chain, and replay status)

### 4.3 Replay
A compliant node MUST expose a `Replay(EventID)` endpoint that attempts to re-execute the logic and compare the output hash.

## 5. Security Considerations

### 5.1 Immutability
The storage layer MUST be append-only. Deletion or modification of historical events is prohibited.

### 5.2 Identity
All events MUST be signed. Anonymous events are not permitted in the Core.

### 5.3 Anchoring
Implementations SHOULD support external anchoring (e.g., RFC3161) to provide proof of existence independent of the node operator.

## 6. References

*   [RFC2119] Key words for use in RFCs
*   [RFC8032] Edwards-Curve Digital Signature Algorithm (EdDSA)
*   [RFC3161] Internet X.509 Public Key Infrastructure Time-Stamp Protocol

---
**End of RFC 0001**