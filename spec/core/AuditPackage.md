# AUDIT PACKAGE SPECIFICATION

The Audit Package is a standardized export format that allows an independent observer to verify the integrity of a sequence of events without accessing the live system.

---

## Core Principle

> **"Verifiability without trust."**

An Audit Package contains everything needed to replay and verify a history segment, except for the private keys of the actors.

---

## Package Structure

```text
AuditPackage/
├── manifest.json       # Metadata: Start/End EventID, Actor list, Timestamp
├── events.jsonl        # Newline-delimited JSON of CanonicalEvents
├── evidence/           # Directory containing raw input/output blobs
│   ├── hash_1.bin
│   └── hash_2.bin
├── identities.json     # Public keys of all Actors involved
└── proofs/             # External anchor proofs (if any)
    └── anchor_proof.json