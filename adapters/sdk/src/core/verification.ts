// GHOSTWEAVE SDK: Verification Core v1.0
// Проверка целостности и непрерывности цепочки

import type { Event, EventId, VerificationResult, VerificationError, Profile } from "../types/index";
import { computeEventHash, isValidHash, isGenesisEvent } from "../utils/crypto";
import { getChainRange, checkContinuity, Chain } from "./chain";
import { validateEvent } from "./event";

export interface VerifyOptions {
  profile?: Profile;
  from?: EventId;
  to?: EventId;
  checkHashes?: boolean;
  checkContinuity?: boolean;
  checkGenesis?: boolean;
  checkProfile?: boolean;
}

export function verifyChain(
  chain: Chain,
  options: VerifyOptions = {}
): VerificationResult {
  const {
    profile,
    from,
    to,
    checkHashes = true,
    checkContinuity: checkContinuityFlag = true,
    checkGenesis = true,
    checkProfile = true
  } = options;

  const errors: VerificationError[] = [];
  const warnings: string[] = [];
  const events = getChainRange(chain, from, to);

  if (events.length === 0) {
    return {
      status: "VALID",
      errors: [],
      warnings: [],
      stats: {
        totalEvents: 0,
        validHashes: 0,
        invalidHashes: 0,
        missingParents: 0
      }
    };
  }

  let validHashes = 0;
  let invalidHashes = 0;
  let missingParents = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventErrors = verifyEvent(event, {
      profile,
      checkHash: checkHashes,
      checkGenesis: checkGenesis && i === 0 && from === undefined
    });

    for (const err of eventErrors) {
      if (err.type === "parent_not_found") missingParents++;
      if (err.type === "hash_mismatch") invalidHashes++;
      else validHashes++;
      errors.push(err);
    }
  }

  if (checkContinuityFlag) {
    const continuity = checkContinuity(chain);
    if (!continuity.valid) {
      for (const link of continuity.brokenLinks) {
        errors.push({
          index: link.index,
          eventId: events[link.index]?.id || "unknown",
          type: "broken_chain",
          message: `Chain broken at index ${link.index}`,
          expected: link.expected,
          actual: link.actual
        });
      }
    }
  }

  if (checkProfile && profile) {
    const profileErrors = verifyProfileCompliance(events, profile);
    for (const err of profileErrors) {
      errors.push(err);
    }
  }

  let status: "VALID" | "INVALID" | "PARTIAL" = "VALID";
  if (errors.length > 0) {
    status = errors.some(e => e.type === "hash_mismatch" || e.type === "broken_chain")
      ? "INVALID"
      : "PARTIAL";
  }

  return {
    status,
    errors,
    warnings,
    stats: {
      totalEvents: events.length,
      validHashes,
      invalidHashes,
      missingParents
    }
  };
}

export function verifyEvent(
  event: Event,
  options: {
    profile?: Profile;
    checkHash?: boolean;
    checkGenesis?: boolean;
  } = {}
): VerificationError[] {
  const { profile, checkHash = true, checkGenesis = false } = options;
  const errors: VerificationError[] = [];

  const validation = validateEvent(event);
  if (!validation.valid) {
    for (const err of validation.errors) {
      errors.push({
        index: -1,
        eventId: event.id,
        type: "malformed",
        message: err
      });
    }
  }

  if (checkHash && event.id) {
    try {
      const { hash, ...eventWithoutHash } = event;
      const recomputed = computeEventHash(eventWithoutHash);
      if (recomputed !== event.hash) {
        errors.push({
          index: -1,
          eventId: event.id,
          type: "hash_mismatch",
          message: `Hash mismatch for event ${event.id}`,
          expected: recomputed,
          actual: event.hash
        });
      }
    } catch (err) {
      errors.push({
        index: -1,
        eventId: event.id,
        type: "hash_mismatch",
        message: `Failed to recompute hash: ${err}`
      });
    }
  }

  if (checkGenesis) {
    if (!isGenesisEvent(event)) {
      errors.push({
        index: -1,
        eventId: event.id,
        type: "invalid_genesis",
        message: "First event must be genesis"
      });
    }
  }

  if (event.previous_hash && !isValidHash(event.previous_hash)) {
    errors.push({
      index: -1,
      eventId: event.id,
      type: "parent_not_found",
      message: `Invalid previous_hash format: ${event.previous_hash}`
    });
  }

  if (profile && event.hash) {
    if (profile.algorithms?.hash && !event.hash.match(/^[a-fA-F0-9]{64}$/)) {
      errors.push({
        index: -1,
        eventId: event.id,
        type: "unknown_profile",
        message: `Hash does not match profile: ${profile.algorithms.hash}`
      });
    }
  }

  return errors;
}

export function verifyProfileCompliance(
  events: Event[],
  profile: Profile
): VerificationError[] {
  const errors: VerificationError[] = [];

  for (const event of events) {
    if (profile.algorithms?.hash === "SHA-256") {
      if (!event.hash || !isValidHash(event.hash)) {
        errors.push({
          index: -1,
          eventId: event.id,
          type: "unknown_profile",
          message: `Event ${event.id} does not use SHA-256 hash`
        });
      }
    }

    if (profile.algorithms?.signature && !event.signature) {
      errors.push({
        index: -1,
        eventId: event.id,
        type: "invalid_signature",
        message: `Event ${event.id} missing signature (profile requires ${profile.algorithms.signature})`
      });
    }
  }

  return errors;
}