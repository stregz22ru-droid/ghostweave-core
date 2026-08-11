import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MemoryEventStore } from '../src/impl/store/memoryEventStore.js';
import { LocalIdentityRegistry } from '../src/impl/identity/localIdentityRegistry.js';
import { VerificationEngine } from '../src/impl/verification/verificationEngine.js';
import { CanonicalEvent } from '../src/core/types.js';
import { sha256 } from '../src/impl/crypto/sha256.js';
import { canonicalJson } from '../src/protocol/canonicalJson.js';
import { generateKeyPair, signData } from '../src/impl/crypto/ed25519.js';
import { VerificationFailureReason } from '../src/core/verificationApi.js';

/**
 * Helper: creates a signed test event
 */
function createSignedEvent(
  eventId: string,
  parentHash: string | null,
  privateKey: string,
  actorId: string
): CanonicalEvent {
  const baseEvent = {
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
    }
  };

  // Sign the event WITHOUT signature field
  const payload = canonicalJson(baseEvent);
  const signature = signData(payload, privateKey);
  
  return { ...baseEvent, signature };
}

/**
 * Helper: calculates event hash (excluding signature)
 */
function calculateEventHash(event: CanonicalEvent): string {
  const { signature, ...payload } = event;
  return sha256(canonicalJson(payload));
}

describe('Verification API', () => {
  let eventStore: MemoryEventStore;
  let identityLayer: LocalIdentityRegistry;
  let verificationEngine: VerificationEngine;
  let keyPair: { publicKey: string; privateKey: string };
  const actorId = 'test-actor-1';

  beforeEach(async () => {
    eventStore = new MemoryEventStore();
    eventStore.clear();
    
    identityLayer = new LocalIdentityRegistry();
    
    // Generate real Ed25519 key pair
    keyPair = generateKeyPair();
    
    // Register actor
    await identityLayer.register(actorId, keyPair.publicKey, 'Ed25519');
    
    verificationEngine = new VerificationEngine(eventStore, identityLayer);
  });

  describe('Event Verification', () => {
    it('should verify valid genesis event', async () => {
      const event = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      await eventStore.append(event);
      
      const result = await verificationEngine.verifyEvent('event-1');
      
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.checks.schema, true);
      assert.strictEqual(result.checks.signature, true);
      assert.strictEqual(result.checks.chainIntegrity, true);
    });

    it('should verify valid chain of events', async () => {
      const event1 = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      await eventStore.append(event1);
      
      const event1Hash = calculateEventHash(event1);
      const event2 = createSignedEvent('event-2', event1Hash, keyPair.privateKey, actorId);
      await eventStore.append(event2);
      
      const result = await verificationEngine.verifyEvent('event-2');
      
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.checks.chainIntegrity, true);
    });

    it('should fail verification for missing event', async () => {
      const result = await verificationEngine.verifyEvent('non-existent');
      
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.failureReason, VerificationFailureReason.MISSING_EVENT);
    });

    it('should fail verification for invalid signature', async () => {
      const event = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      
      // Tamper with signature
      event.signature = 'invalid-signature';
      await eventStore.append(event);
      
      const result = await verificationEngine.verifyEvent('event-1');
      
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.signature, false);
      assert.strictEqual(result.failureReason, VerificationFailureReason.INVALID_SIGNATURE);
    });

    it('should fail verification for schema violation', async () => {
      const event = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      
      // Tamper with required field
      event.contextHash = 'invalid-hash';
      await eventStore.append(event);
      
      const result = await verificationEngine.verifyEvent('event-1');
      
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.schema, false);
      assert.strictEqual(result.failureReason, VerificationFailureReason.SCHEMA_INVALID);
    });
  });

  describe('Chain Verification', () => {
    it('should verify complete chain integrity', async () => {
      const event1 = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      await eventStore.append(event1);
      
      const event2 = createSignedEvent('event-2', calculateEventHash(event1), keyPair.privateKey, actorId);
      await eventStore.append(event2);
      
      const event3 = createSignedEvent('event-3', calculateEventHash(event2), keyPair.privateKey, actorId);
      await eventStore.append(event3);
      
      const result = await verificationEngine.verifyChain('event-3');
      
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.checks.chainIntegrity, true);
    });

    it('should detect chain break (Missing Parent)', async () => {
      const event1 = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      await eventStore.append(event1);
      
      // Create event with wrong parent hash
      const event2 = createSignedEvent('event-2', sha256('wrong-parent'), keyPair.privateKey, actorId);
      
      // Manually inject to bypass store validation (simulating corruption)
      (eventStore as any).events.set('event-2', event2);
      (eventStore as any).eventOrder.push('event-2');
      
      const result = await verificationEngine.verifyChain('event-2');
      
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.chainIntegrity, false);
      assert.ok(result.failureReason?.includes(VerificationFailureReason.HASH_MISMATCH));
    });

    it('should detect tampered event in chain', async () => {
      const event1 = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      await eventStore.append(event1);
      
      const event1Hash = calculateEventHash(event1);
      const event2 = createSignedEvent('event-2', event1Hash, keyPair.privateKey, actorId);
      await eventStore.append(event2);
      
      // Tamper with event1 (simulate historical modification)
      event1.actorId = 'tampered-actor';
      (eventStore as any).events.set('event-1', event1);
      
      const result = await verificationEngine.verifyChain('event-2');
      
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.checks.chainIntegrity, false);
    });
  });

  describe('Batch Verification', () => {
    it('should verify multiple events', async () => {
      const event1 = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      await eventStore.append(event1);
      
      const event2 = createSignedEvent('event-2', calculateEventHash(event1), keyPair.privateKey, actorId);
      await eventStore.append(event2);
      
      const results = await verificationEngine.verifyBatch(['event-1', 'event-2']);
      
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].isValid, true);
      assert.strictEqual(results[1].isValid, true);
    });

    it('should handle mixed valid and invalid events in batch', async () => {
      const event1 = createSignedEvent('event-1', null, keyPair.privateKey, actorId);
      await eventStore.append(event1);
      
      const results = await verificationEngine.verifyBatch(['event-1', 'non-existent']);
      
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].isValid, true);
      assert.strictEqual(results[1].isValid, false);
      assert.strictEqual(results[1].failureReason, VerificationFailureReason.MISSING_EVENT);
    });
  });
});