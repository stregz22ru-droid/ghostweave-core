import { IdentityDocument } from './types.js';

/**
 * Abstract interface for the Identity Layer.
 * Manages actor identities and cryptographic key resolution.
 */
export interface IIdentityLayer {
  /**
   * Resolves an ActorID to its current identity document.
   * 
   * @param actorId - The unique identifier of the actor.
   * @returns IdentityDocument containing public key and metadata.
   * @throws IdentityResolutionError if actor not found or key expired.
   */
  resolve(actorId: string): Promise<IdentityDocument>;

  /**
   * Registers a new actor identity.
   * 
   * @param actorId - The unique identifier to register.
   * @param publicKey - Base64url-encoded public key.
   * @param algorithm - Cryptographic algorithm (e.g., "Ed25519").
   * @returns The created IdentityDocument.
   */
  register(
    actorId: string,
    publicKey: string,
    algorithm: string
  ): Promise<IdentityDocument>;

  /**
   * Verifies a signature against an actor's public key.
   * 
   * @param actorId - The actor whose key to use.
   * @param data - The data that was signed.
   * @param signature - The signature to verify.
   * @returns true if signature is valid, false otherwise.
   */
  verifySignature(
    actorId: string,
    data: string | Buffer,
    signature: string
  ): Promise<boolean>;

  /**
   * Revokes an actor's identity (marks as invalid for future use).
   * Historical events signed by this actor remain valid.
   * 
   * @param actorId - The actor to revoke.
   */
  revoke(actorId: string): Promise<void>;
}