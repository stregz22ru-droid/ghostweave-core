```markdown
# HTTP Adapter — Version Negotiation Policy

**Version:** 1.0.0  
**Last Updated:** 2026-06-29  
**Status:** ✅ VERIFIED  

---

## 1. Purpose

This document defines the version negotiation policy for the HTTP Adapter.

**Principle:** HTTP Adapter must support version negotiation to ensure backward compatibility and smooth upgrades.

---

## 2. Versioning Scheme

### 2.1 API Version

```text
/api/v{MAJOR}
```

- `MAJOR` — breaking changes to API compatibility
- No `MINOR` or `PATCH` in URL — handled via headers

### 2.2 Current Version

- **Current API Version:** `v1`
- **Protocol Version:** `GWP/1.0`
- **Profile Version:** `ghostweave-profile-v1`

---

## 3. Version Discovery

### 3.1 Headers

| Header | Description |
|--------|-------------|
| `Accept-Version` | Requested API version (e.g., `v1`) |
| `X-Protocol-Version` | Protocol version (e.g., `GWP/1.0`) |
| `X-Profile-Version` | Profile version (e.g., `v1.0.0`) |

### 3.2 Response Headers

| Header | Description |
|--------|-------------|
| `API-Version` | Actual API version used |
| `X-Protocol-Version` | Protocol version used |
| `X-Profile-Version` | Profile version used |

---

## 4. Version Compatibility

| Client Version | Server Version | Result |
|----------------|----------------|--------|
| v1 | v1 | ✅ Compatible |
| v1 | v1.1 | ✅ Compatible (backward-compatible) |
| v1 | v2 | ❌ Breaking change — requires migration |

---

## 5. Version Negotiation Flow

```text
Client Request
       ↓
Check Accept-Version
       ↓
   ┌───────────────┐
   │ Version Match? │
   └───────┬───────┘
           │
    ┌──────┴──────┐
    │             │
   YES            NO
    │             │
    ▼             ▼
 Process     Return 406
 Request     Not Acceptable
```

---

## 6. Error Responses

### 6.1 Version Not Supported

```json
{
  "success": false,
  "error": "API version v2 is not supported. Supported versions: v1",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

**HTTP Status:** 406 Not Acceptable

---

### 6.2 Protocol Version Mismatch

```json
{
  "success": false,
  "error": "Protocol version mismatch. Supported: GWP/1.0",
  "timestamp": "2026-06-29T12:00:00.000Z"
}
```

**HTTP Status:** 400 Bad Request

---

## 7. Default Behavior

| Scenario | Behavior |
|----------|----------|
| No version header | Use latest API version (`v1`) |
| Invalid version | Return 406 |
| Unsupported profile | Return 400 |
| Protocol mismatch | Return 400 |

---

## 8. Validation

| Check | Status |
|-------|--------|
| Version discovery | ✅ |
| Compatibility matrix | ✅ |
| Error handling | ✅ |
| Default behavior | ✅ |
| Header documentation | ✅ |

---

## 9. Conclusion

**Status:** ✅ **VERSION POLICY COMPLETE**

The version negotiation policy ensures backward compatibility and provides clear upgrade paths.
```