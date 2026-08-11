# GHOSTWEAVE Profiles

This directory contains Profile specifications for the GHOSTWEAVE protocol.

A **Profile** is a concrete specification of algorithms, formats, and mechanisms that are selected for a specific use case or environment.

---

## Available Profiles

| Profile | Version | Status | Description |
|---------|---------|--------|-------------|
| [official-profile-v1.md](./official-profile-v1.md) | 1.0.0 | Official | Reference Profile (SHA-256, RFC 8785, Ed25519) |

---

## Creating a New Profile

1. Copy `official-profile-v1.md` as a template.
2. Update the Profile Identity section.
3. Select appropriate algorithms for your use case.
4. Define migration rules.
5. Provide test vectors.
6. Submit for review.

For detailed guidance, see [PROFILE_DESIGN_GUIDE.md](./PROFILE_DESIGN_GUIDE.md).

---

## Profile Lifecycle

| Status | Description |
|--------|-------------|
| **Draft** | Initial design, internal review |
| **Candidate** | Public review, test implementations |
| **Official** | Approved by Architecture Board |
| **Deprecated** | Replaced by newer version |
| **Retired** | No longer supported |

---

## Further Reading

- [PROFILE_DESIGN_GUIDE.md](./PROFILE_DESIGN_GUIDE.md) — How to design a Profile
- [official-profile-v1.md](./official-profile-v1.md) — Reference Profile

---

**This directory is part of the GHOSTWEAVE Core v1.0 deliverables.**