// GHOSTWEAVE CLI: Append Command v1.0
// gw append — добавление события в цепочку Core.

import { resolve, join } from "path";
import { readFileSync, existsSync } from "fs";
import { output } from "../utils/output";
import { appendJsonlLine, readJsonlFile } from "../utils/fs";
import { validateNonEmpty, validateHash, validateTraceId } from "../utils/validation";
import { createHash } from "crypto";

export interface AppendOptions {
  path?: string;
  event: string;
  type?: string;
  source?: string;
  parent?: string;
  data?: string;
  metadata?: string;
}

export interface AppendedEvent {
  id: string;
  timestamp: number;
  type: string;
  source: string;
  parent_hash?: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  hash: string;
  previous_hash: string;
}

/**
 * Загрузка конфигурации репозитория
 */
function loadConfig(repoPath: string): Record<string, unknown> {
  const configPath = join(repoPath, ".ghostweave", "config.json");
  if (!existsSync(configPath)) {
    throw new Error(`Repository not initialized. Run 'gw init' first.`);
  }
  return JSON.parse(readFileSync(configPath, "utf-8"));
}

/**
 * Получение хеша последнего события в цепочке
 */
function getLastHash(repoPath: string): string {
  const eventsPath = join(repoPath, ".ghostweave", "events.jsonl");
  if (!existsSync(eventsPath)) {
    return "0".repeat(64);
  }

  const result = readJsonlFile(eventsPath);
  if (!result.success || !result.data || (result.data as unknown[]).length === 0) {
    return "0".repeat(64);
  }

  const events = result.data as AppendedEvent[];
  const last = events[events.length - 1];
  return last?.hash || "0".repeat(64);
}

/**
 * Вычисление SHA-256 хеша события
 */
function computeEventHash(event: Omit<AppendedEvent, "hash">): string {
  const content = JSON.stringify({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    source: event.source,
    parent_hash: event.parent_hash,
    payload: event.payload,
    metadata: event.metadata,
    previous_hash: event.previous_hash
  });
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Добавление события в цепочку
 */
export async function appendCommand(options: AppendOptions): Promise<void> {
  const rootPath = resolve(options.path || process.cwd());
  const repoPath = rootPath;

  output.blank();
  output.info(`Appending event to: ${repoPath}`);

  // Загрузка конфигурации
  let config: Record<string, unknown>;
  try {
    config = loadConfig(repoPath);
  } catch (err) {
    output.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  // Валидация входных данных
  const eventValidation = validateNonEmpty(options.event, "event");
  if (!eventValidation.valid) {
    output.error("Invalid input:", eventValidation.errors[0].message);
    process.exit(1);
  }

  if (options.parent) {
    const parentValidation = validateHash(options.parent, "parent");
    if (!parentValidation.valid) {
      output.warn("Parent hash validation warning:", parentValidation.warnings[0]?.message);
    }
  }

  // Получение предыдущего хеша
  const previousHash = getLastHash(repoPath);

  // Создание события
  const now = Date.now();
  const eventId = `evt_${now}_${Math.random().toString(36).slice(2, 8)}`;

  const newEvent: Omit<AppendedEvent, "hash"> = {
    id: eventId,
    timestamp: now,
    type: options.type || "generic",
    source: options.source || "cli",
    parent_hash: options.parent,
    payload: options.data ? JSON.parse(options.data) : { message: options.event },
    metadata: options.metadata ? JSON.parse(options.metadata) : undefined,
    previous_hash: previousHash
  };

  // Вычисление хеша
  const hash = computeEventHash(newEvent);
  const eventWithHash: AppendedEvent = { ...newEvent, hash };

  // Запись в JSONL
  const eventsPath = join(repoPath, ".ghostweave", "events.jsonl");
  const result = appendJsonlLine(eventsPath, eventWithHash);

  if (!result.success) {
    output.error("Failed to append event", result.error);
    process.exit(1);
  }

  output.blank();
  output.success(`✅ Event appended: ${eventId}`);
  output.blank();
  output.info(`  ID:      ${eventId}`);
  output.info(`  Type:    ${eventWithHash.type}`);
  output.info(`  Hash:    ${hash.slice(0, 16)}...`);
  output.info(`  Prev:    ${previousHash.slice(0, 16)}...`);
  output.blank();
  output.info(`  Chain length: ${(readJsonlFile(eventsPath).data as unknown[])?.length || 0}`);
  output.blank();
}

/**
 * CLI entry point
 */
export async function appendCli(args: string[]): Promise<void> {
  const options: AppendOptions = { event: "" };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--path":
      case "-p":
        options.path = args[++i];
        break;
      case "--type":
      case "-t":
        options.type = args[++i];
        break;
      case "--source":
      case "-s":
        options.source = args[++i];
        break;
      case "--parent":
      case "-P":
        options.parent = args[++i];
        break;
      case "--data":
      case "-d":
        options.data = args[++i];
        break;
      case "--metadata":
      case "-m":
        options.metadata = args[++i];
        break;
      case "--help":
      case "-h":
        showHelp();
        return;
      default:
        if (!options.event) {
          options.event = args[i];
        }
    }
  }

  if (!options.event) {
    output.error("Event message is required");
    showHelp();
    process.exit(1);
  }

  await appendCommand(options);
}

function showHelp(): void {
  output.blank();
  output.info("Usage: gw append [options] <message>");
  output.blank();
  output.info("Arguments:");
  output.indent("<message>             — event message or description");
  output.blank();
  output.info("Options:");
  output.indent("--path, -p <path>      — repository path (default: current directory)");
  output.indent("--type, -t <type>      — event type (default: 'generic')");
  output.indent("--source, -s <source>  — event source (default: 'cli')");
  output.indent("--parent, -P <hash>    — parent event hash (optional)");
  output.indent("--data, -d <json>      — additional data in JSON format");
  output.indent("--metadata, -m <json>  — metadata in JSON format");
  output.indent("--help, -h             — show this help");
  output.blank();
  output.info("Example:");
  output.indent('gw append "User logged in" --type auth --source web');
  output.indent('gw append "Config updated" --data \'{"key": "value"}\'');
  output.blank();
}

export default appendCommand;