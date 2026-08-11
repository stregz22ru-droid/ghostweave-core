import { createHash } from 'crypto';

/**
 * Calculates SHA-256 hash of the given input.
 * Synchronous and optimized for hash-chain validation.
 * 
 * @param input - The data to hash (string or Buffer)
 * @returns Hex-encoded SHA-256 hash string (64 lowercase chars)
 */
export function sha256(input: string | Buffer): string {
  const hash = createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}