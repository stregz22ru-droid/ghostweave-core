# Negative Suite — Certification Kit

**Part of:** Certification Kit  
**Version:** 1.0.0  
**Status:** ✅ PASSED  

---

## 1. Purpose

The Negative Suite verifies that the implementation correctly detects and handles error scenarios.

---

## 2. Test Cases

| Test ID | Description | Expected | Result |
|---------|-------------|----------|--------|
| N-01 | Broken hash detection | Error detected | ✅ PASSED |
| N-02 | Invalid parentHash detection | Error detected | ✅ PASSED |
| N-03 | Double genesis detection | Error detected | ✅ PASSED |
| N-04 | Duplicate event ID detection | Error detected | ✅ PASSED |
| N-05 | Broken chain detection | Error detected | ✅ PASSED |
| N-06 | Invalid canonical serialization | Error detected | ✅ PASSED |
| N-07 | Empty chain verification | VALID | ✅ PASSED |
| N-08 | Replay with broken chain | Error detected | ✅ PASSED |
| N-09 | Event with missing required fields | Error detected | ✅ PASSED |
| N-10 | Event with invalid type | Error detected | ✅ PASSED |

---

## 3. Error Detection Matrix

| Error Type | Detected |
|------------|----------|
| Broken hash | ✅ |
| Invalid parentHash | ✅ |
| Double genesis | ✅ |
| Duplicate ID | ✅ |
| Broken chain | ✅ |
| Invalid canonical JSON | ✅ |
| Missing required fields | ✅ |
| Invalid type | ✅ |

---

## 4. Results

| Metric | Result |
|--------|--------|
| Errors Detected | 10/10 |
| False Positives | 0/10 |
| False Negatives | 0/10 |

---

## 5. Conclusion

**Status:** ✅ **PASSED**

The implementation correctly detects all error scenarios.