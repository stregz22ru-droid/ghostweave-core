// GHOSTWEAVE CLI: Init Command v1.0
// gw init — инициализация репозитория и создание структуры Core.

import { resolve, join } from "path";
import { existsSync } from "fs";
import { output } from "../utils/output";
import { ensureDirectory, atomicWriteFile } from "../utils/fs";
import { validateDirectory } from "../utils/validation";

export interface InitOptions {
  path?: string;
  force?: boolean;
  name?: string;
}

/**
 * Создает структуру Core репозитория
 */
export async function initCommand(options: InitOptions = {}): Promise<void> {
  const rootPath = resolve(options.path || process.cwd());
  const corePath = join(rootPath, ".ghostweave");
  const eventsPath = join(corePath, "events.jsonl");
  const configPath = join(corePath, "config.json");

  output.blank();
  output.info(`Initializing Ghostweave Core at: ${rootPath}`);

  // Проверка существующего репозитория
  if (existsSync(corePath) && !options.force) {
    output.error(`Repository already exists: ${corePath}`);
    output.info("Use --force to reinitialize");
    process.exit(1);
  }

  // Создание структуры
  output.debug("Creating directory structure...");

  const dirs = [
    corePath,
    join(corePath, "snapshots"),
    join(corePath, "export")
  ];

  for (const dir of dirs) {
    const result = ensureDirectory(dir);
    if (!result.success) {
      output.error(`Failed to create directory: ${dir}`, result.error);
      process.exit(1);
    }
  }

  // Создание конфига
  const config = {
    version: "1.0.0",
    name: options.name || "ghostweave-repo",
    created_at: new Date().toISOString(),
    core: {
      schema_version: "1.0",
      identity_provider: "file",
      anchor_provider: "file"
    },
    storage: {
      events: "events.jsonl",
      snapshots_dir: "snapshots",
      export_dir: "export"
    }
  };

  const configResult = atomicWriteFile(
    configPath,
    JSON.stringify(config, null, 2)
  );

  if (!configResult.success) {
    output.error("Failed to write config.json", configResult.error);
    process.exit(1);
  }

  // Создание пустого events.jsonl
  const eventsResult = atomicWriteFile(eventsPath, "");
  if (!eventsResult.success) {
    output.error("Failed to create events.jsonl", eventsResult.error);
    process.exit(1);
  }

  // Создание .gwignore (опционально)
  const ignorePath = join(rootPath, ".gwignore");
  if (!existsSync(ignorePath)) {
    const ignoreContent = `# Ghostweave ignore patterns
node_modules/
.git/
*.log
*.tmp
*.backup
`;
    atomicWriteFile(ignorePath, ignoreContent);
  }

  output.blank();
  output.success(`✅ Ghostweave Core initialized at: ${corePath}`);
  output.blank();
  output.info("Next steps:");
  output.indent("1. gw append <event>  — add an event to the chain");
  output.indent("2. gw verify          — verify the chain integrity");
  output.indent("3. gw status          — show current status");
  output.blank();
}

/**
 * CLI entry point
 */
export async function initCli(args: string[]): Promise<void> {
  const options: InitOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--path":
      case "-p":
        options.path = args[++i];
        break;
      case "--force":
      case "-f":
        options.force = true;
        break;
      case "--name":
      case "-n":
        options.name = args[++i];
        break;
      case "--help":
      case "-h":
        showHelp();
        return;
    }
  }

  await initCommand(options);
}

function showHelp(): void {
  output.blank();
  output.info("Usage: gw init [options]");
  output.blank();
  output.info("Options:");
  output.indent("--path, -p <path>    — root path for repository (default: current directory)");
  output.indent("--force, -f          — force reinitialization (overwrite existing)");
  output.indent("--name, -n <name>    — repository name");
  output.indent("--help, -h           — show this help");
  output.blank();
  output.info("Example:");
  output.indent("gw init --path ./my-repo --name \"My Project\"");
  output.blank();
}

export default initCommand;