/**
 * GHOSTWEAVE Core - Public API
 * 
 * This is the main entry point for the Core layer.
 * Exports all interfaces, types, and contracts.
 * 
 * Usage:
 *   import { CanonicalEvent, IEventStore } from 'ghostweave-core/core';
 */

// Core Types
export type {
  CanonicalEvent,
  ReplayMetadata,
  VerificationResult,
  ReplayResult,
  IdentityDocument,
  AnchorProof
} from './types.js';

// Core Interfaces
export type { IEventStore } from './eventStore.js';
export type { IVerificationAPI, VerificationFailureReason } from './verificationApi.js';
export type { IReplayEngine } from './replayEngine.js';
export type { IProvenanceEngine, ProvenanceRecord } from './provenanceEngine.js';
export type { IIdentityLayer } from './identityLayer.js';
export type { IAnchorProvider, IAnchorRegistry } from './anchorApi.js';