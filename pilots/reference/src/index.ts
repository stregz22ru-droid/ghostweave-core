#!/usr/bin/env node

// GHOSTWEAVE Pilot: Entry Point v1.0
// Точка входа для пилотного проекта

import { profileManager, officialProfileV1 } from "@ghostweave/core-sdk";
import { ChainStorage } from "./storage/chain";
import { logger } from "./utils/logger";
import { initCommand } from "./commands/init";
import { logCommand } from "./commands/log";
import { verifyCommand } from "./commands/verify";
import { exportCommand } from "./commands/export";
import { replayCommand } from "./commands/replay";

// ============================================================================
// Конфигурация
// ============================================================================

const DATA_DIR = process.env.GW_PILOT_DATA || "./data";

// ============================================================================
// Инициализация
// ============================================================================

// Регистрация профиля (если ещё не зарегистрирован)
if (!profileManager.hasProfile(officialProfileV1.id)) {
  profileManager.registerProfile(officialProfileV1);
}
profileManager.setActiveProfile(officialProfileV1.id);

// Инициализация хранилища
const storage = new ChainStorage(DATA_DIR);

// ============================================================================
// Команды
// ============================================================================

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  init: async (args) => {
    const force = args.includes("--force") || args.includes("-f");
    await initCommand(storage, { force, name: "GHOSTWEAVE Pilot" });
  },
  log: async (args) => {
    const type = args[0] || "generic";
    const source = args[1] || "pilot-cli";
    const message = args.slice(2).join(" ") || "No message";
    await logCommand(storage, { type, source, message });
  },
  verify: async (args) => {
    const verbose = args.includes("--verbose") || args.includes("-v");
    await verifyCommand(storage, { verbose });
  },
  export: async (args) => {
    const output = args[0] || "./data";
    const format = args.includes("--canonical") ? "canonical" : "json";
    await exportCommand(storage, { output, format });
  },
  replay: async (args) => {
    const verbose = args.includes("--verbose") || args.includes("-v");
    const from = args.find((_, i) => args[i - 1] === "--from");
    const to = args.find((_, i) => args[i - 1] === "--to");
    await replayCommand(storage, { verbose, from, to });
  },
  help: async () => {
    showHelp();
  },
};

// ============================================================================
// Help
// ============================================================================

function showHelp(): void {
  logger.blank();
  logger.info("🚀 GHOSTWEAVE Pilot v1.0");
  logger.info("A real-world example of GHOSTWEAVE SDK usage");
  logger.blank();
  logger.info("Commands:");
  logger.log("info", "  init              — Initialize the chain with genesis event");
  logger.log("info", "  log <type> <source> <message> — Log an event");
  logger.log("info", "  verify [--verbose] — Verify chain integrity");
  logger.log("info", "  export [--canonical] — Export chain to JSON");
  logger.log("info", "  replay [--verbose] [--from <id>] [--to <id>] — Replay evidence chain");
  logger.log("info", "  help              — Show this help");
  logger.blank();
  logger.info("Examples:");
  logger.log("info", "  pilot init");
  logger.log("info", "  pilot log user.login web-app \"User 123 logged in\"");
  logger.log("info", "  pilot verify --verbose");
  logger.log("info", "  pilot export --canonical");
  logger.log("info", "  pilot replay --from evt_123 --to evt_456");
  logger.blank();
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  if (COMMANDS[command]) {
    try {
      await COMMANDS[command](commandArgs);
    } catch (err) {
      logger.error(`Command failed: ${err}`);
      process.exit(1);
    }
  } else if (command === "--help" || command === "-h") {
    showHelp();
  } else {
    logger.error(`Unknown command: ${command}`);
    logger.info('Run "pilot help" for available commands.');
    process.exit(1);
  }
}

// ============================================================================
// Run
// ============================================================================

main().catch((err) => {
  logger.error(`Fatal error: ${err}`);
  process.exit(1);
});

export default main;