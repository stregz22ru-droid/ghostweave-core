import { AnchorProof } from './types.js';

/**
 * Abstract interface for an Anchor Provider.
 * Implementations connect to external ledgers to provide
 * proof of existence independent of the node operator.
 * 
 * Concrete providers (Blockchain, TSA, SCITT) are out of scope
 * for Core v1.0 and must be implemented as separate adapters.
 */
export interface IAnchorProvider {
  /** Unique identifier for this provider (e.g., "rfc3161", "ethereum") */
  readonly providerId: string;

  /**
   * Anchors a hash to an external ledger.
   * 
   * @param hash - The SHA-256 hash to anchor.
   * @returns AnchorProof containing the external reference.
   */
  anchor(hash: string): Promise<AnchorProof>;

  /**
   * Verifies an existing anchor proof.
   * 
   * @param proof - The AnchorProof to verify.
   * @param hash - The hash that should be in the proof.
   * @returns true if the proof is valid.
   */
  verify(proof: AnchorProof, hash: string): Promise<boolean>;
}

/**
 * Registry for managing multiple anchor providers.
 * Allows Core to support multiple external ledgers simultaneously.
 */
export interface IAnchorRegistry {
  /**
   * Registers an anchor provider.
   * 
   * @param provider - The IAnchorProvider implementation.
   */
  register(provider: IAnchorProvider): void;

  /**
   * Retrieves a provider by its ID.
   * 
   * @param providerId - The provider identifier.
   * @returns The provider or undefined if not registered.
   */
  get(providerId: string): IAnchorProvider | undefined;

  /**
   * Anchors a hash using all registered providers.
   * 
   * @param hash - The SHA-256 hash to anchor.
   * @returns Array of AnchorProofs from all providers.
   */
  anchorAll(hash: string): Promise<AnchorProof[]>;
}