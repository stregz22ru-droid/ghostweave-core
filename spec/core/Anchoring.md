# ANCHORING INTERFACE SPECIFICATION

The Anchoring Interface allows GHOSTWEAVE Core to bind its internal hash chain to external, immutable ledgers. This provides "Proof of Existence" and protects against history rewriting by the system operator.

---

## Core Principle

> **"Trust, but verify externally."**

Core does not implement its own blockchain. It provides a standard interface for any external anchoring provider.

---

## Interface Definition

```typescript
interface IAnchorProvider {
  /**
   * Submits a batch of hashes to the external ledger.
   * @param hashes Array of event hashes to anchor.
   * @returns A proof token or transaction ID from the provider.
   */
  submit(hashes: string[]): Promise<AnchorProof>;

  /**
   * Verifies that a specific hash exists in the external ledger.
   * @param hash The event hash to check.
   * @param proof The proof token received during submission.
   * @returns True if the hash is confirmed on the ledger.
   */
  verify(hash: string, proof: AnchorProof): Promise<boolean>;
}

interface AnchorProof {
  providerId: string;
  transactionId: string;
  timestamp: string;
  merkleRoot?: string; // Optional: for batch anchoring
}