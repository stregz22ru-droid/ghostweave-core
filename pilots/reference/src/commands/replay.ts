// GHOSTWEAVE Pilot: Replay Command v1.0
// Восстановление доказательной цепочки

import { replayChain } from "@ghostweave/core-sdk";
import { ChainStorage } from "../storage/chain";
import { logger } from "../utils/logger";

export interface ReplayOptions {
  verbose?: boolean;
  from?: string;
  to?: string;
}

export async function replayCommand(storage: ChainStorage, options: ReplayOptions = {}): Promise<void> {
  logger.blank();
  logger.info("🔄 Replaying evidence chain...");

  const chain = storage.getChain();
  const length = storage.getLength();

  if (length === 0) {
    logger.warn("Chain is empty. Nothing to replay.");
    return;
  }

  const result = replayChain(chain, {
    from: options.from,
    to: options.to,
    verifyHashes: true
  });

  logger.blank();
  logger.separator();

  // Статус
  const statusIcon = result.status === "VALID" ? "✅" : result.status === "PARTIAL" ? "⚠️" : "❌";
  logger.log("info", `${statusIcon} Replay Status: ${result.status}`);

  // Отчет
  logger.info(`   Total events: ${result.verificationReport.totalEvents}`);
  logger.info(`   Verified: ${result.verificationReport.verified}`);
  logger.info(`   Invalid: ${result.verificationReport.invalid}`);
  logger.info(`   Missing: ${result.verificationReport.missing}`);

  // Доказательства
  logger.blank();
  logger.info(`📋 Evidence Chain (${result.verifiedChain.length} events):`);

  for (let i = 0; i < result.verifiedChain.length; i++) {
    const event = result.verifiedChain[i];
    const status = event.hash ? "✓" : "✗";
    const isGenesis = i === 0 ? "🔹" : "🔸";
    const icon = result.verifiedChain.length <= 10 || options.verbose ? `${isGenesis} ${status}` : "";
    
    if (result.verifiedChain.length <= 10 || options.verbose) {
      logger.log("info", `   ${icon} [${i}] ${event.id} (${event.type})`);
      if (options.verbose) {
        logger.log("debug", `       Hash: ${event.hash.slice(0, 16)}...`);
        logger.log("debug", `       Prev: ${event.previous_hash.slice(0, 16)}...`);
        logger.log("debug", `       Time: ${new Date(event.timestamp).toISOString()}`);
      }
    }
  }

  if (result.verifiedChain.length > 10 && !options.verbose) {
    logger.log("info", `   ... and ${result.verifiedChain.length - 10} more events (use --verbose to see all)`);
  }

  // Предупреждения и ошибки
  if (result.warnings.length > 0) {
    logger.blank();
    logger.warn(`Warnings (${result.warnings.length}):`);
    for (const warn of result.warnings) {
      logger.log("warn", `   ${warn}`);
    }
  }

  if (result.brokenLinks.length > 0) {
    logger.blank();
    logger.error(`Broken links (${result.brokenLinks.length}):`);
    for (const link of result.brokenLinks) {
      logger.log("error", `   [${link.index}] Expected: ${link.expected.slice(0, 16)}..., Actual: ${link.actual.slice(0, 16)}...`);
    }
  }

  logger.separator();
  logger.blank();

  if (result.status === "VALID") {
    logger.success("✅ Evidence chain is complete and valid.");
  } else if (result.status === "PARTIAL") {
    logger.warn("⚠️ Evidence chain is partial. Some events may be missing or invalid.");
  } else {
    logger.error("❌ Evidence chain is invalid. Cannot reconstruct trust.");
  }

  logger.blank();
}

export default replayCommand;