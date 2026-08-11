# MESSAGE FORMAT SPECIFICATION

This document defines the standard envelope for all messages exchanged between GHOSTWEAVE components, clients, and extensions.

---

## Core Principle

> **"Uniform envelopes, diverse payloads."**

All communication follows a strict envelope structure to ensure routing, tracing, and versioning, regardless of the underlying transport (HTTP, gRPC, WebSocket).

---

## Message Envelope

Every message must be wrapped in a standard envelope:

```typescript
interface MessageEnvelope {
  // Protocol version (e.g., "1.0")
  version: string;

  // Message type identifier
  type: MessageType;

  // Unique identifier for this specific message instance
  messageId: string;

  // Identifier for tracing requests across services
  correlationId: string;

  // ISO 8601 timestamp of message creation
  timestamp: string;

  // The actual payload (structure depends on 'type')
  payload: unknown;

  // Optional: Digital signature of the envelope
  signature?: string;
}

type MessageType = 
  | 'EVENT_INGEST_REQUEST'
  | 'EVENT_INGEST_RESPONSE'
  | 'REPLAY_REQUEST'
  | 'REPLAY_RESPONSE'
  | 'VERIFY_REQUEST'
  | 'VERIFY_RESPONSE'
  | 'ERROR';