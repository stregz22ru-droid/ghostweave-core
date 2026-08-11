# HASH CHAIN SPECIFICATION

The Hash Chain provides cryptographic integrity for the event history. It ensures that no event can be altered, deleted, or inserted without breaking the chain.

---

## Core Principle

> **"History is immutable."**

Each event is cryptographically linked to its predecessor, forming a single, unbreakable line of truth.

---

## Linking Mechanism

### 1. Content Hashing
Before linking, the content of the event is hashed:
`ContentHash = SHA256(CanonicalJSON(EventPayload))`

### 2. Chain Linking
The `parentHash` field of the current event must equal the `ContentHash` of the previous event.
`CurrentEvent.parentHash == PreviousEvent.ContentHash`

### 3. Genesis Event
The first event in any chain has `parentHash = null`. Its integrity is established by the Identity Layer signature.

---

## Integrity Verification

To verify a segment of the chain:
1.  Calculate `SHA256` of the event payload.
2.  Compare it with the `parentHash` of the next event.
3.  Repeat until the end of the segment or the genesis event.

If any link fails, the entire chain from that point forward is considered **compromised**.

---

## Fork Detection

If two events claim the same `parentHash`, a **fork** is detected.
*   **Core Behavior:** The Core records both events as valid but conflicting branches.
*   **Resolution:** Fork resolution is handled by the **Conflict Preservation Extension** (Layer 02), not the Core.

---

## Algorithm Details

*   **Hash Function:** SHA-256 (NIST FIPS 180-4).
*   **Encoding:** Hexadecimal string (lowercase).
*   **Collision Resistance:** 128-bit security level.

---
**Status:** v1.0 Draft  
**Last Updated:** 2026-06-27