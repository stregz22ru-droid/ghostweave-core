# CANONICAL EVENT SPECIFICATION

The Canonical Event is the atomic unit of truth in GHOSTWEAVE. Every state change, decision, or observation must be recorded as an instance of this structure.

---

## Structure Definition

```typescript
interface CanonicalEvent {
  // Unique identifier for this event (UUID v7 recommended)
  eventId: string;

  // Hash of the previous event in the chain (null for genesis)
  parentHash: string | null;

  // ISO 8601 timestamp of creation
  timestamp: string;

  // Identifier of the entity creating the event
  actorId: string;

  // Hash of the input data that triggered this event
  contextHash: string;

  // Hash of the decision/output produced
  decisionHash: string;

  // Array of evidence hashes (inputs, model versions, configs)
  evidence: string[];

  // Metadata required to reproduce this event deterministically
  replayMetadata: ReplayMetadata;

  // Cryptographic signature of the event payload
  signature: string;
}

interface ReplayMetadata {
  // Version of the logic/model used
  processorVersion: string;
  
  // Hash of the configuration state
  configHash: string;
  
  // Identifiers of all upstream dependencies
  dependencyIds: string[];
}