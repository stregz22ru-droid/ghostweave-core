// GHOSTWEAVE File Event Store v1.0 (FIXED)
// Реализация IEventStore на основе файловой системы (JSONL).
// Использует canonicalJson для детерминированного хеширования.
// Интерфейс Event приведен к CanonicalEvent из core/types.ts.

import { resolve, join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { output } from "../../cli/utils/output";
import { appendJsonlLine, readJsonlFile, atomicWriteFile } from "../../cli/utils/fs";
import { createHash } from "crypto";

// ============================================================================
// Типы (приведены к CanonicalEvent из core/types.ts)
// ============================================================================

export interface CanonicalEvent {
  id: string;
  timestamp: number;
  type: string;
  source: string;
  previous_hash: string;      // "0".repeat(64) для genesis
  payload: unknown;           // Opaque
  metadata?: Record<string, unknown>;
  hash: string;               // SHA-256 канонического Envelope
  signature?: string;         // Опционально
  anchor?: Anchor;            // Опционально
}

export interface Anchor {
  provider: string;
  receipt: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface IEventStore {
  append(event: Omit<CanonicalEvent, "hash">): Promise<CanonicalEvent>;
  get(id: string): Promise<CanonicalEvent | null>;
  getAll(): Promise<CanonicalEvent[]>;
  getLast(): Promise<CanonicalEvent | null>;
  getFirstEventId(): Promise<string | null>;
  getRange(from?: string, to?: string): Promise<CanonicalEvent[]>;
  verify(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }>;
}

export interface FileEventStoreConfig {
  path: string;
  eventsFile?: string;
}

// ============================================================================
// Каноническая сериализация (RFC 8785)
// ============================================================================

/**
 * Каноническая сериализация объекта (RFC 8785)
 * - Ключи сортируются лексикографически
 * - Без пробелов
 * - null вместо undefined
 */
function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "string") {
    return JSON.stringify(obj);
  }

  if (typeof obj === "number") {
    return String(obj);
  }

  if (typeof obj === "boolean") {
    return obj ? "true" : "false";
  }

  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalStringify(item));
    return `[${items.join(",")}]`;
  }

  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys
      .filter(key => (obj as Record<string, unknown>)[key] !== undefined)
      .map(key => {
        const value = (obj as Record<string, unknown>)[key];
        return `${JSON.stringify(key)}:${canonicalStringify(value)}`;
      });
    return `{${pairs.join(",")}}`;
  }

  return JSON.stringify(obj);
}

/**
 * Каноническая сериализация Envelope (исключая поле hash)
 */
function canonicalEnvelope(event: Omit<CanonicalEvent, "hash">): string {
  // Создаем объект с явным порядком ключей
  const canonicalObj: Record<string, unknown> = {
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    source: event.source,
    previous_hash: event.previous_hash,
    payload: event.payload,
  };

  if (event.metadata !== undefined) {
    canonicalObj.metadata = event.metadata;
  }

  if (event.signature !== undefined) {
    canonicalObj.signature = event.signature;
  }

  if (event.anchor !== undefined) {
    canonicalObj.anchor = event.anchor;
  }

  return canonicalStringify(canonicalObj);
}

// ============================================================================
// FileEventStore
// ============================================================================

export class FileEventStore implements IEventStore {
  private readonly rootPath: string;
  private readonly eventsPath: string;

  constructor(config: FileEventStoreConfig) {
    this.rootPath = resolve(config.path);
    this.eventsPath = join(this.rootPath, config.eventsFile || "events.jsonl");

    if (!existsSync(this.rootPath)) {
      mkdirSync(this.rootPath, { recursive: true });
    }
  }

  /**
   * Вычисление SHA-256 хеша события (канонический Envelope)
   */
  private computeHash(event: Omit<CanonicalEvent, "hash">): string {
    const canonical = canonicalEnvelope(event);
    return createHash("sha256").update(canonical, "utf-8").digest("hex");
  }

  /**
   * Получение хеша последнего события
   */
  private async getLastHash(): Promise<string> {
    const last = await this.getLast();
    return last?.hash || "0".repeat(64);
  }

  /**
   * Добавление события в цепочку
   */
  async append(eventData: Omit<CanonicalEvent, "hash">): Promise<CanonicalEvent> {
    // Получаем хеш предыдущего события
    const previousHash = await this.getLastHash();

    // Проверяем соответствие previous_hash
    if (eventData.previous_hash !== previousHash) {
      throw new Error(`Chain broken: expected previous_hash ${previousHash}, got ${eventData.previous_hash}`);
    }

    // Создаем полное событие с хешем
    const event: CanonicalEvent = {
      ...eventData,
      previous_hash: previousHash,
      hash: this.computeHash({ ...eventData, previous_hash: previousHash })
    };

    // Запись в JSONL
    const result = appendJsonlLine(this.eventsPath, event);
    if (!result.success) {
      throw new Error(`Failed to append event: ${result.error}`);
    }

    return event;
  }

  /**
   * Получение события по ID
   */
  async get(id: string): Promise<CanonicalEvent | null> {
    const events = await this.getAll();
    return events.find(e => e.id === id) || null;
  }

  /**
   * Получение всех событий
   */
  async getAll(): Promise<CanonicalEvent[]> {
    const result = readJsonlFile(this.eventsPath);
    if (!result.success) {
      return [];
    }
    return (result.data as CanonicalEvent[]) || [];
  }

  /**
   * Получение последнего события
   */
  async getLast(): Promise<CanonicalEvent | null> {
    const events = await this.getAll();
    return events.length > 0 ? events[events.length - 1] : null;
  }

  /**
   * Получение ID первого события
   */
  async getFirstEventId(): Promise<string | null> {
    const events = await this.getAll();
    return events.length > 0 ? events[0].id : null;
  }

  /**
   * Получение диапазона событий
   */
  async getRange(from?: string, to?: string): Promise<CanonicalEvent[]> {
    const events = await this.getAll();

    let startIndex = 0;
    let endIndex = events.length - 1;

    if (from) {
      const found = events.findIndex(e => e.id === from);
      if (found !== -1) startIndex = found;
    }

    if (to) {
      const found = events.findIndex(e => e.id === to);
      if (found !== -1) endIndex = found;
    }

    return events.slice(startIndex, endIndex + 1);
  }

  /**
   * Верификация цепочки
   */
  async verify(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const events = await this.getAll();

    if (events.length === 0) {
      return { valid: true, errors: [], warnings: [] };
    }

    let previousHash = "0".repeat(64);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      // Проверка наличия обязательных полей
      if (!event.id || !event.hash || !event.timestamp) {
        errors.push(`Event ${i}: missing required fields (id, hash, timestamp)`);
        continue;
      }

      // Проверка хеша (канонический Envelope)
      const { hash, ...eventWithoutHash } = event;
      const canonical = canonicalEnvelope(eventWithoutHash);
      const computedHash = createHash("sha256").update(canonical, "utf-8").digest("hex");

      if (computedHash !== event.hash) {
        errors.push(`Event ${i} (${event.id}): hash mismatch`);
      }

      // Проверка цепочки
      const prevHash = event.previous_hash || "0".repeat(64);
      if (prevHash !== previousHash && i > 0) {
        warnings.push(`Chain broken at event ${i} (${event.id})`);
      }
      previousHash = event.hash;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default FileEventStore;