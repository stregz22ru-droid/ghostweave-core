# GHOSTWEAVE API Reference

**Version:** 1.0
**Status:** DRAFT
**Last Updated:** 2026-06-28

---

## 1. Introduction

This document provides a **reference** for the GHOSTWEAVE Core API.

It covers:

* Core interfaces
* Event operations
* Verification
* Replay
* Profile management
* Extension interfaces

**Note:** This is a protocol-level API reference. Language-specific bindings may vary.

---

## 2. Core Interfaces

### 2.1 Event

```typescript
interface Event {
  // Envelope (Core-defined)
  id: string;                 // MUST be unique
  timestamp: number;          // Unix epoch milliseconds
  type: string;               // Event type
  source: string;             // Event source
  previous_hash: string;      // SHA-256 of previous event (or "0".repeat(64) for genesis)
  payload: unknown;           // Opaque payload
  metadata?: Record<string, unknown>;  // Optional metadata
  hash: string;               // SHA-256 of canonical Envelope

  // Optional (Profile-defined)
  signature?: string;         // Ed25519 signature
  anchor?: Anchor;            // External attestation
}
```

### 2.2 Envelope

```typescript
interface Envelope {
  version: string;            // Protocol version (e.g., "GWP/1.0")
  profile: string;            // Profile identifier
  identity: Identity;         // Identity information
  integrity: Integrity;       // Hash/signature
  provenance: Provenance;     // Reference to predecessor
  temporal: Temporal;         // Timestamp/sequence
  payloadHash: string;        // Hash of opaque payload
  payloadType: string;        // Payload format identifier
  payloadLength?: number;     // Payload size in bytes (optional)
}
```

### 2.3 Identity

```typescript
interface Identity {
  provider: string;           // Identity provider identifier
  id: string;                 // Identity identifier
  type: string;               // Identity type (e.g., "did", "oidc")
  metadata?: Record<string, unknown>;  // Additional identity data
}
```

### 2.4 Integrity

```typescript
interface Integrity {
  hash: string;               // SHA-256 hash
  algorithm: string;          // Hash algorithm
  signature?: string;         // Ed25519 signature
  publicKey?: string;         // Public key (if needed)
}
```

### 2.5 Provenance

```typescript
interface Provenance {
  previous_hash: string;      // Hash of parent event
  genesis_id: string;         // ID of genesis event
}
```

### 2.6 Temporal

```typescript
interface Temporal {
  timestamp: number;          // Unix epoch milliseconds
  sequence?: number;          // Sequence number (if ordering is maintained)
}
```

---

## 3. Chain Operations

### 3.1 Append Event

```typescript
function appendEvent(chain: Event[], event: Event): AppendResult;

interface AppendResult {
  success: boolean;
  event?: Event;
  error?: string;
  hash?: string;
  chainLength?: number;
}
```

**Example:**

```typescript
const result = appendEvent(chain, newEvent);

if (result.success) {
  console.log(`Event appended: ${result.event.id}`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

### 3.2 Get Last Event

```typescript
function getLastEvent(chain: Event[]): Event | null;
```

**Example:**

```typescript
const last = getLastEvent(chain);
console.log(`Last event: ${last?.id}`);
```

### 3.3 Get Chain Length

```typescript
function getChainLength(chain: Event[]): number;
```

**Example:**

```typescript
const length = getChainLength(chain);
console.log(`Chain length: ${length}`);
```

---

## 4. Verification API

### 4.1 Verify Chain

```typescript
function verifyChain(chain: Event[]): VerificationResult;

interface VerificationResult {
  status: "VALID" | "INVALID" | "PARTIAL";
  errors: VerificationError[];
  warnings: string[];
  stats: {
    totalEvents: number;
    validHashes: number;
    invalidHashes: number;
    missingParents: number;
  };
}
```

**Example:**

```typescript
const result = verifyChain(chain);

if (result.status === "VALID") {
  console.log("✅ Chain is valid");
} else {
  console.error("❌ Chain invalid:", result.errors);
}
```

### 4.2 Verify Event

```typescript
function verifyEvent(event: Event, chain: Event[]): VerificationResult;
```

**Example:**

```typescript
const result = verifyEvent(event, chain);

if (result.status === "VALID") {
  console.log("✅ Event is valid");
}
```

---

## 5. Replay API

### 5.1 Replay Chain

```typescript
function replayChain(chain: Event[]): ReplayResult;

interface ReplayResult {
  status: "VALID" | "INVALID" | "PARTIAL";
  verifiedChain: Event[];
  verificationReport: {
    totalEvents: number;
    verified: number;
    invalid: number;
    missing: number;
  };
  missingEvents: string[];
  brokenLinks: {
    index: number;
    expected: string;
    actual: string;
  }[];
  warnings: string[];
}
```

**Example:**

```typescript
const result = replayChain(chain);

console.log(`Replay: ${result.verifiedChain.length} events`);
```

### 5.2 Replay Subset

```typescript
function replaySubset(
  chain: Event[],
  from: string,
  to: string
): ReplayResult;
```

**Example:**

```typescript
const result = replaySubset(chain, "evt_001", "evt_100");

console.log(`Replay subset: ${result.verifiedChain.length} events`);
```

---

## 6. Profile Management

### 6.1 Get Profile

```typescript
function getProfile(chain: Event[]): Profile | null;

