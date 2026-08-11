# EVENT SCHEMA SPECIFICATION

This document defines the wire-format schema for GHOSTWEAVE events. It is the contract for data exchange between Core nodes, Extensions, and external consumers.

---

## Schema Version

**Version:** 1.0  
**Format:** JSON (Canonical)  
**Encoding:** UTF-8  

---

## JSON Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GHOSTWEAVE Canonical Event",
  "type": "object",
  "required": [
    "eventId",
    "parentHash",
    "timestamp",
    "actorId",
    "contextHash",
    "decisionHash",
    "evidence",
    "replayMetadata",
    "signature"
  ],
  "properties": {
    "eventId": {
      "type": "string",
      "format": "uuid",
      "description": "UUID v7 recommended for temporal ordering"
    },
    "parentHash": {
      "type": ["string", "null"],
      "pattern": "^[a-f0-9]{64}$",
      "description": "SHA-256 hash of previous event (null for genesis)"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 UTC timestamp"
    },
    "actorId": {
      "type": "string",
      "description": "DID or UUID of the signing entity"
    },
    "contextHash": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$",
      "description": "SHA-256 of serialized input context"
    },
    "decisionHash": {
      "type": "string",
      "pattern": "^[a-f0-9]{64}$",
      "description": "SHA-256 of serialized decision output"
    },
    "evidence": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-f0-9]{64}$"
      },
      "description": "Array of supporting evidence hashes"
    },
    "replayMetadata": {
      "type": "object",
      "required": ["processorVersion", "configHash", "dependencyIds"],
      "properties": {
        "processorVersion": {
          "type": "string",
          "description": "Semantic version of processing logic"
        },
        "configHash": {
          "type": "string",
          "pattern": "^[a-f0-9]{64}$",
          "description": "SHA-256 of configuration state"
        },
        "dependencyIds": {
          "type": "array",
          "items": { "type": "string" },
          "description": "IDs of upstream dependencies"
        }
      }
    },
    "signature": {
      "type": "string",
      "contentEncoding": "base64url",
      "description": "Ed25519 signature over canonical JSON"
    }
  },
  "additionalProperties": false
}