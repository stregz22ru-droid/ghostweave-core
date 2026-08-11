import { CanonicalEvent } from './types.js';

/**
 * Abstract interface for the Event Store.
 * The Event Store is the single source of truth for the immutable event history.
 * It must support append-only semantics.
 */
export interface IEventStore {
  /**
   * Appends a new event to the history.
   * @param event - The CanonicalEvent to append.
   * @throws ChainBrokenError if parentHash does not match the latest event.
   * @throws SchemaValidationError if the event schema is invalid.
   */
  append(event: CanonicalEvent): Promise<void>;

  /**
   * Retrieves a specific event by its ID.
   * @param eventId - The UUID of the event.
   * @returns The CanonicalEvent or null if not found.
   */
  getEvent(eventId: string): Promise<CanonicalEvent | null>;

  /**
   * Retrieves a sequence of events starting from a specific ID.
   * @param startEventId - The ID of the first event in the range.
   * @param limit - Maximum number of events to return.
   * @returns Array of CanonicalEvents in chronological order.
   */
  getEvents(startEventId: string, limit: number): Promise<CanonicalEvent[]>;

  /**
   * Returns the hash of the most recent event in the chain.
   * @returns The hex-encoded SHA-256 hash of the latest event, or null if empty.
   */
  getLatestHash(): Promise<string | null>;

  /**
   * Returns the total number of events in the store.
   */
  count(): Promise<number>;

  /**
   * Returns the ID of the first (genesis) event in the chain.
   * @returns The eventId of the first event, or null if store is empty.
   */
  getFirstEventId(): Promise<string | null>;
}