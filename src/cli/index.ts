#!/usr/bin/env node

// GHOSTWEAVE CLI: Entry Point v1.0
// Точка входа для всех CLI-команд.
// Использование: gw <command> [options]

import { output } from "./utils/output";
import { initCli } from "./commands/init";
import { appendCli } from "./commands/append";
import { verifyCli } from "./commands/verify";
import { replayCli } from "./commands/replay";
import { exportCli } from "./commands/export";
import { statusCli } from "./commands/status";

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  init: initCli,
  append: appendCli,
  verify: verifyCli,
  replay: replayCli,
  export: exportCli,
  status: statusCli
};

const COMMAND_ALIASES: Record<string, string> = {
  i: "init",
  a: "append",
  v: "verify",
  r: "replay",
  e: "export",
  s: "status"
};

const COMMAND_DESCRIPTIONS: Record<string, string> = {
  init: "Initialize a new Ghostweave Core repository",
  append: "Append an event to the chain",
  verify: "Verify the integrity of the chain",
  replay: "Reconstruct the evidence chain",
  export: "Export the chain in various formats (RFC 8785)",
  status: "Show current Core status"
};

/**
 * Показать справку по командам
 */
function showHelp(): void {
  output.blank();
  output.info("GHOSTWEAVE Core CLI v1.0");
  output.info("A portable local AI runtime foundation");
  output.blank();
  output.info("Usage: gw <command> [options]");
  output.blank();
  output.info("Commands:");

  const maxLen = Math.max(...Object.keys(COMMANDS).map(c => c.length)) + 2;
  for (const [cmd, desc] of Object.entries(COMMAND_DESCRIPTIONS)) {
    const pad = " ".repeat(maxLen - cmd.length);
    output.indent(`${cmd}${pad}${desc}`);
  }

  output.blank();
  output.info("Aliases:");
  for (const [alias, cmd] of Object.entries(COMMAND_ALIASES)) {
    output.indent(`${alias} → ${cmd}`);
  }

  output.blank();
  output.info("Global options:");
  output.indent("--help, -h     — show this help");
  output.indent("--version, -V  — show version");
  output.indent("--verbose, -v  — enable verbose output");
  output.indent("--silent, -s   — suppress output (except errors)");
  output.blank();
  output.info("Examples:");
  output.indent("gw init --path ./my-repo");
  output.indent("gw append 'User logged in' --type auth");
  output.indent("gw verify --verbose");
  output.indent("gw export --format rfc8785 --output chain.json");
  output.blank();
}

/**
 * Показать версию
 */
function showVersion(): void {
  output.blank();
  output.info("GHOSTWEAVE Core CLI v1.0.0");
  output.info("Built with ❤️ for portable local AI runtime");
  output.blank();
}

/**
 * Парсинг глобальных опций
 */
function parseGlobalOptions(args: string[]): { filtered: string[]; verbose: boolean; silent: boolean } {
  const filtered: string[] = [];
  let verbose = false;
  let silent = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--verbose":
      case "-v":
        verbose = true;
        break;
      case "--silent":
      case "-s":
        silent = true;
        break;
      case "--help":
      case "-h":
        showHelp();
        process.exit(0);
        break;
      case "--version":
      case "-V":
        showVersion();
        process.exit(0);
        break;
      default:
        filtered.push(args[i]);
        break;
    }
  }

  return { filtered, verbose, silent };
}

/**
 * Основная функция CLI
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  // Парсинг глобальных опций
  const { filtered, verbose, silent } = parseGlobalOptions(args);

  // Обновляем Output
  if (verbose) {
    // Output уже имеет поддержку verbose через createOutput
    // Временно устанавливаем флаг через окружение
    process.env.GW_VERBOSE = "1";
  }
  if (silent) {
    process.env.GW_SILENT = "1";
  }

  if (filtered.length === 0) {
    showHelp();
    process.exit(0);
  }

  const commandName = filtered[0];
  const commandArgs = filtered.slice(1);

  // Разрешаем алиас
  const resolvedCommand = COMMAND_ALIASES[commandName] || commandName;

  if (!COMMANDS[resolvedCommand]) {
    output.error(`Unknown command: ${commandName}`);
    output.info(`Run 'gw --help' for available commands`);
    process.exit(1);
  }

  // Выполнение команды
  try {
    await COMMANDS[resolvedCommand](commandArgs);
  } catch (err) {
    output.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

/**
 * Запуск CLI
 */
if (require.main === module) {
  main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

export default main;