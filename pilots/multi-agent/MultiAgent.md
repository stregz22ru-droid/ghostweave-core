# MULTI-AGENT PILOT: AUTONOMOUS WORKFLOW

This document outlines the pilot implementation of GHOSTWEAVE Core in a multi-agent system, where multiple autonomous AI agents collaborate, negotiate, or chain tasks to achieve a complex goal.

---

## Pilot Objective

To demonstrate that GHOSTWEAVE Core can provide end-to-end cryptographic provenance for a decision that is the result of a multi-step workflow executed by different, independent AI agents. It proves exactly which agent contributed what, in what order, and based on which inputs.

---

## Architecture Mapping

### 1. The Agents (Processors)
*   **Agent A (Researcher):** Gathers data, queries external APIs, summarizes findings.
*   **Agent B (Analyst):** Takes Agent A's summary, applies domain logic, identifies risks.
*   **Agent C (Executor):** Takes Agent B's risk assessment, formats the final action plan, and triggers execution.

### 2. GHOSTWEAVE Integration
Every inter-agent communication and internal state change is recorded as a `CanonicalEvent`.

*   `actorId`: The specific DID/UUID of the agent performing the action (e.g., `did:agent:researcher-v1`).
*   `contextHash`: Hash of the input received from the previous agent.
*   `decisionHash`: Hash of the output passed to the next agent.
*   `evidence`: Hashes of the specific prompts, tools used, and internal state of the agent at that step.

---

## Extension Utilization

### Identity Layer (Core)
*   **Function:** Strict cryptographic binding of every step to a specific agent's private key.
*   **Mechanism:** Prevents agent spoofing. If Agent B receives a message, it cryptographically verifies it came from Agent A.

### Replay Engine (Core)
*   **Function:** End-to-end workflow reconstruction.
*   **Mechanism:** An auditor can query the final output (Agent C's event) and the Replay Engine will automatically trace back through `contextHash` links to reconstruct the exact inputs and states of Agent B and Agent A.

### Conflict Preservation Extension
*   **Scenario:** Agent B (Analyst) rejects Agent A's (Researcher) data as insufficient or hallucinated, requesting a re-run.
*   **Resolution:** Both the original data submission and the rejection/request-for-retry are preserved as parallel branches in the event graph, providing a complete history of the negotiation.

---

## Success Metrics for Pilot

1.  **End-to-End Traceability:** Time taken to trace a final output back to the initial raw data input across 5+ agent hops (Target: < 3 seconds).
2.  **Identity Verification Overhead:** The latency added by cryptographic signing and verification at each agent hop (Target: < 50ms per hop).
3.  **Fault Isolation:** Ability to pinpoint exactly which agent introduced an error or hallucination by replaying the specific agent's step in isolation.

---

## Data Flow Diagram

```text
[ User Request ]
       │
       ▼
[ Agent A: Researcher ] ──(Event 1)──> [ GHOSTWEAVE Core ]
       │ (Passes Summary)
       ▼
[ Agent B: Analyst ]    ──(Event 2)──> [ GHOSTWEAVE Core ]
       │ (Passes Risk Assessment)
       ▼
[ Agent C: Executor ]   ──(Event 3)──> [ GHOSTWEAVE Core ]
       │
       ▼
[ Final Action / Output ]

* Auditor queries Event 3 -> Replay Engine fetches Event 2 & Event 1 -> Full context restored.