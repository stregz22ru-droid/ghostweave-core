import { CanonicalEvent } from '../core/types.js';
import { SchemaValidationError } from '../utils/errors.js';

/**
 * Validates a CanonicalEvent against the specification.
 * Checks structure, types, and required fields.
 * 
 * @param event - The event to validate.
 * @throws SchemaValidationError if validation fails.
 */
export function validateEventSchema(event: CanonicalEvent): void {
  const errors: string[] = [];

  // Check required fields exist
  if (!event.eventId || typeof event.eventId !== 'string') {
    errors.push('eventId must be a non-empty string');
  }

  if (event.parentHash !== null && typeof event.parentHash !== 'string') {
    errors.push('parentHash must be a string or null');
  }

  if (!event.timestamp || typeof event.timestamp !== 'string') {
    errors.push('timestamp must be a non-empty string');
  }

  if (!event.actorId || typeof event.actorId !== 'string') {
    errors.push('actorId must be a non-empty string');
  }

  if (!event.contextHash || typeof event.contextHash !== 'string') {
    errors.push('contextHash must be a non-empty string');
  }

  if (!event.decisionHash || typeof event.decisionHash !== 'string') {
    errors.push('decisionHash must be a non-empty string');
  }

  if (!Array.isArray(event.evidence)) {
    errors.push('evidence must be an array');
  }

  if (!event.replayMetadata || typeof event.replayMetadata !== 'object') {
    errors.push('replayMetadata must be an object');
  } else {
    // Validate replayMetadata structure
    const rm = event.replayMetadata;
    if (!rm.processorVersion || typeof rm.processorVersion !== 'string') {
      errors.push('replayMetadata.processorVersion must be a string');
    }
    if (!rm.configHash || typeof rm.configHash !== 'string') {
      errors.push('replayMetadata.configHash must be a string');
    }
    if (!Array.isArray(rm.dependencyIds)) {
      errors.push('replayMetadata.dependencyIds must be an array');
    }
  }

  if (!event.signature || typeof event.signature !== 'string') {
    errors.push('signature must be a non-empty string');
  }

  // Validate hash formats (64 hex chars for SHA-256)
  const hashRegex = /^[a-f0-9]{64}$/;
  
  if (event.parentHash !== null && !hashRegex.test(event.parentHash)) {
    errors.push('parentHash must be 64 lowercase hex characters');
  }

  if (!hashRegex.test(event.contextHash)) {
    errors.push('contextHash must be 64 lowercase hex characters');
  }

  if (!hashRegex.test(event.decisionHash)) {
    errors.push('decisionHash must be 64 lowercase hex characters');
  }

  if (Array.isArray(event.evidence)) {
    for (let i = 0; i < event.evidence.length; i++) {
      if (!hashRegex.test(event.evidence[i])) {
        errors.push(`evidence[${i}] must be 64 lowercase hex characters`);
      }
    }
  }

  // Validate timestamp format (ISO 8601)
  if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
    errors.push('timestamp must be valid ISO 8601 format');
  }

  // Throw if any errors found
  if (errors.length > 0) {
    throw new SchemaValidationError(`Schema validation failed: ${errors.join('; ')}`);
  }
}

/**
 * Quick check if an object looks like a CanonicalEvent.
 * Does not throw - returns boolean.
 */
export function isCanonicalEvent(obj: any): obj is CanonicalEvent {
  try {
    validateEventSchema(obj);
    return true;
  } catch {
    return false;
  }
}