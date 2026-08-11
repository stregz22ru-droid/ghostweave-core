/**
 * Custom error types for GHOSTWEAVE Core
 */

export class ChainBrokenError extends Error {
  constructor(message: string = 'Hash chain integrity violation') {
    super(message);
    this.name = 'ChainBrokenError';
  }
}

export class SignatureInvalidError extends Error {
  constructor(message: string = 'Invalid cryptographic signature') {
    super(message);
    this.name = 'SignatureInvalidError';
  }
}

export class SchemaValidationError extends Error {
  constructor(message: string = 'Event schema validation failed') {
    super(message);
    this.name = 'SchemaValidationError';
  }
}

export class EventNotFoundError extends Error {
  constructor(eventId: string) {
    super(`Event not found: ${eventId}`);
    this.name = 'EventNotFoundError';
  }
}

export class ReplayFailureError extends Error {
  constructor(message: string = 'Event replay verification failed') {
    super(message);
    this.name = 'ReplayFailureError';
  }
}

export class IdentityResolutionError extends Error {
  constructor(actorId: string) {
    super(`Unable to resolve identity: ${actorId}`);
    this.name = 'IdentityResolutionError';
  }
}