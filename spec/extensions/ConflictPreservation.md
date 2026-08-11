# CONFLICT PRESERVATION EXTENSION

This extension enables the system to handle divergent interpretations of the same event without violating Core immutability.

---

## Core Principle

> **"Disagreement is data."**

Instead of forcing a single "truth," the system preserves all valid perspectives as parallel branches.

---

## Component: ConflictNode

A `ConflictNode` is a metadata structure that links multiple events representing different views of the same reality.

```typescript
interface ConflictNode {
  conflictId: string;
  rootEventId: string; // The event being disputed or interpreted
  branches: ConflictBranch[];
  status: 'OPEN' | 'RESOLVED' | 'ARCHIVED';
  resolutionReason?: string;
}

interface ConflictBranch {
  eventId: string;
  actorId: string;
  confidence: number; // 0.0 - 1.0
  reasoning: string; // Human-readable explanation
}