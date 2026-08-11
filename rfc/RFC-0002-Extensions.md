# RFC 0002: GHOSTWEAVE EXTENSION FRAMEWORK

**Status:** Draft  
**Category:** Standards Track  
**Date:** 2026-06-27  

---

## Abstract

This document defines the Extension Framework for GHOSTWEAVE. It specifies how third-party or domain-specific logic can be attached to the immutable Core without modifying its internal invariants. The framework ensures that the Core remains minimal and domain-agnostic while allowing for rich, industry-specific functionality.

## 1. Introduction

The GHOSTWEAVE Core provides the "physics" of the trust layer (immutability, hashing, signing). It does not provide the "biology" (domain rules, compliance, human workflows). Extensions bridge this gap.

### 1.1 Design Goals
1.  **Non-Invasive:** Extensions MUST NOT require changes to `01_CORE`.
2.  **Composable:** Multiple extensions can operate on the same event stream simultaneously.
3.  **Sandboxed:** A failure in an extension MUST NOT crash the Core or corrupt the event log.

## 2. Extension Model

### 2.1 Lifecycle
An extension follows a standard lifecycle:
1.  **Registration:** The extension declares its capabilities and required hooks.
2.  **Initialization:** The Core injects dependencies (e.g., read-only access to the Event Store).
3.  **Execution:** The extension processes events asynchronously or synchronously via hooks.
4.  **Termination:** The extension is unloaded, releasing resources.

### 2.2 Hook Points
Extensions can subscribe to specific events in the Core lifecycle:
*   `PRE_INGEST`: Before an event is validated and stored (can reject).
*   `POST_INGEST`: After an event is successfully stored (read-only).
*   `ON_REPLAY`: Triggered when a replay is requested (can modify environment).
*   `ON_VERIFY`: Triggered during verification (can add custom checks).

## 3. Interface Specification

All compliant extensions MUST implement the `IGhostweaveExtension` interface.

```typescript
interface IGhostweaveExtension {
  // Unique identifier for the extension (e.g., "com.ghostweave.ext.conflict-v1")
  id: string;
  
  // Human-readable name
  name: string;

  // Version string (SemVer)
  version: string;

  /**
   * Called once when the extension is loaded.
   * @param context Access to Core services (EventStore, Identity, etc.)
   */
  initialize(context: CoreContext): Promise<void>;

  /**
   * Processes a new event.
   * @param event The CanonicalEvent being processed.
   * @param hook The lifecycle stage (e.g., 'POST_INGEST').
   */
  handleEvent(event: CanonicalEvent, hook: HookType): Promise<void>;

  /**
   * Called when the extension is unloaded.
   */
  shutdown(): Promise<void>;
}