
```markdown
# RFC 0003: GHOSTWEAVE NETWORK PROTOCOL

**Status:** Draft  
**Category:** Standards Track  
**Date:** 2026-06-27  

---

## Abstract

This document defines the network protocol for GHOSTWEAVE nodes. It specifies the message envelope, transport bindings (HTTP/REST and gRPC), and standard API endpoints required for node-to-node and client-to-node communication.

## 1. Introduction

While the GHOSTWEAVE Core is a local library, real-world deployments require networked nodes to ingest events from distributed sources and serve verification requests to external auditors. This protocol ensures interoperability between different implementations.

## 2. Message Envelope

All network requests and responses MUST be wrapped in a standard `MessageEnvelope` to facilitate routing, tracing, and versioning.

```json
{
  "version": "1.0",
  "type": "EVENT_INGEST_REQUEST",
  "messageId": "uuid-v7",
  "correlationId": "uuid-v7",
  "timestamp": "2026-06-27T10:00:00Z",
  "payload": { ... }
}
```

### 2.1 Envelope Fields
*   `version`: Protocol version string (e.g., "1.0").
*   `type`: Enum defining the payload structure (e.g., `EVENT_INGEST_REQUEST`, `VERIFY_RESPONSE`).
*   `messageId`: Unique ID for this specific message instance.
*   `correlationId`: ID used to link requests and responses across distributed services.
*   `timestamp`: ISO 8601 UTC timestamp of message creation.
*   `payload`: The actual data payload, structure defined by `type`.

## 3. Transport Bindings

### 3.1 HTTP/REST
The primary transport for public-facing APIs and simple integrations.

*   **Content-Type:** `application/json`
*   **Headers:** 
    *   `X-Message-ID`: Mirrors `messageId` from envelope.
    *   `X-Correlation-ID`: Mirrors `correlationId`.
*   **Status Codes:**
    *   `200 OK`: Success.
    *   `400 Bad Request`: Invalid schema or signature.
    *   `409 Conflict`: Chain broken (parentHash mismatch).
    *   `500 Internal Server Error`: Node failure.

### 3.2 gRPC
Recommended for high-throughput internal communication between microservices.

*   **Schema:** Defined via Protocol Buffers (`.proto`).
*   **Metadata:** `messageId` and `correlationId` passed in gRPC metadata.
*   **Streaming:** Supports server-side streaming for real-time event notification (`SubscribeEvents`).

## 4. Standard API Endpoints

### 4.1 Ingest Event
*   **Path:** `POST /v1/events`
*   **Payload:** `CanonicalEvent` object.
*   **Behavior:** Validates schema, signature, and chain integrity. Appends to local store if valid.

### 4.2 Verify Event
*   **Path:** `GET /v1/events/{eventId}/verify`
*   **Response:** `VerificationResult` object.
*   **Behavior:** Checks chain integrity up to the specified event and verifies cryptographic signatures.

### 4.3 Replay Event
*   **Path:** `POST /v1/events/{eventId}/replay`
*   **Response:** `ReplayResult` object.
*   **Behavior:** Attempts to re-execute the logic using stored evidence. Returns success/failure status.

### 4.4 Get Audit Package
*   **Path:** `GET /v1/audit?start={id}&end={id}`
*   **Response:** Binary stream (ZIP file).
*   **Behavior:** Generates and downloads a standardized Audit Package for the specified range.

## 5. Error Handling

All error responses MUST follow the standard `ErrorMessage` format:

```json
{
  "code": "CHAIN_BROKEN",
  "message": "Parent hash mismatch at event index 402.",
  "details": {
    "expectedHash": "a1b2...",
    "actualHash": "c3d4..."
  }
}
```

### 5.1 Standard Error Codes
*   `INVALID_SCHEMA`: Payload does not match JSON Schema.
*   `INVALID_SIGNATURE`: Cryptographic verification failed.
*   `CHAIN_BROKEN`: Parent hash mismatch detected.
*   `REPLAY_FAILURE`: Reproduced hash does not match stored hash.
*   `NOT_FOUND`: EventID does not exist in the store.

## 6. Security Requirements

### 6.1 Transport Security
All network communication MUST be encrypted using TLS 1.3 or higher.

### 6.2 Node Authentication
For private networks, nodes MUST authenticate each other using mutual TLS (mTLS) or API keys signed by a trusted authority.

### 6.3 Rate Limiting
Nodes SHOULD implement rate limiting on the Ingest API to prevent denial-of-service attacks.

---
**End of RFC 0003**
```