// GHOSTWEAVE CLI: Status Command v1.0
// gw status — отображение текущего состояния Core: цепочка, хеши, метрики, здоровье.

import { resolve, join } from "path";
import { existsSync, statSync } from "fs";
import { output } from "../utils/output";
import { readJsonlFile, getFileSize } from "../utils/fs";
import { createHash } from "crypto";

export interface StatusOptions {
  path?: string;
  verbose?: boolean;
  watch?: boolean;
}

export interface CoreStatus {
  initialized: boolean;
  path: string;
  chain: {
    length: number;
    firstHash: string;
    lastHash: string;
    size: number;
    firstEvent?: unknown;
    lastEvent?: unknown;
  };
  config: {
    version: string;
    name: string;
    created_at: string;
  };
  health: {
    status: "healthy" | "degraded" | "corrupted";
    errors: string[];
    warnings: string[];
  };
  metrics: {
    totalEvents: number;
    totalSize: number;
    averageSize: number;
    lastModified: string;
  };
}

/**
 * Загрузка конфигурации репозитория
 */
function loadConfig(repoPath: string): Record<string, unknown> | null {
  const configPath = join(repoPath, ".ghostweave", "config.json");
  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const { readFileSync } = require("fs");
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Загрузка событий с ограничением
 */
function loadEvents(repoPath: string, limit: number = 10): { events: unknown[]; total: number; firstHash: string; lastHash: string } {
  const eventsPath = join(repoPath, ".ghostweave", "events.jsonl");
  if (!existsSync(eventsPath)) {
    return { events: [], total: 0, firstHash: "0".repeat(64), lastHash: "0".repeat(64) };
  }

  const result = readJsonlFile(eventsPath);
  if (!result.success) {
    return { events: [], total: 0, firstHash: "0".repeat(64), lastHash: "0".repeat(64) };
  }

  const allEvents = (result.data as unknown[]) || [];
  const total = allEvents.length;

  // Получение первого и последнего хеша
  let firstHash = "0".repeat(64);
  let lastHash = "0".repeat(64);

  if (total > 0) {
    const first = allEvents[0] as Record<string, unknown>;
    const last = allEvents[total - 1] as Record<string, unknown>;
    firstHash = (first.hash as string) || "0".repeat(64);
    lastHash = (last.hash as string) || "0".repeat(64);
  }

  // Возвращаем последние N событий для отображения
  const events = allEvents.slice(Math.max(0, total - limit), total);

  return { events, total, firstHash, lastHash };
}

/**
 * Проверка целостности цепочки (быстрая)
 */
function quickVerify(events: unknown[]): { status: "healthy" | "degraded" | "corrupted"; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (events.length === 0) {
    return { status: "healthy", errors: [], warnings: [] };
  }

  let previousHash = "0".repeat(64);
  let chainBroken = false;

  for (let i = 0; i < events.length; i++) {
    const event = events[i] as Record<string, unknown>;

    // Проверка наличия обязательных полей
    if (!event.id || !event.hash || !event.timestamp) {
      errors.push(`Event ${i}: missing required fields (id, hash, timestamp)`);
      continue;
    }

    // Проверка хеша (быстрая — только если есть hash)
    if (event.hash) {
      const { hash, ...eventWithoutHash } = event;
      const content = JSON.stringify(eventWithoutHash);
      const computedHash = createHash("sha256").update(content).digest("hex");
      if (computedHash !== (event.hash as string)) {
        errors.push(`Event ${i} (${event.id}): hash mismatch`);
      }
    }

    // Проверка цепочки
    const prevHash = event.previous_hash as string || "0".repeat(64);
    if (prevHash !== previousHash && i > 0) {
      if (!chainBroken) {
        warnings.push(`Chain broken at event ${i} (${event.id})`);
        chainBroken = true;
      }
    }
    previousHash = event.hash as string || "0".repeat(64);
  }

  const status = errors.length > 0 ? "corrupted" : warnings.length > 0 ? "degraded" : "healthy";
  return { status, errors, warnings };
}

/**
 * Получение статуса Core
 */
export function getCoreStatus(repoPath: string, options: StatusOptions = {}): CoreStatus | null {
  // Проверка инициализации
  const corePath = join(repoPath, ".ghostweave");
  if (!existsSync(corePath)) {
    return null;
  }

  // Загрузка конфига
  const config = loadConfig(repoPath);
  if (!config) {
    return null;
  }

  // Загрузка событий
  const limit = options.verbose ? 20 : 5;
  const { events, total, firstHash, lastHash } = loadEvents(repoPath, limit);
  const eventsPath = join(repoPath, ".ghostweave", "events.jsonl");
  const size = getFileSize(eventsPath) || 0;

  // Проверка целостности
  const health = quickVerify(events);

  // Вычисление метрик
  const averageSize = total > 0 ? size / total : 0;
  const stats = existsSync(eventsPath) ? statSync(eventsPath) : null;

  return {
    initialized: true,
    path: repoPath,
    chain: {
      length: total,
      firstHash,
      lastHash,
      size
    },
    config: {
      version: (config.version as string) || "unknown",
      name: (config.name as string) || "unnamed",
      created_at: (config.created_at as string) || new Date().toISOString()
    },
    health,
    metrics: {
      totalEvents: total,
      totalSize: size,
      averageSize: averageSize,
      lastModified: stats ? stats.mtime.toISOString() : "unknown"
    }
  };
}

/**
 * Форматирование статуса для вывода
 */
function formatStatus(status: CoreStatus, options: StatusOptions = {}): string {
  const lines: string[] = [];

  // Заголовок
  const healthIcon = status.health.status === "healthy" ? "✅" :
                     status.health.status === "degraded" ? "⚠️" : "❌";
  lines.push(`📊 Ghostweave Core Status  ${healthIcon}`);
  lines.push("=".repeat(50));
  lines.push("");

  // Общая информация
  lines.push(`📁 Path:       ${status.path}`);
  lines.push(`📛 Name:       ${status.config.name}`);
  lines.push(`📦 Version:    ${status.config.version}`);
  lines.push(`📅 Created:    ${status.config.created_at.slice(0, 19)}`);
  lines.push("");

  // Состояние цепочки
  lines.push(`🔗 Chain:`);
  lines.push(`   Length:     ${status.chain.length} events`);
  lines.push(`   Size:       ${(status.chain.size / 1024).toFixed(2)} KB`);
  lines.push(`   First hash: ${status.chain.firstHash.slice(0, 16)}...`);
  lines.push(`   Last hash:  ${status.chain.lastHash.slice(0, 16)}...`);
  lines.push("");

  // Здоровье
  lines.push(`💊 Health:     ${status.health.status.toUpperCase()}`);
  if (status.health.errors.length > 0) {
    lines.push(`   Errors:     ${status.health.errors.length}`);
    for (const err of status.health.errors) {
      lines.push(`     ❌ ${err}`);
    }
  }
  if (status.health.warnings.length > 0) {
    lines.push(`   Warnings:   ${status.health.warnings.length}`);
    for (const warn of status.health.warnings) {
      lines.push(`     ⚠️ ${warn}`);
    }
  }
  lines.push("");

  // Метрики
  lines.push(`📈 Metrics:`);
  lines.push(`   Avg event:  ${(status.metrics.averageSize / 1024).toFixed(2)} KB`);
  lines.push(`   Modified:   ${status.metrics.lastModified.slice(0, 19)}`);
  lines.push("");

  // Последние события (если есть)
  if (options.verbose && status.chain.length > 0) {
    lines.push(`📄 Recent events (last ${Math.min(status.chain.length, 5)}):`);
    const events = loadEvents(status.path, options.verbose ? 20 : 5).events;
    for (const event of events as Record<string, unknown>[]) {
      lines.push(`   ${event.id}  |  ${event.type}  |  ${new Date(event.timestamp as number).toISOString().slice(0, 19)}`);
    }
    lines.push("");
  }

  lines.push("=".repeat(50));

  return lines.join("\n");
}

/**
 * Отображение статуса Core
 */
export async function statusCommand(options: StatusOptions = {}): Promise<void> {
  const rootPath = resolve(options.path || process.cwd());

  output.blank();

  const status = getCoreStatus(rootPath, options);

  if (!status) {
    output.warn(`Not a Ghostweave repository: ${rootPath}`);
    output.info("Run 'gw init' to initialize a new repository");
    output.blank();
    return;
  }

  // Вывод статуса
  output.write(formatStatus(status, options));
  output.blank();

  // Watch режим
  if (options.watch) {
    output.info("👁️  Watching for changes... (Ctrl+C to stop)");
    // Простой watch — в реальном CLI можно использовать chokidar
    // Здесь оставляем заглушку
  }
}

/**
 * CLI entry point
 */
export async function statusCli(args: string[]): Promise<void> {
  const options: StatusOptions = {};

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
      case "--watch":
      case "-w":
        options.watch = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        return;
    }
  }

  await statusCommand(options);
}

function showHelp(): void {
  output.blank();
  output.info("Usage: gw status [options]");
  output.blank();
  output.info("Options:");
  output.indent("--path, -p <path>    — repository path (default: current directory)");
  output.indent("--verbose, -v        — show detailed output (recent events)");
  output.indent("--watch, -w          — watch for changes (experimental)");
  output.indent("--help, -h           — show this help");
  output.blank();
  output.info("Example:");
  output.indent("gw status --path ./my-repo --verbose");
  output.blank();
}

export default statusCommand;