# ADR-0004: Profile Migration

**Status:** Accepted

---

## Context

GHOSTWEAVE Profiles define concrete algorithms, formats, and mechanisms. As the ecosystem evolves, new profiles will emerge with new hash algorithms, serialization methods, and identity providers.

The protocol must support migration without breaking existing chains.

---

## Decision

**New profiles MUST be backward-compatible.**

A new profile version:
- MAY introduce new fields.
- MAY introduce new hash algorithms.
- MAY introduce new extension points.

A new profile version:
- MUST NOT change canonicalization of existing events.
- MUST NOT change field order of old versions.
- MUST NOT break verification of old chains.

**Verification of old events MUST remain always possible.**

---

## Consequences

### Positive
- Chains remain valid across profile versions.
- Smooth upgrade path for implementations.
- Ecosystem can evolve without breaking existing data.

### Negative
- Profile designers must be careful about compatibility.
- Some features may be delayed to ensure compatibility.

---

## Alternatives Considered

### Alternative 1: Allow breaking changes

**Rejected.** Breaking changes would require re-verification of all chains, which is impractical and would undermine trust.

### Alternative 2: No versioning for profiles

**Rejected.** Without versioning, the ecosystem cannot evolve. New algorithms and formats would be impossible to introduce.

---

**This document is part of the GHOSTWEAVE Release Readiness deliverables.**