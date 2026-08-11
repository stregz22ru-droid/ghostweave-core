# GHOSTWEAVE Core v1.0

**Status:** ✅ FROZEN
**Version:** 1.0.0  
**Protocol:** GWP/1.0  
**Profile:** ghostweave-profile-v1.0.0  

---

## Overview

GHOSTWEAVE is a **trust layer** for AI-driven systems — a protocol for creating, linking, verifying, and replaying event chains.

**Key principles:**
- **Replay before Trust** — evidence must be reconstructable before any trust decision.
- **Core defines invariants** — Extensions define behavior.
- **Protocol is implementation independent** — no language-specific details.
- **Payload is opaque** — Core does not interpret payload.

---

## Repository Structure

ghostweave-core/
├── spec/                    # Frozen Core specifications
│   ├── vision/              # Manifest, principles, scope
│   ├── core/                # Core architecture, hash chain, replay
│   ├── protocol/            # API, event schema, message format
│   └── extensions/          # Compliance, explainability, policy
│
├── src/                     # Reference implementation (TypeScript)
│   ├── core/                # Core engines (event store, replay, verification)
│   ├── protocol/            # Canonical JSON, schema validation
│   ├── impl/                # Concrete implementations
│   ├── cli/                 # Command-line interface
│   └── utils/               # Helpers, logger, errors
│
├── tests/                   # Test suites
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── stress/              # Stress tests
│   └── fixtures/            # Test data and fixtures
│
├── rfc/                     # Request for Comments
│   ├── RFC-0001-Core.md
│   ├── RFC-0002-Extensions.md
│   ├── RFC-0003-Protocol.md
│   ├── RFC-0004-Replay-Metadata-Separation.md
│   ├── RFC-0005-Fork-Handling.md
│   └── CHANGELOG.md
│
├── adr/                     # Architectural Decision Records
│   ├── ADR-0001-payload-opaque.md
│   ├── ADR-0002-replay-proof-reconstruction.md
│   └── ... (8 ADRs total)
│
├── docs/                    # Documentation
│   ├── architecture/        # Architecture docs
│   ├── guides/              # Developer and integration guides
│   └── reference/           # API reference, profiles
│
├── adapters/                # Protocol adapters
│   ├── http/                # HTTP/REST adapter
│   └── sdk/                 # TypeScript SDK
│
├── tools/                   # Project tools
│   ├── audit/               # Audit and certification tools
│   └── certification/       # Certification test suites
│
├── pilots/                  # Pilot implementations
│   ├── compliance/          # Compliance pilot
│   ├── finance/             # Finance pilot
│   ├── medical/             # Medical pilot
│   ├── multi-agent/         # Multi-agent pilot
│   └── reference/           # Reference executable pilot
│
├── project/                 # Project management
│   ├── evidence/            # Evidence packages
│   ├── release-readiness/   # Release checklist and traceability
│   └── reports/             # Roadmap and reports
│
├── docs-site/               # MkDocs documentation site
├── _archive/                # Historical drafts (provenance)
│
├── README.md                # This file
├── CHANGELOG.md             # Version history
├── LICENSE                  # Apache 2.0
└── .gitignore               # Git ignore rules

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

git clone https://github.com/stregz22ru-droid/ghostweave-core.git
cd ghostweave-core
npm install

### Basic Usage

import { EventStore, ReplayEngine } from './src/core';

// Create event store
const store = new EventStore();

// Append event
const event = {
  id: 'evt_001',
  timestamp: Date.now(),
  type: 'user.action',
  source: 'my-app',
  payload: { action: 'login' }
};

await store.append(event);

// Verify chain
const result = await store.verify();
console.log('Chain valid:', result.valid);

---

## Documentation

- **Architecture:** docs/architecture/
- **Developer Guide:** docs/guides/DEVELOPER_GUIDE.md
- **API Reference:** docs/reference/API_REFERENCE.md
- **Protocol RFCs:** rfc/
- **Architectural Decisions:** adr/

---

## License

Apache License 2.0 — see LICENSE file for details.

---

## Status

This repository contains the **Frozen Core v1.0 Baseline** of GHOSTWEAVE.

The Core specification and reference implementation are stable and will not change except for critical security fixes. Future development will occur in separate branches or repositories.

For questions or contributions, please open an issue on GitHub.