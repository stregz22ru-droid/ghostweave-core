# ADR-0002: Replay is Proof Reconstruction

**Status:** Accepted

---

## Context

The term "replay" is often misunderstood as "reproducing LLM reasoning" or "re-executing model inference." This is a dangerous misconception that could lead to incorrect expectations about GHOSTWEAVE's capabilities.

GHOSTWEAVE Core is designed to establish **trust**, not to simulate or reproduce AI behavior.

---

## Decision

**Replay is defined as the deterministic reconstruction of an evidence chain.**

- Replay reconstructs the sequence of events from the chain.
- Replay verifies hash integrity and chain continuity.
- Replay produces a `ReplayResult` containing:
  - Status (`VALID`, `INVALID`, `PARTIAL`)
  - Verified chain of events
  - Verification report (total events, verified, invalid, missing)
  - Missing events (if any)
  - Broken links (if any)
  - Warnings

**Replay does NOT:**
- Reproduce LLM reasoning.
- Explain model decisions.
- Interpret event content.
- Modify or transform events.

---

## Consequences

### Positive
- Clear distinction between **trust** (Core) and **interpretation** (Extensions).
- Prevents scope creep into AI execution.
- Enables deterministic audit and compliance.
- Replay results are reproducible across implementations.

### Negative
- Users expecting "AI replay" may be disappointed.
- Requires clear documentation to avoid confusion.

---

## Alternatives Considered

### Alternative 1: Replay = reproduce LLM reasoning

**Rejected.** This is impossible to achieve deterministically and would require storing model state, which violates Core principles.

### Alternative 2: Replay = export + visualization

**Rejected.** Visualization is a presentation concern, not a trust concern. It belongs to Extensions or SDKs, not Core.

### Alternative 3: Replay = re-execute computation

**Rejected.** This would require storing all intermediate states and would make Core dependent on specific AI frameworks.

---

**This document is part of the GHOSTWEAVE Release Readiness deliverables.**