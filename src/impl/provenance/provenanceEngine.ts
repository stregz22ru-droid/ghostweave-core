import { IProvenanceEngine, ProvenanceRecord } from '../../core/provenanceEngine.js';
import { CanonicalEvent } from '../../core/types.js';
import { IEventStore } from '../../core/eventStore.js';
import { EventNotFoundError } from '../../utils/errors.js';

/**
 * Concrete implementation of Provenance Engine.
 * Tracks the origin and flow of data through the system.
 * Stores only references (hashes), not actual data.
 */
export class ProvenanceEngine implements IProvenanceEngine {
  private provenanceRecords: Map<string, ProvenanceRecord> = new Map();
  private eventStore: IEventStore;

  constructor(eventStore: IEventStore) {
    this.eventStore = eventStore;
  }

  async recordProvenance(event: CanonicalEvent): Promise<ProvenanceRecord> {
    const record: ProvenanceRecord = {
      eventId: event.eventId,
      contextHash: event.contextHash,
      decisionHash: event.decisionHash,
      memoryReferences: event.replayMetadata.dependencyIds,
      evidenceHashes: event.evidence
    };

    this.provenanceRecords.set(event.eventId, record);
    return record;
  }

  async getProvenance(eventId: string): Promise<ProvenanceRecord | null> {
    return this.provenanceRecords.get(eventId) || null;
  }

  async traceProvenance(eventId: string): Promise<ProvenanceRecord[]> {
    const chain: ProvenanceRecord[] = [];
    let currentEventId: string | null = eventId;

    // Traverse backwards through parent hashes
    while (currentEventId !== null) {
      // Try to get provenance record
      let record = this.provenanceRecords.get(currentEventId);

      // If not in memory, extract from event
      if (!record) {
        const event = await this.eventStore.getEvent(currentEventId);
        
        if (!event) {
          throw new EventNotFoundError(currentEventId);
        }

        record = await this.recordProvenance(event);
      }

      chain.push(record);

      // Get parent event to continue tracing
      const event = await this.eventStore.getEvent(currentEventId);
      if (!event) {
        break;
      }

      currentEventId = event.parentHash;
    }

    // Reverse to get chronological order (genesis first)
    return chain.reverse();
  }

  /**
   * Clears all provenance records (for testing)
   */
  clear(): void {
    this.provenanceRecords.clear();
  }

  /**
   * Returns the number of stored provenance records
   */
  count(): number {
    return this.provenanceRecords.size;
  }
}