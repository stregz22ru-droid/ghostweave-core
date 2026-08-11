// GHOSTWEAVE SDK: Replay Core v1.0
// Восстановление доказательной цепочки

import type { Event, EventId, ReplayResult, BrokenLink, VerificationStatus } from "../types/index";
import { genesisHash } from "../utils/crypto";
import { Chain, getChainRange, checkContinuity, getLastEvent } from "./chain";
import { verifyEvent } from "./verification";

export interface ReplayOptions {
  from?: EventId;
  to?: EventId;
  verifyHashes?: boolean;
  skipInvalid?: boolean;
}

export function replayChain(
  chain: Chain,
  options: ReplayOptions = {}
): ReplayResult {
  const { from, to, verifyHashes = true, skipInvalid = false } = options;

  const events = getChainRange(chain, from, to);
  const verifiedChain: Event[] = [];
  const missingEvents: EventId[] = [];
  const brokenLinks: BrokenLink[] = [];
  const warnings: string[] = [];

  let status: VerificationStatus = "VALID";

  if (events.length === 0) {
    return {
      status: "VALID",
      verifiedChain: [],
      verificationReport: {
        totalEvents: 0,
        verified: 0,
        invalid: 0,
        missing: 0
      },
      missingEvents: [],
      brokenLinks: [],
      warnings: ["Chain is empty"]
    };
  }

  const continuity = checkContinuity(chain);
  if (!continuity.valid) {
    brokenLinks.push(...continuity.brokenLinks);
    status = "PARTIAL";
  }

  let verifiedCount = 0;
  let invalidCount = 0;

  for (const event of events) {
    let isValid = true;

    if (verifyHashes) {
      const errors = verifyEvent(event, { checkHash: true });
      if (errors.length > 0) {
        isValid = false;
        invalidCount++;
        warnings.push(`Event ${event.id}: ${errors.map(e => e.message).join(", ")}`);
      }
    }

    if (isValid) {
      verifiedChain.push(event);
      verifiedCount++;
    } else if (!skipInvalid) {
      verifiedChain.push(event);
    }
  }

  if (verifiedChain.length + missingEvents.length < events.length) {
    status = "PARTIAL";
  }

  if (verifiedChain.length > 0) {
    const first = verifiedChain[0];
    if (first.previous_hash !== genesisHash()) {
      warnings.push("First event is not genesis");
      status = "PARTIAL";
    }
  }

  if (!to && verifiedChain.length > 0) {
    const last = getLastEvent(chain);
    if (last && verifiedChain[verifiedChain.length - 1].id !== last.id) {
      warnings.push("Replay did not reach the end of the chain");
      status = "PARTIAL";
    }
  }

  if (status === "VALID" && (brokenLinks.length > 0 || warnings.length > 0)) {
    status = "PARTIAL";
  }

  return {
    status,
    verifiedChain,
    verificationReport: {
      totalEvents: events.length,
      verified: verifiedCount,
      invalid: invalidCount,
      missing: events.length - verifiedChain.length
    },
    missingEvents,
    brokenLinks,
    warnings
  };
}

export function replayToCanonical(
  chain: Chain,
  options: ReplayOptions = {}
): { replay: ReplayResult; canonical: string } {
  const replay = replayChain(chain, options);
  const canonical = JSON.stringify(
    {
      version: "GWP/1.0",
      replayStatus: replay.status,
      verifiedEvents: replay.verifiedChain.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        type: e.type,
        source: e.source,
        previous_hash: e.previous_hash,
        payload: e.payload,
        metadata: e.metadata,
        hash: e.hash
      })),
      report: replay.verificationReport,
      warnings: replay.warnings
    },
    null,
    2
  );

  return { replay, canonical };
}

export function isReplayDeterministic(
  chain: Chain,
  iterations: number = 5
): { deterministic: boolean; results: ReplayResult[] } {
  const results: ReplayResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = replayChain(chain);
    results.push(result);
  }

  const first = results[0];
  let deterministic = true;

  for (let i = 1; i < results.length; i++) {
    const current = results[i];

    if (current.status !== first.status) {
      deterministic = false;
      break;
    }

    if (current.verifiedChain.length !== first.verifiedChain.length) {
      deterministic = false;
      break;
    }

    for (let j = 0; j < first.verifiedChain.length; j++) {
      if (current.verifiedChain[j]?.id !== first.verifiedChain[j]?.id) {
        deterministic = false;
        break;
      }
    }

    if (current.warnings.length !== first.warnings.length) {
      deterministic = false;
      break;
    }
  }

  return { deterministic, results };
}