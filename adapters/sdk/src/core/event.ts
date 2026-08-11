// GHOSTWEAVE SDK: Event Core v1.0
// Создание, валидация и управление событиями

import type { Event, EventId, Hash, Timestamp } from "../types/index";
import { computeEventHash, generateEventId, genesisHash, isGenesisEvent, isValidHash } from "../utils/crypto";

export interface CreateEventOptions {
  type: string;
  source: string;
  payload: unknown;
  metadata?: Record<string, unknown>;
  previousHash?: Hash;
  id?: EventId;
  timestamp?: Timestamp;
}

export interface EventValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function createEvent(options: CreateEventOptions): Event {
  const timestamp = options.timestamp ?? Date.now();
  const id = options.id ?? generateEventId();
  const previousHash = options.previousHash ?? genesisHash();

  const event: Omit<Event, "hash"> = {
    id,
    timestamp,
    type: options.type,
    source: options.source,
    previous_hash: previousHash,
    payload: options.payload,
    metadata: options.metadata
  };

  const hash = computeEventHash(event);
  return { ...event, hash };
}

export function createGenesisEvent(
  type: string = "genesis",
  source: string = "system",
  payload: unknown = { message: "Genesis block" },
  metadata?: Record<string, unknown>
): Event {
  return createEvent({
    type,
    source,
    payload,
    metadata,
    previousHash: genesisHash()
  });
}

export function cloneEvent(event: Event): Event {
  return JSON.parse(JSON.stringify(event));
}

export function validateEvent(event: Event): EventValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event.id) errors.push("Event missing 'id'");
  if (!event.timestamp) errors.push("Event missing 'timestamp'");
  if (!event.type) errors.push("Event missing 'type'");
  if (!event.source) errors.push("Event missing 'source'");
  if (event.previous_hash === undefined) errors.push("Event missing 'previous_hash'");
  if (event.payload === undefined) errors.push("Event missing 'payload'");
  if (!event.hash) errors.push("Event missing 'hash'");

  if (event.id && !/^evt_\d+_[a-f0-9]{8}$/.test(event.id)) {
    warnings.push("Event ID format may not be canonical");
  }

  if (event.hash && !isValidHash(event.hash)) {
    errors.push(`Invalid hash format: ${event.hash}`);
  }

  if (event.previous_hash && !isValidHash(event.previous_hash)) {
    errors.push(`Invalid previous_hash format: ${event.previous_hash}`);
  }

  if (event.timestamp && (event.timestamp < 0 || event.timestamp > Date.now() + 86400000)) {
    warnings.push("Timestamp is in the future or too far in the past");
  }

  if (event.hash && event.id && event.timestamp && event.type && event.source) {
    try {
      const { hash, ...eventWithoutHash } = event;
      const recomputed = computeEventHash(eventWithoutHash);
      if (recomputed !== event.hash) {
        errors.push(`Hash mismatch: computed ${recomputed}, stored ${event.hash}`);
      }
    } catch (err) {
      errors.push(`Failed to recompute hash: ${err}`);
    }
  }

  if (isGenesisEvent(event) && event.previous_hash !== genesisHash()) {
    warnings.push("Event is genesis but previous_hash is not all zeros");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}