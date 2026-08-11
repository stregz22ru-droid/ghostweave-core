/**
 * GHOSTWEAVE Core Types
 * Based on Canonical Event Specification v1.0
 */

export interface ReplayMetadata {
  processorVersion: string;
  configHash: string;
  dependencyIds: string[];
}

export interface CanonicalEvent {
  eventId: string;
  parentHash: string | null;
  timestamp: string;
  actorId: string;
  contextHash: string;
  decisionHash: string;
  evidence: string[];
  replayMetadata: ReplayMetadata;
  signature: string;
}

export interface VerificationResult {
  isValid: boolean;
  checks: {
    schema: boolean;
    signature: boolean;
    chainIntegrity: boolean;
  };
  failureReason?: string;
}

export interface ReplayResult {
  status: 'SUCCESS' | 'FAILURE';
  reproducedHash?: string;
  originalHash: string;
  reason?: string;
}

export interface IdentityDocument {
  actorId: string;
  publicKey: string;
  algorithm: string;
  validFrom: string;
  validTo?: string;
}

export interface AnchorProof {
  providerId: string;
  transactionId: string;
  timestamp: string;
  merkleRoot?: string;
}