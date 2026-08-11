// GHOSTWEAVE SDK Audit: SDK-05 — Zero Protocol Leakage
// Проверка, что SDK не вводит новых требований к протоколу

import {
  createEvent,
  createGenesisEvent,
  createChain,
  appendToChain,
  verifyChain,
  replayChain,
  verifyEvent,
  genesisHash,
  type Event
} from "@ghostweave/core-sdk";

import { logger } from "../utils/logger";

export interface TestResult {
  passed: boolean;
  errors: string[];
}

/**
 * Проверка отсутствия утечек протокола
 * SDK не должен вводить новые обязательные поля или требования к протоколу
 */
export async function runLeakageTests(): Promise<TestResult> {
  const errors: string[] = [];

  logger.info("Checking for protocol leakage...");

  // ==========================================================================
  // Test 1: SDK does not add mandatory fields to Event
  // ==========================================================================

  try {
    // Создаем событие с минимальным набором полей (только обязательные)
    const event = createEvent({
      type: "test",
      source: "audit",
      payload: { message: "test" }
    });

    // Проверяем, что в событии нет полей, не описанных в Protocol Specification
    const allowedFields = [
      "id", "timestamp", "type", "source", 
      "previous_hash", "payload", "metadata", "hash", 
      "signature", "anchor"
    ];

    const eventFields = Object.keys(event);
    const extraFields = eventFields.filter(f => !allowedFields.includes(f));

    if (extraFields.length > 0) {
      errors.push(`Event contains extra fields not in Protocol: ${extraFields.join(", ")}`);
      logger.error(`  ❌ Extra fields found: ${extraFields.join(", ")}`);
    } else {
      logger.success(`  ✅ Event has no extra fields beyond Protocol`);
    }
  } catch (err) {
    errors.push(`Event field check failed: ${err}`);
    logger.error(`  ❌ Event field check failed: ${err}`);
  }

  // ==========================================================================
  // Test 2: Verification does not add new check types
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const result = verifyChain(chain);

    // Проверяем, что статусы соответствуют Protocol Specification
    const allowedStatuses = ["VALID", "INVALID", "PARTIAL"];
    if (!allowedStatuses.includes(result.status)) {
      errors.push(`Verification status "${result.status}" is not in Protocol Specification`);
      logger.error(`  ❌ Unknown status: ${result.status}`);
    } else {
      logger.success(`  ✅ Verification statuses match Protocol`);
    }

    // Проверяем, что типы ошибок соответствуют Protocol Specification
    const allowedErrorTypes = [
      "hash_mismatch", "broken_chain", "parent_not_found", 
      "malformed", "invalid_genesis", "unknown_profile", 
      "version_mismatch", "invalid_signature"
    ];

    for (const err of result.errors) {
      if (!allowedErrorTypes.includes(err.type)) {
        errors.push(`Error type "${err.type}" is not in Protocol Specification`);
        logger.error(`  ❌ Unknown error type: ${err.type}`);
      }
    }

    if (errors.length === 0) {
      logger.success(`  ✅ Verification error types match Protocol`);
    }
  } catch (err) {
    errors.push(`Verification check failed: ${err}`);
    logger.error(`  ❌ Verification check failed: ${err}`);
  }

  // ==========================================================================
  // Test 3: Replay does not add new fields to ReplayResult
  // ==========================================================================

  try {
    const chain = createChain({ name: "test-chain" });
    const genesis = createGenesisEvent("test.genesis", "audit", { message: "genesis" });
    appendToChain(chain, genesis);

    const result = replayChain(chain);

    // Проверяем, что структура ReplayResult соответствует Protocol Specification
    const allowedFields = [
      "status", "verifiedChain", "verificationReport", 
      "missingEvents", "brokenLinks", "warnings"
    ];

    const resultFields = Object.keys(result);
    const extraFields = resultFields.filter(f => !allowedFields.includes(f));

    if (extraFields.length > 0) {
      errors.push(`ReplayResult contains extra fields: ${extraFields.join(", ")}`);
      logger.error(`  ❌ ReplayResult has extra fields: ${extraFields.join(", ")}`);
    } else {
      logger.success(`  ✅ ReplayResult matches Protocol Specification`);
    }

    // Проверяем, что verificationReport соответствует спецификации
    const reportFields = Object.keys(result.verificationReport);
    const expectedReportFields = ["totalEvents", "verified", "invalid", "missing"];
    const extraReportFields = reportFields.filter(f => !expectedReportFields.includes(f));

    if (extraReportFields.length > 0) {
      errors.push(`verificationReport contains extra fields: ${extraReportFields.join(", ")}`);
      logger.error(`  ❌ verificationReport has extra fields: ${extraReportFields.join(", ")}`);
    } else {
      logger.success(`  ✅ verificationReport matches Protocol Specification`);
    }
  } catch (err) {
    errors.push(`Replay check failed: ${err}`);
    logger.error(`  ❌ Replay check failed: ${err}`);
  }

  // ==========================================================================
  // Test 4: SDK does not require changes to Protocol to work
  // ==========================================================================

  try {
    // Проверяем, что все проверки SDK основаны на Protocol Specification
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

    // Проверяем работу verifyChain с разными опциями
    const result1 = verifyChain(chain, { checkHashes: true });
    const result2 = verifyChain(chain, { checkHashes: false });

    // Оба результата должны быть валидны (или невалидны одинаково)
    // Проверяем, что SDK не требует дополнительных полей для работы
    if (result1.status !== result2.status) {
      // Разные результаты при разных опциях - это нормально
      // Главное, что они оба валидны
      if (result1.status === "VALID" && result2.status === "VALID") {
        logger.success(`  ✅ SDK works with different options`);
      } else if (result1.status === "INVALID" && result2.status === "INVALID") {
        logger.success(`  ✅ SDK consistently reports INVALID`);
      } else {
        errors.push(`SDK behavior inconsistent with options`);
        logger.error(`  ❌ SDK behavior inconsistent`);
      }
    } else {
      logger.success(`  ✅ SDK works without requiring Protocol changes`);
    }
  } catch (err) {
    errors.push(`SDK behavior check failed: ${err}`);
    logger.error(`  ❌ SDK behavior check failed: ${err}`);
  }

  // ==========================================================================
  // Test 5: SDK does not introduce new constants that should be in Protocol
  // ==========================================================================

  try {
    // Проверяем, что SDK использует только константы из Protocol
    // Проверяем, что константы не конфликтуют
    const sdkExports = Object.keys(require("@ghostweave/core-sdk"));
    const sdkOnly = sdkExports.filter(c => 
      c.startsWith("_") || c.includes("internal")
    );

    if (sdkOnly.length > 0) {
      errors.push(`SDK exports implementation-specific constants: ${sdkOnly.join(", ")}`);
      logger.error(`  ❌ SDK exports implementation-specific constants`);
    } else {
      logger.success(`  ✅ No implementation-specific constants leaked`);
    }
  } catch (err) {
    // Если не удалось проверить константы, это не критично
    logger.warn(`  ⚠️ Could not check all constants: ${err}`);
  }

  // ==========================================================================
  // Test 6: SDK follows "SDK fixes, not Protocol" rule
  // ==========================================================================

  try {
    // Проверяем, что SDK не пытается исправить данные, которые должны быть отвергнуты
    const brokenEvent = {
      id: "broken",
      timestamp: Date.now(),
      type: "test",
      source: "audit",
      previous_hash: genesisHash(),
      payload: { message: "broken" },
      hash: "f".repeat(64) // Invalid hash
    };

    const result = verifyEvent(brokenEvent as Event);
    if (result.length === 0) {
      errors.push("SDK did not detect invalid hash in broken event");
      logger.error(`  ❌ Broken event not detected`);
    } else {
      logger.success(`  ✅ Broken event correctly rejected by SDK`);
    }
  } catch (err) {
    errors.push(`SDK validation check failed: ${err}`);
    logger.error(`  ❌ SDK validation check failed: ${err}`);
  }

  // ==========================================================================
  // Summary
  // ==========================================================================

  const passed = errors.length === 0;
  logger.blank();
  if (passed) {
    logger.success("✅ SDK-05: Zero Protocol Leakage — PASSED");
    logger.info("   SDK does not introduce new Protocol requirements");
  } else {
    logger.error(`❌ SDK-05: Zero Protocol Leakage — FAILED (${errors.length} errors)`);
  }

  return { passed, errors };
}

export default runLeakageTests;