# Governance

**Version:** 1.0.0  
**Last Updated:** 2026-06-30  

---

## 1. Purpose

This document defines the governance model for the GHOSTWEAVE project. It describes how decisions are made, who has authority, and how the project evolves over time.

---

## 2. Governance Principles

1. **Protocol is the source of truth.**  
   Implementations may differ. Protocol may not.

2. **Core defines invariants.**  
   Extensions define behavior.

3. **Changes require evidence.**  
   Every architectural claim must be backed by reproducible evidence.

4. **RFC is the change mechanism.**  
   Any change to Core, Protocol, or Profile requires an RFC.

---

## 3. Decision-Making Bodies

### 3.1 Architecture Board

**Role:** Final authority on Core, Protocol, and Profile changes.

**Members:**
- Chief Architect
- Core Maintainers
- External Advisors (as needed)

**Responsibilities:**
- Approve or reject RFCs.
- Define Project Roadmap.
- Resolve architectural disputes.

### 3.2 Core Maintainers

**Role:** Day-to-day maintenance of the codebase.

**Responsibilities:**
- Review and merge PRs.
- Maintain SDK, HTTP Adapter, Certification Kit.
- Ensure code quality and test coverage.

### 3.3 Community Contributors

**Role:** Contribute code, documentation, and feedback.

**Responsibilities:**
- Follow project guidelines.
- Submit PRs and issues.
- Participate in discussions.

---

## 4. Change Management

### 4.1 RFC Process

Any significant change requires an RFC (Request for Comments).

**RFC Types:**
- **Editorial RFC:** Documentation, formatting, examples.
- **Minor RFC:** Backward-compatible changes to Profiles or Extensions.
- **Major RFC:** Changes to Core, Protocol, or Official Profile.

**RFC Process:**
1. **Proposal:** Submit RFC via GitHub Issue with detailed description.
2. **Discussion:** Community reviews and comments (minimum 14 days).
3. **Decision:** Architecture Board approves or rejects.
4. **Implementation:** Approved RFC is implemented.
5. **Documentation:** RFC is archived and documentation updated.

### 4.2 Core Freeze Policy

Once Core is frozen:
- ❌ No new features.
- ❌ No new mandatory fields.
- ❌ No changes to invariants.
- ✅ Editorial fixes allowed.
- ✅ Bug fixes allowed (if non-breaking).

**Changes to Core after freeze require a Major RFC.**

---

## 5. Release Governance

### 5.1 Versioning

- **Major:** Breaking changes to Protocol or Core.
- **Minor:** Backward-compatible additions.
- **Patch:** Backward-compatible bug fixes.

### 5.2 Release Process

1. **Release Candidate:** All tests pass, Certification Kit passes.
2. **External Audit:** Independent audit of all artifacts.
3. **Approval:** Architecture Board approves release.
4. **Tag:** Git tag is created.
5. **Announce:** Release is announced.

---

## 6. Conflict Resolution

### 6.1 Technical Disputes

1. Discussion among Core Maintainers.
2. Escalation to Architecture Board.
3. Final decision by Chief Architect.

### 6.2 Community Disputes

1. Mediation by Code of Conduct team.
2. Escalation to Project Lead.
3. Final decision by Architecture Board.

---

## 7. Code of Conduct

All participants must adhere to the [Code of Conduct](CODE_OF_CONDUCT.md).

Violations will be addressed according to the enforcement guidelines.

---

## 8. Amendments

This governance document may be amended by the Architecture Board.

Amendments must be proposed as an RFC and approved by the Architecture Board.

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-30 | Initial governance document |

---

**This document is part of the GHOSTWEAVE documentation website.**