interface Profile {
  id: string;
  version: string;
  algorithms: {
    hash: string;
    canonicalization: string;
    signature: string;
  };
  identity: {
    provider: string;
    mechanism: string;
  };
  anchor: {
    provider: string | null;
    mechanism: string | null;
  };
}
```

**Example:**

```typescript
const profile = getProfile(chain);

console.log(`Profile: ${profile.id} v${profile.version}`);
```

### 6.2 Validate Profile

```typescript
function validateProfile(profile: Profile): ValidationResult;

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

**Example:**

```typescript
const result = validateProfile(profile);

if (!result.valid) {
  console.error("Invalid profile:", result.errors);
}
```

---

## 7. Export API

### 7.1 Export Chain (Canonical JSON)

```typescript
function exportChain(
  chain: Event[],
  format: "canonical" | "pretty"
): string;
```

**Example:**

```typescript
const exported = exportChain(chain, "canonical");

// Write to storage (implementation-specific)
```

### 7.2 Export Package

```typescript
function exportPackage(
  chain: Event[],
  options: ExportOptions
): ExportPackage;

interface ExportOptions {
  includeMetadata: boolean;
  includeSignatures: boolean;
  includeProfile: boolean;
}

interface ExportPackage {
  version: string;
  profile: string;
  generatedAt: string;
  eventCount: number;
  events: Event[];
  metadata?: Record<string, unknown>;
}
```

**Example:**

```typescript
const pkg = exportPackage(chain, {
  includeMetadata: true
});

console.log(`Exported ${pkg.eventCount} events`);
```

---

## 8. Extension API

### 8.1 Register Extension

```typescript
function registerExtension(extension: Extension): void;

interface Extension {
  name: string;
  version: string;
  required_capabilities: string[];
  analyze?: (chain: Event[]) => unknown;
  visualize?: (chain: Event[]) => string;
  report?: (chain: Event[]) => unknown;
}
```

**Example:**

```typescript
registerExtension({
  name: "ConflictResolver",
  version: "1.0.0",
  required_capabilities: [
    "event.read",
    "event.verify"
  ],
  analyze: (chain) => {
    // Analyze conflicts
    return {
      conflicts: []
    };
  }
});
```

### 8.2 Get Extension

```typescript
function getExtension(name: string): Extension | null;
```

**Example:**

```typescript
const ext = getExtension("ConflictResolver");

if (ext) {
  console.log(`Found extension: ${ext.name} v${ext.version}`);
}
```

---

## 9. Utility APIs

### 9.1 Generate ID

```typescript
function generateId(): string;
```

**Example:**

```typescript
const id = generateId();

console.log(`Generated ID: ${id}`);
```

### 9.2 Compute Hash

```typescript
function computeHash(
  event: Event,
  profile: Profile
): string;
```

**Example:**

```typescript
const hash = computeHash(newEvent, profile);

console.log(`Hash: ${hash}`);
```

### 9.3 Validate Genesis

```typescript
function isGenesis(event: Event): boolean;
```

**Example:**

```typescript
if (isGenesis(event)) {
  console.log("This is the genesis event");
}
```

### 9.4 Validate Chain Continuity

```typescript
function validateContinuity(
  chain: Event[]
): ContinuityResult;

interface ContinuityResult {
  valid: boolean;
  brokenLinks: {
    index: number;
    expected: string;
    actual: string;
  }[];
}
```

**Example:**

```typescript
const result = validateContinuity(chain);

if (!result.valid) {
  console.error("Chain broken at:", result.brokenLinks);
}
```

---

## 10. Error Codes

| Code   | Description                  |
| ------ | ---------------------------- |
| `E001` | Invalid event structure      |
| `E002` | Hash mismatch                |
| `E003` | Chain broken                 |
| `E004` | Parent not found             |
| `E005` | Invalid genesis              |
| `E006` | Unknown profile              |
| `E007` | Version mismatch             |
| `E008` | Invalid signature            |
| `E009` | Identity verification failed |
| `E010` | Anchor verification failed   |

---

## 11. Example Usage

### 11.1 Complete Workflow

```typescript
// 1. Create genesis event
const genesis = createEvent({
  type: "genesis",
  source: "my-app",
  previous_hash: "0".repeat(64),
  payload: {
    message: "Genesis"
  }
});

const chain = [genesis];

// 2. Append events
for (let i = 0; i < 10; i++) {
  const event = createEvent({
    type: "test",
    source: "my-app",
    previous_hash: getLastEvent(chain).hash,
    payload: {
      index: i
    }
  });

  const result = appendEvent(chain, event);

  if (!result.success) {
    console.error("Failed to append:", result.error);
  }
}

// 3. Verify chain
const verifyResult = verifyChain(chain);

if (verifyResult.status === "VALID") {
  console.log("✅ Chain is valid");
}

// 4. Replay chain
const replayResult = replayChain(chain);

console.log(`Replay: ${replayResult.verifiedChain.length} events`);

// 5. Export chain
const exported = exportChain(chain, "canonical");

// Write to storage (implementation-specific)
```

---

## 12. Version History

| Version | Date       | Changes               |
| ------- | ---------- | --------------------- |
| 1.0.0   | 2026-06-28 | Initial API Reference |

---

**This document is part of the GHOSTWEAVE Core v1.0 deliverables.**
