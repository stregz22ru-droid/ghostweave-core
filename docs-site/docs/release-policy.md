# Release Policy

**Version:** 1.0.0  
**Last Updated:** 2026-06-30  

---

## 1. Purpose

This document defines the release policy for GHOSTWEAVE Core, SDK, HTTP Adapter, and related components. It describes versioning, release process, tagging, evidence requirements, and backward compatibility guarantees.

---

## 2. Versioning

GHOSTWEAVE follows **Semantic Versioning (SemVer) 2.0.0**.

**Format:** `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes to Protocol or Core.
- **MINOR:** Backward-compatible additions.
- **PATCH:** Backward-compatible bug fixes.

**Examples:**
- `1.0.0` → Initial stable release.
- `1.1.0` → New backward-compatible feature.
- `1.1.1` → Bug fix.
- `2.0.0` → Breaking change.

---

## 3. Release Process

### 3.1 Release Candidate (RC)

1. All tests pass.
2. Certification Kit passes.
3. Evidence Package is complete.
4. Release Checklist is reviewed.
5. External audit is conducted.

### 3.2 Stable Release

1. Architecture Board approves the release.
2. Git tag is created: `vMAJOR.MINOR.PATCH`.
3. Release notes are prepared.
4. Announcement is made.

---

## 4. Tag Policy

| Tag | Description |
|-----|-------------|
| `v1.0.0` | Stable release |
| `v1.1.0-rc.1` | Release Candidate 1 |
| `v1.1.0-rc.2` | Release Candidate 2 |
| `v1.1.0` | Final stable release |

---

## 5. Evidence Policy

Every release must be accompanied by:
- **Evidence Registry** — all tests and audits have unique IDs.
- **Evidence Packages** — specification + execution evidence.
- **Traceability Matrix** — every RFC requirement mapped to implementation and evidence.
- **Release Checklist** — all criteria passed.

---

## 6. Backward Compatibility

- **Within MAJOR:** Full backward compatibility.
- **Across MAJOR:** Breaking changes documented with migration guide.

**Exceptions:**
- Security fixes may break compatibility if necessary.
- Editorial fixes are allowed without version change.

---

## 7. Release Schedule

| Frequency | Description |
|-----------|-------------|
| **Patch releases** | As needed for critical fixes. |
| **Minor releases** | Quarterly (or as needed). |
| **Major releases** | Annual (or as needed). |

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-31 | Initial stable release |

---

**This document is part of the GHOSTWEAVE documentation website.**