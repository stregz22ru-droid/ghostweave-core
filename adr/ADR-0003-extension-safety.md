# ADR-0003: Extension Safety

**Status:** Accepted

---

## Context

GHOSTWEAVE Core must remain **stable and trustworthy**. Extensions add behavior but must not compromise Core invariants. Without clear safety rules, extensions could corrupt the chain, break verification, or introduce security vulnerabilities.

---

## Decision

**Extensions are read-only and MUST NOT modify Core state.**

Extensions may:
- Analyze events.
- Export data.
- Visualize chains.
- Generate reports.
- Enrich events (read-only).

Extensions must NOT:
- Modify events.
- Delete events.
- Reorder the chain.
- Rewrite hashes.
- Rewrite provenance.
- Bypass verification.

Any violation makes the implementation **Non-Compliant**.

---

## Consequences

### Positive
- Core integrity is guaranteed.
- Extensions cannot corrupt the chain.
- Clear separation of concerns.
- Easier to reason about system behavior.

### Negative
- Extensions may have limited functionality.
- Some use cases may require more powerful extensions (handled via Profiles or SDKs).

---

## Alternatives Considered

### Alternative 1: Allow extensions to modify events

**Rejected.** This would break the immutability invariant and undermine trust.

### Alternative 2: Allow extensions to bypass verification

**Rejected.** Verification is the foundation of trust. Bypassing it would make the entire protocol meaningless.

### Alternative 3: Allow extensions to reorder the chain

**Rejected.** Chain order is essential for provenance and replay.

---

**This document is part of the GHOSTWEAVE Release Readiness deliverables.**