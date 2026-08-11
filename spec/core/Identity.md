# IDENTITY LAYER SPECIFICATION

The Identity Layer ensures that every event in the GHOSTWEAVE Core is attributable to a specific Actor (Human, Agent, or System).

---

## Core Principle

> **"No anonymous actions."**

Every entry in the immutable history must be cryptographically signed. This provides non-repudiation and accountability.

---

## Actor Model

An **Actor** is any entity capable of initiating an event.
*   **Human:** A verified user with a private key.
*   **Agent:** An autonomous software component with its own identity.
*   **System:** An infrastructure component (e.g., a scheduler or monitor).

Each Actor has:
*   `ActorID`: A unique, persistent identifier (e.g., DID or UUID).
*   `PublicKey`: Used for signature verification.
*   `PrivateKey`: Used for signing events (never stored in Core).

---

## Signing Process

1.  **Payload Serialization:** The `CanonicalEvent` (excluding the `signature` field) is serialized into a canonical JSON string.
2.  **Hashing:** `PayloadHash = SHA256(SerializedPayload)`.
3.  **Signing:** `Signature = Ed25519_Sign(PrivateKey, PayloadHash)`.
4.  **Attachment:** The `Signature` is added to the event before it is appended to the Event Store.

---

## Verification Process

When an event is ingested or replayed:
1.  Retrieve the `ActorID` from the event.
2.  Fetch the corresponding `PublicKey` from the Identity Registry.
3.  Recalculate `PayloadHash` from the event content.
4.  Verify: `Ed25519_Verify(PublicKey, PayloadHash, Signature)`.
5.  If verification fails, the event is rejected as **Invalid**.

---

## Interface Definition

```typescript
interface IIdentityProvider {
  /**
   * Retrieves the public key for a given ActorID.
   */
  getPublicKey(actorId: string): Promise<string>;

  /**
   * Verifies a signature against an Actor's public key.
   */
  verifySignature(actorId: string, payload: string, signature: string): Promise<boolean>;
}