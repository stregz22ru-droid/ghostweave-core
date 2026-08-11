# Cross-Version Suite — Certification Kit

**Part of:** Certification Kit  
**Version:** 1.0.0  
**Status:** ✅ PASSED  

---

## 1. Purpose

The Cross-Version Suite verifies backward compatibility across Protocol versions.

---

## 2. Test Cases

| Test ID | Description | Expected | Result |
|---------|-------------|----------|--------|
| CV-01 | v1 events read by v1 SDK | Compatible | ✅ PASSED |
| CV-02 | v1 events read by v1.1 SDK | Compatible | ✅ PASSED |
| CV-03 | v1.1 events read by v1 SDK (if compatible) | Compatible | ✅ PASSED |
| CV-04 | v1 events read by v2 SDK (breaking) | Incompatible | ✅ PASSED |
| CV-05 | v1 events read by v2 SDK with migration | Compatible | ✅ PASSED |
| CV-06 | v1 events exported in canonical format | Compatible | ✅ PASSED |
| CV-07 | v1.1 events exported in canonical format | Compatible | ✅ PASSED |
| CV-08 | v1 events imported by v1.1 SDK | Compatible | ✅ PASSED |
| CV-09 | v1.1 events imported by v1 SDK (if compatible) | Compatible | ✅ PASSED |
| CV-10 | v2 events rejected by v1 SDK | Rejected | ✅ PASSED |

---

## 3. Version Compatibility Matrix

| Client Version | Server Version | Result |
|----------------|----------------|--------|
| v1 | v1 | ✅ Compatible |
| v1 | v1.1 | ✅ Compatible |
| v1.1 | v1 | ✅ Compatible |
| v1 | v2 | ❌ Incompatible |
| v1.1 | v2 | ❌ Incompatible |
| v2 | v1 | ❌ Incompatible |

---

## 4. Migration Path
