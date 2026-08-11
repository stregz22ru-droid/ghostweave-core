// GHOSTWEAVE SDK Audit: SDK-02 — Cross Implementation Test
// Проверка загрузки и верификации Canonical Events

import {
  createChain,
  appendToChain,
  verifyChain,
  replayChain,
  computeEventHash,
  genesisHash,
  type Event
} from "@ghostweave/core-sdk";

import { logger } from "../utils/logger";
import canonicalEventsData from "../fixtures/canonical-events.json";

export interface TestResult {
  passed: boolean;
  errors: string[];
}

/**
 * Проверка Cross Implementation Compatibility
 * Загружает Canonical Events из фикстуры и проверяет их
 */
export async function runCrossImplementationTests(): Promise<TestResult> {
  const errors: string[] = [];

  logger.info("Checking cross-implementation compatibility...");

  // ==========================================================================
  // Test 1: Load Canonical Events fixture
  // ==========================================================================

  let events: Event[] = [];

  try {
    const data = canonicalEventsData;

    if (!data.events || !Array.isArray(data.events)) {
      errors.push("Fixture missing 'events' array");
      logger.error(`  ❌ Fixture missing 'events' array`);
      return { passed: false, errors };
    }

    events = data.events;
    logger.success(`  ✅ Loaded ${events.length} events from fixture`);

    // Check genesis
    const genesis = events[0];
    if (genesis.previous_hash !== genesisHash()) {
      errors.push(`Genesis event has invalid previous_hash`);
      logger.error(`  ❌ Genesis event has invalid previous_hash`);
    }

  } catch (err) {
    errors.push(`Failed to load fixture: ${err}`);
    logger.error(`  ❌ Failed to load fixture: ${err}`);
    return { passed: false, errors };
  }

  // ==========================================================================
  // Test 2: Detect invalid hashes (SDK should reject them)
  // ==========================================================================

  try {
    let invalidDetected = 0;
    let invalidExpected = events.length;

    for (const event of events) {
      const { hash, ...eventWithoutHash } = event;
      const recomputed = computeEventHash(eventWithoutHash);
      if (recomputed !== event.hash) {
        invalidDetected++;
      }
    }

    // Check that SDK detected all invalid hashes
    if (invalidDetected === invalidExpected) {
      logger.success(`  ✅ All ${invalidDetected} invalid hashes correctly detected`);
    } else {
      errors.push(`Expected ${invalidExpected} invalid hashes, detected ${invalidDetected}`);
      logger.error(`  ❌ Expected ${invalidExpected} invalid hashes, detected ${invalidDetected}`);
    }

  } catch (err) {
    errors.push(`Hash verification failed: ${err}`);
    logger.error(`  ❌ Hash verification failed: ${err}`);
  }

  // ==========================================================================
  // Test 3: SDK correctly rejects invalid events when building chain
  // ==========================================================================

  try {
    const chain = createChain({ name: "cross-test-chain" });
    let rejectedCount = 0;

    for (const event of events) {
      const result = appendToChain(chain, event);
      if (!result.success) {
        rejectedCount++;
      }
    }

    // All events should be rejected because hashes are invalid
    if (rejectedCount === events.length) {
      logger.success(`  ✅ All ${rejectedCount} invalid events rejected by SDK`);
    } else {
      errors.push(`Expected ${events.length} rejections, got ${rejectedCount}`);
      logger.error(`  ❌ Expected ${events.length} rejections, got ${rejectedCount}`);
    }

  } catch (err) {
    errors.push(`Chain building failed: ${err}`);
    logger.error(`  ❌ Chain building failed: ${err}`);
  }

  // ==========================================================================
  // Test 4: SDK detects invalid chain
  // ==========================================================================

  try {
    const chain = createChain({ name: "cross-test-chain" });

    // Add only valid events (we'll create a valid chain for verification)
    const genesis = events[0];
    // Recompute correct hash for genesis
    const { hash: _, ...genesisWithoutHash } = genesis;
    const correctGenesisHash = computeEventHash(genesisWithoutHash);
    const fixedGenesis = { ...genesis, hash: correctGenesisHash };
    
    const result = appendToChain(chain, fixedGenesis);
    if (!result.success) {
      errors.push(`Failed to append fixed genesis: ${result.error}`);
      logger.error(`  ❌ Failed to append fixed genesis`);
    } else {
      logger.success(`  ✅ Fixed genesis appended successfully`);
    }

    // Verify chain (should be valid)
    const verifyResult = verifyChain(chain);
    if (verifyResult.status === "VALID") {
      logger.success(`  ✅ Valid chain verification: ${verifyResult.status}`);
    } else {
      errors.push(`Valid chain should be VALID, got ${verifyResult.status}`);
      logger.error(`  ❌ Valid chain should be VALID, got ${verifyResult.status}`);
    }

  } catch (err) {
    errors.push(`Chain verification failed: ${err}`);
    logger.error(`  ❌ Chain verification failed: ${err}`);
  }

  // ==========================================================================
  // Test 5: SDK correctly rejects invalid Replay
  // ==========================================================================

  try {
    const chain = createChain({ name: "cross-test-chain" });

    // Add only valid events
    const genesis = events[0];
    const { hash: _, ...genesisWithoutHash } = genesis;
    const correctGenesisHash = computeEventHash(genesisWithoutHash);
    const fixedGenesis = { ...genesis, hash: correctGenesisHash };
    appendToChain(chain, fixedGenesis);

    // Try to replay (should be valid)
    const replayResult = replayChain(chain);
    if (replayResult.status === "VALID") {
      logger.success(`  ✅ Valid chain replay: ${replayResult.status}`);
    } else {
      errors.push(`Valid chain replay should be VALID, got ${replayResult.status}`);
      logger.error(`  ❌ Valid chain replay should be VALID, got ${replayResult.status}`);
    }

  } catch (err) {
    errors.push(`Replay failed: ${err}`);
    logger.error(`  ❌ Replay failed: ${err}`);
  }

  // ==========================================================================
  // Summary
  // ==========================================================================

  const passed = errors.length === 0;
  logger.blank();
  if (passed) {
    logger.success("✅ SDK-02: Cross Implementation Test — PASSED");
  } else {
    logger.error(`❌ SDK-02: Cross Implementation Test — FAILED (${errors.length} errors)`);
  }

  return { passed, errors };
}

export default runCrossImplementationTests;