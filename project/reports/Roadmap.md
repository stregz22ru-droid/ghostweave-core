# REFERENCE IMPLEMENTATION ROADMAP

This document outlines the phased development plan for the GHOSTWEAVE Reference Implementation. It prioritizes a minimal, verifiable Core before expanding into Extensions and external integrations.

---

## Phase 1: Core MVP (Weeks 1-4)
**Goal:** A fully functional, zero-dependency Core that can ingest, link, and verify events locally.

### Deliverables:
1.  **Canonical Event Parser:** Strict JSON schema validation and canonical serialization.
2.  **In-Memory Event Store:** For initial testing and unit tests.
3.  **File-Based Event Store:** JSONL append-only storage with byte-offset indexing.
4.  **Hash Chain Engine:** SHA-256 implementation for content and chain linking.
5.  **Local Identity Registry:** Ed25519 key generation, storage, and signature verification.
6.  **Basic Replay Engine:** Ability to re-calculate hashes from stored evidence blobs.

### Exit Criteria:
*   Can ingest 10,000 events per second on commodity hardware.
*   100% test coverage for chain integrity and signature verification.
*   Zero external runtime dependencies.

---

## Phase 2: Anchoring & Verification API (Weeks 5-6)
**Goal:** Expose the Core to the outside world and provide external proof of existence.

### Deliverables:
1.  **Verification API:** REST/gRPC endpoints for `Verify(EventID)` and `VerifyChain()`.
2.  **Audit Package Exporter:** Tool to generate the standardized ZIP package for external auditors.
3.  **RFC3161 Anchor Adapter:** Basic integration with a Time Stamping Authority.
4.  **Webhook/Event Listener:** Mechanism to notify external systems of new events.

### Exit Criteria:
*   External client can verify a chain of 1,000 events in < 2 seconds.
*   Successfully anchors a batch of hashes to an external TSA and retrieves the proof.

---

## Phase 3: Extension Framework (Weeks 7-9)
**Goal:** Prove that the Core is truly domain-agnostic by building the first Extensions without modifying Core code.

### Deliverables:
1.  **Extension Registry:** Mechanism to load and manage external modules.
2.  **Conflict Preservation Extension:** First real extension, handling divergent branches.
3.  **Explainability Extension:** Attaching natural language summaries to events.
4.  **Policy Engine Extension:** Basic rule-based filtering and flagging.

### Exit Criteria:
*   Extensions can be added/removed at runtime without restarting the Core.
*   Core test suite passes with all extensions disabled.

---

## Phase 4: Pilot Integration (Weeks 10-12)
**Goal:** Deploy the Reference Implementation in a real-world scenario to measure performance and UX.

### Target Pilot:** AI Credit Decision or Internal Enterprise Agent.
### Deliverables:
1.  **Pilot Adapter:** Code that intercepts the pilot's decision flow and formats it into `CanonicalEvents`.
2.  **Dashboard/Viewer:** A simple UI to browse the event chain and view replays.
3.  **Performance Report:** Metrics on storage growth, replay time, and hash calculation overhead.

### Exit Criteria:
*   System operates in production for 2 weeks without data loss.
*   Replay time for a complex decision is < 500ms.

---

## Phase 5: Specification & RFC (Weeks 13-14)
**Goal:** Formalize the learnings from the pilot into a public standard.

### Deliverables:
1.  **GHOSTWEAVE Core Specification v1.0:** Final normative document.
2.  **RFC Draft 0.1:** Published to IETF or similar standards body for review.
3.  **Compliance Test Suite:** A standardized set of tests for third-party implementations to prove compliance.

---
**Status:** v1.0 Draft  
**Last Updated:** 2026-06-27