import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/**
 * CLI Configuration
 * 
 * Manages paths and settings for GHOSTWEAVE CLI.
 * Default store location: ~/.ghostweave/store/
 */

export interface CliConfig {
  storePath: string;
  eventsFile: string;
  identityFile: string;
}

const DEFAULT_STORE_DIR = join(homedir(), '.ghostweave', 'store');

/**
 * Returns the default CLI configuration
 */
export function getDefaultConfig(): CliConfig {
  return {
    storePath: DEFAULT_STORE_DIR,
    eventsFile: join(DEFAULT_STORE_DIR, 'events.json'),
    identityFile: join(DEFAULT_STORE_DIR, 'identity.json')
  };
}

/**
 * Loads configuration from environment or defaults
 */
export function loadConfig(): CliConfig {
  const storePath = process.env.GHOSTWEAVE_STORE || DEFAULT_STORE_DIR;
  
  return {
    storePath,
    eventsFile: join(storePath, 'events.json'),
    identityFile: join(storePath, 'identity.json')
  };
}

/**
 * Ensures store directory exists
 */
export function ensureStoreExists(config: CliConfig): void {
  if (!existsSync(config.storePath)) {
    mkdirSync(config.storePath, { recursive: true });
  }
}

/**
 * Saves configuration to file (for future use)
 */
export function saveConfig(config: CliConfig, configPath: string): void {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Loads configuration from file (for future use)
 */
export function loadConfigFromFile(configPath: string): CliConfig | null {
  if (!existsSync(configPath)) {
    return null;
  }
  
  try {
    const data = readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}