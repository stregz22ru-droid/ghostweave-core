import { IEventStore } from '../../core/eventStore.js';
import { CanonicalEvent } from '../../core/types.js';
import { sha256 } from '../crypto/sha256.js';
import { canonicalJson } from '../../protocol/canonicalJson.js';
import { ChainBrokenError, EventNotFoundError } from '../../utils/errors.js';

/**
 * In-memory implementation of Event Store.
 * Suitable for testing and development.
 * Not persistent - data lost on restart.
 * 
 * IMPORTANT: Stores deep copies of events to ensure immutability.
 */
export class MemoryEventStore implements IEventStore {
  private events: Map<string, CanonicalEvent> = new Map();
  private eventOrder: string[] = [];
  private hashToEventId: Map<string, string> = new Map();

  async append(event: CanonicalEvent): Promise<void> {
    const latestHash = await this.getLatestHash();
    
    if (latestHash === null) {
      if (event.parentHash !== null) {
        throw new ChainBrokenError('Genesis event must have parentHash = null');
      }
    } else {
      if (event.parentHash !== latestHash) {
        throw new ChainBrokenError(
          `Parent hash mismatch. Expected: ${latestHash}, Got: ${event.parentHash}`
        );
      }
    }

    const clonedEvent = JSON.parse(JSON.stringify(event));
    
    this.events.set(clonedEvent.eventId, clonedEvent);
    this.eventOrder.push(clonedEvent.eventId);
    
    const eventHash = this.calculateEventHash(clonedEvent);
    this.hashToEventId.set(eventHash, clonedEvent.eventId);
  }

  async getEvent(eventId: string): Promise<CanonicalEvent | null> {
    const event = this.events.get(eventId);
    if (!event) return null;
    return JSON.parse(JSON.stringify(event));
  }

  async getEvents(startEventId: string, limit: number): Promise<CanonicalEvent[]> {
    const startIndex = this.eventOrder.indexOf(startEventId);
    
    if (startIndex === -1) {
      throw new EventNotFoundError(startEventId);
    }

    const endIndex = Math.min(startIndex + limit, this.eventOrder.length);
    const eventIds = this.eventOrder.slice(startIndex, endIndex);
    
    return eventIds
      .map(id => {
        const event = this.events.get(id)!;
        return JSON.parse(JSON.stringify(event));
      })
      .filter(e => e !== undefined);
  }

  async getLatestHash(): Promise<string | null> {
    if (this.eventOrder.length === 0) {
      return null;
    }

    const latestEventId = this.eventOrder[this.eventOrder.length - 1];
    const latestEvent = this.events.get(latestEventId)!;
    
    return this.calculateEventHash(latestEvent);
  }

  async count(): Promise<number> {
    return this.events.size;
  }

  async getFirstEventId(): Promise<string | null> {
    if (this.eventOrder.length === 0) {
      return null;
    }
    return this.eventOrder[0];
  }

  getEventIdByHash(hash: string): string | null {
    return this.hashToEventId.get(hash) || null;
  }

  clear(): void {
    this.events.clear();
    this.eventOrder = [];
    this.hashToEventId.clear();
  }

  private calculateEventHash(event: CanonicalEvent): string {
    const { signature, ...payload } = event;
    return sha256(canonicalJson(payload));
  }
}