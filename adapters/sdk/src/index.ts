// GHOSTWEAVE SDK: Entry Point v1.0
// Единая точка входа для всех компонентов SDK

// ============================================================================
// Types
// ============================================================================

export * from "./types/index";

// ============================================================================
// Core
// ============================================================================

export {
  createEvent,
  createGenesisEvent,
  cloneEvent,
  validateEvent,
  type CreateEventOptions,
  type EventValidationResult
} from "./core/event";

export {
  createChain,
  appendToChain,
  getLastEvent,
  getEventById,
  getChainLength,
  getChainRange,
  checkContinuity,
  getLastHash,
  clearChain,
  serializeChain,
  deserializeChain,
  type Chain
} from "./core/chain";

export {
  verifyChain,
  verifyEvent,
  verifyProfileCompliance,
  type VerifyOptions
} from "./core/verification";

export {
  replayChain,
  replayToCanonical,
  isReplayDeterministic,
  type ReplayOptions
} from "./core/replay";

// ============================================================================
// Profile
// ============================================================================

export {
  ProfileManager,
  createProfileManager,
  profileManager
} from "./profile/manager";

export {
  officialProfileV1,
  isOfficialProfileV1,
  getProfileRecommendations
} from "./profile/official-v1";

// ============================================================================
// Utils
// ============================================================================

export {
  sha256,
  computeEventHash,
  generateEventId,
  generateTraceId,
  isValidHash,
  isValidSignature,
  genesisHash,
  isGenesisEvent,
  signEvent,
  verifySignature
} from "./utils/crypto";

export {
  canonicalStringify,
  canonicalEnvelope,
  isCanonicalJSON,
  canonicalExport
} from "./utils/canonical";

// ============================================================================
// Version
// ============================================================================

export const VERSION = "1.0.0";
export const PROTOCOL_VERSION = "GWP/1.0";
export const PROFILE_VERSION = "ghostweave-profile-v1.0.0";

export function getSDKInfo() {
  return {
    version: VERSION,
    protocol: PROTOCOL_VERSION,
    profile: PROFILE_VERSION,
    coreStatus: "FROZEN" as const,
    date: "2026-06-28"
  };
}

export default {
  VERSION,
  PROTOCOL_VERSION,
  PROFILE_VERSION,
  getSDKInfo
};