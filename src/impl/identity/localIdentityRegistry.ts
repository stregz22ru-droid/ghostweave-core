import { IIdentityLayer } from '../../core/identityLayer.js';
import { IdentityDocument } from '../../core/types.js';
import { IdentityResolutionError } from '../../utils/errors.js';
import { verifySignature as ed25519Verify } from '../crypto/ed25519.js';

/**
 * Local in-memory implementation of Identity Layer.
 * Suitable for single-node deployments and testing.
 * For production, replace with database-backed or DID-based implementation.
 */
export class LocalIdentityRegistry implements IIdentityLayer {
  private identities: Map<string, IdentityDocument> = new Map();
  private revokedActors: Set<string> = new Set();

  async resolve(actorId: string): Promise<IdentityDocument> {
    // Check if revoked
    if (this.revokedActors.has(actorId)) {
      throw new IdentityResolutionError(`Actor ${actorId} has been revoked`);
    }

    const doc = this.identities.get(actorId);
    if (!doc) {
      throw new IdentityResolutionError(actorId);
    }

    // Check expiration
    if (doc.validTo) {
      const now = new Date();
      const validTo = new Date(doc.validTo);
      if (now > validTo) {
        throw new IdentityResolutionError(`Actor ${actorId} identity has expired`);
      }
    }

    return doc;
  }

  async register(
    actorId: string,
    publicKey: string,
    algorithm: string
  ): Promise<IdentityDocument> {
    const doc: IdentityDocument = {
      actorId,
      publicKey,
      algorithm,
      validFrom: new Date().toISOString(),
    };

    this.identities.set(actorId, doc);
    return doc;
  }

  async verifySignature(
    actorId: string,
    data: string | Buffer,
    signature: string
  ): Promise<boolean> {
    try {
      const doc = await this.resolve(actorId);
      
      if (doc.algorithm !== 'Ed25519') {
        throw new Error(`Unsupported algorithm: ${doc.algorithm}`);
      }

      return ed25519Verify(data, signature, doc.publicKey);
    } catch (error) {
      // If identity resolution fails, signature is invalid
      return false;
    }
  }

  async revoke(actorId: string): Promise<void> {
    this.revokedActors.add(actorId);
  }

  /**
   * Checks if an actor exists (without checking revocation or expiration)
   */
  exists(actorId: string): boolean {
    return this.identities.has(actorId);
  }

  /**
   * Returns all registered actor IDs
   */
  listActors(): string[] {
    return Array.from(this.identities.keys());
  }
}