// GHOSTWEAVE SDK: Canonical Serialization v1.0
// RFC 8785 — JSON Canonicalization Scheme

/**
 * Каноническая сериализация объекта по RFC 8785
 * 
 * Особенности:
 * - Ключи сортируются лексикографически
 * - Без пробелов и лишних символов
 * - null вместо undefined
 * - Строки экранируются по правилам JSON
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "string") {
    return JSON.stringify(obj);
  }

  if (typeof obj === "number") {
    return String(obj);
  }

  if (typeof obj === "boolean") {
    return obj ? "true" : "false";
  }

  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalStringify(item));
    return `[${items.join(",")}]`;
  }

  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys
      .filter(key => (obj as Record<string, unknown>)[key] !== undefined)
      .map(key => {
        const value = (obj as Record<string, unknown>)[key];
        const stringifiedValue = canonicalStringify(value);
        return `${JSON.stringify(key)}:${stringifiedValue}`;
      });
    return `{${pairs.join(",")}}`;
  }

  // Fallback
  return JSON.stringify(obj);
}

/**
 * Каноническая сериализация Envelope (для хеширования)
 * Исключает поле hash и сортирует ключи
 */
export function canonicalEnvelope(event: {
  id: string;
  timestamp: number;
  type: string;
  source: string;
  previous_hash: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
}): string {
  // Копируем объект без поля hash
  const { hash, ...envelopeWithoutHash } = event as any;
  
  // Создаем объект с явным порядком ключей
  const canonicalObj = {
    id: envelopeWithoutHash.id,
    timestamp: envelopeWithoutHash.timestamp,
    type: envelopeWithoutHash.type,
    source: envelopeWithoutHash.source,
    previous_hash: envelopeWithoutHash.previous_hash,
    payload: envelopeWithoutHash.payload,
    ...(envelopeWithoutHash.metadata !== undefined && { metadata: envelopeWithoutHash.metadata })
  };

  return canonicalStringify(canonicalObj);
}

/**
 * Проверка, что строка является каноническим JSON
 */
export function isCanonicalJSON(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    const recanonicalized = canonicalStringify(parsed);
    return str === recanonicalized;
  } catch {
    return false;
  }
}

/**
 * Каноническая сериализация экспортного пакета
 */
export function canonicalExport(package_: {
  version: string;
  profile: string;
  generatedAt: string;
  eventCount: number;
  events: unknown[];
  metadata?: Record<string, unknown>;
}): string {
  // Сортируем ключи и сериализуем
  const sorted = {
    version: package_.version,
    profile: package_.profile,
    generatedAt: package_.generatedAt,
    eventCount: package_.eventCount,
    events: package_.events,
    ...(package_.metadata && { metadata: package_.metadata })
  };
  return canonicalStringify(sorted);
}