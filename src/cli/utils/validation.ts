// GHOSTWEAVE CLI: Validation Utilities v1.0
// Валидация входных данных, путей, событий и конфигурации.

import { existsSync, statSync } from "fs";
import { resolve } from "path";

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Проверка, что путь существует и является директорией
 */
export function validateDirectory(path: string, allowRelative: boolean = true): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const resolvedPath = allowRelative ? resolve(path) : path;

  if (!existsSync(resolvedPath)) {
    errors.push({
      field: "path",
      message: `Directory does not exist: ${resolvedPath}`,
      value: path
    });
  } else {
    const stats = statSync(resolvedPath);
    if (!stats.isDirectory()) {
      errors.push({
        field: "path",
        message: `Path is not a directory: ${resolvedPath}`,
        value: path
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Проверка, что путь существует и является файлом
 */
export function validateFile(path: string, allowRelative: boolean = true): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const resolvedPath = allowRelative ? resolve(path) : path;

  if (!existsSync(resolvedPath)) {
    errors.push({
      field: "path",
      message: `File does not exist: ${resolvedPath}`,
      value: path
    });
  } else {
    const stats = statSync(resolvedPath);
    if (!stats.isFile()) {
      errors.push({
        field: "path",
        message: `Path is not a file: ${resolvedPath}`,
        value: path
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Проверка, что строка не пустая
 */
export function validateNonEmpty(value: string, field: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!value || value.trim() === "") {
    errors.push({
      field,
      message: `${field} cannot be empty`,
      value
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Проверка, что значение является валидным hex-хешем (SHA-256)
 */
export function validateHash(value: string, field: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const hexPattern = /^[a-fA-F0-9]{64}$/;

  if (!hexPattern.test(value)) {
    errors.push({
      field,
      message: `${field} must be a valid SHA-256 hash (64 hex characters)`,
      value
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Проверка, что значение является валидным TraceId
 */
export function validateTraceId(value: string, field: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const tracePattern = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

  if (!tracePattern.test(value)) {
    warnings.push({
      field,
      message: `${field} should be a valid UUID format (for compatibility)`,
      value
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Проверка семантической версии
 */
export function validateSemver(value: string, field: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const semverPattern = /^(\d+)\.(\d+)\.(\d+)$/;

  if (!semverPattern.test(value)) {
    errors.push({
      field,
      message: `${field} must be a valid semantic version (X.Y.Z)`,
      value
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Комбинированная валидация — агрегирует результаты нескольких проверок
 */
export function combineResults(results: ValidationResult[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const result of results) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Форматирование ошибок для вывода
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) return "";

  const lines: string[] = [];

  for (const error of result.errors) {
    lines.push(`  ❌ ${error.field}: ${error.message}`);
  }

  for (const warning of result.warnings) {
    lines.push(`  ⚠️ ${warning.field}: ${warning.message}`);
  }

  return lines.join("\n");
}

/**
 * Форматирование результата валидации для вывода в CLI
 */
export function formatValidationResult(result: ValidationResult): string {
  const errors = result.errors.length;
  const warnings = result.warnings.length;

  if (errors === 0 && warnings === 0) return "✅ All checks passed";

  const parts: string[] = [];
  if (errors > 0) parts.push(`${errors} error(s)`);
  if (warnings > 0) parts.push(`${warnings} warning(s)`);

  const status = errors === 0 ? "⚠️" : "❌";
  return `${status} ${parts.join(", ")}`;
}

export default {
  validateDirectory,
  validateFile,
  validateNonEmpty,
  validateHash,
  validateTraceId,
  validateSemver,
  combineResults,
  formatValidationErrors,
  formatValidationResult
};