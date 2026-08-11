# GHOSTWEAVE Pilot Project

**Status:** ✅ READY
**Version:** 1.0.0
**SDK:** @ghostweave/core-sdk v1.0.0

---

## 📌 Overview

This is the **Pilot Project** for GHOSTWEAVE — a real-world example of using the SDK to build a trust-enabled application.

It demonstrates:

* Creating and managing event chains
* Logging events (user actions, system events)
* Verifying chain integrity
* Exporting chains to Canonical JSON
* Replaying evidence chains

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Build the project

```bash
npm run build
```

### 3. Initialize the chain

```bash
npm start -- init
```

### 4. Log some events

```bash
npm start -- log user.login web-app "User 123 logged in"
npm start -- log user.logout web-app "User 123 logged out"
npm start -- log data.update api "Order 456 updated"
```

### 5. Verify the chain

```bash
npm start -- verify
```

### 6. Export the chain

```bash
npm start -- export
```

### 7. Replay evidence

```bash
npm start -- replay --verbose
```

---

## 📁 Structure

```text
pilot/
├── src/
│   ├── index.ts              # Entry point
│   ├── commands/             # CLI commands
│   │   ├── init.ts
│   │   ├── log.ts
│   │   ├── verify.ts
│   │   ├── export.ts
│   │   └── replay.ts
│   ├── storage/              # Chain storage
│   │   └── chain.ts
│   └── utils/                # Utilities
│       └── logger.ts
├── data/                     # Chain storage (JSONL)
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🧪 Example Session

```bash
$ npm start -- init
🚀 Initializing Pilot Chain...
✅ Chain initialized with genesis event: evt_1782690628241_aa85788b
   Chain length: 1
   Storage: ./data/events.jsonl

$ npm start -- log user.login web-app "User 123 logged in"
📝 Logging event: user.login
✅ Event logged: evt_1782690628241_bb85788c
   Type: user.login
   Source: web-app
   Hash: 02734fe0db2c129a...
   Chain length: 2

$ npm start -- verify
🔍 Verifying chain integrity...
✅ Verification Status: VALID
   Events: 2
   Valid hashes: 2
   Invalid hashes: 0
   Missing parents: 0
✅ Chain is valid and trustworthy.

$ npm start -- export
📦 Exporting chain...
✅ Chain exported to: ./data/export_2026-06-28T12-00-00-000Z.json
   Events: 2
   Status: VALID
   Size: 0.25 KB
```

---

## 📚 Commands Reference

| Command                                        | Description                         |
| ---------------------------------------------- | ----------------------------------- |
| `init`                                         | Initialize chain with genesis event |
| `log <type> <source> <message>`                | Append event                        |
| `verify [--verbose]`                           | Verify integrity                    |
| `export [--canonical]`                         | Export chain                        |
| `replay [--verbose] [--from <id>] [--to <id>]` | Replay chain                        |
| `help`                                         | Show help                           |

---

## 🔧 Development

```bash
# Development mode
npm run dev -- init

# Build
npm run build

# Clean
npm run clean
```

---

## 🔗 Related

* SDK Documentation
* Protocol Specification
* Developer Guide

---

**This pilot project is part of the GHOSTWEAVE Core v1.0 ecosystem.**
