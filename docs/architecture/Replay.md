# REPLAY ENGINE IMPLEMENTATION

This document details the concrete implementation of the Replay Engine within the GHOSTWEAVE Reference Implementation. It focuses on the mechanics of deterministic reproduction.

---

## Core Mechanism

The Replay Engine takes a `CanonicalEvent` and attempts to reconstruct the exact state and output that occurred at the time of the original decision.

### 1. Environment Setup
Before execution, the engine prepares a sandboxed environment:
*   **Inputs:** Loads all blobs referenced in `evidence` from the Content-Addressed Storage.
*   **Configuration:** Applies the configuration state defined by `configHash`.
*   **Dependencies:** Loads the specific versions of upstream models or logic modules listed in `dependencyIds`.

### 2. Execution Sandbox
To ensure determinism, the logic is executed in a controlled environment:
*   **Time Freeze:** `Date.now()` and system clocks are mocked to return the event's `timestamp`.
*   **Randomness:** If the original execution used a random seed, it is retrieved from `replayMetadata` and injected into the RNG.
*   **Network Isolation:** External API calls are blocked unless a mock response was recorded in the `evidence` array.

### 3. Comparison
After execution, the engine calculates the hash of the reproduced output.
*   `ReproducedHash = SHA256(ReplayedOutput)`
*   **Success:** `ReproducedHash == OriginalDecisionHash`.
*   **Failure:** The hashes do not match. The engine returns a `REPLAY_FAILURE` status with diagnostic logs.

---

## Handling Non-Determinism

Some AI models (e.g., LLMs with high temperature) are inherently non-deterministic. The Replay Engine handles this via:

1.  **Seed Recording:** The `processorVersion` or specific logic module must record the random seed used in `replayMetadata`.
2.  **Semantic Matching:** If exact binary match is impossible, the engine may support a "Semantic Replay" mode (via Extension) that compares the semantic meaning of the output rather than the exact bytes.
3.  **Probabilistic Verification:** For some models, the engine may verify that the output falls within a statistically expected range, though this is considered a weaker form of verification.

---

## Performance Optimization

*   **Caching:** Frequently used `processorVersions` and `configHash` states are cached in memory to avoid reloading from disk.
*   **Lazy Loading:** Evidence blobs are only loaded from disk when the replay is actually triggered, not during event ingestion.
*   **Parallelism:** Multiple replays can be executed concurrently in separate worker threads or processes.

---

## Error Handling

*   **Missing Evidence:** If a referenced hash in `evidence` is not found in storage, the replay fails with `EVIDENCE_MISSING`.
*   **Version Mismatch:** If the `processorVersion` code is no longer available or incompatible, the replay fails with `VERSION_UNAVAILABLE`.
*   **Timeout:** Replays are subject to a configurable timeout to prevent infinite loops in buggy logic versions.

---
**Status:** v1.0 Draft  
**Last Updated:** 2026-06-27