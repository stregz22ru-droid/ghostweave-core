# Changelog

All notable changes to the GHOSTWEAVE v1.0 specification and reference architecture will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-RC1] - 2026-06-27

### Added
- **00_VISION:** Initial Manifest, Principles, and Scope definition.
- **01_CORE:** Complete specification for CanonicalEvents, ReplayEngine, HashChain, Identity, Anchoring, and AuditPackage.
- **02_EXTENSIONS:** Draft specifications for ConflictPreservation, Explainability, PolicyEngine, HumanReview, and ComplianceProfiles.
- **03_PROTOCOL:** EventSchema (JSON), MessageFormat, WCPMapping, Core API interfaces, and DraftProtocol.
- **04_REFERENCE_IMPLEMENTATION:** Architecture, Storage (JSONL), Replay mechanics, and Development Roadmap.
- **05_PILOTS:** Design documents for Finance, Medical, MultiAgent, and Compliance pilots.
- **99_RFC:** Initial drafts for RFC-0001 (Core), RFC-0002 (Extensions), and RFC-0003 (Protocol).

### Changed
- N/A (Initial Release)

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- Defined strict Ed25519 signature requirements for all CanonicalEvents.
- Mandated SHA-256 for all content and chain hashing.
- Established append-only storage invariants to prevent historical tampering.
- Enforced identity binding (no anonymous events).