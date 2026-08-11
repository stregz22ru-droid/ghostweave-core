import { CanonicalEvent, ReplayResult } from './types.js';

/**
 * Abstract interface for the Replay Engine.
 * Reconstructs the complete history chain for any event back to the genesis.
 * Does NOT re-execute AI models - only restores the event history.
 */
export interface IReplayEngine {
  /**
   * Replays an event by reconstructing its complete history chain.
   * Returns all events from the target event back to the genesis event.
   * 
   * @param eventId - The UUID of the event to replay.
   * @returns ReplayResult with the full chain of events.
   */
  replay(eventId: string): Promise<ReplayResult>;

  /**
   * Retrieves the complete event chain for a given event.
   * Traces parent hashes back to the genesis event.
   * 
   * @param eventId - The UUID of the target event.
   * @returns Array of CanonicalEvents in reverse chronological order (newest first).
   */
  getEventChain(eventId: string): Promise<CanonicalEvent[]>;

  /**
   * Verifies that an event's decision hash can be reproduced from its evidence.
   * This is a lightweight check - does not re-run AI models.
   * 
   * @param event - The event to verify.
   * @returns true if the event's hashes are internally consistent.
   */
  verifyEventConsistency(event: CanonicalEvent): Promise<boolean>;
}