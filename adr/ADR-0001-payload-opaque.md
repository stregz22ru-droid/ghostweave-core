# ADR-0001: Payload is Opaque

**Status:** Accepted

---

## Context

GHOSTWEAVE Core must handle arbitrary data from AI systems, including code, logs, structured data, and binary blobs. The protocol cannot impose restrictions on payload format, as this would limit adoption and force unnecessary conversions.

The core responsibility is to ensure **integrity** and **provenance**, not to interpret or validate content.

---

## Decision

**Payload is treated as opaque by Core.**

- Core does NOT interpret, validate, or transform payload content.
- Payload is stored as an opaque object and serialized via JSON.
- Core only computes a `payloadHash` (SHA-256) to ensure integrity.
- The `payloadType` field in Envelope indicates the format (e.g., `application/json`, `application/octet-stream`).

**This decision applies to all events.**

---

## Consequences

### Positive
- Maximum flexibility for integrations.
- No need to update Core when new payload formats emerge.
- Simpler Core implementation.
- Clear separation of concerns: Core = trust, Profiles/Extensions = interpretation.

### Negative
- Core cannot provide semantic validation of payload.
- Some use cases may require additional validation (handled by Profiles/Extensions).
- Payload size is limited by implementation (storage, network).

---

## Alternatives Considered

### Alternative 1: Define a standard Payload schema

**Rejected.** This would limit adoption and force all integrations to conform to a single standard. It would also require frequent updates to Core as new data types emerge.

### Alternative 2: Support multiple schema versions

**Rejected.** This would add significant complexity to Core without clear benefit. Schema validation is better handled by Profiles or Extensions.

### Alternative 3: Allow Core plugins for payload validation

**Rejected.** This violates the principle of "Core defines invariants, Extensions define behavior." Validation belongs to Extensions, not Core.

---

**This document is part of the GHOSTWEAVE Release Readiness deliverables.**