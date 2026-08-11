// GHOSTWEAVE HTTP API: Storage Utilities v1.0
// Управление хранилищем цепочки для HTTP Adapter

import * as fs from "fs";
import * as path from "path";
import {
  createChain,
  appendToChain,
  getLastEvent,
  getChainLength,
  getEventById,
  getChainRange,
  verifyChain,
  replayChain,
  type Chain,
  type Event,
  type VerificationResult,
  type ReplayResult
} from "@ghostweave/core-sdk";

import { logger } from "../middleware/logger";

export class ChainStorage {
  private chain: Chain;
  private filePath: string;

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, "events.jsonl");
    this.chain = createChain({ name: "HTTP Adapter Chain", createdAt: Date.now() });
    this.load();
  }

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

      const events: Event[] = lines.map(line => JSON.parse(line));
      this.chain = createChain({ name: "HTTP Adapter Chain", createdAt: Date.now() });

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

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const lines = this.chain.events.map(event => JSON.stringify(event));
      fs.writeFileSync(this.filePath, lines.join("\n") + "\n", "utf-8");

      logger.debug(`Saved ${this.chain.events.length} events to ${this.filePath}`);
    } catch (err) {
      logger.error(`Failed to save chain: ${err}`);
    }
  }

  append(event: Event): { success: boolean; error?: string; event?: Event } {
    const result = appendToChain(this.chain, event);
    if (result.success) {
      this.save();
      logger.success(`Event appended: ${event.id}`);
    } else {
      logger.error(`Failed to append event: ${result.error}`);
    }
    return result;
  }

  getChain(): Chain {
    return this.chain;
  }

  getLength(): number {
    return getChainLength(this.chain);
  }

  getLast(): Event | null {
    return getLastEvent(this.chain);
  }

  getEvent(id: string): Event | null {
    return getEventById(this.chain, id);
  }

  getRange(from?: string, to?: string): Event[] {
    return getChainRange(this.chain, from, to);
  }

  verify(options?: {
    from?: string;
    to?: string;
    checkHashes?: boolean;
    checkContinuity?: boolean;
    checkGenesis?: boolean;
  }): VerificationResult {
    const from = options?.from;
    const to = options?.to;
    const chain = this.chain;

    const events = getChainRange(chain, from, to);
    const tempChain = createChain({ name: "temp" });
    for (const event of events) {
      appendToChain(tempChain, event);
    }

    return verifyChain(tempChain, {
      checkHashes: options?.checkHashes ?? true,
      checkContinuity: options?.checkContinuity ?? true,
      checkGenesis: options?.checkGenesis ?? true
    });
  }

  replay(options?: {
    from?: string;
    to?: string;
    verifyHashes?: boolean;
    skipInvalid?: boolean;
  }): ReplayResult {
    const from = options?.from;
    const to = options?.to;
    const chain = this.chain;

    const events = getChainRange(chain, from, to);
    const tempChain = createChain({ name: "temp" });
    for (const event of events) {
      appendToChain(tempChain, event);
    }

    return replayChain(tempChain, {
      from,
      to,
      verifyHashes: options?.verifyHashes ?? true,
      skipInvalid: options?.skipInvalid ?? false
    });
  }

  clear(): void {
    this.chain = createChain({ name: "HTTP Adapter Chain", createdAt: Date.now() });
    this.save();
    logger.info("Chain cleared");
  }

  getFilePath(): string {
    return this.filePath;
  }
}

export default ChainStorage;