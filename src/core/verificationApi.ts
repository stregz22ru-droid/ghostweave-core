import { VerificationResult } from './types.js';

/**
 * Abstract interface for the Verification API.
 * Provides cryptographic verification of events and chain integrity.
 */
export interface IVerificationAPI {
  /**
   * Performs full verification of a single event.
   * Checks: schema, signature, chain integrity (parent hash).
   * 
   * @param eventId - The UUID of the event to verify.
   * @returns VerificationResult with detailed status and failure reasons.
   */
  verifyEvent(eventId: string): Promise<VerificationResult>;

  /**
   * Verifies the integrity of the entire chain up to a specific event.
   * Checks that all parent hashes are correctly linked.
   * 
   * @param endEventId - The UUID of the event to verify up to.
   * @returns VerificationResult indicating chain validity.
   */
  verifyChain(endEventId: string): Promise<VerificationResult>;

  /**
   * Verifies a batch of events for efficiency.
   * 
   * @param eventIds - Array of event UUIDs to verify.
   * @returns Array of VerificationResults in the same order.
   */
  verifyBatch(eventIds: string[]): Promise<VerificationResult[]>;
}

/**
 * Structured failure reasons for verification
 */
export enum VerificationFailureReason {
  MISSING_EVENT = 'Missing Event',
  MISSING_PARENT = 'Missing Parent',
  INVALID_SIGNATURE = 'Invalid Signature',
  HASH_MISMATCH = 'Hash Mismatch',
  SCHEMA_INVALID = 'Schema Invalid',
  CHAIN_BROKEN = 'Chain Broken'
}