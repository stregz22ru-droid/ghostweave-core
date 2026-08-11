```markdown
---

# HTTP Adapter — Error Model

**Version:** 1.0.0  
**Last Updated:** 2026-06-29  
**Status:** ✅ VERIFIED  

---

## 1. Purpose

This document defines the error model for the HTTP Adapter.

**Principle:** Errors must be consistent, predictable, and mapped to Protocol verification statuses where applicable.

---

## 2. Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message",
  "timestamp": "2026-06-29T12:00:00.000Z",
  "details": {
    "field": "type",
    "value": "invalid",
    "expected": "string"
  }
}
```

---

## 3. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request or validation error |
| `CHAIN_NOT_FOUND` | 404 | Chain does not exist |
| `EVENT_NOT_FOUND` | 404 | Event not found by ID |
| `VERIFICATION_FAILED` | 422 | Chain verification failed |
| `REPLAY_FAILED` | 422 | Replay reconstruction failed |
| `EXPORT_FAILED` | 500 | Export operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 4. Error Scenarios

### 4.1 Invalid Request

**Example:** Missing required field `type`

```json
{
  "success": false,
  "error": "Missing required field: type",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

**HTTP Status:** 400

---

### 4.2 Chain Empty

**Example:** Trying to verify an empty chain

```json
{
  "success": false,
  "error": "Chain is empty. Nothing to verify.",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

**HTTP Status:** 400

---

### 4.3 Event Not Found

**Example:** GET `/api/chain/events/evt_123`

```json
{
  "success": false,
  "error": "Event with ID evt_123 not found",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

**HTTP Status:** 404

---

### 4.4 Verification Failed

**Example:** Chain has broken links or invalid hashes

```json
{
  "success": false,
  "error": "Verification failed: broken_chain",
  "timestamp": "2026-06-29T12:00:00.000Z",
  "details": {
    "status": "INVALID",
    "errors": [
      {
        "index": 5,
        "eventId": "evt_123",
        "type": "broken_chain",
        "message": "Chain broken at index 5"
      }
    ]
  }
}
```

**HTTP Status:** 422

---

### 4.5 Replay Failed

**Example:** Chain cannot be reconstructed

```json
{
  "success": false,
  "error": "Replay failed: chain has missing events",
  "timestamp": "2026-06-29T12:00:00.000Z",
  "details": {
    "status": "PARTIAL",
    "missingEvents": ["evt_123", "evt_456"]
  }
}
```

**HTTP Status:** 422

---

### 4.6 Internal Error

**Example:** Unexpected server error

```json
{
  "success": false,
  "error": "Internal server error",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

**HTTP Status:** 500

---

## 5. Protocol Mapping

| Protocol Status | HTTP Status | Description |
|-----------------|-------------|-------------|
| `VALID` | 200 | Chain is valid |
| `PARTIAL` | 206 | Chain is partially valid |
| `INVALID` | 422 | Chain is invalid |
```