import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MemoryEventStore } from '../src/impl/store/memoryEventStore.js';
import { CanonicalEvent } from '../src/core/types.js';
import { sha256 } from '../src/impl/crypto/sha256.js';
import { canonicalJson } from '../src/protocol/canonicalJson.js';
import { ChainBrokenError } from '../src/utils/errors.js';

/**
 * Helper: creates a valid test event
 */
function createTestEvent(
  eventId: string,
  parentHash: string | null,
  actorId: string = 'test-actor'
): CanonicalEvent {
  return {
    eventId,
    parentHash,
    timestamp: new Date().toISOString(),
    actorId,
    contextHash: sha256('test-context'),
    decisionHash: sha256('test-decision'),
    evidence: [sha256('evidence-1')],
    replayMetadata: {
      processorVersion: '1.0.0',
      configHash: sha256('config'),
      dependencyIds: ['dep-1']
    },
    signature: 'test-signature'
  };
}

/**
 * Helper: calculates event hash (excluding signature)
 */
function calculateEventHash(event: CanonicalEvent): string {
  const { signature, ...payload } = event;
  return sha256(canonicalJson(payload));
}

describe('EventStore', () => {
  let store: MemoryEventStore;

  beforeEach(() => {
    store = new MemoryEventStore();
    store.clear();
  });

  describe('Event Creation', () => {
    it('should append genesis event with null parentHash', async () => {
      const event = createTestEvent('event-1', null);
      
      await store.append(event);
      
      const retrieved = await store.getEvent('event-1');
      assert.deepStrictEqual(retrieved, event);
    });

    it('should append second event with correct parentHash', async () => {
      const event1 = createTestEvent('event-1', null);
      await store.append(event1);
      
      const event1Hash = calculateEventHash(event1);
      const event2 = createTestEvent('event-2', event1Hash);
      
      await store.append(event2);
      
      const retrieved = await store.getEvent('event-2');
      assert.deepStrictEqual(retrieved, event2);
    });

    it('should maintain chronological order', async () => {
      const event1 = createTestEvent('event-1', null);
      await store.append(event1);
      
      const event2 = createTestEvent('event-2', calculateEventHash(event1));
      await store.append(event2);
      
      const events = await store.getEvents('event-1', 10);
      assert.strictEqual(events.length, 2);
      assert.strictEqual(events[0].eventId, 'event-1');
      assert.strictEqual(events[1].eventId, 'event-2');
    });
  });

  describe('Hash Chain Integrity', () => {
    it('should reject event with incorrect parentHash', async () => {
      const event1 = createTestEvent('event-1', null);
      await store.append(event1);
      
      const wrongParentHash = sha256('wrong-parent');
      const event2 = createTestEvent('event-2', wrongParentHash);
      
      await assert.rejects(
        async () => await store.append(event2),
        ChainBrokenError
      );
    });

    it('should reject genesis event with non-null parentHash', async () => {
      const event = createTestEvent('event-1', sha256('some-hash'));
      
      await assert.rejects(
        async () => await store.append(event),
        ChainBrokenError
      );
    });

    it('should return correct latest hash', async () => {
      const event1 = createTestEvent('event-1', null);
      await store.append(event1);
      
      const latestHash = await store.getLatestHash();
      const expectedHash = calculateEventHash(event1);
      
      assert.strictEqual(latestHash, expectedHash);
    });

    it('should update latest hash after each append', async () => {
      const event1 = createTestEvent('event-1', null);
      await store.append(event1);
      
      const event2 = createTestEvent('event-2', calculateEventHash(event1));
      await store.append(event2);
      
      const latestHash = await store.getLatestHash();
      const expectedHash = calculateEventHash(event2);
      
      assert.strictEqual(latestHash, expectedHash);
    });
  });

  describe('Event Retrieval', () => {
    it('should return null for non-existent event', async () => {
      const result = await store.getEvent('non-existent');
      assert.strictEqual(result, null);
    });

    it('should return correct event count', async () => {
      const event1 = createTestEvent('event-1', null);
      await store.append(event1);
      
      const event2 = createTestEvent('event-2', calculateEventHash(event1));
      await store.append(event2);
      
      const count = await store.count();
      assert.strictEqual(count, 2);
    });

    it('should return events in range', async () => {
      const event1 = createTestEvent('event-1', null);
      await store.append(event1);
      
      const event2 = createTestEvent('event-2', calculateEventHash(event1));
      await store.append(event2);
      
      const event3 = createTestEvent('event-3', calculateEventHash(event2));
      await store.append(event3);
      
      const events = await store.getEvents('event-2', 2);
      assert.strictEqual(events.length, 2);
      assert.strictEqual(events[0].eventId, 'event-2');
      assert.strictEqual(events[1].eventId, 'event-3');
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of stored events', async () => {
      const event = createTestEvent('event-1', null);
      await store.append(event);
      
      const retrieved = await store.getEvent('event-1');
      assert.deepStrictEqual(retrieved, event);
      
      // Try to modify (this should not affect stored event)
      if (retrieved) {
        retrieved.actorId = 'modified-actor';
      }
      
      const retrievedAgain = await store.getEvent('event-1');
      assert.strictEqual(retrievedAgain?.actorId, 'test-actor');
    });
  });
});