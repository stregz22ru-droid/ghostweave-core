import { IAnchorProvider, IAnchorRegistry } from '../../core/anchorApi.js';
import { AnchorProof } from '../../core/types.js';
import { logger } from '../../utils/logger.js';

/**
 * Concrete implementation of Anchor Registry.
 * Manages multiple anchor providers and coordinates anchoring operations.
 * 
 * This is the integration point for external ledgers (TSA, Blockchain, SCITT).
 * Core v1.0 provides only the interface - actual providers are implemented separately.
 */
export class AnchorRegistry implements IAnchorRegistry {
  private providers: Map<string, IAnchorProvider> = new Map();

  register(provider: IAnchorProvider): void {
    if (this.providers.has(provider.providerId)) {
      logger.warn(`Provider ${provider.providerId} already registered. Overwriting.`);
    }

    this.providers.set(provider.providerId, provider);
    logger.info(`Anchor provider registered: ${provider.providerId}`);
  }

  get(providerId: string): IAnchorProvider | undefined {
    return this.providers.get(providerId);
  }

  async anchorAll(hash: string): Promise<AnchorProof[]> {
    const proofs: AnchorProof[] = [];
    const errors: Error[] = [];

    // Anchor to all registered providers in parallel
    const anchorPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        const proof = await provider.anchor(hash);
        return { provider, proof, error: null };
      } catch (error) {
        return { provider, proof: null, error };
      }
    });

    const results = await Promise.all(anchorPromises);

    // Collect successful proofs and log errors
    for (const result of results) {
      if (result.proof) {
        proofs.push(result.proof);
        logger.info(`Anchored to ${result.provider.providerId}: ${result.proof.transactionId}`);
      } else if (result.error) {
        errors.push(result.error as Error);
        logger.error(`Failed to anchor to ${result.provider.providerId}: ${result.error}`);
      }
    }

    // If all providers failed, throw an error
    if (proofs.length === 0 && errors.length > 0) {
      throw new Error(
        `All anchor providers failed. Errors: ${errors.map(e => e.message).join('; ')}`
      );
    }

    return proofs;
  }

  /**
   * Verifies a proof against its provider
   */
  async verifyProof(proof: AnchorProof, hash: string): Promise<boolean> {
    const provider = this.providers.get(proof.providerId);

    if (!provider) {
      logger.warn(`Provider ${proof.providerId} not found in registry`);
      return false;
    }

    try {
      return await provider.verify(proof, hash);
    } catch (error) {
      logger.error(`Verification failed for provider ${proof.providerId}: ${error}`);
      return false;
    }
  }

  /**
   * Returns list of all registered provider IDs
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Removes a provider from the registry
   */
  unregister(providerId: string): boolean {
    const removed = this.providers.delete(providerId);
    if (removed) {
      logger.info(`Anchor provider unregistered: ${providerId}`);
    }
    return removed;
  }

  /**
   * Clears all providers (for testing)
   */
  clear(): void {
    this.providers.clear();
    logger.info('Anchor registry cleared');
  }
}