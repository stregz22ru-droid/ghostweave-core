# REPLAY ENGINE SPECIFICATION

The Replay Engine is the mechanism that allows any observer to verify a decision by reproducing it from its original inputs.

---

## Core Principle

> **"If it can't be replayed, it didn't happen."**

The engine does not store the "thought process" of the AI. It stores the **deterministic boundary**: the exact state of inputs, configuration, and logic version at the moment of decision.

---

## Replay Process

### 1. Input Resolution
Given an `EventID`, the engine retrieves:
*   The `CanonicalEvent`.
*   All `evidence` blobs referenced by their hashes.
*   The `processorVersion` specified in `replayMetadata`.

### 2. State Reconstruction
The engine initializes a clean environment with:
*   The exact input data (`contextHash`).
*   The exact configuration (`configHash`).
*   The specific logic/model version (`processorVersion`).

### 3. Deterministic Execution
The engine executes the logic against the inputs. 
*   **Constraint:** The execution must be free of non-deterministic sources (e.g., current time, random seeds, external API calls).

### 4. Verification
The engine compares the result of the replay with the stored `decisionHash`.
*   **Match:** The event is verified as authentic and reproducible.
*   **Mismatch:** The event is flagged as `REPLAY_FAILURE`, indicating potential tampering or environmental drift.

---

## Interface Definition

```typescript
interface IReplayEngine {
  /**
   * Attempts to reproduce a decision given its EventID.
   */
  replay(eventId: string): Promise<ReplayResult>;
}

interface ReplayResult {
  status: 'SUCCESS' | 'FAILURE';
  reproducedHash: string;
  originalHash: string;
  reason?: string; // If failure
}