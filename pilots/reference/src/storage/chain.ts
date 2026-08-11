// GHOSTWEAVE Pilot: Chain Storage v1.0
// Управление цепочкой событий с сохранением в JSONL

import * as fs from "fs";
import * as path from "path";
import type { Event } from "@ghostweave/core-sdk";
import { createChain, appendToChain, getLastEvent, getChainLength, type Chain } from "@ghostweave/core-sdk";
import { logger } from "../utils/logger";

export class ChainStorage {
  private chain: Chain;
  private filePath: string;

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, "events.jsonl");
    this.chain = createChain({ name: "Pilot Chain", createdAt: Date.now() });
    this.load();
  }

  /**
   * Загрузка цепочки из файла
   */
  private load(): void {
    if (!fs.existsSync(this.filePath)) {
      logger.debug("No existing chain found, starting fresh");
      return;
    }

    try {
      const content = fs.readFileSync(this.filePath, "utf-8");
      const lines = content.split("\n").filter(line => line.trim() !== "");
      
      if (lines.length === 0) {
        logger.debug("Chain file is empty, starting fresh");
        return;
      }

      // Восстанавливаем цепочку из JSONL
      const events: Event[] = lines.map(line => JSON.parse(line));
      this.chain = createChain({ name: "Pilot Chain", createdAt: Date.now() });
      
      for (const event of events) {
        const result = appendToChain(this.chain, event);
        if (!result.success) {
          logger.warn(`Failed to append event ${event.id}: ${result.error}`);
        }
      }

      logger.info(`Loaded ${events.length} events from ${this.filePath}`);
    } catch (err) {
      logger.error(`Failed to load chain: ${err}`);
    }
  }

  /**
   * Сохранение цепочки в файл
   */
  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Записываем каждое событие как отдельную JSON-строку
      const lines = this.chain.events.map(event => JSON.stringify(event));
      fs.writeFileSync(this.filePath, lines.join("\n") + "\n", "utf-8");
      
      logger.debug(`Saved ${this.chain.events.length} events to ${this.filePath}`);
    } catch (err) {
      logger.error(`Failed to save chain: ${err}`);
    }
  }

  /**
   * Добавление события в цепочку
   */
  append(event: Event): { success: boolean; error?: string } {
    const result = appendToChain(this.chain, event);
    if (result.success) {
      this.save();
      logger.success(`Event appended: ${event.id} (${event.type})`);
    } else {
      logger.error(`Failed to append event: ${result.error}`);
    }
    return result;
  }

  /**
   * Получение всей цепочки
   */
  getChain(): Chain {
    return this.chain;
  }

  /**
   * Получение количества событий
   */
  getLength(): number {
    return getChainLength(this.chain);
  }

  /**
   * Получение последнего события
   */
  getLast(): Event | null {
    return getLastEvent(this.chain);
  }

  /**
   * Очистка цепочки
   */
  clear(): void {
    this.chain = createChain({ name: "Pilot Chain", createdAt: Date.now() });
    this.save();
    logger.info("Chain cleared");
  }

  /**
   * Получение пути к файлу
   */
  getFilePath(): string {
    return this.filePath;
  }
}

export default ChainStorage;