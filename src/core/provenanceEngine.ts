import { CanonicalEvent } from './types.js';

/**
 * Represents the provenance chain of a decision.
 * Tracks the flow from input to decision without storing the actual data.
 */
export interface ProvenanceRecord {
  eventId: string;
  contextHash: string;     // Hash of the input/context
  decisionHash: string;    // Hash of the final decision
  memoryReferences: string[]; // IDs of referenced memory/state (from replayMetadata.dependencyIds)
  evidenceHashes: string[]; // Hashes of supporting evidence
}

/**
 * Abstract interface for the Provenance Engine.
 * Tracks the origin and flow of data through the system.
 * Stores references (hashes), not actual data.
 */
export interface IProvenanceEngine {
  /**
   * Extracts and stores the provenance record from a CanonicalEvent.
   * 
   * @param event - The event to extract provenance from.
   * @returns The created ProvenanceRecord.
   */
  recordProvenance(event: CanonicalEvent): Promise<ProvenanceRecord>;

  /**
   * Retrieves the provenance record for a specific event.
   * 
   * @param eventId - The UUID of the event.
   * @returns The ProvenanceRecord or null if not found.
   */
  getProvenance(eventId: string): Promise<ProvenanceRecord | null>;

  /**
   * Traces the provenance chain backwards from a decision to its inputs.
   * 
   * @param eventId - The UUID of the decision event.
   * @returns Array of ProvenanceRecords in reverse order.
   */
  traceProvenance(eventId: string): Promise<ProvenanceRecord[]>;
}