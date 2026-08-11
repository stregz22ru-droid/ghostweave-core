// GHOSTWEAVE CLI: Replay Command v1.0
// gw replay — восстановление доказательной цепочки (НЕ воспроизведение мышления).
// Строит Evidence Chain на основе событий из Core.

import { resolve, join } from "path";
import { existsSync } from "fs";
import { output } from "../utils/output";
import { readJsonlFile, atomicWriteFile } from "../utils/fs";
import { createHash } from "crypto";

export interface ReplayOptions {
  path?: string;
  output?: string;
  format?: "json" | "markdown" | "evidence";
  from?: string;
  to?: string;
  verbose?: boolean;
}

export interface Evidence {
  id: string;
  timestamp: number;
  type: string;
  source: string;
  hash: string;
  previous_hash: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  verified: boolean;
}

export interface ReplayResult {
  evidence: Evidence[];
  chainLength: number;
  verified: boolean;
  fromIndex: number;
  toIndex: number;
}

/**
 * Загрузка событий из цепочки
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
 * Проверка хеша события
 */
function verifyEventHash(event: Record<string, unknown>): boolean {
  const { hash, ...eventWithoutHash } = event;
  const content = JSON.stringify(eventWithoutHash);
  const computedHash = createHash("sha256").update(content).digest("hex");
  return computedHash === (hash as string);
}

/**
 * Построение доказательной цепочки из событий
 */
export function buildEvidenceChain(events: unknown[], options: ReplayOptions = {}): ReplayResult {
  const result: ReplayResult = {
    evidence: [],
    chainLength: 0,
    verified: true,
    fromIndex: 0,
    toIndex: 0
  };

  if (events.length === 0) {
    return result;
  }

  // Определяем диапазон
  let startIndex = 0;
  let endIndex = events.length - 1;

  if (options.from) {
    const found = events.findIndex(e => (e as Record<string, unknown>).id === options.from);
    if (found !== -1) startIndex = found;
  }

  if (options.to) {
    const found = events.findIndex(e => (e as Record<string, unknown>).id === options.to);
    if (found !== -1) endIndex = found;
  }

  // Строим цепочку доказательств
  let previousHash = "0".repeat(64);
  let chainVerified = true;

  for (let i = startIndex; i <= endIndex; i++) {
    const event = events[i] as Record<string, unknown>;

    // Проверка валидности события
    const isVerified = verifyEventHash(event);
    if (!isVerified) {
      chainVerified = false;
    }

    const evidence: Evidence = {
      id: event.id as string || `evt_${i}`,
      timestamp: event.timestamp as number || Date.now(),
      type: event.type as string || "unknown",
      source: event.source as string || "unknown",
      hash: event.hash as string || "0".repeat(64),
      previous_hash: event.previous_hash as string || "0".repeat(64),
      payload: event.payload || null,
      metadata: event.metadata as Record<string, unknown> | undefined,
      verified: isVerified
    };

    result.evidence.push(evidence);
    previousHash = evidence.hash;
  }

  result.chainLength = result.evidence.length;
  result.verified = chainVerified;
  result.fromIndex = startIndex;
  result.toIndex = endIndex;

  return result;
}

/**
 * Форматирование доказательной цепочки в JSON
 */
function formatJson(result: ReplayResult): string {
  return JSON.stringify({
    evidence: result.evidence,
    meta: {
      chainLength: result.chainLength,
      verified: result.verified,
      fromIndex: result.fromIndex,
      toIndex: result.toIndex,
      generatedAt: new Date().toISOString()
    }
  }, null, 2);
}

/**
 * Форматирование доказательной цепочки в Markdown
 */
