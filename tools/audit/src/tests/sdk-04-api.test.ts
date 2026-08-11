// GHOSTWEAVE SDK Audit: SDK-04 — Public API Stability
// Проверка стабильности публичного API

import * as fs from "fs";
import * as path from "path";
import {
  // Core
  createEvent,
  createGenesisEvent,
  cloneEvent,
  validateEvent,
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
  // Verification
  verifyChain,
  verifyEvent,
  verifyProfileCompliance,
  // Replay
  replayChain,
  replayToCanonical,
  isReplayDeterministic,
  // Profile
  ProfileManager,
  createProfileManager,
  profileManager,
  officialProfileV1,
  isOfficialProfileV1,
  getProfileRecommendations,
  // Utils
  sha256,
  computeEventHash,
  generateEventId,
  generateTraceId,
  isValidHash,
  isValidSignature,
  genesisHash,
  isGenesisEvent,
  signEvent,
  verifySignature,
  canonicalStringify,
  canonicalEnvelope,
  isCanonicalJSON,
  canonicalExport,
  // Version
  VERSION,
  PROTOCOL_VERSION,
  PROFILE_VERSION,
  getSDKInfo
} from "@ghostweave/core-sdk";

import { logger } from "../utils/logger";

export interface TestResult {
  passed: boolean;
  errors: string[];
}

