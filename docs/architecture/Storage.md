# STORAGE IMPLEMENTATION SPECIFICATION

This document defines the physical storage strategy for the GHOSTWEAVE Reference Implementation. It prioritizes durability, append-only semantics, and simplicity over complex query capabilities.

---

## Core Principle

> **"Write once, read many, never alter."**

The storage layer is designed to be a dumb, reliable sink for immutable data. Complex querying is left to external indexing systems.

---

## 1. Event Storage (JSONL)

Events are stored in a single, append-only file named `events.jsonl`.

### Format
*   Each line contains exactly one `CanonicalEvent` serialized as Canonical JSON.
*   No line breaks within a JSON object.
*   No trailing commas.

### Why JSONL?
1.  **Append-Only:** Natively supports `O(1)` appends without rewriting the file.
2.  **Streamable:** Can be processed line-by-line without loading the entire history into memory.
3.  **Corruption Resilience:** If the system crashes mid-write, only the last line is corrupted; the rest of the chain remains intact.

### Indexing
To avoid full-file scans for specific `EventID`s, the implementation maintains an in-memory index:
```typescript
// Map<EventID, ByteOffset>
const index = new Map<string, number>();