# EXPLAINABILITY EXTENSION

This extension provides human-readable context for machine-generated decisions. It bridges the gap between cryptographic hashes and user understanding.

---

## Core Principle

> **"Hashes are for machines; explanations are for humans."**

The Core stores *what* happened (hashes). The Extension stores *why* it happened (natural language).

---

## Component: ExplanationRecord

An `ExplanationRecord` is an optional metadata object attached to a `CanonicalEvent`.

```typescript
interface ExplanationRecord {
  eventId: string;
  summary: string; // Short, natural language summary (< 500 tokens)
  keyFactors: string[]; // List of input features that most influenced the decision
  confidenceScore: number; // Model's internal confidence (0.0 - 1.0)
  generatedBy: string; // ActorID of the explanation generator
  timestamp: string;
}