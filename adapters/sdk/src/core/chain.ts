// GHOSTWEAVE SDK: Chain Core v1.0
// Управление цепочкой событий

import type { Event, EventId, Hash, AppendResult, ContinuityResult } from "../types/index";
import { genesisHash } from "../utils/crypto";
import { validateEvent } from "./event";

export interface Chain {
  events: Event[];
  metadata?: {
    id?: string;
    name?: string;
    createdAt?: number;
    updatedAt?: number;
    profile?: string;
  };
}

export function createChain(metadata?: Chain["metadata"]): Chain {
  return {
    events: [],
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...metadata
    }
  };
}

export function appendToChain(chain: Chain, event: Event): AppendResult {
  const validation = validateEvent(event);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid event: ${validation.errors.join(", ")}`
    };
  }

  const lastEvent = getLastEvent(chain);

  if (lastEvent) {
    if (event.previous_hash !== lastEvent.hash) {
      return {
        success: false,
        error: `previous_hash mismatch: expected ${lastEvent.hash}, got ${event.previous_hash}`
      };
    }
  } else {
    if (event.previous_hash !== genesisHash()) {
      return {
        success: false,
        error: "First event in chain must be genesis (previous_hash = 0)"
      };
    }
  }

  if (chain.events.some(e => e.id === event.id)) {
    return {
      success: false,
      error: `Event with ID ${event.id} already exists in chain`
    };
  }

  chain.events.push(event);
  chain.metadata = {
    ...chain.metadata,
    updatedAt: Date.now()
  };

  return {
    success: true,
    event,
    hash: event.hash,
    chainLength: chain.events.length
  };
}

export function getLastEvent(chain: Chain): Event | null {
  return chain.events.length > 0 ? chain.events[chain.events.length - 1] : null;
}

export function getEventById(chain: Chain, id: EventId): Event | null {
  return chain.events.find(e => e.id === id) || null;
}

export function getChainLength(chain: Chain): number {
  return chain.events.length;
}

export function getChainRange(chain: Chain, from?: EventId, to?: EventId): Event[] {
  let start = 0;
  let end = chain.events.length;

  if (from) {
    const found = chain.events.findIndex(e => e.id === from);
    if (found !== -1) start = found;
  }

  if (to) {
    const found = chain.events.findIndex(e => e.id === to);
    if (found !== -1) end = found + 1;
  }

  return chain.events.slice(start, end);
}

export function checkContinuity(chain: Chain): ContinuityResult {
  const brokenLinks: { index: number; expected: string; actual: string }[] = [];

  if (chain.events.length === 0) {
    return { valid: true, brokenLinks: [] };
  }

  const first = chain.events[0];
  if (first.previous_hash !== genesisHash()) {
    brokenLinks.push({
      index: 0,
      expected: genesisHash(),
      actual: first.previous_hash
    });
  }

  for (let i = 1; i < chain.events.length; i++) {
    const current = chain.events[i];
    const previous = chain.events[i - 1];

    if (current.previous_hash !== previous.hash) {
      brokenLinks.push({
        index: i,
        expected: previous.hash,
        actual: current.previous_hash
      });
    }
  }

  return {
    valid: brokenLinks.length === 0,
    brokenLinks
  };
}

export function getLastHash(chain: Chain): Hash {
  const last = getLastEvent(chain);
  return last ? last.hash : genesisHash();
}

export function clearChain(chain: Chain): void {
  chain.events = [];
  chain.metadata = {
    ...chain.metadata,
    updatedAt: Date.now()
  };
}

export function serializeChain(chain: Chain): string {
  return JSON.stringify({
    events: chain.events,
    metadata: chain.metadata
  });
}

export function deserializeChain(data: string): Chain {
  const parsed = JSON.parse(data);
  return {
    events: parsed.events || [],
    metadata: parsed.metadata || {}
  };
}