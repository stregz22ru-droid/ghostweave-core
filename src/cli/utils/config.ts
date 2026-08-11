// GHOSTWEAVE CLI: Configuration Utilities v1.0
// Управление конфигурацией CLI: загрузка, сохранение, валидация.

import { resolve, join } from "path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { output } from "./output";

export interface CliConfig {
  repository?: string;
  profile?: string;
  verbose?: boolean;
  noColor?: boolean;
  silent?: boolean;
}

const CONFIG_DIR = ".ghostweave";
const CONFIG_FILE = "cli-config.json";

/**
 * Получение пути к файлу конфигурации
 */
export function getConfigPath(rootPath?: string): string {
  const base = rootPath || process.cwd();
  return join(base, CONFIG_DIR, CONFIG_FILE);
}

/**
 * Загрузка конфигурации CLI
 */
export function loadConfig(rootPath?: string): CliConfig {
  const configPath = getConfigPath(rootPath);

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content) as CliConfig;
  } catch (err) {
    output.warn(
      `Failed to load config: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    return {};
  }
}

/**
 * Сохранение конфигурации CLI
 */
export function saveConfig(config: CliConfig, rootPath?: string): void {
  const configPath = getConfigPath(rootPath);
  const configDir = join(rootPath || process.cwd(), CONFIG_DIR);

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    output.error(
      `Failed to save config: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Обновление конфигурации (merge)
 */
export function updateConfig(
  updates: Partial<CliConfig>,
  rootPath?: string
): CliConfig {
  const current = loadConfig(rootPath);
  const merged = { ...current, ...updates };
  saveConfig(merged, rootPath);
  return merged;
}

/**
 * Получение значения из конфигурации или окружения
 */
export function getConfigValue<T>(
  key: keyof CliConfig,
  defaultValue?: T,
  rootPath?: string
): T | undefined {
  const config = loadConfig(rootPath);
  const value = config[key] as T;

  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;

  // Проверка окружения
  const envKey = `GW_${key.toUpperCase()}`;
  const envValue = process.env[envKey];

  if (envValue !== undefined) {
    if (envValue === "1" || envValue === "true") return true as T;
    if (envValue === "0" || envValue === "false") return false as T;
    return envValue as T;
  }

  return undefined;
}

export default {
  loadConfig,
  saveConfig,
  updateConfig,
  getConfigValue,
  getConfigPath
};