// GHOSTWEAVE CLI: Verify Command v1.0
// gw verify — верификация цепочки Core: проверка хешей и целостности.

import { resolve, join } from "path";
import { existsSync } from "fs";
import { output } from "../utils/output";
import { readJsonlFile } from "../utils/fs";
import { createHash } from "crypto";

export interface VerifyOptions {
  path?: string;
  verbose?: boolean;
  repair?: boolean;
}

export interface VerifyResult {
  valid: boolean;
  chainLength: number;
  errors: VerifyError[];
  warnings: VerifyWarning[];
  stats: {
    totalEvents: number;
    validHashes: number;
    invalidHashes: number;
    missingParents: number;
    repaired: number;
  };
}

export interface VerifyError {
  index: number;
  eventId: string;
  type: "hash_mismatch" | "broken_chain" | "parent_not_found" | "malformed";
  message: string;
  expected?: string;
  actual?: string;
}

export interface VerifyWarning {
  index: number;
  eventId: string;
  type: "duplicate_id" | "future_timestamp" | "missing_metadata" | "broken_chain";
  message: string;
}

/**
 * Загрузка всех событий из цепочки
 */
function loadEvents(repoPath: string): unknown[] {
  const eventsPath = join(repoPath, ".ghostweave", "events.jsonl");
  if (!existsSync(eventsPath)) {
    return [];
  }

  const result = readJsonlFile(eventsPath);
  if (!result.success) {
    throw new Error(`Failed to read events: ${result.error}`);
  }

  return (result.data as unknown[]) || [];
}

/**
 * Вычисление хеша события
 */
function computeEventHash(event: Record<string, unknown>): string {
  // Создаем копию без поля hash
  const { hash, ...eventWithoutHash } = event;
  const content = JSON.stringify(eventWithoutHash);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Проверка цепочки событий
 */
export function verifyChain(events: unknown[], options: VerifyOptions = {}): VerifyResult {
  const result: VerifyResult = {
    valid: true,
    chainLength: events.length,
    errors: [],
    warnings: [],
    stats: {
      totalEvents: events.length,
      validHashes: 0,
      invalidHashes: 0,
      missingParents: 0,
      repaired: 0
    }
  };

  if (events.length === 0) {
    output.info("Chain is empty (valid)");
    return result;
  }

  const eventMap = new Map<string, Record<string, unknown>>();
  let previousHash = "0".repeat(64);
  let chainBroken = false;

  for (let i = 0; i < events.length; i++) {
    const event = events[i] as Record<string, unknown>;

    // Проверка на malformed
    if (!event.id || !event.hash || !event.timestamp) {
      result.errors.push({
        index: i,
        eventId: event.id as string || `unknown_${i}`,
        type: "malformed",
        message: "Event missing required fields (id, hash, timestamp)"
      });
      result.valid = false;
      continue;
    }

    const eventId = event.id as string;
    eventMap.set(eventId, event);

    // Проверка хеша
    const computedHash = computeEventHash(event);
    const storedHash = event.hash as string;

    if (computedHash !== storedHash) {
      result.errors.push({
        index: i,
        eventId,
        type: "hash_mismatch",
        message: `Hash mismatch at event ${i}`,
        expected: computedHash,
        actual: storedHash
      });
      result.stats.invalidHashes++;
      result.valid = false;
    } else {
      result.stats.validHashes++;
    }

    // Проверка цепочки (previous_hash)
    const prevHash = event.previous_hash as string || "0".repeat(64);
    if (prevHash !== previousHash) {
      // Проверяем, существует ли parent с таким хешем
      let parentFound = false;
      for (const [, ev] of eventMap) {
        if ((ev.hash as string) === prevHash) {
          parentFound = true;
          break;
        }
      }

      if (!parentFound && prevHash !== "0".repeat(64)) {
        result.errors.push({
          index: i,
          eventId,
          type: "parent_not_found",
          message: `Parent hash not found: ${prevHash.slice(0, 16)}...`
        });
        result.stats.missingParents++;
        result.valid = false;
      } else if (!chainBroken) {
        result.warnings.push({
          index: i,
          eventId,
          type: "broken_chain",
          message: `Chain broken at event ${i}: expected ${previousHash.slice(0, 16)}..., got ${prevHash.slice(0, 16)}...`
        });
        chainBroken = true;
        result.valid = false;
      }
    }

    // Обновляем previousHash для следующего события
    previousHash = storedHash;
  }

  // Дополнительная проверка: дубликаты ID
  const ids = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    const event = events[i] as Record<string, unknown>;
    const id = event.id as string;
    if (ids.has(id)) {
      result.warnings.push({
        index: i,
        eventId: id,
        type: "duplicate_id",
        message: `Duplicate event ID: ${id}`
      });
    }
    ids.add(id);
  }

  return result;
}

