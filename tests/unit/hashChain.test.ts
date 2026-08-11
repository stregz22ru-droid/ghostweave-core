import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MemoryEventStore } from '../src/impl/store/memoryEventStore.js';
import { VerificationEngine } from '../src/impl/verification/verificationEngine.js';
import { LocalIdentityRegistry } from '../src/impl/identity/localIdentityRegistry.js';
import { CanonicalEvent } from '../src/core/types.js';
import { sha256 } from '../src/impl/crypto/sha256.js';
import { canonicalJson } from '../src/protocol/canonicalJson.js';
import { ChainBrokenError } from '../src/utils/errors.js';

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

describe('Hash Chain Integrity', () => {
  let store: MemoryEventStore;

  beforeEach(() => {
    store = new MemoryEventStore();
    store.clear();
  });

  describe('Chain Building', () => {
    it('should automatically build chain with correct parent hashes', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);
      
      const e1Hash = calculateEventHash(e1);
      const e2 = createTestEvent('e2', e1Hash);
      await store.append(e2);
      
      const e2Hash = calculateEventHash(e2);
      const e3 = createTestEvent('e3', e2Hash);
      await store.append(e3);

      const retrieved1 = await store.getEvent('e1');
      const retrieved2 = await store.getEvent('e2');
      const retrieved3 = await store.getEvent('e3');

      assert.strictEqual(retrieved1?.parentHash, null);
      assert.strictEqual(retrieved2?.parentHash, e1Hash);
      assert.strictEqual(retrieved3?.parentHash, e2Hash);
    });

    it('should maintain chain order across multiple appends', async () => {
      const events: CanonicalEvent[] = [];
      let parentHash: string | null = null;

      for (let i = 0; i < 10; i++) {
        const event = createTestEvent(`e${i}`, parentHash);
        await store.append(event);
        events.push(event);
        parentHash = calculateEventHash(event);
      }

      const firstId = await store.getFirstEventId();
      const allEvents = await store.getEvents(firstId!, 10);
      assert.strictEqual(allEvents.length, 10);

      for (let i = 0; i < allEvents.length; i++) {
        assert.strictEqual(allEvents[i].eventId, `e${i}`);
      }
    });
  });

  describe('Chain Break Detection', () => {
    it('should detect and reject broken chain (wrong parent)', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);

      const wrongParent = sha256('wrong-parent');
      const e2 = createTestEvent('e2', wrongParent);

      await assert.rejects(
        async () => await store.append(e2),
        ChainBrokenError
      );
    });

    it('should detect tampering in historical events via VerificationEngine', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);
      
      const e1Hash = calculateEventHash(e1);
      const e2 = createTestEvent('e2', e1Hash);
      await store.append(e2);

      // Tamper with e1 directly in the internal Map (bypassing clone)
      const internalMap = (store as any).events as Map<string, CanonicalEvent>;
      const storedE1 = internalMap.get('e1')!;
      storedE1.actorId = 'tampered-actor';

      // VerificationEngine should detect the tampering
      const identityLayer = new LocalIdentityRegistry();
      const verificationEngine = new VerificationEngine(store, identityLayer);
      
      const result = await verificationEngine.verifyChain('e2');
      
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.chainIntegrity, false);
    });

    it('should detect missing parent in chain via ReplayEngine', async () => {
      const e1 = createTestEvent('e1', null);
      await store.append(e1);

      // Manually inject event pointing to non-existent parent
      const e2 = createTestEvent('e2', sha256('non-existent'));
      const internalMap = (store as any).events as Map<string, CanonicalEvent>;
      const eventOrder = (store as any).eventOrder as string[];
      
      internalMap.set('e2', e2);
      eventOrder.push('e2');

      // ReplayEngine should fail when trying to traverse the chain
      const { ReplayEngine } = await import('../src/impl/replay/replayEngine.js');
      const replayEngine = new ReplayEngine(store);
      
      const result = await replayEngine.replay('e2');
      
      assert.strictEqual(result.status, 'FAILURE');
    });
  });

  describe('Hash Calculation', () => {
    it('should produce consistent hashes for same content', () => {
      const event = createTestEvent('e1', null);
      
      const hash1 = calculateEventHash(event);
      const hash2 = calculateEventHash(event);
      
      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different content', () => {
      const e1 = createTestEvent('e1', null);
      const e2 = createTestEvent('e2', null);
      
      const hash1 = calculateEventHash(e1);
      const hash2 = calculateEventHash(e2);
      
      assert.notStrictEqual(hash1, hash2);
    });

    it('should exclude signature from hash calculation', () => {
      const e1 = createTestEvent('e1', null);
      e1.signature = 'sig1';
      const hash1 = calculateEventHash(e1);
      
      const e2 = { ...e1, signature: 'sig2' };
      const hash2 = calculateEventHash(e2);
      
      assert.strictEqual(hash1, hash2);
    });

    it('should produce 64-character hex hash', () => {
      const event = createTestEvent('e1', null);
      const hash = calculateEventHash(event);
      
      assert.strictEqual(hash.length, 64);
      assert.match(hash, /^[a-f0-9]{64}$/);
    });
  });

  describe('Canonical JSON Serialization', () => {
    it('should produce deterministic JSON regardless of key order', () => {
      const obj1 = { b: 2, a: 1, c: 3 };
      const obj2 = { c: 3, a: 1, b: 2 };
      
      const json1 = canonicalJson(obj1);
      const json2 = canonicalJson(obj2);
      
      assert.strictEqual(json1, json2);
    });

    it('should handle nested objects', () => {
      const obj = {
        z: { b: 2, a: 1 },
        a: [3, 2, 1]
      };
      
      const json = canonicalJson(obj);
      assert.strictEqual(json, '{"a":[3,2,1],"z":{"a":1,"b":2}}');
    });

    it('should handle null values', () => {
      const obj = { a: null, b: 1 };
      const json = canonicalJson(obj);
      assert.strictEqual(json, '{"a":null,"b":1}');
    });
  });
});