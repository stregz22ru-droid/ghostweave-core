# POLICY ENGINE EXTENSION

This extension enforces organizational or regulatory rules on top of the immutable Core history. It acts as a gatekeeper for event ingestion and a filter for event retrieval.

---

## Core Principle

> **"Rules change; history does not."**

The Policy Engine allows dynamic rule application without modifying the underlying immutable log.

---

## Component: PolicyRule

A `PolicyRule` defines conditions under which an event is allowed, flagged, or redacted.

```typescript
interface PolicyRule {
  ruleId: string;
  name: string;
  condition: string; // Expression language (e.g., "actor.role == 'intern'")
  action: 'ALLOW' | 'FLAG' | 'REDACT' | 'REJECT';
  priority: number;
  isActive: boolean;
}