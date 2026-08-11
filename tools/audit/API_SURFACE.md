# GHOSTWEAVE SDK — Public API Surface v1.0

**Version:** 1.0.0  
**Last Updated:** 2026-06-29  
**Status:** FROZEN (until SDK 2.0)

---

## 📌 Core

### Event

| Method | Description |
|--------|-------------|
| `createEvent(options: CreateEventOptions): Event` | Create a new event |
| `createGenesisEvent(type, source, payload, metadata): Event` | Create a genesis event |
| `cloneEvent(event: Event): Event` | Deep clone an event |
| `validateEvent(event: Event): EventValidationResult` | Validate event structure and hash |

### Chain

| Method | Description |
|--------|-------------|
| `createChain(metadata?): Chain` | Create a new empty chain |
| `appendToChain(chain: Chain, event: Event): AppendResult` | Append an event to the chain |
| `getLastEvent(chain: Chain): Event \| null` | Get the last event in the chain |
| `getEventById(chain: Chain, id: EventId): Event \| null` | Get event by ID |
| `getChainLength(chain: Chain): number` | Get chain length |
| `getChainRange(chain: Chain, from?, to?): Event[]` | Get a range of events |
| `checkContinuity(chain: Chain): ContinuityResult` | Check chain continuity |
| `getLastHash(chain: Chain): Hash` | Get hash of the last event |
| `clearChain(chain: Chain): void` | Clear the chain |
| `serializeChain(chain: Chain): string` | Serialize chain to JSON |
| `deserializeChain(data: string): Chain` | Deserialize chain from JSON |

---

## 🔍 Verification

| Method | Description |
|--------|-------------|
| `verifyChain(chain: Chain, options?: VerifyOptions): VerificationResult` | Verify chain integrity |
| `verifyEvent(event: Event, options?): VerificationError[]` | Verify a single event |
| `verifyProfileCompliance(events: Event[], profile: Profile): VerificationError[]` | Verify events against a profile |

---

## 🔄 Replay

| Method | Description |
|--------|-------------|
| `replayChain(chain: Chain, options?: ReplayOptions): ReplayResult` | Replay evidence chain |
| `replayToCanonical(chain: Chain, options?): { replay: ReplayResult; canonical: string }` | Replay and export to canonical JSON |
| `isReplayDeterministic(chain: Chain, iterations?: number): { deterministic: boolean; results: ReplayResult[] }` | Test replay determinism |

---

## 📋 Profile

| Method | Description |
|--------|-------------|
| `ProfileManager` | Manage profiles |
| `profileManager` | Global profile manager instance |
| `createProfileManager(): ProfileManager` | Create a new profile manager |
| `officialProfileV1` | Official Profile v1.0 |
| `isOfficialProfileV1(profile: Profile): boolean` | Check if profile is official v1.0 |
| `getProfileRecommendations()` | Get recommended profile settings |

---

## 🔐 Utils

### Crypto

| Method | Description |
|--------|-------------|
| `sha256(data: string \| Buffer): string` | SHA-256 hash |
| `computeEventHash(event: Omit<Event, "hash">): Hash` | Compute event hash |
| `generateEventId(): string` | Generate a unique event ID |
| `generateTraceId(): string` | Generate a trace ID |
| `isValidHash(hash: string): boolean` | Validate hash format |
| `isValidSignature(signature: string): boolean` | Validate signature format |
| `genesisHash(): string` | Get genesis hash (64 zeros) |
| `isGenesisEvent(event: Partial<Event>): boolean` | Check if event is genesis |
| `signEvent(event: Event, privateKey: string): Signature` | Sign an event (stub) |
| `verifySignature(event: Event, signature: Signature, publicKey: string): boolean` | Verify signature (stub) |

### Canonical

| Method | Description |
|--------|-------------|
| `canonicalStringify(obj: unknown): string` | RFC 8785 canonical serialization |
| `canonicalEnvelope(event): string` | Canonical serialization of Envelope |
| `isCanonicalJSON(str: string): boolean` | Check if string is canonical JSON |
| `canonicalExport(package_): string` | Canonical serialization of export package |

---

## 📦 Version

| Constant | Value |
|----------|-------|
| `VERSION` | `1.0.0` |
| `PROTOCOL_VERSION` | `GWP/1.0` |
| `PROFILE_VERSION` | `ghostweave-profile-v1.0.0` |
| `getSDKInfo()` | Returns version, protocol, profile, date |

---

## 🔒 Stability Policy

- **FROZEN** — until SDK 2.0
- Changes require a new MINOR version
- Breaking changes require a new MAJOR version
- All changes MUST be documented in CHANGELOG

---

**This document is part of the GHOSTWEAVE SDK Audit deliverables.**