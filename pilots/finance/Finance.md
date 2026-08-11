# FINANCE PILOT: AI CREDIT DECISION

This document outlines the first pilot implementation of GHOSTWEAVE Core in the financial sector, specifically for AI-driven credit scoring and loan approval.

---

## Pilot Objective

To demonstrate that an AI credit decision model can operate transparently, providing regulators and auditors with cryptographic proof of *why* a specific applicant was approved or denied, without exposing sensitive PII in the immutable log.

---

## Architecture Mapping

### 1. The AI Model (Processor)
*   **Input:** Applicant financial data (credit history, income, debt-to-income ratio).
*   **Logic:** Machine Learning model (e.g., XGBoost) + Rule-based fallback.
*   **Output:** Credit Score and Approval/Denial Decision.

### 2. GHOSTWEAVE Integration
The pilot system intercepts the decision flow and generates a `CanonicalEvent` for every credit application processed.

*   `contextHash`: SHA-256 of the applicant's anonymized/normalized feature vector.
*   `decisionHash`: SHA-256 of the model's output (Score + Decision).
*   `evidence`: Hashes of the specific model weights, the feature engineering script version, and the regulatory ruleset applied.
*   `actorId`: The ID of the AI Agent or the Underwriting System.

---

## Extension Utilization

### Explainability Extension
*   **Function:** Generates a natural language summary of the decision.
*   **Example:** "Applicant denied due to DTI ratio exceeding 43% and recent late payments."
*   **Storage:** Linked to the `eventId`, stored outside the Core hash chain to allow for updates if the explanation model improves.

### Compliance Extension (FCRA / GDPR)
*   **Function:** Enforces "Right to Explanation" and data minimization.
*   **Mechanism:** The Policy Engine intercepts queries. If a regulator requests the file, the Extension redacts raw PII from the `evidence` blobs on-the-fly, serving only the hashes and the explanation.

### Conflict Preservation Extension
*   **Scenario:** A human underwriter reviews an AI denial and decides to override it (approve the loan based on mitigating circumstances).
*   **Resolution:** The AI's original denial is preserved. The human's override is recorded as a new event with a `parentHash` pointing to the AI's decision, creating a documented branch of human intervention.

---

## Success Metrics for Pilot

1.  **Audit Speed:** Time taken to produce a cryptographic audit trail for a specific loan application (Target: < 2 seconds).
2.  **Replay Accuracy:** Percentage of historical decisions that can be exactly reproduced using the stored `evidence` and `processorVersion` (Target: 100% for deterministic models).
3.  **Regulatory Acceptance:** Feedback from compliance officers on the utility of the Explainability output during mock audits.

---

## Data Flow Diagram

```text
[ Applicant Data ] 
       │
       ▼
[ Feature Engineering ] ──(Hash)──> [ contextHash ]
       │
       ▼
[ AI Credit Model ] ──(Output)──> [ decisionHash ]
       │
       ├─(Evidence)─> [ Model Weights Hash, Ruleset Hash ]
       │
       ▼
[ GHOSTWEAVE Core ] ──(Append)──> [ Immutable Event Log ]
       │
       ├─> [ Explainability Ext. ] -> Generates Summary
       └─> [ Compliance Ext. ]     -> Applies Redaction Rules