/**
 * Форматирование результата верификации
 */
function formatVerifyResult(result: VerifyResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push("✅ Chain is VALID");
  } else {
    lines.push("❌ Chain is INVALID");
  }

  lines.push(`  Events: ${result.stats.totalEvents}`);
  lines.push(`  Valid hashes: ${result.stats.validHashes}`);
  lines.push(`  Invalid hashes: ${result.stats.invalidHashes}`);

  if (result.stats.missingParents > 0) {
    lines.push(`  Missing parents: ${result.stats.missingParents}`);
  }

  if (result.errors.length > 0) {
    lines.push(`  Errors: ${result.errors.length}`);
    for (const err of result.errors) {
      lines.push(`    ❌ [${err.index}] ${err.eventId}: ${err.message}`);
      if (err.expected && err.actual) {
        lines.push(`       Expected: ${err.expected.slice(0, 16)}...`);
        lines.push(`       Actual:   ${err.actual.slice(0, 16)}...`);
      }
    }
  }

  if (result.warnings.length > 0 && output) {
    lines.push(`  Warnings: ${result.warnings.length}`);
    for (const warn of result.warnings) {
      lines.push(`    ⚠️ [${warn.index}] ${warn.eventId}: ${warn.message}`);
    }
  }

  return lines.join("\n");
}

/**
 * Верификация цепочки
 */
export async function verifyCommand(options: VerifyOptions = {}): Promise<void> {
  const rootPath = resolve(options.path || process.cwd());
  const repoPath = rootPath;

  output.blank();
  output.info(`Verifying chain at: ${repoPath}`);

  // Загрузка событий
  let events: unknown[];
  try {
    events = loadEvents(repoPath);
  } catch (err) {
    output.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  if (events.length === 0) {
    output.blank();
    output.success("✅ Chain is empty (valid)");
    output.blank();
    return;
  }

  // Верификация
  const startTime = Date.now();
  const result = verifyChain(events, options);
  const duration = Date.now() - startTime;

  // Вывод результата
  output.blank();
  output.info(formatVerifyResult(result));
  output.blank();
  output.info(`Verification completed in ${duration}ms`);

  if (!result.valid) {
    process.exit(1);
  }
}

/**
 * CLI entry point
 */
export async function verifyCli(args: string[]): Promise<void> {
  const options: VerifyOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--path":
      case "-p":
        options.path = args[++i];
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--repair":
      case "-r":
        options.repair = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        return;
    }
  }

  await verifyCommand(options);
}

function showHelp(): void {
  output.blank();
  output.info("Usage: gw verify [options]");
  output.blank();
  output.info("Options:");
  output.indent("--path, -p <path>    — repository path (default: current directory)");
  output.indent("--verbose, -v        — show detailed output");
  output.indent("--repair, -r         — attempt to repair chain (experimental)");
  output.indent("--help, -h           — show this help");
  output.blank();
  output.info("Example:");
  output.indent("gw verify --path ./my-repo --verbose");
  output.blank();
}

export default verifyCommand;