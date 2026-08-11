# PROJECT SCOPE: GHOSTWEAVE CORE v1.0

This document defines the boundaries of the Core system. It serves as a filter for all future development decisions.

---

## ✅ IN SCOPE (CORE)

The Core is responsible for the **mechanics of trust**. It provides the infrastructure to record, link, and verify events.

1.  **Event Store:** Append-only storage for canonical events.
2.  **Hash Chain:** Cryptographic linking of events to ensure integrity.
3.  **Replay Engine:** Mechanism to reconstruct state from event history.
4.  **Provenance Tracking:** Linking inputs, context, and decisions via hashes.
5.  **Identity Binding:** Associating events with signed Actor IDs.
6.  **Verification API:** Public interface to validate event integrity (`Verify(EventID)`).
7.  **Anchor Interface:** Abstract API for external timestamping/anchoring (RFC3161, SCITT, etc.).

**Key Constraint:** The Core is **domain-agnostic**. It does not interpret the content of the events.

---

## ❌ OUT OF SCOPE (EXTENSIONS / EXTERNAL)

The following are explicitly **excluded** from the Core. They must be implemented as Extensions or external services.

1.  **Domain Logic:** No medical, financial, or legal rules.
2.  **Conflict Resolution:** Core preserves conflicts; it does not resolve them automatically.
3.  **Semantic Search:** Core stores structured data; it does not perform vector similarity search.
4.  **Blockchain Implementation:** Core provides an Anchor Interface, but does not implement its own ledger.
5.  **Custom Cryptography:** Core uses standard libraries (SHA-256, Ed25519); it does not invent new algorithms.
6.  **UI/UX:** No dashboards or visualization tools.
7.  **Network Protocol:** Core is a library/engine. Network transport (gRPC/HTTP) is an implementation detail of the Reference Implementation.

---

## 🚧 THE "GRAY ZONE" RULE

If a feature is requested, ask:
> *"Can the Trust Layer function without this?"*

*   **YES** → It is an **Extension**.
*   **NO** → It might be **Core** (requires Architect review).

**Example:**
*   *Storing a hash of the input?* **Core** (Required for Provenance).
*   *Storing a human-readable explanation of why the input was chosen?* **Extension** (Explainability Module).

---
**Status:** v1.0 Locked  
**Last Updated:** 2026-06-27