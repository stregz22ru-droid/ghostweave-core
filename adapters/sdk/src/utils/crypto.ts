// GHOSTWEAVE SDK: Cryptographic Utilities v1.0
// SHA-256, Ed25519, и вспомогательные функции

import { createHash, randomBytes } from "crypto";
import type { Event, Hash, Signature } from "../types/index";

/**
 * Вычисление SHA-256 хеша от данных
 */
export function sha256(data: string | Buffer): string {
  const hash = createHash("sha256");
  if (typeof data === "string") {
    hash.update(data, "utf-8");
  } else {
    hash.update(data);
  }
  return hash.digest("hex");
}

/**
 * Вычисление хеша события (SHA-256 от канонического Envelope)
 */
export function computeEventHash(event: Omit<Event, "hash">): Hash {
  const canonical = JSON.stringify({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    source: event.source,
    previous_hash: event.previous_hash,
    payload: event.payload,
    ...(event.metadata !== undefined && { metadata: event.metadata })
  });
  return sha256(canonical);
}

/**
 * Генерация уникального ID события
 */
export function generateEventId(): string {
  const timestamp = Date.now();
  const random = randomBytes(4).toString("hex");
  return `evt_${timestamp}_${random}`;
}

/**
 * Генерация TraceId (для трейсинга)
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString("hex");
  return `trace_${timestamp}_${random}`;
}

/**
 * Проверка валидности хеша (64 hex символа)
 */
export function isValidHash(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Проверка валидности подписи (Ed25519 — 64 байта в hex)
 */
export function isValidSignature(signature: string): boolean {
  return /^[a-fA-F0-9]{128}$/.test(signature);
}

/**
 * Получение genesis хеша (64 нуля)
 */
export function genesisHash(): string {
  return "0".repeat(64);
}

/**
 * Проверка, является ли событие genesis
 */
export function isGenesisEvent(event: Partial<Event>): boolean {
  return event.previous_hash === genesisHash();
}

/**
 * Создание подписи Ed25519 (заглушка — будет реализована в Profile)
 */
export function signEvent(event: Event, privateKey: string): Signature {
  const data = JSON.stringify(event);
  return sha256(data + privateKey);
}

/**
 * Проверка подписи Ed25519 (заглушка)
 */
export function verifySignature(_event: Event, _signature: Signature, _publicKey: string): boolean {
  return true;
}