# GHOSTWEAVE HTTP Adapter

**Status:** ✅ READY  
**Version:** 1.0.0  
**Protocol:** GWP/1.0  
**Profile:** ghostweave-profile-v1.0.0  

---

## 📌 Overview

This is the **HTTP Adapter** for GHOSTWEAVE — a REST API that exposes the Core protocol and SDK functionality over HTTP.

It provides:
- **Chain management** — create, read, clear chain
- **Event operations** — append events, genesis, batch
- **Verification** — check chain integrity
- **Replay** — reconstruct evidence chains
- **Export** — export chain to JSON / Canonical format

**Key principle:** HTTP Adapter is a transport layer. It does NOT extend the Protocol. It is an **Adapter** that provides HTTP access to the existing Core.

---

## 🚀 Quick Start

### 1. Install dependencies

npm install

### 2. Build the adapter

npm run build

### 3. Start the server

npm start

Or with custom port:

npm start -- --port 3311 --host 0.0.0.0

### 4. Test the API

# Health check
curl http://localhost:3311/health

# Create genesis event
curl -X POST http://localhost:3311/api/events/genesis \
  -H "Content-Type: application/json" \
  -d '{"type":"genesis","source":"test"}'

# Append event
curl -X POST http://localhost:3311/api/events \
  -H "Content-Type: application/json" \
  -d '{"type":"user.login","source":"web","payload":{"userId":"123"}}'

# Verify chain
curl -X POST http://localhost:3311/api/verify

# Replay evidence
curl -X POST http://localhost:3311/api/replay

---

## 📁 Structure

http/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Server configuration
│   ├── routes/               # Route definitions
│   │   ├── index.ts
│   │   ├── chain.ts
│   │   ├── events.ts
│   │   ├── verify.ts
│   │   ├── replay.ts
│   │   └── export.ts
│   ├── handlers/             # Request handlers
│   │   ├── chain.ts
│   │   ├── events.ts
│   │   ├── verify.ts
│   │   ├── replay.ts
│   │   └── export.ts
│   ├── middleware/           # Express middleware
│   │   ├── logger.ts
│   │   └── error.ts
│   ├── types/                # Type definitions
│   │   └── index.ts
│   └── utils/                # Utilities
│       └── storage.ts
├── tests/                    # Tests
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── README.md

---

## 📚 API Endpoints

### Chain

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chain/status` | Get chain status |
| GET | `/api/chain/events` | Get all events |
| GET | `/api/chain/events/:id` | Get event by ID |
| DELETE | `/api/chain/clear?confirm=true` | Clear chain |
| GET | `/api/chain/health` | Check service health |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Append an event |
| POST | `/api/events/genesis` | Create genesis event |
| POST | `/api/events/batch` | Batch append events |

### Verify

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verify` | Verify chain integrity |
| GET | `/api/verify/status` | Get verification status |

### Replay

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/replay` | Replay evidence chain |
| GET | `/api/replay/evidence` | Get evidence summary |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/export` | Export chain to JSON |
| GET | `/api/export/download` | Download exported chain |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GW_HTTP_PORT` | Port to listen on | `3311` |
| `GW_HTTP_HOST` | Host to bind to | `127.0.0.1` |
| `GW_HTTP_DATA_DIR` | Data directory | `./data` |
| `GW_HTTP_CORS` | Enable CORS | `true` |
| `GW_HTTP_CORS_ORIGINS` | Allowed origins | (all) |
| `GW_HTTP_AUTH` | Enable authentication | `false` |
| `GW_HTTP_AUTH_TOKEN` | Auth token | (none) |
| `GW_HTTP_LOGGING` | Enable logging | `true` |
| `GW_HTTP_LOG_LEVEL` | Log level | `info` |

### Command Line

node dist/index.js --port 3311 --host 0.0.0.0 --data-dir ./my-data

---

## 🧪 Testing

# Run tests
npm test

---

## 📄 License

MIT

---

## 🔗 Related Documents

- [SDK Documentation](../sdk/README.md)
- [Developer Guide](../../docs/guides/DEVELOPER_GUIDE.md)
- [API Reference](../../docs/reference/API_REFERENCE.md)

---

**This HTTP Adapter is part of the GHOSTWEAVE Core v1.0 ecosystem.**