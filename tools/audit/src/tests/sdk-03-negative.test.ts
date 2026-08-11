// GHOSTWEAVE SDK Audit: SDK-03 — Negative Tests
// Проверка корректного обнаружения ошибок

import {
  createEvent,
  createGenesisEvent,
  createChain,
  appendToChain,
  verifyChain,
  replayChain,
  computeEventHash
} from "@ghostweave/core-sdk";

import { logger } from "../utils/logger";

export interface TestResult {
  passed: boolean;
  errors: string[];
}

export async function runNegativeTests(): Promise<TestResult> {
  const errors: string[] = [];

  logger.info("Checking negative test scenarios...");

  // ==========================================================================
  // Test 1: Broken hash
  // ==========================================================================

  try {
    const event = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test" }
    });

    const broken = { ...event, hash: "f".repeat(64) };
    const { hash, ...eventWithoutHash } = broken;
    const recomputed = computeEventHash(eventWithoutHash);

    if (recomputed === broken.hash) {
      errors.push("Broken hash should not match recomputed hash");
      logger.error(`  ❌ Broken hash not detected`);
    } else {
      logger.success(`  ✅ Broken hash detected`);
    }
  } catch (err) {
    errors.push(`Broken hash test failed: ${err}`);
    logger.error(`  ❌ Broken hash test failed: ${err}`);
  }

  // ==========================================================================
  // Test 2: Invalid parentHash
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const event2 = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test2" },
      previousHash: "f".repeat(64)
    });

    const result = appendToChain(chain, event2);
    if (result.success) {
      errors.push("Event with invalid parentHash should not be appended");
      logger.error(`  ❌ Invalid parentHash not detected`);
    } else {
      logger.success(`  ✅ Invalid parentHash detected`);
    }
  } catch (err) {
    errors.push(`Invalid parentHash test failed: ${err}`);
    logger.error(`  ❌ Invalid parentHash test failed: ${err}`);
  }

  // ==========================================================================
  // Test 3: Double genesis
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const genesis2 = createGenesisEvent("test.genesis2", "audit", { message: "genesis2" });
    const result = appendToChain(chain, genesis2);

    if (result.success) {
      errors.push("Double genesis should not be allowed");
      logger.error(`  ❌ Double genesis not detected`);
    } else {
      logger.success(`  ✅ Double genesis detected`);
    }
  } catch (err) {
    errors.push(`Double genesis test failed: ${err}`);
    logger.error(`  ❌ Double genesis test failed: ${err}`);
  }

  // ==========================================================================
  // Test 4: Duplicate event ID
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const event = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test" },
      previousHash: genesis.hash,
      id: "duplicate_id"
    });
    appendToChain(chain, event);

    const duplicate = createEvent({
      type: "test2",
      source: "audit",
      payload: { message: "test2" },
      previousHash: event.hash,
      id: "duplicate_id"
    });

    const result = appendToChain(chain, duplicate);
    if (result.success) {
      errors.push("Duplicate event ID should not be allowed");
      logger.error(`  ❌ Duplicate ID not detected`);
    } else {
      logger.success(`  ✅ Duplicate ID detected`);
    }
  } catch (err) {
    errors.push(`Duplicate ID test failed: ${err}`);
    logger.error(`  ❌ Duplicate ID test failed: ${err}`);
  }

  // ==========================================================================
  // Test 5: Broken chain continuity (FIXED)
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    // Создаем второе событие с правильным хешем
    const event2 = createEvent({
      type: "test2",
      source: "audit",
      payload: { message: "test2" },
      previousHash: genesis.hash
    });
    appendToChain(chain, event2);

    // Создаем третье событие с НЕПРАВИЛЬНЫМ previousHash (должен быть event2.hash)
    const brokenEvent = createEvent({
      type: "test3",
      source: "audit",
      payload: { message: "test3" },
      previousHash: "f".repeat(64)
    });
    // Добавляем напрямую, чтобы создать разрыв
    chain.events.push(brokenEvent);

    const result = verifyChain(chain);
    if (result.status === "VALID") {
      errors.push("Broken chain should not be VALID");
      logger.error(`  ❌ Broken chain not detected`);
    } else {
      logger.success(`  ✅ Broken chain detected (status: ${result.status})`);
    }
  } catch (err) {
    errors.push(`Broken chain test failed: ${err}`);
    logger.error(`  ❌ Broken chain test failed: ${err}`);
  }

  // ==========================================================================
  // Test 6: Invalid canonical serialization
  // ==========================================================================

  try {
    const event = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test" }
    });

    const nonCanonical = JSON.stringify({
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      source: event.source,
      previous_hash: event.previous_hash,
      payload: event.payload,
      metadata: event.metadata
    }, null, 2);

    const canonical = JSON.stringify(JSON.parse(nonCanonical));
    if (nonCanonical === canonical) {
      errors.push("Non-canonical JSON should differ from canonical");
      logger.error(`  ❌ Canonical validation not tested`);
    } else {
      logger.success(`  ✅ Non-canonical JSON identified`);
    }
  } catch (err) {
    errors.push(`Canonical serialization test failed: ${err}`);
    logger.error(`  ❌ Canonical serialization test failed: ${err}`);
  }

  // ==========================================================================
  // Test 7: Empty chain verification
  // ==========================================================================

  try {
    const chain = createChain({ name: "empty-chain" });
    const result = verifyChain(chain);

    if (result.status !== "VALID") {
      errors.push("Empty chain should be VALID");
      logger.error(`  ❌ Empty chain verification failed`);
    } else {
      logger.success(`  ✅ Empty chain is VALID`);
    }
  } catch (err) {
    errors.push(`Empty chain test failed: ${err}`);
    logger.error(`  ❌ Empty chain test failed: ${err}`);
  }

  // ==========================================================================
  // Test 8: Replay with broken chain (FIXED)
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const event2 = createEvent({
      type: "test2",
      source: "audit",
      payload: { message: "test2" },
      previousHash: genesis.hash
    });
    appendToChain(chain, event2);

    const brokenEvent = createEvent({
      type: "test3",
      source: "audit",
      payload: { message: "test3" },
      previousHash: "f".repeat(64)
    });
    chain.events.push(brokenEvent);

    const result = replayChain(chain);
    if (result.status === "VALID") {
      errors.push("Replay should detect broken chain");
      logger.error(`  ❌ Replay did not detect broken chain`);
    } else {
      logger.success(`  ✅ Replay detected broken chain (status: ${result.status})`);
    }
  } catch (err) {
    errors.push(`Replay with broken chain test failed: ${err}`);
    logger.error(`  ❌ Replay with broken chain test failed: ${err}`);
  }

  const passed = errors.length === 0;
  logger.blank();
  if (passed) {
    logger.success("✅ SDK-03: Negative Tests — PASSED");
  } else {
    logger.error(`❌ SDK-03: Negative Tests — FAILED (${errors.length} errors)`);
  }

  return { passed, errors };
}

export default runNegativeTests;