// GHOSTWEAVE Pilot: Verify Command v1.0
// Проверка целостности цепочки

import { verifyChain } from "@ghostweave/core-sdk";
import { ChainStorage } from "../storage/chain";
import { logger } from "../utils/logger";

export interface VerifyOptions {
  verbose?: boolean;
}

export async function verifyCommand(storage: ChainStorage, options: VerifyOptions = {}): Promise<void> {
  logger.blank();
  logger.info("🔍 Verifying chain integrity...");

  const chain = storage.getChain();
  const length = storage.getLength();

  if (length === 0) {
    logger.warn("Chain is empty. Nothing to verify.");
    return;
  }

  const result = verifyChain(chain, {
    checkHashes: true,
    checkContinuity: true,
    checkGenesis: true
  });

  logger.blank();
  logger.separator();

  // Статус
  const statusIcon = result.status === "VALID" ? "✅" : result.status === "PARTIAL" ? "⚠️" : "❌";
  logger.log("info", `${statusIcon} Verification Status: ${result.status}`);

  // Статистика
  logger.info(`   Events: ${result.stats.totalEvents}`);
  logger.info(`   Valid hashes: ${result.stats.validHashes}`);
  logger.info(`   Invalid hashes: ${result.stats.invalidHashes}`);
  logger.info(`   Missing parents: ${result.stats.missingParents}`);

  // Ошибки
  if (result.errors.length > 0) {
    logger.blank();
    logger.error(`Errors (${result.errors.length}):`);
    for (const err of result.errors) {
      logger.log("error", `   [${err.index}] ${err.eventId}: ${err.message}`);
      if (options.verbose && err.expected && err.actual) {
        logger.log("debug", `      Expected: ${err.expected.slice(0, 16)}...`);
        logger.log("debug", `      Actual:   ${err.actual.slice(0, 16)}...`);
      }
    }
  }

  // Предупреждения
  if (result.warnings.length > 0) {
    logger.blank();
    logger.warn(`Warnings (${result.warnings.length}):`);
    for (const warn of result.warnings) {
      logger.log("warn", `   ${warn}`);
    }
  }

  logger.separator();
  logger.blank();

  if (result.status === "VALID") {
    logger.success("✅ Chain is valid and trustworthy.");
  } else if (result.status === "PARTIAL") {
    logger.warn("⚠️ Chain has issues but is partially valid.");
  } else {
    logger.error("❌ Chain is invalid. Do not trust it.");
  }

  logger.blank();
}

export default verifyCommand;