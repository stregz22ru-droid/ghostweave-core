// GHOSTWEAVE Pilot: Init Command v1.0
// Инициализация пилотного проекта

import { createGenesisEvent } from "@ghostweave/core-sdk";
import { ChainStorage } from "../storage/chain";
import { logger } from "../utils/logger";

export interface InitOptions {
  name?: string;
  force?: boolean;
}

export async function initCommand(storage: ChainStorage, options: InitOptions = {}): Promise<void> {
  logger.blank();
  logger.info("🚀 Initializing Pilot Chain...");

  const existingLength = storage.getLength();
  if (existingLength > 0 && !options.force) {
    logger.warn(`Chain already has ${existingLength} events. Use --force to reinitialize.`);
    return;
  }

  if (options.force && existingLength > 0) {
    storage.clear();
    logger.info("Existing chain cleared.");
  }

  // Создаем Genesis событие
  const genesis = createGenesisEvent(
    "pilot.init",
    "pilot-cli",
    {
      message: "Pilot chain initialized",
      name: options.name || "GHOSTWEAVE Pilot",
      timestamp: new Date().toISOString()
    },
    {
      version: "1.0.0",
      initiator: "pilot"
    }
  );

  const result = storage.append(genesis);
  if (!result.success) {
    logger.error("Failed to initialize chain:", result.error);
    return;
  }

  logger.blank();
  logger.success(`✅ Chain initialized with genesis event: ${genesis.id}`);
  logger.info(`   Chain length: ${storage.getLength()}`);
  logger.info(`   Storage: ${storage.getFilePath()}`);
  logger.blank();
}

export default initCommand;