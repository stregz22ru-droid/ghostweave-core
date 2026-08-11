import { IReplayEngine } from '../../core/replayEngine.js';
import { CanonicalEvent, ReplayResult } from '../../core/types.js';
import { IEventStore } from '../../core/eventStore.js';
import { EventNotFoundError } from '../../utils/errors.js';
import { sha256 } from '../crypto/sha256.js';
import { canonicalJson } from '../../protocol/canonicalJson.js';

/**
 * Concrete implementation of Replay Engine.
 * Reconstructs complete event history chains without re-executing AI models.
 */
export class ReplayEngine implements IReplayEngine {
  private eventStore: IEventStore;
  private hashToEventId: Map<string, string> = new Map();
  private initialized = false;

  constructor(eventStore: IEventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Builds local hash→eventId mapping from all events in store
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const count = await this.eventStore.count();
    if (count === 0) {
      this.initialized = true;
      return;
    }

    const firstEventId = await this.eventStore.getFirstEventId();
    if (!firstEventId) {
      this.initialized = true;
      return;
    }

    const allEvents = await this.eventStore.getEvents(firstEventId, count);

    for (const event of allEvents) {
      const hash = this.calculateEventHash(event);
      this.hashToEventId.set(hash, event.eventId);
    }

    this.initialized = true;
  }

  async replay(eventId: string): Promise<ReplayResult> {
    try {
      await this.initialize();

      const targetEvent = await this.eventStore.getEvent(eventId);
      
      if (!targetEvent) {
        return {
          status: 'FAILURE',
          originalHash: '',
          reason: `Event not found: ${eventId}`
        };
      }

      const chain = await this.getEventChain(eventId);
      const chainValid = await this.verifyChainIntegrity(chain);

      if (!chainValid) {
        return {
          status: 'FAILURE',
          originalHash: this.calculateEventHash(targetEvent),
          reason: 'Chain integrity verification failed'
        };
      }

      return {
        status: 'SUCCESS',
        reproducedHash: this.calculateEventHash(targetEvent),
        originalHash: targetEvent.decisionHash
      };

    } catch (error) {
      return {
        status: 'FAILURE',
        originalHash: '',
        reason: `Replay error: ${error}`
      };
    }
  }

  async getEventChain(eventId: string): Promise<CanonicalEvent[]> {
    await this.initialize();

    const chain: CanonicalEvent[] = [];
    let currentEventId: string | null = eventId;

    while (currentEventId !== null) {
      const event = await this.eventStore.getEvent(currentEventId);
      
      if (!event) {
        throw new EventNotFoundError(currentEventId);
      }

      chain.push(event);

      if (event.parentHash !== null) {
        const parentEventId = this.hashToEventId.get(event.parentHash);
        if (!parentEventId) {
          throw new EventNotFoundError(`Parent event with hash ${event.parentHash} not found`);
        }
        currentEventId = parentEventId;
      } else {
        currentEventId = null;
      }
    }

    return chain.reverse();
  }

  async verifyEventConsistency(event: CanonicalEvent): Promise<boolean> {
    return this.calculateEventHash(event) !== '';
  }

  private async verifyChainIntegrity(chain: CanonicalEvent[]): Promise<boolean> {
    for (let i = 1; i < chain.length; i++) {
      const previousHash = this.calculateEventHash(chain[i - 1]);
      
      if (chain[i].parentHash !== previousHash) {
        return false;
      }
    }

    return true;
  }

  private calculateEventHash(event: CanonicalEvent): string {
    const { signature, ...payload } = event;
    return sha256(canonicalJson(payload));
  }

  /**
   * Resets initialization state (for testing)
   */
  reset(): void {
    this.hashToEventId.clear();
    this.initialized = false;
  }
}