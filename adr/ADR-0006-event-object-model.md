# ADR-0006: Event Object Model

**Status:** Accepted

---

## Context

GHOSTWEAVE Core must define a clear, immutable event model that separates concerns and remains future-proof. The event model is the foundation of the entire protocol.

---

## Decision

**Event = Envelope + Payload.**

- **Envelope:** Core-defined metadata (version, profile, identity, integrity, provenance, temporal, payloadHash, payloadType, payloadLength).
- **Payload:** Opaque content (format defined by Profile, not interpreted by Core).

**Rules:**
1. Core serializes ONLY the Envelope.
2. Core does NOT interpret Payload.
3. Payload format is defined by Profile.
4. Canonical serialization applies to Envelope ONLY.
5. Hash is computed over Envelope canonical representation.

---

## Consequences

### Positive
- Clear separation of Core and Profile responsibilities.
- Payload can evolve independently.
- Core remains lightweight and stable.
- Cross-implementation compatibility is ensured.

### Negative
- Core cannot provide semantic validation of payload.
- Some use cases may require additional validation (handled by Profiles/Extensions).

---

## Alternatives Considered

### Alternative 1: Event = full object

**Rejected.** This would force Core to understand all payload types and make it vulnerable to changes in data formats.

### Alternative 2: Payload included in hash

**Rejected.** This would break the separation of concerns and make Core dependent on payload formats.

---

**This document is part of the GHOSTWEAVE Release Readiness deliverables.**