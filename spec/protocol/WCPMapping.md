# WCP MAPPING SPECIFICATION

This document defines how GHOSTWEAVE Core concepts map to the World Compute Protocol (WCP) or similar external distributed computing standards. 

---

## Core Principle

> **"Mapping is an adapter responsibility, not a Core feature."**

GHOSTWEAVE Core does not implement WCP. It provides a standardized internal format (`CanonicalEvent`) that an external WCP Adapter can translate into WCP-compliant messages.

---

## Mapping Table

| GHOSTWEAVE Core Concept | WCP Equivalent | Translation Logic |
| :--- | :--- | :--- |
| `CanonicalEvent` | `ComputeTaskResult` | The entire event payload becomes the result of a verified compute task. |
| `eventId` | `taskId` / `messageId` | Direct mapping. UUID v7 ensures temporal compatibility. |
| `parentHash` | `previousTaskHash` | Maintains the sequential execution chain required by WCP ledgers. |
| `actorId` | `executorDid` | The ActorID is translated into a W3C DID format expected by WCP. |
| `contextHash` | `inputDataHash` | Direct mapping. Represents the hash of the task inputs. |
| `decisionHash` | `outputDataHash` | Direct mapping. Represents the hash of the task outputs. |
| `replayMetadata` | `executionEnvironment` | Translated into WCP's environment specification (OS, model version, etc.). |
| `signature` | `executorSignature` | Ed25519 signature is wrapped in the WCP standard signature envelope. |

---

## Adapter Architecture

The WCP Adapter sits **outside** the Core boundary (Layer 04_REFERENCE_IMPLEMENTATION or external).

```text
[ GHOSTWEAVE Core ] 
       │ (Outputs CanonicalEvent)
       ▼
[ WCP Adapter ] 
       │ (Translates to WCP Message)
       ▼
[ WCP Network / Ledger ]