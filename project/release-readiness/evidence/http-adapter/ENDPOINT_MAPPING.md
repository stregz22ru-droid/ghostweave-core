# HTTP Adapter — Endpoint-to-Protocol Mapping

**Version:** 1.0.0  
**Last Updated:** 2026-06-29  
**Status:** ✅ VERIFIED  

---

## 1. Purpose

This document maps each HTTP Adapter endpoint to its corresponding Protocol component.

**Principle:** HTTP Adapter is a transport layer. It does NOT extend the Protocol.

---

## 2. Mapping Table

| Endpoint | Protocol Component | Description |
|----------|-------------------|-------------|
| `GET /health` | N/A | Service health (non-Protocol) |
| `GET /api/chain/status` | Event Model | Chain status |
| `GET /api/chain/events` | Event Model | Get events |
| `GET /api/chain/events/:id` | Event Model | Get event by ID |
| `DELETE /api/chain/clear` | N/A | Administrative (non-Protocol) |
| `GET /api/chain/health` | N/A | Chain storage health |
| `POST /api/events/genesis` | Event Model | Create genesis event |
| `POST /api/events` | Event Model | Append event |
| `POST /api/events/batch` | Event Model | Batch append |
| `POST /api/verify` | Verification | Verify chain integrity |
| `GET /api/verify/status` | Verification | Verification status |
| `POST /api/replay` | Replay | Replay evidence chain |
| `GET /api/replay/evidence` | Replay | Evidence summary |
| `POST /api/export` | Export | Export chain |
| `GET /api/export/download` | Export | Download export |

---

## 3. Protocol Compliance

| Endpoint | Protocol Field | SDK Method | Status |
|----------|---------------|------------|--------|
| `POST /events` | `Event` | `createEvent()` | ✅ |
| `POST /events/genesis` | `Event` | `createGenesisEvent()` | ✅ |
| `POST /events/batch` | `Event[]` | `createEvent()` loop | ✅ |
| `POST /verify` | `VerificationResult` | `verifyChain()` | ✅ |
| `POST /replay` | `ReplayResult` | `replayChain()` | ✅ |
| `POST /export` | `Event[]` | `replayToCanonical()` | ✅ |

---

## 4. Data Flow
