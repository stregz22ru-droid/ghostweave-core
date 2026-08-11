# FUTURE IDEAS & RESEARCH TRACKS

This document catalogs potential extensions and research directions that are currently out of scope for Core v1.0 but may be developed in future versions.

---

## 1. Zero-Knowledge Proofs (ZKP) Integration
*   **Concept:** Prove that a decision followed a specific policy without revealing the underlying data or the model weights.
*   **Status:** Research Phase.
*   **Challenge:** High computational cost for complex AI models.

## 2. Decentralized Identity (DID) Native Support
*   **Concept:** Replace internal `ActorID` with W3C-compliant DIDs for cross-organization interoperability.
*   **Status:** Planned for v1.1.
*   **Benefit:** Enables trust between competing organizations without a central authority.

## 3. Semantic Replay Engine
*   **Concept:** Instead of exact binary replay, verify that the *semantic meaning* of the output remains consistent even if the underlying model version changes slightly.
*   **Status:** Experimental.
*   **Use Case:** Long-term archival where original model binaries are lost.

## 4. Multi-Agent Consensus Protocol
*   **Concept:** A protocol for multiple GHOSTWEAVE nodes to agree on a shared history branch.
*   **Status:** Deferred.
*   **Note:** Core is currently single-node focused.

## 5. Automated Bias Detection
*   **Concept:** An extension that analyzes historical events for statistical bias in decision-making patterns.
*   **Status:** Idea Stage.
*   **Integration:** Would use the Provenance Engine to trace input demographics.

---

## Contribution Guide

If you wish to develop any of these ideas:
1.  Create a new folder in `02_EXTENSIONS/`.
2.  Draft a specification following the Core format.
3.  Ensure no changes to `01_CORE` are required.
4.  Submit as a separate module.

---
**Status:** Living Document  
**Last Updated:** 2026-06-27