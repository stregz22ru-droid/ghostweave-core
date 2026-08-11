// GHOSTWEAVE Pilot: Log Command v1.0
// Добавление события в цепочку

import { createEvent } from "@ghostweave/core-sdk";
import { ChainStorage } from "../storage/chain";
import { logger } from "../utils/logger";

export interface LogOptions {
  type: string;
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function logCommand(storage: ChainStorage, options: LogOptions): Promise<void> {
  logger.blank();
  logger.info(`📝 Logging event: ${options.type}`);

  // Проверяем, есть ли цепочка
  if (storage.getLength() === 0) {
    logger.error("Chain is empty. Please run 'pilot init' first.");
    return;
  }

  // Получаем хеш последнего события
  const lastEvent = storage.getLast();
  const previousHash = lastEvent ? lastEvent.hash : undefined;

  // Создаем событие с правильным previous_hash
  const event = createEvent({
    type: options.type,
    source: options.source,
    payload: {
      message: options.message,
      ...options.data,
      timestamp: new Date().toISOString()
    },
    metadata: {
      version: "1.0.0",
      loggedBy: "pilot"
    },
    previousHash: previousHash // Явно передаем хеш последнего события
  });

  const result = storage.append(event);
  if (!result.success) {
    logger.error("Failed to log event:", result.error);
    return;
  }

  logger.blank();
  logger.success(`✅ Event logged: ${event.id}`);
  logger.info(`   Type: ${event.type}`);
  logger.info(`   Source: ${event.source}`);
  logger.info(`   Hash: ${event.hash.slice(0, 16)}...`);
  logger.info(`   Chain length: ${storage.getLength()}`);
  logger.blank();
}

export default logCommand;