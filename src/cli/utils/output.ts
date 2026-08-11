// GHOSTWEAVE CLI: Output Utilities v1.0
// Форматированный вывод в терминал с поддержкой цветов, уровней и прогресса.

export type LogLevel = "debug" | "info" | "warn" | "error" | "success";

export interface OutputOptions {
  silent?: boolean;
  noColor?: boolean;
  verbose?: boolean;
}

const ANSI_COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: "🔍",
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  success: "✅",
};

const LEVEL_COLORS: Record<LogLevel, keyof typeof ANSI_COLORS> = {
  debug: "gray",
  info: "blue",
  warn: "yellow",
  error: "red",
  success: "green",
};

export class Output {
  private silent: boolean;
  private noColor: boolean;
  private verbose: boolean;

  constructor(options: OutputOptions = {}) {
    this.silent = options.silent ?? false;
    this.noColor = options.noColor ?? false;
    this.verbose = options.verbose ?? false;
  }

  private format(level: LogLevel, message: string, data?: unknown): string {
    const color = this.noColor ? "reset" : LEVEL_COLORS[level];
    const icon = LEVEL_ICONS[level];
    const prefix = this.colorize(`[${level.toUpperCase()}]`, color);
    const timestamp = this.colorize(new Date().toISOString(), "gray");

    let output = `${timestamp} ${prefix} ${icon} ${message}`;

    if (data !== undefined && this.verbose) {
      const dataStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      output += `\n${this.colorize(dataStr, "gray")}`;
    }

    return output;
  }

  private colorize(text: string, color: keyof typeof ANSI_COLORS): string {
    if (this.noColor) return text;
    return `${ANSI_COLORS[color]}${text}${ANSI_COLORS.reset}`;
  }

  log(level: LogLevel, message: string, data?: unknown): void {
    if (this.silent) return;
    if (level === "debug" && !this.verbose) return;
    console.log(this.format(level, message, data));
  }

  debug(message: string, data?: unknown): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: unknown): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: unknown): void {
    this.log("error", message, data);
  }

  success(message: string, data?: unknown): void {
    this.log("success", message, data);
  }

  /**
   * Вывод с отступом (для вложенных структур)
   */
  indent(message: string, level: number = 1): void {
    if (this.silent) return;
    const indentStr = "  ".repeat(level);
    console.log(`${indentStr}${message}`);
  }

  /**
   * Вывод в виде таблицы
   */
  table(headers: string[], rows: string[][]): void {
    if (this.silent || rows.length === 0) return;

    const colWidths = headers.map((h, i) => {
      const maxRow = Math.max(...rows.map(r => (r[i] || "").length));
      return Math.max(h.length, maxRow);
    });

    const separator = colWidths.map(w => "─".repeat(w + 2)).join("┼");
    const headerStr = headers.map((h, i) => ` ${h.padEnd(colWidths[i])} `).join("│");

    console.log(this.colorize(`┌${separator}┐`, "gray"));
    console.log(this.colorize(`│${headerStr}│`, "bold"));
    console.log(this.colorize(`├${separator}┤`, "gray"));

    for (const row of rows) {
      const rowStr = row.map((cell, i) => ` ${(cell || "").padEnd(colWidths[i])} `).join("│");
      console.log(this.colorize(`│${rowStr}│`, "gray"));
    }

    console.log(this.colorize(`└${separator}┘`, "gray"));
  }

  /**
   * Прогресс-бар (простой)
   */
  progress(current: number, total: number, label: string = ""): void {
    if (this.silent) return;
    const percent = Math.min(Math.round((current / total) * 100), 100);
    const barWidth = 40;
    const filled = Math.round((percent / 100) * barWidth);
    const empty = barWidth - filled;
    const bar = "█".repeat(filled) + "░".repeat(empty);
    const color = percent === 100 ? "green" : percent > 70 ? "yellow" : "cyan";
    const coloredBar = this.colorize(bar, color);
    const labelStr = label ? ` ${label}` : "";
    process.stdout.write(`\r${this.colorize("[", "gray")}${coloredBar}${this.colorize("]", "gray")} ${percent}%${labelStr}`);
    if (percent === 100) {
      process.stdout.write("\n");
    }
  }

  /**
   * Вывод в одну строку (без переноса)
   */
  write(message: string): void {
    if (this.silent) return;
    process.stdout.write(message);
  }

  /**
   * Пустая строка
   */
  blank(): void {
    if (this.silent) return;
    console.log("");
  }
}

/**
 * Создание экземпляра Output с опциями из окружения
 */
export function createOutput(options?: OutputOptions): Output {
  const envOpts: OutputOptions = {
    silent: process.env.GW_SILENT === "1",
    noColor: process.env.NO_COLOR === "1" || !process.stdout.isTTY,
    verbose: process.env.GW_VERBOSE === "1" || process.argv.includes("--verbose"),
  };

  return new Output({ ...envOpts, ...options });
}

/**
 * Глобальный экземпляр Output (для простого импорта)
 */
export const output = createOutput();

export default output;