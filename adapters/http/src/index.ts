#!/usr/bin/env node

// GHOSTWEAVE HTTP API: Entry Point v1.0
// Точка входа для HTTP Adapter

import { HttpServer } from "./server";
import { HttpConfig } from "./types/index";
import { logger } from "./middleware/logger";

// ============================================================================
// Конфигурация по умолчанию
// ============================================================================

const DEFAULT_CONFIG: HttpConfig = {
  port: parseInt(process.env.GW_HTTP_PORT || "3311", 10),
  host: process.env.GW_HTTP_HOST || "127.0.0.1",
  dataDir: process.env.GW_HTTP_DATA_DIR || "./data",
  cors: {
    enabled: process.env.GW_HTTP_CORS !== "false",
    origins: process.env.GW_HTTP_CORS_ORIGINS?.split(",") || undefined
  },
  auth: {
    enabled: process.env.GW_HTTP_AUTH === "true",
    token: process.env.GW_HTTP_AUTH_TOKEN
  },
  logging: {
    enabled: process.env.GW_HTTP_LOGGING !== "false",
    level: (process.env.GW_HTTP_LOG_LEVEL as "debug" | "info" | "warn" | "error") || "info"
  }
};

// ============================================================================
// Парсинг аргументов командной строки
// ============================================================================

function parseArgs(): HttpConfig {
  const config = { ...DEFAULT_CONFIG };
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--port":
        config.port = parseInt(args[++i], 10);
        break;
      case "--host":
        config.host = args[++i];
        break;
      case "--data-dir":
        config.dataDir = args[++i];
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
      case "--version":
      case "-v":
        console.log("GHOSTWEAVE HTTP Adapter v1.0.0");
        process.exit(0);
        break;
    }
  }

  return config;
}

// ============================================================================
// Help
// ============================================================================

function showHelp(): void {
  console.log(`
GHOSTWEAVE HTTP Adapter v1.0.0

Usage:
  node dist/index.js [options]

Options:
  --port <number>      Port to listen on (default: 3311)
  --host <string>      Host to bind to (default: 127.0.0.1)
  --data-dir <path>    Data directory for chain storage (default: ./data)
  --help, -h           Show this help
  --version, -v        Show version

Environment variables:
  GW_HTTP_PORT         Port to listen on
  GW_HTTP_HOST         Host to bind to
  GW_HTTP_DATA_DIR     Data directory for chain storage
  GW_HTTP_CORS         Enable/disable CORS (default: true)
  GW_HTTP_CORS_ORIGINS Comma-separated list of allowed origins
  GW_HTTP_AUTH         Enable authentication (default: false)
  GW_HTTP_AUTH_TOKEN   Authentication token (required if auth enabled)
  GW_HTTP_LOGGING      Enable/disable logging (default: true)
  GW_HTTP_LOG_LEVEL    Log level: debug, info, warn, error (default: info)

Examples:
  node dist/index.js --port 3311 --host 0.0.0.0
  GW_HTTP_PORT=3311 GW_HTTP_DATA_DIR=./my-data node dist/index.js
`);
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

let server: HttpServer | null = null;

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down...`);
  if (server) {
    await server.stop();
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  try {
    server = new HttpServer(config);
    await server.start();
  } catch (err) {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error(`Fatal error: ${err}`);
  process.exit(1);
});

export default main;