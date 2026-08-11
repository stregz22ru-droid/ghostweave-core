import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MemoryEventStore } from '../src/impl/store/memoryEventStore.js';
import { ReplayEngine } from '../src/impl/replay/replayEngine.js';
import { CanonicalEvent } from '../src/core/types.js';
import { sha256 } from '../src/impl/crypto/sha256.js';
import { canonicalJson } from '../src/protocol/canonicalJson.js';

/**
 * Helper: creates a valid test event
 */
function createTestEvent(eventId: string, parentHash: string | null): CanonicalEvent {
  return {
    eventId,
    parentHash,
    timestamp: new Date().toISOString(),
    actorId: 'test-actor',
    contextHash: sha256(`ctx-${eventId}`),
    decisionHash: sha256(`dec-${eventId}`),
    evidence: [],
    replayMetadata: {
      processorVersion: '1.0.0',
      configHash: sha256('config'),
      dependencyIds: []
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

describe('Replay Engine', () => {
  let store: MemoryEventStore;
  let engine: ReplayEngine;

  beforeEach(() => {
    store = new MemoryEventStore();
    store.clear();
    engine = new ReplayEngine(store);
  });

  describe('Chain Reconstruction', () => {
    it('should reconstruct full chain back to genesis', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);
      const e2 = createTestEvent('e2', calculateEventHash(e1));
      await store.append(e2);
      const e3 = createTestEvent('e3', calculateEventHash(e2));
      await store.append(e3);

      const chain = await engine.getEventChain('e3');
      
      assert.strictEqual(chain.length, 3);
      assert.strictEqual(chain[0].eventId, 'e1');
      assert.strictEqual(chain[1].eventId, 'e2');
      assert.strictEqual(chain[2].eventId, 'e3');
    });

    it('should handle genesis event replay', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);

      const chain = await engine.getEventChain('e1');
      
      assert.strictEqual(chain.length, 1);
      assert.strictEqual(chain[0].eventId, 'e1');
      assert.strictEqual(chain[0].parentHash, null);
    });

    it('should throw EventNotFoundError for broken chain traversal', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);
      
      const e2 = createTestEvent('e2', sha256('non-existent-parent'));
      (store as any).events.set('e2', e2);
      (store as any).eventOrder.push('e2');

      await assert.rejects(
        async () => await engine.getEventChain('e2'),
        /Event not found/
      );
    });
  });

  describe('Replay Verification', () => {
    it('should return SUCCESS for valid event chain', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);
      const e2 = createTestEvent('e2', calculateEventHash(e1));
      await store.append(e2);

      const result = await engine.replay('e2');
      
      assert.strictEqual(result.status, 'SUCCESS');
      assert.ok(result.reproducedHash);
      assert.ok(result.originalHash);
    });

    it('should fail replay for missing event', async () => {
      const result = await engine.replay('non-existent');
      
      assert.strictEqual(result.status, 'FAILURE');
      assert.ok(result.reason?.includes('not found'));
    });

    it('should fail replay for chain integrity violation', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);
      
      const e1Hash = calculateEventHash(e1);
      const e2 = createTestEvent('e2', e1Hash);
      await store.append(e2);

      // Tamper with e1 directly in the internal Map
      const internalMap = (store as any).events as Map<string, CanonicalEvent>;
      const storedE1 = internalMap.get('e1')!;
      storedE1.actorId = 'tampered-actor';

      // ReplayEngine should detect the tampering
      const result = await engine.replay('e2');
      
      assert.strictEqual(result.status, 'FAILURE');
      assert.ok(result.reason);
    });

    it('should verify event consistency (hash calculation)', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);
      
      const isConsistent = await engine.verifyEventConsistency(e1);
      assert.strictEqual(isConsistent, true);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle deep chains efficiently', async () => {
      const depth = 100;
      let parentId: string | null = null;

      for (let i = 0; i < depth; i++) {
        const eid = `evt-${i}`;
        const ev = createTestEvent(eid, parentId);
        await store.append(ev);
        parentId = calculateEventHash(ev);
      }

      const start = performance.now();
      const chain = await engine.getEventChain(`evt-${depth - 1}`);
      const duration = performance.now() - start;

      assert.strictEqual(chain.length, depth);
      console.log(`⚡ Replay ${depth} events took ${duration.toFixed(2)}ms`);
    });
  });
});