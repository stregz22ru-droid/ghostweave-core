/**
 * GHOSTWEAVE Core - Reference Implementation
 * 
 * Main entry point. Exports all core interfaces, types, and concrete implementations.
 * 
 * Usage:
 *   import { MemoryEventStore, sha256, CanonicalEvent } from 'ghostweave-core';
 */

// ==========================================
// 1. CORE API (Interfaces & Types)
// ==========================================
export * from './core/index.js';

// ==========================================
// 2. IMPLEMENTATIONS
// ==========================================

// Event Stores
export { MemoryEventStore } from './impl/store/memoryEventStore.js';
export { FileEventStore } from './impl/store/fileEventStore.js';

// Engines
export { VerificationEngine } from './impl/verification/verificationEngine.js';
export { ReplayEngine } from './impl/replay/replayEngine.js';
export { ProvenanceEngine } from './impl/provenance/provenanceEngine.js';

// Identity & Anchoring
export { LocalIdentityRegistry } from './impl/identity/localIdentityRegistry.js';
export { AnchorRegistry } from './impl/anchor/anchorRegistry.js';

// ==========================================
// 3. CRYPTOGRAPHY
// ==========================================
export { sha256 } from './impl/crypto/sha256.js';
export { generateKeyPair, signData, verifySignature } from './impl/crypto/ed25519.js';

// ==========================================
// 4. PROTOCOL
// ==========================================
export { canonicalJson } from './protocol/canonicalJson.js';
export { validateEventSchema, isCanonicalEvent } from './protocol/schema.js';

// ==========================================
// 5. UTILITIES
// ==========================================
export { logger, LogLevel } from './utils/logger.js';
export * from './utils/errors.js';