function formatMarkdown(result: ReplayResult): string {
  const lines: string[] = [];

  lines.push("# GHOSTWEAVE Evidence Chain");
  lines.push("");
  lines.push(`**Chain Length:** ${result.chainLength}`);
  lines.push(`**Verified:** ${result.verified ? "✅ Yes" : "❌ No"}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const evidence of result.evidence) {
    const status = evidence.verified ? "✅" : "❌";
    lines.push(`## ${status} ${evidence.type}: ${evidence.id}`);
    lines.push("");
    lines.push(`- **Timestamp:** ${new Date(evidence.timestamp).toISOString()}`);
    lines.push(`- **Source:** ${evidence.source}`);
    lines.push(`- **Hash:** \`${evidence.hash.slice(0, 16)}...\``);
    lines.push(`- **Previous:** \`${evidence.previous_hash.slice(0, 16)}...\``);

    if (evidence.payload && typeof evidence.payload === "object") {
      const payloadStr = JSON.stringify(evidence.payload, null, 2);
      if (payloadStr.length > 500) {
        lines.push(`- **Payload:** _(truncated, ${payloadStr.length} chars)_`);
      } else {
        lines.push(`- **Payload:**`);
        lines.push("```json");
        lines.push(payloadStr);
        lines.push("```");
      }
    }

    if (evidence.metadata) {
      lines.push(`- **Metadata:** ${JSON.stringify(evidence.metadata)}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Форматирование доказательной цепочки как Evidence List
 */
function formatEvidenceList(result: ReplayResult): string {
  const lines: string[] = [];

  lines.push(`Chain verified: ${result.verified ? "✅" : "❌"}`);
  lines.push(`Total evidence: ${result.evidence.length}`);
  lines.push("");

  for (const ev of result.evidence) {
    const status = ev.verified ? "✓" : "✗";
    lines.push(`${status} ${ev.id}  |  ${ev.type}  |  ${new Date(ev.timestamp).toISOString().slice(0, 19)}`);
  }

  return lines.join("\n");
}

/**
 * Восстановление доказательной цепочки
 */
export async function replayCommand(options: ReplayOptions = {}): Promise<void> {
  const rootPath = resolve(options.path || process.cwd());
  const repoPath = rootPath;

  output.blank();
  output.info(`Replaying evidence chain at: ${repoPath}`);

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
    output.warn("Chain is empty — no evidence to replay");
    output.blank();
    return;
  }

  // Построение доказательной цепочки
  const startTime = Date.now();
  const result = buildEvidenceChain(events, options);
  const duration = Date.now() - startTime;

  // Вывод результата
  output.blank();

  if (result.verified) {
    output.success(`✅ Evidence chain verified (${result.chainLength} items)`);
  } else {
    output.error(`❌ Evidence chain has errors (${result.chainLength} items)`);
  }

  if (options.verbose) {
    output.blank();
    output.info("Chain summary:");
    output.indent(`From: ${result.fromIndex} -> To: ${result.toIndex}`);
    output.indent(`Verified: ${result.verified ? "Yes" : "No"}`);
    output.blank();
  }

  // Экспорт в файл
  if (options.output) {
    const outputPath = resolve(options.output);
    const format = options.format || "json";

    let content = "";
    switch (format) {
      case "markdown":
        content = formatMarkdown(result);
        break;
      case "evidence":
        content = formatEvidenceList(result);
        break;
      case "json":
      default:
        content = formatJson(result);
        break;
    }

    const writeResult = atomicWriteFile(outputPath, content);

    if (writeResult.success) {
      output.success(`Saved to: ${outputPath}`);
    } else {
      output.error(`Failed to save: ${writeResult.error}`);
    }
  }

  output.blank();
  output.info(`Replay completed in ${duration}ms`);
  output.blank();
}

/**
 * CLI entry point
 */
export async function replayCli(args: string[]): Promise<void> {
  const options: ReplayOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--path":
      case "-p":
        options.path = args[++i];
        break;
      case "--output":
      case "-o":
        options.output = args[++i];
        break;
      case "--format":
      case "-f":
        const format = args[++i];
        if (format === "json" || format === "markdown" || format === "evidence") {
          options.format = format;
        }
        break;
      case "--from":
        options.from = args[++i];
        break;
      case "--to":
        options.to = args[++i];
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        return;
    }
  }

  await replayCommand(options);
}

function showHelp(): void {
  output.blank();
  output.info("Usage: gw replay [options]");
  output.blank();
  output.info("Options:");
  output.indent("--path, -p <path>    — repository path (default: current directory)");
  output.indent("--output, -o <path>  — save to file");
  output.indent("--format, -f <fmt>   — json | markdown | evidence (default: json)");
  output.indent("--from <id>          — start from specific event ID");
  output.indent("--to <id>            — end at specific event ID");
  output.indent("--verbose, -v        — show detailed output");
  output.indent("--help, -h           — show this help");
  output.blank();
  output.info("Examples:");
  output.indent("gw replay --format markdown --output chain.md");
  output.indent("gw replay --from evt_1715842312345_a7f3k --to evt_1715842400000_b8g4l");
  output.blank();
}

export default replayCommand;