# Bitrix24 Outbox Bridge

> **Fault-tolerant webhook gateway for guaranteed CRM delivery.**
> Reliably captures leads, contacts, deals, and companies from any external source and persists them to Bitrix24 — even when the CRM API, the queue, or the database is temporarily unavailable.

[![CI](https://github.com/incredible007/bitrix24-outbox-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/incredible007/bitrix24-outbox-bridge/actions/workflows/ci.yml)
[![CD](https://github.com/incredible007/bitrix24-outbox-bridge/actions/workflows/cd.yml/badge.svg)](https://github.com/incredible007/bitrix24-outbox-bridge/actions/workflows/cd.yml)
![Node](https://img.shields.io/badge/Node-20-green)
![NestJS](https://img.shields.io/badge/NestJS-11-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

**Live environment**

| Interface | URL |
|-----------|-----|
| Swagger UI | https://bitrix24-outbox-bridge.andrewpodgola.pro/api-doc |
| Bull Board | https://bitrix24-outbox-bridge.andrewpodgola.pro/queues |
| Health | https://bitrix24-outbox-bridge.andrewpodgola.pro/health |

---

## The Business Problem

Leads and contacts in B2B/B2C businesses have real monetary value. A single missed lead from a paid ad campaign can cost tens or hundreds of dollars. Traditional webhook integrations that call the CRM API inline are fragile:

- The Bitrix24 API can be slow or temporarily unavailable
- A network timeout causes the caller to retry, creating **duplicates**
- A crash between "API responded OK" and "mark as saved" causes **silent data loss**
- Rate limits on the Bitrix24 side drop requests under load

**Bitrix24 Outbox Bridge** solves all of these at once. Every incoming event is written to a PostgreSQL outbox table **first** — this is the only commit point that matters. A background poller then picks up pending events, delivers them to Bitrix24 via BullMQ workers, and marks each event as processed only after the CRM confirms receipt. No lead is ever lost, no lead is ever duplicated.

---

## Architecture

```
External Source  (landing page, ad platform, etc.)
        |
        |  POST /outbox/create_lead
        |  POST /outbox/create_contact
        v
+-------------------------------------------------------+
|               NestJS Application                      |
|                                                       |
|   [API Key Guard] --> [OutboxController]              |
|                            |                          |
|                            | enqueue()                |
|                            v                          |
|                   [OutboxRepository]                  |
|                   INSERT INTO outbox                  |
|                   (state: PENDING)                    |
|                            |                          |
|   OutboxPoller (every 2s)  |                          |
|   +------------------------+                          |
|   | 1. resetStuckJobs (>5 min in PROCESSING)          |
|   | 2. claimPendingBatch (50 rows, SKIP LOCKED)       |
|   | 3. push to BullMQ                                 |
|   +---> [BullMQ / Redis]                              |
|          |                                            |
|          +--> lead-queue    --> LeadProcessor         |
|          +--> contact-queue --> ContactProcessor      |
|                                                       |
|         On failure (5 attempts, exponential backoff): |
|          +--> lead-dlq / contact-dlq                  |
+-------------------------------------------------------+
                       |
                       v
             [ Bitrix24 REST API ]
```

**Technology stack**

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11, TypeScript 5.7 |
| Database | PostgreSQL + Drizzle ORM |
| Queue | Redis + BullMQ 5 |
| API docs | Swagger / OpenAPI |
| Queue UI | Bull Board 7 |
| Health checks | @nestjs/terminus |
| Validation | Zod (env), class-validator (DTOs) |
| Container | Docker (multi-stage, non-root user) |
| CI/CD | GitHub Actions |

---

## Database Schema

Full interactive diagram: **[dbdiagram.io → bitrix24-outbox-bridge](https://dbdiagram.io/d/bitrix24-outbox-bridge-69f9a391c6a36f9c1b086641)**

### `bitrix24_outbox`

The core of the Outbox Pattern. Every incoming event lives here from the moment it is received until Bitrix24 confirms delivery.

| Column | Type | Description |
|--------|------|-------------|
| `boid` | `bigint PK` | Auto-incremented event ID |
| `idempotency_key` | `varchar(255) UNIQUE` | Deduplication key (see Idempotency section) |
| `event_variant` | `enum` | `CRM_LEAD_ADD` · `CRM_CONTACT_ADD` · `CRM_DEAL_ADD` · `CRM_COMPANY_ADD` |
| `event_state` | `enum` | `PENDING` → `PROCESSING` → `SUCCEEDED` / `FAILED` |
| `payload` | `jsonb` | Raw event data passed to Bitrix24 |
| `bitrix_id` | `varchar(50)` | ID returned by Bitrix24 after successful delivery |
| `attempts` | `smallint` | Number of delivery attempts (constraint: ≥ 0) |
| `error_message` | `text` | Last error message, populated on failure |
| `created_at` | `timestamp` | Event ingestion time |
| `processing_at` | `timestamp` | Time the poller last claimed this event |
| `processed_at` | `timestamp` | Time Bitrix24 confirmed receipt |

**Indexes**
- `idx_outbox_created_at` — supports range scans and time-based ordering
- `idx_outbox_event_state_pending` — partial index on `PENDING` only, keeps poller queries fast as the table grows

### `bitrix_tokens`

Stores OAuth tokens used to authenticate against the Bitrix24 REST API.

| Column | Type | Description |
|--------|------|-------------|
| `btid` | `bigint PK` | Token record ID |
| `access_token` | `text` | Current access token |
| `refresh_token` | `text` | Used to obtain a new access token |
| `expires_at` | `timestamp` | DB constraint: must be > `now() + 1 hour` |
| `domain` | `varchar(200)` | Bitrix24 portal domain |
| `updated_at` | `timestamp` | Time of last refresh |

---

## Idempotency

Idempotency is enforced at **two independent layers** so that duplicate delivery is impossible regardless of where a failure occurs.

### Layer 1 — Database (ingest side)

The `idempotency_key` column has a `UNIQUE` constraint. The key is a **SHA-256 hash** computed from the entity's identifying fields before the event is written to the database. A duplicate POST returns `409 Conflict` immediately, without touching the queue.

**Contacts and companies**

```
key = SHA256(email)
```

One contact per email address — straightforward deduplication.

**Leads**

```
key = SHA256(email + date)     // date = YYYY-MM-DD UTC
```

A single client can be the source of multiple leads over time (different ad campaigns, different products). Including the date allows a new lead to be created per calendar day while still blocking repeated submissions within the same day. The design assumes that the minimum meaningful processing window for one lead is **one business day** — if a lead from the same person arrives twice on the same day it is treated as a retry, not a new intent.

### Layer 2 — Bitrix24 API (delivery side)

Even after a job leaves the queue and the processor calls the Bitrix24 API, failures can occur between "CRM created the entity" and "database marked as processed":

```
createLead(payload)     ✓   ← Bitrix24 responds 200
markProcessed(boid)     ✗   ← database crashes here
```

Without protection the job would be retried on recovery, and a **duplicate lead would be created** in Bitrix24. To prevent this, the processor always checks the CRM before calling create:

```typescript
// Check Bitrix24 first using the idempotency key stored at creation time
const existingId = await this.bitrixClient.findLeadByIdempotencyKey(event.idempotencyKey);

if (existingId) {
  // Entity already exists in Bitrix24 — just record the ID and finish
  await this.outboxRepo.markProcessed(event.boid, existingId);
  return;
}

// Not found — safe to create
const bitrixId = await this.bitrixClient.createLead(payload);
await this.outboxRepo.markProcessed(event.boid, bitrixId);
```

The idempotency key is written to a custom field in Bitrix24 at creation time and is used for the existence check on every retry. This makes the entire delivery flow **exactly-once** from end to end.

---

## API Protection

All `/outbox/*` endpoints require the `x-api-key` header. Requests without a valid key are rejected with `401 Unauthorized` before reaching any business logic.

```http
POST /outbox/create_lead
x-api-key: <your-api-key>
Content-Type: application/json

{
  "firstName": "Ivan",
  "lastName": "Petrov",
  "email": "ivan@example.com",
  "phone": "+79001234567",
  "comments": "Interested in the enterprise plan"
}
```

The key is configured via `API_KEY` (minimum 32 characters, enforced by Zod at startup). The guard is a NestJS `CanActivate` applied to the outbox controller.

Bull Board (`/queues`) is protected separately by HTTP Basic Auth via `BULL_BOARD_USER` / `BULL_BOARD_PASSWORD`.

Full API reference is available in **[Swagger UI](https://bitrix24-outbox-bridge.andrewpodgola.pro/api-doc)**.

---

## Environment Variables

All variables are validated at startup with a Zod schema. The application **refuses to start** if any required variable is missing or invalid.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | yes | — | `DEV` · `PROD` · `TEST` |
| `PORT` | no | `3000` | HTTP server port |
| `APP_URL` | yes | — | Public base URL of this service |
| `API_KEY` | yes | — | Shared secret for `x-api-key` header (min 32 chars) |
| `DB_URL` | yes | — | PostgreSQL connection string |
| `REDIS_HOST` | yes | — | Redis host |
| `REDIS_PORT` | no | `6379` | Redis port |
| `REDIS_TTL` | no | `300000` | Redis key TTL in milliseconds |
| `BULL_BOARD_USER` | yes | — | Basic-auth username for the queue dashboard |
| `BULL_BOARD_PASSWORD` | yes | — | Basic-auth password for the queue dashboard |
| `BITRIX_CLIENT_ID` | yes | — | Bitrix24 OAuth app client ID |
| `BITRIX_CLIENT_SECRET` | yes | — | Bitrix24 OAuth app client secret |
| `BITRIX_REDIRECT_URI` | yes | — | OAuth redirect URI |
| `BITRIX_DOMAIN` | yes | — | Bitrix24 portal domain |

---

## Logging and Monitoring

**Application logs** — NestJS built-in structured logger. All queue processors, the poller, and the Bitrix24 HTTP client emit contextual log lines including the `boid`, `idempotencyKey`, Bitrix24 entity ID on success, and full error details on failure.

**Health endpoint**

```
GET /health
```

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis":    { "status": "up" }
  }
}
```

The health endpoint is polled by Docker every 30 seconds and is suitable as a Kubernetes liveness / readiness probe.

**Bull Board** — Real-time queue dashboard at [`/queues`](https://bitrix24-outbox-bridge.andrewpodgola.pro/queues) (Basic Auth). Shows live job counts per queue, failure reasons, retry history, and allows manual job replay directly from the UI.

---

## Queues and Dead-Letter Queues

The service uses **four BullMQ queues** backed by Redis:

| Queue | Purpose |
|-------|---------|
| `lead-queue` | Primary delivery queue for CRM leads |
| `lead-dlq` | Dead-letter queue for leads that exhausted all retries |
| `contact-queue` | Primary delivery queue for CRM contacts |
| `contact-dlq` | Dead-letter queue for contacts that exhausted all retries |

**Retry policy (primary queues)**

| Setting | Value |
|---------|-------|
| Max attempts | 5 |
| Backoff | Exponential with jitter, base delay 5 000 ms |
| Completed jobs retained | 100 |
| Failed jobs retained | 500 |

**DLQ policy**

| Setting | Value |
|---------|-------|
| Max attempts | 1 (no further retries in DLQ) |
| Failed jobs retained | indefinitely (for manual inspection and replay) |

**Stuck-job recovery** — The poller calls `resetStuckJobs(5)` on every tick. Any event that has been in `PROCESSING` state for more than 5 minutes (indicating a worker crash) is reset to `PENDING` and reclaimed on the next cycle.

> Planned: structured audit log entries will be written to a dedicated table whenever a job transitions to DLQ, providing a full history of every delivery attempt.

---

## CI/CD and Deployment

### Continuous Integration

Every pull request targeting `main` or `dev` triggers the CI pipeline:

1. Checkout code
2. Setup Node 20 + pnpm (dependency cache)
3. `pnpm install --frozen-lockfile`
4. `pnpm lint`
5. `pnpm test`

### Continuous Deployment

Every push to `main` triggers a two-job CD pipeline:

**Job 1 — build-and-push**
1. Build a multi-stage Docker image (TypeScript compile → production-only Node image)
2. Push to the private Docker registry with two tags: `latest` and the commit SHA
3. Layer caching via the registry reduces rebuild time on unchanged layers

**Job 2 — deploy** (runs after job 1)
1. Copy `docker-compose.yml` to the server via SCP
2. SSH into the server, write `.env` from GitHub Secrets/Variables
3. `docker compose pull && docker compose up -d`

All secrets (DB credentials, API keys, registry credentials, SSH private key) are stored in GitHub Secrets and never appear in logs or source code.

### Infrastructure

The service runs as a non-root Docker container (`nodejs:1001`) on a private VPS, sharing an external Docker network (`infra-network`) with a co-located Redis instance and an nginx reverse proxy that terminates TLS.

```
Internet ──▶ nginx (TLS) ──▶ bitrix24-outbox-bridge :3000
                         ──▶ redis :6379  (internal only)
```

**Deployed at:** https://bitrix24-outbox-bridge.andrewpodgola.pro

---

## Local Development

```bash
# Install dependencies
pnpm install

# Copy and fill environment variables
cp .env.example .env

# Start in watch mode
pnpm start:dev

# Push database schema
pnpm drizzle-kit push

# Run unit tests
pnpm test
```

Swagger UI → `http://localhost:3000/api-doc`
Bull Board → `http://localhost:3000/queues`
