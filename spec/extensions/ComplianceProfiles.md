# COMPLIANCE PROFILES EXTENSION

This extension provides pre-configured sets of policies, retention rules, and audit requirements for specific regulatory frameworks.

---

## Core Principle

> **"Compliance is configuration, not code."**

By separating compliance logic into profiles, the Core remains agnostic while supporting strict industry standards.

---

## Component: ComplianceProfile

A `ComplianceProfile` is a bundle of rules and metadata.

```typescript
interface ComplianceProfile {
  profileId: string;
  name: string; // e.g., "GDPR-EU", "HIPAA-US", "SOX-Finance"
  version: string;
  rules: PolicyRule[];
  retentionPeriod: number; // Days
  requiredAnchors: string[]; // e.g., ["RFC3161", "Blockchain"]
  auditFrequency: string; // e.g., "Monthly"
}