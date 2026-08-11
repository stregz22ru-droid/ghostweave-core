# RFC-002: Fork Handling

**Status:** DRAFT  
**Date:** 2026-07-01  
**Author:** Development Team  
**Target:** GHOSTWEAVE Core v2.0 (or later)  
**Compatibility:** Conceptual, no implementation required

---

## 1. Summary

This RFC describes the fork handling strategy for GHOSTWEAVE Core.

Core v1.0 uses a linear chain model — each event has exactly one parent. This is sufficient for most use cases, but decentralized scenarios may require support for forks (multiple children from the same parent).

This RFC proposes a **fork handling strategy** without modifying Core v1.0.

---

## 2. Why Core v1.0 is Linear

| Reason | Description |
|--------|-------------|
| **Simplicity** | Linear chain is easier to verify, replay, and audit. |
| **Determinism** | No ambiguity in chain selection. |
| **Performance** | Linear chains are faster to process. |
| **Use case fit** | Most AI and enterprise scenarios do not require forks. |

**Core v1.0 remains linear.** Forks are handled at the Extension or Application layer.

---

## 3. Fork Handling Strategies

| Strategy | Description | Pros | Cons |
|----------|-------------|------|------|
| **Longest Chain** | Choose the chain with the most events. | Simple, common in blockchain. | Vulnerable to spam. |
| **Heaviest Chain** | Choose the chain with the most cumulative "weight". | More secure. | Requires weight calculation. |
| **Application-defined** | Let the application choose the fork. | Maximum flexibility. | No consensus. |
| **Extension-defined** | Use an Extension to define fork choice. | Clean separation. | Requires Extension implementation. |

---

## 4. Recommended Strategy

**Extension-defined fork handling.**

- Core does not handle forks.
- Extensions define fork choice logic.
- Applications select the Extension.

This aligns with Core principles:
- Core defines invariants.
- Extensions define behavior.

---

## 5. Limitations

| Limitation | Description |
|------------|-------------|
| **No built-in consensus** | Core does not provide consensus. |
| **Application responsibility** | Applications must choose an Extension. |
| **No cross-extension compatibility** | Different Extensions may produce different results. |

---

## 6. Migration Path

1. **Step 1**: Define Extension interface for fork handling.
2. **Step 2**: Implement reference Extension in SDK.
3. **Step 3**: Update Certification Kit to test fork handling.
4. **Step 4**: Document fork strategies for implementers.

---

## 7. References

- [RFC-001: Replay Metadata Separation](RFC-001-Replay-Metadata-Separation.md)
- [ADR-0001: Payload is Opaque](../docs/adr/ADR-0001-payload-opaque.md)
- [Independent Audit Report (2026-06-30)](../auditor/README.md)

---

## 8. Approval

| Role | Status |
|------|--------|
| Architecture Board | ⏳ Pending |
| Core Maintainers | ⏳ Pending |

---

**This RFC is part of the GHOSTWEAVE Core v1.x Evolution Program.**