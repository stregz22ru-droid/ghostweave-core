# REFERENCE IMPLEMENTATION ARCHITECTURE

This document describes the concrete realization of the GHOSTWEAVE Core abstract interfaces. It serves as the blueprint for the primary TypeScript/Node.js implementation.

---

## Overview

The Reference Implementation (RI) is a standalone, embeddable library that provides a fully functional GHOSTWEAVE Core. It is designed to be:
*   **Zero-Dependency:** No external runtime libraries required for core logic.
*   **Portable:** Runs on Node.js, Deno, or Bun.
*   **Testable:** Includes a comprehensive suite of deterministic tests.

---

## Technology Stack

*   **Language:** TypeScript (Strict Mode).
*   **Runtime:** Node.js (v20+), with compatibility for Deno/Bun.
*   **Cryptography:** Native `crypto` module (WebCrypto API) for SHA-256 and Ed25519.
*   **Storage (Default):** In-memory (for testing) and File-based JSONL (for persistence).
*   **Serialization:** Canonical JSON (sorted keys, no whitespace).

---

## Component Instantiation

### 1. EventStore Implementation (`FileEventStore`)
*   **Mechanism:** Appends canonical JSON lines to a `.jsonl` file.
*   **Indexing:** Maintains a lightweight in-memory map of `EventID -> FileOffset` for fast retrieval.
*   **Concurrency:** Uses file locking (or atomic appends) to prevent corruption in multi-process environments.

### 2. Identity Implementation (`LocalIdentityRegistry`)
*   **Mechanism:** Stores public keys in a local JSON file or SQLite database.
*   **Key Management:** Supports key generation, rotation, and revocation lists.

### 3. Replay Implementation (`DeterministicReplayEngine`)
*   **Mechanism:** Loads the original `evidence` blobs and the specific `processorVersion` code (via dynamic import or sandbox) to re-execute the logic.
*   **Constraint:** Requires the execution environment to be strictly deterministic (no `Date.now()`, no random seeds without recording).

---

## Data Flow (Ingest Path)

1.  **Receive:** API receives a raw payload (Input + Context).
2.  **Hash:** `ProvenanceEngine` calculates `contextHash` and `decisionHash`.
3.  **Sign:** `IdentityLayer` signs the payload using the configured Actor's private key.
4.  **Validate:** Core checks schema, signature, and `parentHash` against the latest stored event.
5.  **Persist:** `EventStore` appends the event to the disk.
6.  **Notify:** (Optional) Triggers an event listener for Extensions (e.g., Anchoring).

---

## Directory Structure (Implementation)

```text
src/
├── core/           # Abstract interfaces (01_CORE)
├── impl/           # Concrete implementations
│   ├── store/      # FileEventStore, MemoryEventStore
│   ├── crypto/     # SHA256, Ed25519 wrappers
│   └── identity/   # LocalIdentityRegistry
├── protocol/       # Serialization, Canonical JSON
└── utils/          # Logging, Error handling