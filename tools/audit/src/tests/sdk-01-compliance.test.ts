// GHOSTWEAVE SDK Audit: SDK-01 — Protocol Compliance
// Проверка соответствия SDK Protocol Specification

import {
  createEvent,
  createGenesisEvent,
  appendToChain,
  createChain,
  verifyChain,
  replayChain,
  computeEventHash,
  genesisHash,
  isValidHash,
  isGenesisEvent,
  canonicalStringify,
  officialProfileV1,
  profileManager
} from "@ghostweave/core-sdk";

import { logger } from "../utils/logger";

export interface TestResult {
  passed: boolean;
  errors: string[];
}

/**
 * Проверка соответствия SDK Protocol Specification
 */
export async function runComplianceTests(): Promise<TestResult> {
  const errors: string[] = [];

  logger.info("Checking SDK compliance with Protocol Specification...");

  // ==========================================================================
  // Test 1: Event creation follows RFC
  // ==========================================================================

  try {
    const event = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test" }
    });

    // Проверка обязательных полей
    if (!event.id) errors.push("Event missing 'id'");
    if (!event.timestamp) errors.push("Event missing 'timestamp'");
    if (!event.type) errors.push("Event missing 'type'");
    if (!event.source) errors.push("Event missing 'source'");
    if (!event.previous_hash) errors.push("Event missing 'previous_hash'");
    if (!event.payload) errors.push("Event missing 'payload'");
    if (!event.hash) errors.push("Event missing 'hash'");

    // Проверка формата хеша
    if (!isValidHash(event.hash)) {
      errors.push(`Invalid hash format: ${event.hash}`);
    }

    // Проверка previous_hash (genesis)
    if (event.previous_hash !== genesisHash()) {
      errors.push(`Genesis event should have previous_hash = genesisHash, got ${event.previous_hash}`);
    }

    // Проверка пересчета хеша
    const { hash, ...eventWithoutHash } = event;
    const recomputed = computeEventHash(eventWithoutHash);
    if (recomputed !== event.hash) {
      errors.push(`Hash mismatch: computed ${recomputed}, stored ${event.hash}`);
    }

    logger.success(`  ✅ Event creation: PASSED`);
  } catch (err) {
    errors.push(`Event creation failed: ${err}`);
    logger.error(`  ❌ Event creation: FAILED`);
  }

  // ==========================================================================
  // Test 2: Genesis event creation
  // ==========================================================================

  try {
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });

    if (!isGenesisEvent(genesis)) {
      errors.push("Genesis event not recognized as genesis");
    }

    if (genesis.previous_hash !== genesisHash()) {
      errors.push(`Genesis previous_hash should be ${genesisHash()}, got ${genesis.previous_hash}`);
    }

    logger.success(`  ✅ Genesis creation: PASSED`);
  } catch (err) {
    errors.push(`Genesis creation failed: ${err}`);
    logger.error(`  ❌ Genesis creation: FAILED`);
  }

  // ==========================================================================
  // Test 3: Chain continuity
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const event2 = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test2" },
      previousHash: genesis.hash
    });
    appendToChain(chain, event2);

    const last = chain.events[chain.events.length - 1];
    if (last.previous_hash !== genesis.hash) {
      errors.push(`Chain continuity broken: expected ${genesis.hash}, got ${last.previous_hash}`);
    }

    logger.success(`  ✅ Chain continuity: PASSED`);
  } catch (err) {
    errors.push(`Chain continuity failed: ${err}`);
    logger.error(`  ❌ Chain continuity: FAILED`);
  }

  // ==========================================================================
  // Test 4: Verification
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const event2 = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test2" },
      previousHash: genesis.hash
    });
    appendToChain(chain, event2);

    const result = verifyChain(chain);
    if (result.status !== "VALID") {
      errors.push(`Verification failed: status ${result.status}`);
    }

    if (result.stats.totalEvents !== 2) {
      errors.push(`Verification expected 2 events, got ${result.stats.totalEvents}`);
    }

    logger.success(`  ✅ Verification: PASSED`);
  } catch (err) {
    errors.push(`Verification failed: ${err}`);
    logger.error(`  ❌ Verification: FAILED`);
  }

  // ==========================================================================
  // Test 5: Replay
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const event2 = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test2" },
      previousHash: genesis.hash
    });
    appendToChain(chain, event2);

    const result = replayChain(chain);
    if (result.status !== "VALID") {
      errors.push(`Replay failed: status ${result.status}`);
    }

    if (result.verifiedChain.length !== 2) {
      errors.push(`Replay expected 2 events, got ${result.verifiedChain.length}`);
    }

    logger.success(`  ✅ Replay: PASSED`);
  } catch (err) {
    errors.push(`Replay failed: ${err}`);
    logger.error(`  ❌ Replay: FAILED`);
  }

  // ==========================================================================
  // Test 6: Canonical serialization (RFC 8785)
  // ==========================================================================

  try {
    const obj = { b: 2, a: 1, c: 3 };
    const canonical = canonicalStringify(obj);
    // RFC 8785: keys sorted lexicographically
    if (!canonical.includes("a") || !canonical.includes("b") || !canonical.includes("c")) {
      errors.push("Canonical serialization did not include all keys");
    }
    // Check that keys are sorted (a, b, c)
    const aIdx = canonical.indexOf("a");
    const bIdx = canonical.indexOf("b");
    const cIdx = canonical.indexOf("c");
    if (!(aIdx < bIdx && bIdx < cIdx)) {
      errors.push("Canonical serialization keys not sorted correctly");
    }

    logger.success(`  ✅ Canonical serialization: PASSED`);
  } catch (err) {
    errors.push(`Canonical serialization failed: ${err}`);
    logger.error(`  ❌ Canonical serialization: FAILED`);
  }

  // ==========================================================================
  // Test 7: Profile compatibility
  // ==========================================================================

  try {
    const profile = officialProfileV1;
    if (!profile.id) errors.push("Profile missing 'id'");
    if (!profile.version) errors.push("Profile missing 'version'");
    if (!profile.algorithms) errors.push("Profile missing 'algorithms'");
    if (!profile.algorithms.hash) errors.push("Profile missing 'algorithms.hash'");
    if (!profile.algorithms.canonicalization) {
      errors.push("Profile missing 'algorithms.canonicalization'");
    }
    if (!profile.algorithms.signature) {
      errors.push("Profile missing 'algorithms.signature'");
    }

    // Check that profile is registered
    const manager = profileManager;
    if (!manager.hasProfile(profile.id)) {
      errors.push(`Profile ${profile.id} not registered in profileManager`);
    }

    const active = manager.getActiveProfile();
    if (!active || active.id !== profile.id) {
      errors.push(`Active profile is not officialProfileV1`);
    }

    logger.success(`  ✅ Profile compatibility: PASSED`);
  } catch (err) {
    errors.push(`Profile compatibility failed: ${err}`);
    logger.error(`  ❌ Profile compatibility: FAILED`);
  }

  // ==========================================================================
  // Summary
  // ==========================================================================

  const passed = errors.length === 0;
  logger.blank();
  if (passed) {
    logger.success("✅ SDK-01: Protocol Compliance — PASSED");
  } else {
    logger.error(`❌ SDK-01: Protocol Compliance — FAILED (${errors.length} errors)`);
  }

  return { passed, errors };
}

export default runComplianceTests;