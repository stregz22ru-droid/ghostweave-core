# GHOSTWEAVE Evidence Packages

**Version:** 1.0.0  
**Date:** 2026-06-29  
**Status:** Ready for Architectural Review  

---

## 📌 Overview

This directory contains the **Evidence Packages** for GHOSTWEAVE Core v1.0.

These packages provide independent verification that each component meets the criteria for its official status.

---

## 📁 Package Structure

| Package | Status | Description |
|---------|--------|-------------|
| [SDK](./sdk/README.md) | Candidate | Reference Implementation evidence |
| [HTTP Adapter](./http-adapter/README.md) | Candidate | HTTP Adapter evidence |
| [Certification Kit](./certification-kit/README.md) | In Progress | Certification suite evidence |
| [Cross-Implementation](./cross-implementation/README.md) | In Progress | Cross-implementation compatibility |

---

## 📋 Evidence Criteria

| Component | Criteria | Evidence |
|-----------|----------|----------|
| SDK | Audit Report | `sdk/SDK_AUDIT_REPORT.md` |
| SDK | Public API Stability | `sdk/PUBLIC_API_SPECIFICATION.md` |
| SDK | Compatibility | `sdk/COMPATIBILITY_MATRIX.md` |
| SDK | Cross-Implementation | `sdk/CROSS_IMPLEMENTATION_REPORT.md` |
| HTTP | OpenAPI Spec | `http-adapter/OPENAPI_SPECIFICATION.yaml` |
| HTTP | Protocol Mapping | `http-adapter/ENDPOINT_MAPPING.md` |
| HTTP | Error Model | `http-adapter/ERROR_MODEL.md` |
| HTTP | Version Policy | `http-adapter/VERSION_POLICY.md` |
| HTTP | Compatibility Tests | `http-adapter/COMPATIBILITY_TESTS.md` |
| Certification | All Suites | `certification-kit/*_SUITE.md` |
| Certification | Report | `certification-kit/CERTIFICATION_REPORT.md` |
| Cross-Impl | Compatibility | `cross-implementation/COMPATIBILITY_REPORT.md` |

---

## 🔗 Related Documents

- [SDK Documentation](../../adapters/sdk/README.md)
- [HTTP Adapter Documentation](../../adapters/http/README.md)
- [Certification Kit Documentation](../../tools/certification/README.md)

---

**This evidence package is part of the GHOSTWEAVE Core v1.0 deliverables.**