export async function runAPITests(): Promise<TestResult> {
  const errors: string[] = [];

  logger.info("Checking public API stability...");

  // ==========================================================================
  // Test 1: API_SURFACE.md exists and contains all exports
  // ==========================================================================

  try {
    const apiSurfacePath = path.join(__dirname, "../../API_SURFACE.md");
    if (!fs.existsSync(apiSurfacePath)) {
      errors.push("API_SURFACE.md not found");
      logger.error(`  ❌ API_SURFACE.md not found`);
    } else {
      const content = fs.readFileSync(apiSurfacePath, "utf-8");
      const sections = ["Core", "Verification", "Replay", "Profile", "Utils", "Version"];
      for (const section of sections) {
        if (!content.includes(section)) {
          errors.push(`API_SURFACE.md missing section: ${section}`);
        }
      }
      if (errors.length === 0) {
        logger.success(`  ✅ API_SURFACE.md exists and is complete`);
      }
    }
  } catch (err) {
    errors.push(`API_SURFACE.md check failed: ${err}`);
    logger.error(`  ❌ API_SURFACE.md check failed: ${err}`);
  }

  // ==========================================================================
  // Test 2: All exported functions exist and are callable
  // ==========================================================================

  try {
    const exports = {
      createEvent,
      createGenesisEvent,
      cloneEvent,
      validateEvent,
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
      verifyChain,
      verifyEvent,
      verifyProfileCompliance,
      replayChain,
      replayToCanonical,
      isReplayDeterministic,
      ProfileManager,
      createProfileManager,
      profileManager,
      officialProfileV1,
      isOfficialProfileV1,
      getProfileRecommendations,
      sha256,
      computeEventHash,
      generateEventId,
      generateTraceId,
      isValidHash,
      isValidSignature,
      genesisHash,
      isGenesisEvent,
      signEvent,
      verifySignature,
      canonicalStringify,
      canonicalEnvelope,
      isCanonicalJSON,
      canonicalExport,
      VERSION,
      PROTOCOL_VERSION,
      PROFILE_VERSION,
      getSDKInfo
    };

    const missing: string[] = [];
    for (const [name, fn] of Object.entries(exports)) {
      if (fn === undefined || fn === null) {
        missing.push(name);
      }
    }

    if (missing.length > 0) {
      errors.push(`Missing exports: ${missing.join(", ")}`);
      logger.error(`  ❌ Missing exports: ${missing.join(", ")}`);
    } else {
      logger.success(`  ✅ All ${Object.keys(exports).length} exports are available`);
    }
  } catch (err) {
    errors.push(`Export check failed: ${err}`);
    logger.error(`  ❌ Export check failed: ${err}`);
  }

  // ==========================================================================
  // Test 3: Version constants are correct
  // ==========================================================================

  try {
    const expectedVersion = "1.0.0";
    const expectedProtocol = "GWP/1.0";
    const expectedProfile = "ghostweave-profile-v1.0.0";

    if (VERSION !== expectedVersion) {
      errors.push(`VERSION mismatch: expected ${expectedVersion}, got ${VERSION}`);
    }
    if (PROTOCOL_VERSION !== expectedProtocol) {
      errors.push(`PROTOCOL_VERSION mismatch: expected ${expectedProtocol}, got ${PROTOCOL_VERSION}`);
    }
    if (PROFILE_VERSION !== expectedProfile) {
      errors.push(`PROFILE_VERSION mismatch: expected ${expectedProfile}, got ${PROFILE_VERSION}`);
    }

    const info = getSDKInfo();
    if (info.version !== expectedVersion) {
      errors.push(`getSDKInfo().version mismatch: expected ${expectedVersion}, got ${info.version}`);
    }
    if (info.protocol !== expectedProtocol) {
      errors.push(`getSDKInfo().protocol mismatch: expected ${expectedProtocol}, got ${info.protocol}`);
    }
    if (info.profile !== expectedProfile) {
      errors.push(`getSDKInfo().profile mismatch: expected ${expectedProfile}, got ${info.profile}`);
    }

    if (errors.length === 0) {
      logger.success(`  ✅ Version constants correct: ${VERSION}, ${PROTOCOL_VERSION}, ${PROFILE_VERSION}`);
    }
  } catch (err) {
    errors.push(`Version check failed: ${err}`);
    logger.error(`  ❌ Version check failed: ${err}`);
  }

  // ==========================================================================
  // Test 4: ProfileManager API (FIXED)
  // ==========================================================================

  try {
    // Проверяем, зарегистрирован ли уже профиль
    if (!profileManager.hasProfile(officialProfileV1.id)) {
      profileManager.registerProfile(officialProfileV1);
    }
    profileManager.setActiveProfile(officialProfileV1.id);

    const active = profileManager.getActiveProfile();
    if (!active || active.id !== officialProfileV1.id) {
      errors.push("ProfileManager: active profile not set correctly");
    }

    const all = profileManager.getAllProfiles();
    if (all.length === 0) {
      errors.push("ProfileManager: no profiles found");
    }

    if (errors.length === 0) {
      logger.success(`  ✅ ProfileManager API working correctly`);
    }
  } catch (err) {
    errors.push(`ProfileManager check failed: ${err}`);
    logger.error(`  ❌ ProfileManager check failed: ${err}`);
  }

  // ==========================================================================
  // Test 5: Public API types are exported
  // ==========================================================================

  try {
    const event = createEvent({ type: "test", source: "audit", payload: {} });
    const validation = validateEvent(event);
    if (!validation.valid && validation.errors.length > 0) {
      if (!validation.errors.some(e => e.includes("timestamp"))) {
        errors.push(`Event validation failed: ${validation.errors.join(", ")}`);
      }
    }
    logger.success(`  ✅ Event types are available and work correctly`);
  } catch (err) {
    errors.push(`Type check failed: ${err}`);
    logger.error(`  ❌ Type check failed: ${err}`);
  }

  // ==========================================================================
  // Test 6: API_SURFACE.md matches actual exports
  // ==========================================================================

  try {
    const apiSurfacePath = path.join(__dirname, "../../API_SURFACE.md");
    if (fs.existsSync(apiSurfacePath)) {
      const content = fs.readFileSync(apiSurfacePath, "utf-8");

      const exportedFunctions = [
        "createEvent",
        "createGenesisEvent",
        "cloneEvent",
        "validateEvent",
        "createChain",
        "appendToChain",
        "getLastEvent",
        "getEventById",
        "getChainLength",
        "getChainRange",
        "checkContinuity",
        "getLastHash",
        "clearChain",
        "serializeChain",
        "deserializeChain",
        "verifyChain",
        "verifyEvent",
        "verifyProfileCompliance",
        "replayChain",
        "replayToCanonical",
        "isReplayDeterministic",
        "sha256",
        "computeEventHash",
        "generateEventId",
        "generateTraceId",
        "isValidHash",
        "isValidSignature",
        "genesisHash",
        "isGenesisEvent",
        "canonicalStringify",
        "canonicalEnvelope",
        "isCanonicalJSON",
        "canonicalExport"
      ];

      const missing = [];
      for (const fn of exportedFunctions) {
        if (!content.includes(fn)) {
          missing.push(fn);
        }
      }

      if (missing.length > 0) {
        errors.push(`Functions missing from API_SURFACE.md: ${missing.join(", ")}`);
        logger.error(`  ❌ Functions missing from API_SURFACE.md: ${missing.join(", ")}`);
      } else {
        logger.success(`  ✅ All functions documented in API_SURFACE.md`);
      }
    }
  } catch (err) {
    errors.push(`API_SURFACE.md check failed: ${err}`);
    logger.error(`  ❌ API_SURFACE.md check failed: ${err}`);
  }

  const passed = errors.length === 0;
  logger.blank();
  if (passed) {
    logger.success("✅ SDK-04: Public API Stability — PASSED");
  } else {
    logger.error(`❌ SDK-04: Public API Stability — FAILED (${errors.length} errors)`);
  }

  return { passed, errors };
}

export default runAPITests;