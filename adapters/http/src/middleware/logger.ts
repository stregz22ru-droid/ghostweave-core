// GHOSTWEAVE HTTP API: Logger Middleware v1.0
// Логирование запросов и ответов

import { Request, Response, NextFunction } from "express";

export type LogLevel = "debug" | "info" | "warn" | "error" | "success";

const COLORS = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
};

const LEVEL_COLORS: Record<LogLevel, keyof typeof COLORS> = {
  debug: "gray",
  info: "blue",
  warn: "yellow",
  error: "red",
  success: "green",
};

const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: "🔍",
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  success: "✅",
};

export class Logger {
  private silent: boolean = false;
  private verbose: boolean = false;
  private noColor: boolean = false;

  constructor(options: { silent?: boolean; verbose?: boolean; noColor?: boolean } = {}) {
    this.silent = options.silent ?? false;
    this.verbose = options.verbose ?? false;
    this.noColor = options.noColor ?? false;
  }

  colorize(text: string, color: keyof typeof COLORS): string {
    if (this.noColor) return text;
    return `${COLORS[color]}${text}${COLORS.reset}`;
  }

  private format(level: LogLevel, message: string, data?: unknown): string {
    const color = LEVEL_COLORS[level];
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

  blank(): void {
    if (this.silent) return;
    console.log("");
  }

  separator(): void {
    if (this.silent) return;
    console.log(this.colorize("─".repeat(50), "gray"));
  }
}

export const logger = new Logger({ verbose: true });

/**
 * Express middleware для логирования запросов
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    let statusColor: keyof typeof COLORS = "green";
    if (status >= 500) statusColor = "red";
    else if (status >= 400) statusColor = "yellow";
    else if (status >= 300) statusColor = "cyan";

    const statusStr = logger.colorize(String(status), statusColor);

    logger.log("info", `${method} ${url} → ${statusStr} (${duration}ms) [${ip}]`);
  });

  next();
}

export default logger;