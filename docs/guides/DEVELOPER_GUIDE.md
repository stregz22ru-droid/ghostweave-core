# GHOSTWEAVE Developer Guide

**Version:** 1.0
**Status:** DRAFT
**Last Updated:** 2026-06-28

---

## 1. Introduction

This guide is for developers who want to **build applications, integrations, or extensions** using GHOSTWEAVE Core.

It covers:

* Core concepts (Events, Envelopes, Chains)
* Working with Profiles
* Implementing Verification and Replay
* Building Extensions
* Best practices

---

## 2. Core Concepts

### 2.1 Event = Envelope + Payload

| Part         | Definition                                              | Who Defines        |
| ------------ | ------------------------------------------------------- | ------------------ |
| **Envelope** | Core-defined metadata (version, hash, provenance, etc.) | Protocol           |
| **Payload**  | Opaque content (your data)                              | You / Your Profile |

**Rule:** Core never touches Payload. Only the Envelope is serialized and hashed.

### 2.2 Chain = Sequence of Events

* Each event (except Genesis) references its parent via `previous_hash`.
* The chain is immutable and verifiable.
* Replay reconstructs the chain deterministically.

### 2.3 Verification = Trust Check

* Hash integrity
* Chain continuity
* Genesis validity
* Profile conformance

### 2.4 Replay = Evidence Reconstruction

* **Not** AI reasoning.
* **Not** model execution.
* **Yes** — deterministic reconstruction of the event chain.

---

## 3. Getting Started

### 3.1 Choose a Profile

Start with the **Official Profile v1.0**:

| Parameter        | Value                           |
| ---------------- | ------------------------------- |
| Hash             | SHA-256                         |
| Canonicalization | RFC 8785                        |
| Signature        | Ed25519                         |
| Payload          | Opaque (implementation-defined) |
| Identity         | Implementation-defined          |
| Anchor           | NONE                            |

### 3.2 Create Your First Event

const event = {
  id: "evt_001",
  timestamp: Date.now(),
  type: "my.first.event",
  source: "my-app",
  previous_hash: "0".repeat(64), // Genesis
  payload: { message: "Hello World" },
  metadata: { version: "1.0" }
};

// Compute hash (SHA-256)
const hash = computeHash(event);
event.hash = hash;

### 3.3 Append to Chain

const previousEvent = getLastEvent(chain);
const previousHash = previousEvent ? previousEvent.hash : "0".repeat(64);

const newEvent = {
  ...event,
  previous_hash: previousHash
};

const result = appendEvent(chain, newEvent);

if (result.success) {
  console.log("Event appended:", result.event.id);
}

### 3.4 Verify Chain

const result = verifyChain(chain);

if (result.status === "VALID") {
  console.log("✅ Chain is valid");
} else {
  console.error("❌ Chain invalid:", result.errors);
}

### 3.5 Replay Chain

const replayResult = replayChain(chain);

console.log(`Replay: ${replayResult.verifiedChain.length} events`);

---

## 4. Working with Profiles

### 4.1 Profile Selection

* The Profile determines algorithms and formats.
* The Profile identifier is stored in the Envelope.
* Different Profiles can coexist.

### 4.2 Creating a Custom Profile

Follow the **PROFILE_DESIGN_GUIDE.md**.

Checklist:

* [ ] All Core invariants respected.
* [ ] No Core changes required.
* [ ] All algorithms documented.
* [ ] Test vectors provided.
* [ ] Migration rules defined.

---

## 5. Building Extensions

### 5.1 Extension Contract

| Extension MUST NOT | Extension MAY             |
| ------------------ | ------------------------- |
| Modify events      | Analyze events            |
| Delete events      | Export events             |
| Reorder chain      | Visualize chain           |
| Rewrite hashes     | Generate reports          |
| Rewrite provenance | Enrich events (read-only) |

### 5.2 Extension Example

class ConflictResolver implements Extension {
  name = "ConflictResolver";
  version = "1.0.0";

  analyze(events: Event[]): ConflictReport {
    // Analyze chain for conflicts (read-only)
    return {
      conflicts: [],
      status: "OK"
    };
  }
}

---

## 6. Best Practices

### 6.1 Do

* ✅ Use canonical serialization (RFC 8785) for all cryptographic operations.
* ✅ Store events in append-only storage (JSONL, WAL).
* ✅ Verify the chain before trusting it.
* ✅ Use Profiles to document your algorithm choices.
* ✅ Write tests for your implementation.

### 6.2 Don't

* ❌ Modify events after creation.
* ❌ Bypass verification.
* ❌ Store Payload in Envelope.
* ❌ Use non-deterministic serialization.
* ❌ Assume Core validates Payload.

### 6.3 Performance Tips

* Use batch appends for high-volume ingestion.
* Cache verification results where safe.
* Use streaming Replay for large chains.
* Profile your implementation.

---

## 7. Common Tasks

### 7.1 Importing External Events

1. Validate event schema.
2. Verify hash (recompute and compare).
3. Verify chain continuity.
4. Append if valid.

### 7.2 Exporting Chain

1. Load all events.
2. Serialize to Canonical JSON.
3. Include metadata (version, profile, timestamp).

### 7.3 Integrating with Identity

1. Define Identity Provider (DID, OIDC, etc.).
2. Populate `identity` field in Envelope.
3. Verify signatures (if enabled).

---

## 8. Error Handling

| Error              | Cause                     | Resolution                                      |
| ------------------ | ------------------------- | ----------------------------------------------- |
| `INVALID_HASH`     | Hash mismatch             | Recompute hash; check canonical serialization   |
| `BROKEN_CHAIN`     | Parent hash mismatch      | Find missing event; repair chain                |
| `UNKNOWN_PROFILE`  | Profile not recognized    | Check Profile identifier; update implementation |
| `VERSION_MISMATCH` | Protocol version mismatch | Update implementation; negotiate version        |

---

## 9. Debugging

### 9.1 Logging

console.debug("Event created", {
  id: event.id,
  hash: event.hash
});

console.info("Chain verified", {
  length: chain.length,
  status: result.status
});

console.error("Verification failed", {
  errors: result.errors
});

### 9.2 Inspecting Chain

gw status --path ./my-repo
gw verify --verbose
gw replay --format markdown

### 9.3 Test Vectors

Use the canonical events from:

tests/stress/fixtures/canonical-events.json

to validate your implementation.

---

## 10. Reference Implementations

| Language   | Repository       | Status      |
| ---------- | ---------------- | ----------- |
| TypeScript | `src/` (current) | ✅ Reference |
| Rust       | (planned)        | 🔮 Future   |
| Python     | (planned)        | 🔮 Future   |
| Go         | (planned)        | 🔮 Future   |

---

## 11. Further Reading

* `PROFILE_DESIGN_GUIDE.md`
* `INTEGRATION_GUIDE.md`

---

**This document is part of the GHOSTWEAVE Core v1.0 deliverables.**