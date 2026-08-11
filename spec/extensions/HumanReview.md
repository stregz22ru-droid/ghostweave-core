# HUMAN REVIEW EXTENSION

This extension facilitates the integration of human oversight into the automated decision-making loop. It allows humans to validate, override, or annotate AI-generated events.

---

## Core Principle

> **"Human-in-the-loop is a state, not an exception."**

Human review actions are recorded as first-class events, linked to the AI decisions they assess.

---

## Component: ReviewTask

A `ReviewTask` represents a pending or completed human assessment.

```typescript
interface ReviewTask {
  taskId: string;
  targetEventId: string; // The AI decision being reviewed
  reviewerId: string; // Human ActorID
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN';
  comments?: string;
  timestamp: string;
}