// GHOSTWEAVE Pilot: Export Command v1.0
// Экспорт цепочки в Canonical JSON

import * as fs from "fs";
import * as path from "path";
import { replayToCanonical } from "@ghostweave/core-sdk";
import { ChainStorage } from "../storage/chain";
import { logger } from "../utils/logger";

export interface ExportOptions {
  output?: string;
  format?: "json" | "canonical";
}

export async function exportCommand(storage: ChainStorage, options: ExportOptions = {}): Promise<void> {
  logger.blank();
  logger.info("📦 Exporting chain...");

  const chain = storage.getChain();
  const length = storage.getLength();

  if (length === 0) {
    logger.warn("Chain is empty. Nothing to export.");
    return;
  }

  // Определяем путь для экспорта
  const outputDir = options.output || path.join(process.cwd(), "data");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `export_${timestamp}.json`;
  const outputPath = path.join(outputDir, fileName);

  // Создаем директорию, если её нет
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Выполняем экспорт через replayToCanonical
  const { replay, canonical } = replayToCanonical(chain, { verifyHashes: true });

  if (replay.status === "INVALID") {
    logger.warn("⚠️ Exporting chain with errors. Use 'verify' command to check integrity.");
  }

  // Сохраняем в файл
  try {
    fs.writeFileSync(outputPath, canonical, "utf-8");
  } catch (err) {
    logger.error(`Failed to write export file: ${err}`);
    return;
  }

  logger.blank();
  logger.success(`✅ Chain exported to: ${outputPath}`);
  logger.info(`   Events: ${replay.verifiedChain.length}`);
  logger.info(`   Status: ${replay.status}`);
  logger.info(`   Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  logger.blank();

  if (options.format === "canonical") {
    logger.info("📌 Canonical JSON (RFC 8785) — ready for verification by external tools.");
  }

  logger.blank();
}

export default exportCommand;