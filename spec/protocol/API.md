# CORE API SPECIFICATION

This document defines the abstract interfaces for the GHOSTWEAVE Core. These interfaces represent the contract that any Reference Implementation or third-party integration must fulfill.

---

## 1. EventStore API

The primary interface for recording and retrieving immutable events.

```typescript
interface IEventStore {
  /**
   * Appends a new event to the history.
   * @throws ChainBrokenError if parentHash does not match the latest event.
   * @throws ValidationError if the event schema or signature is invalid.
   */
  append(event: CanonicalEvent): Promise<void>;

  /**
   * Retrieves a specific event by its ID.
   * @returns The CanonicalEvent or null if not found.
   */
  getEvent(eventId: string): Promise<CanonicalEvent | null>;

  /**
   * Retrieves a sequence of events starting from a specific ID.
   * @param startEventId The ID of the first event in the range.
   * @param limit Maximum number of events to return.
   */
  getEvents(startEventId: string, limit: number): Promise<CanonicalEvent[]>;

  /**
   * Returns the hash of the most recent event in the chain.
   */
  getLatestHash(): Promise<string | null>;
}