// GHOSTWEAVE CLI: Filesystem Utilities v1.0
// Работа с файловой системой: чтение/запись JSONL, проверка целостности, атомарные операции.

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { createHash } from "crypto";

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Атомарная запись файла (сначала во временный файл, потом rename)
 * Гарантирует, что файл не будет поврежден при сбое записи.
 */
export function atomicWriteFile(
  filePath: string,
  content: string | Buffer,
  options?: { mode?: number; backup?: boolean }
): FileOperationResult {
  const resolvedPath = resolve(filePath);
  const dir = dirname(resolvedPath);

  try {
    // Создаем директорию, если её нет
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Временный файл
    const tmpPath = `${resolvedPath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;

    // Запись во временный файл
    writeFileSync(tmpPath, content, { mode: options?.mode ?? 0o644 });

    // Бэкап существующего файла
    if (options?.backup && existsSync(resolvedPath)) {
      const backupPath = `${resolvedPath}.backup.${Date.now()}`;
      renameSync(resolvedPath, backupPath);
    }

    // Атомарное переименование
    renameSync(tmpPath, resolvedPath);

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Чтение файла с проверкой существования
 */
export function readFileSafe(filePath: string): FileOperationResult {
  const resolvedPath = resolve(filePath);

  try {
    if (!existsSync(resolvedPath)) {
      return {
        success: false,
        error: `File does not exist: ${resolvedPath}`
      };
    }

    const content = readFileSync(resolvedPath, "utf-8");
    return { success: true, data: content };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Чтение JSONL файла (каждая строка — JSON объект)
 */
export function readJsonlFile(filePath: string): FileOperationResult {
  const result = readFileSafe(filePath);
  if (!result.success) return result;

  const lines = (result.data as string).split("\n").filter(line => line.trim() !== "");
  const objects: unknown[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      objects.push(JSON.parse(lines[i]));
    } catch (err) {
      return {
        success: false,
        error: `Invalid JSON at line ${i + 1}: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }

  return { success: true, data: objects };
}

/**
 * Запись в JSONL файл (добавление строки)
 */
export function appendJsonlLine(filePath: string, obj: unknown): FileOperationResult {
  const line = JSON.stringify(obj) + "\n";
  return atomicWriteFile(filePath, line);
}

/**
 * Проверка целостности файла по хешу
 */
export function verifyFileHash(filePath: string, expectedHash: string): FileOperationResult {
  const result = readFileSafe(filePath);
  if (!result.success) return result;

  const hash = createHash("sha256").update(result.data as string).digest("hex");

  if (hash !== expectedHash) {
    return {
      success: false,
      error: `Hash mismatch: expected ${expectedHash}, got ${hash}`
    };
  }

  return { success: true, data: { hash, verified: true } };
}

/**
 * Проверка, что директория существует и доступна для записи
 */
export function ensureDirectory(path: string): FileOperationResult {
  const resolvedPath = resolve(path);

  try {
    if (!existsSync(resolvedPath)) {
      mkdirSync(resolvedPath, { recursive: true });
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Получение размера файла в байтах
 */
export function getFileSize(filePath: string): number | null {
  const resolvedPath = resolve(filePath);

  try {
    if (!existsSync(resolvedPath)) return null;
    const stats = require("fs").statSync(resolvedPath);
    return stats.size;
  } catch {
    return null;
  }
}

/**
 * Проверка, что файл не пустой
 */
export function isFileEmpty(filePath: string): boolean {
  const size = getFileSize(filePath);
  return size === null || size === 0;
}

/**
 * Создание директории рекурсивно
 */
export function createDirSafe(path: string): FileOperationResult {
  const resolvedPath = resolve(path);

  try {
    if (!existsSync(resolvedPath)) {
      mkdirSync(resolvedPath, { recursive: true });
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

export default {
  atomicWriteFile,
  readFileSafe,
  readJsonlFile,
  appendJsonlLine,
  verifyFileHash,
  ensureDirectory,
  getFileSize,
  isFileEmpty,
  createDirSafe
};