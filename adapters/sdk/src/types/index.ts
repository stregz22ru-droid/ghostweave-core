// GHOSTWEAVE SDK: Type Definitions v1.0
// Все типы данных для работы с Core

/**
 * Основные типы событий и цепочек
 */

export type TraceId = string;
export type WorkspaceId = string;
export type EventId = string;
export type Hash = string;
export type Signature = string;
export type Timestamp = number; // Unix epoch milliseconds

export enum RuntimeMode {
  BOOTSTRAP = "bootstrap",
  NORMAL = "normal",
  DEGRADED = "degraded",
  OFFLINE = "offline",
  SAFE = "safe"
}

export enum TrustLevel {
  NONE = "none",
  BASIC = "basic",
  VERIFIED = "verified",
  HIGH = "high"
}

/**
 * Event = Envelope + Payload
 * 
 * Используем интерфейс вместо type, чтобы избежать конфликта с DOM Event
 */
export interface Event {
  // Envelope (Core-defined)
  id: EventId;
  timestamp: Timestamp;
  type: string;
  source: string;
  previous_hash: Hash; // "0".repeat(64) for genesis
  payload: unknown; // Opaque
  metadata?: Record<string, unknown>;
  hash: Hash; // SHA-256 of canonical Envelope

  // Profile-defined (optional)
  signature?: Signature;
  anchor?: Anchor;
}

export interface Envelope {
  version: string; // e.g., "GWP/1.0"
  profile: string; // e.g., "ghostweave-profile-v1"
  identity: Identity;
  integrity: Integrity;
  provenance: Provenance;
  temporal: Temporal;
  payloadHash: Hash;
  payloadType: string;
  payloadLength?: number;
}

export interface Identity {
  provider: string;
  id: string;
  type: string; // "did", "oidc", "x509", etc.
  metadata?: Record<string, unknown>;
}

export interface Integrity {
  hash: Hash;
  algorithm: string; // e.g., "SHA-256"
  signature?: Signature;
  publicKey?: string;
}

export interface Provenance {
  previous_hash: Hash;
  genesis_id: EventId;
}

export interface Temporal {
  timestamp: Timestamp;
  sequence?: number;
}

export interface Anchor {
  provider: string;
  receipt: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

/**
 * Profile
 */

export interface Profile {
  id: string;
  version: string;
  algorithms: ProfileAlgorithms;
  identity: ProfileIdentity;
  anchor: ProfileAnchor;
}

export interface ProfileAlgorithms {
  hash: string;
  canonicalization: string;
  signature: string;
}

export interface ProfileIdentity {
  provider: string;
  mechanism: string;
}

export interface ProfileAnchor {
  provider: string | null;
  mechanism: string | null;
}

/**
 * Verification & Replay
 */

export type VerificationStatus = "VALID" | "INVALID" | "PARTIAL";

export interface VerificationResult {
  status: VerificationStatus;
  errors: VerificationError[];
  warnings: string[];
  stats: {
    totalEvents: number;
    validHashes: number;
    invalidHashes: number;
    missingParents: number;
  };
}

export interface VerificationError {
  index: number;
  eventId: EventId;
  type: VerificationErrorType;
  message: string;
  expected?: string;
  actual?: string;
}

export type VerificationErrorType =
  | "hash_mismatch"
  | "broken_chain"
  | "parent_not_found"
  | "malformed"
  | "invalid_genesis"
  | "unknown_profile"
  | "version_mismatch"
  | "invalid_signature";

export interface ReplayResult {
  status: VerificationStatus;
  verifiedChain: Event[];
  verificationReport: {
    totalEvents: number;
    verified: number;
    invalid: number;
    missing: number;
  };
  missingEvents: EventId[];
  brokenLinks: BrokenLink[];
  warnings: string[];
}

export interface BrokenLink {
  index: number;
  expected: Hash;
  actual: Hash;
}

/**
 * Extensions
 */

export interface Extension {
  name: string;
  version: string;
  requiredCapabilities: string[];
  analyze?: (chain: Event[]) => unknown;
  visualize?: (chain: Event[]) => string;
  report?: (chain: Event[]) => unknown;
}

/**
 * Storage Adapters
 */

export interface EventStorage {
  append(event: Event): Promise<void>;
  get(id: EventId): Promise<Event | null>;
  getAll(): Promise<Event[]>;
  getLast(): Promise<Event | null>;
  getFirstEventId(): Promise<EventId | null>;
  getRange(from?: EventId, to?: EventId): Promise<Event[]>;
  verify(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }>;
}

/**
 * Identity & Anchor Providers
 */

export interface IdentityProvider {
  verifyIdentity(identity: Identity): Promise<boolean>;
  signEvent(event: Event): Promise<Signature>;
}

export interface AnchorProvider {
  anchor(event: Event): Promise<Anchor>;
}

/**
 * Exports
 */

export interface ExportOptions {
  includeMetadata?: boolean;
  includeSignatures?: boolean;
  includeProfile?: boolean;
}

export interface ExportPackage {
  version: string;
  profile: string;
  generatedAt: string;
  eventCount: number;
  events: Event[];
  metadata?: Record<string, unknown>;
}

/**
 * Chain Operations
 */

export interface AppendResult {
  success: boolean;
  event?: Event;
  error?: string;
  hash?: Hash;
  chainLength?: number;
}

export interface ContinuityResult {
  valid: boolean;
  brokenLinks: BrokenLink[];
}