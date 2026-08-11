// GHOSTWEAVE CLI: Export Command v1.0
// gw export — экспорт цепочки Core в формат RFC 8785 (JSON Canonicalization).
// Поддерживает экспорт полной цепочки или диапазона событий.

import { resolve, join } from "path";
import { existsSync } from "fs";
import { output } from "../utils/output";
import { readJsonlFile, atomicWriteFile } from "../utils/fs";
import { createHash } from "crypto";

export interface ExportOptions {
  path?: string;
  output?: string;
  format?: "json" | "rfc8785" | "compact";
  from?: string;
  to?: string;
  pretty?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  exported: number;
  format: string;
  size: number;
  hash: string;
  outputPath: string;
}

/**
 * RFC 8785 Canonical JSON сериализация
 * (JSON без пробелов, с сортировкой ключей)
 */
function canonicalStringify(obj: unknown): string {
  if (obj === null) return "null";
  if (obj === undefined) return "null";
  
  if (typeof obj === "string") return JSON.stringify(obj);
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalStringify(item));
    return `[${items.join(",")}]`;
  }
  
  if (typeof obj === "object") {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = keys.map(key => {
      const value = (obj as Record<string, unknown>)[key];
      if (value === undefined) return null;
      return `${JSON.stringify(key)}:${canonicalStringify(value)}`;
    }).filter(p => p !== null);
    return `{${pairs.join(",")}}`;
  }
  
  return JSON.stringify(obj);
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
 * Подготовка данных для экспорта
 */
function prepareExportData(events: unknown[], options: ExportOptions = {}): unknown {
  let data = events;

  // Фильтрация по диапазону
  if (options.from || options.to) {
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

    data = events.slice(startIndex, endIndex + 1);
  }

  // Удаление metadata если нужно
  if (!options.includeMetadata) {
    data = (data as Record<string, unknown>[]).map(event => {
      const { metadata, ...rest } = event;
      return rest;
    });
  }

  return data;
}

/**
 * Форматирование в зависимости от формата
 */
function formatExport(data: unknown, options: ExportOptions = {}): string {
  const format = options.format || "json";

  switch (format) {
    case "rfc8785":
      return canonicalStringify(data);

    case "compact":
      return JSON.stringify(data);

    case "json":
    default:
      return JSON.stringify(data, null, options.pretty ? 2 : 0);
  }
}

/**
 * Вычисление хеша экспортированных данных
 */
function computeExportHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Экспорт цепочки
 */
export async function exportCommand(options: ExportOptions = {}): Promise<void> {
  const rootPath = resolve(options.path || process.cwd());
  const repoPath = rootPath;

  output.blank();
  output.info(`Exporting chain from: ${repoPath}`);

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
    output.warn("Chain is empty — nothing to export");
    output.blank();
    return;
  }

  // Подготовка данных
  const data = prepareExportData(events, options);
  const dataArray = Array.isArray(data) ? data : [data];
  
  // Форматирование
  const content = formatExport(data, options);
  const contentSize = Buffer.byteLength(content, "utf-8");
  const hash = computeExportHash(content);

  // Определение пути вывода
  let outputPath = options.output;
  if (!outputPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = options.format === "rfc8785" ? ".json" : ".json";
    outputPath = join(repoPath, ".ghostweave", "export", `export_${timestamp}${ext}`);
  } else {
    outputPath = resolve(outputPath);
  }

  // Запись файла
  const writeResult = atomicWriteFile(outputPath, content);

  if (!writeResult.success) {
    output.error(`Failed to write export: ${writeResult.error}`);
    process.exit(1);
  }

  const result: ExportResult = {
    exported: dataArray.length,
    format: options.format || "json",
    size: contentSize,
    hash,
    outputPath
  };

  // Вывод результата
  output.blank();
  output.success(`✅ Export completed`);
  output.blank();
  output.info(`  Format:   ${result.format}`);
  output.info(`  Events:   ${result.exported}`);
  output.info(`  Size:     ${(result.size / 1024).toFixed(2)} KB`);
  output.info(`  Hash:     ${result.hash.slice(0, 16)}...`);
  output.info(`  Output:   ${result.outputPath}`);
  output.blank();

  if (options.format === "rfc8785") {
    output.info("📌 RFC 8785 canonical JSON — ready for verification");
  }
}

/**
 * CLI entry point
 */
export async function exportCli(args: string[]): Promise<void> {
  const options: ExportOptions = {};

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
        if (format === "json" || format === "rfc8785" || format === "compact") {
          options.format = format;
        }
        break;
      case "--from":
        options.from = args[++i];
        break;
      case "--to":
        options.to = args[++i];
        break;
      case "--pretty":
        options.pretty = true;
        break;
      case "--include-metadata":
        options.includeMetadata = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        return;
    }
  }

  await exportCommand(options);
}

function showHelp(): void {
  output.blank();
  output.info("Usage: gw export [options]");
  output.blank();
  output.info("Options:");
  output.indent("--path, -p <path>       — repository path (default: current directory)");
  output.indent("--output, -o <path>     — output file path");
  output.indent("--format, -f <fmt>      — json | rfc8785 | compact (default: json)");
  output.indent("--from <id>             — start from specific event ID");
  output.indent("--to <id>               — end at specific event ID");
  output.indent("--pretty                — pretty print JSON");
  output.indent("--include-metadata      — include metadata in export");
  output.indent("--help, -h              — show this help");
  output.blank();
  output.info("About RFC 8785:");
  output.indent("Canonical JSON format with sorted keys and no extra whitespace.");
  output.indent("Ideal for cryptographic verification and cross-platform compatibility.");
  output.blank();
  output.info("Examples:");
  output.indent("gw export --format rfc8785 --output chain.json");
  output.indent("gw export --from evt_123 --to evt_456 --pretty");
  output.blank();
}

export default exportCommand;