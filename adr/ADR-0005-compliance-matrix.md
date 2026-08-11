# ADR-0005: Compliance Matrix

**Status:** Accepted

---

## Context

GHOSTWEAVE Core defines invariants, but the protocol must be testable and verifiable. A compliance matrix is needed to map each invariant to its implementation, evidence, and test.

This ensures that every architectural requirement is:

- **Implemented** in the SDK
- **Evidenced** in the audit
- **Tested** in the certification suite

---

## Decision

**A Compliance Matrix is maintained as a living document.**

It maps:
- **RFC Requirement** → Protocol Specification
- **Implementation** → SDK, HTTP Adapter, Core
- **Evidence** → Evidence Registry ID
- **Test** → Certification Kit test
- **Certification** → Status (PASSED / PENDING / FAILED)

The matrix is part of the Release Readiness artifacts and is updated with every release.

---

## Consequences

### Positive
- Traceability from requirement to certification.
- Clear visibility into what is covered and what is missing.
- Easier for external auditors to verify compliance.
- Prevents gaps between specification and implementation.

### Negative
- Requires maintenance effort.
- Matrix must be kept in sync with the codebase and documentation.

---

## Alternatives Considered

### Alternative 1: No compliance matrix

**Rejected.** Without a matrix, there is no way to verify that all requirements are implemented and tested.

### Alternative 2: Matrix maintained only during audit

**Rejected.** The matrix should be updated continuously, not just before audits. This reduces technical debt and ensures readiness.

---

**This document is part of the GHOSTWEAVE Release Readiness deliverables.**