# Pact Architecture Report

## Purpose

Pact is a personal accountability assistant for a time-bounded job switch. It records a plan, tracks scheduled work and status changes, and uses an LLM for conversational check-ins. The current plan targets a move to a funded startup by November 10, 2026, with a React, Node, and Postgres project as the main portfolio build.

## How the Application Works

1. The React dashboard loads tasks and context from the Worker API. The date selector filters the board and daily completion metrics to one plan date.
2. The plan generator turns the October 6-November 10 itinerary into dated tasks. Daily DSA, mini-build, and main-project tasks are created alongside the applicable system-design, behavioral, application, portfolio, and interview tasks. Seeded tasks start as `todo`; progress is never inferred.
3. The Worker API validates task-state transitions and handles task, schedule, progress, and context requests. Local D1 stores plans, tasks, schedules, task events, context versions, conversations, and messages. The first API request seeds the job-switch plan into an empty local plan.
4. Chat requests go from the browser to the Worker. The Worker combines the selected day's tasks and saved context with the user message, then calls Groq using a server-side API key. The browser never receives the Groq credential.

## Technology Choices

| Technology | Reason for this project |
| --- | --- |
| React | Supports the interactive task board, daily summary, context editor, and chat without making the UI the source of truth. |
| TypeScript | Makes task states, API payloads, and Worker environment boundaries explicit, reducing invalid transitions and mismatched contracts. |
| Vite | Provides a fast frontend build and local hot reload; the production output is static assets that Workers can serve. |
| Cloudflare Workers | Runs the API close to the edge with a small operational footprint and provides a natural server-side boundary for secrets and Groq calls. |
| Cloudflare D1 / SQLite | The plan, schedule, task status, events, and context are relational and benefit from a simple transactional store. D1 keeps the first deployment within the Cloudflare stack. |
| Groq | Provides the initial LLM provider. Calls are isolated behind `src/server/groq.ts`, so provider-specific code is not spread through the UI or task store. |
| Vitest | Exercises task transitions, plan generation, and store behavior using the same TypeScript toolchain. |

The repository includes Drizzle dependencies, but the current Worker persistence adapter uses D1 prepared SQL directly; Drizzle is not currently part of the request path.

## Deployment Shape

The hosted layout is deployed as two Workers:

- **Frontend Worker:** serves the Vite `dist` assets, enforces a single-user access gate, and proxies `/api/*` through a Worker service binding.
- **API Worker:** handles task/context/chat requests, reads and writes a remote D1 database, and calls Groq. A server-to-server token prevents direct unauthenticated API access.

This split keeps browser assets, private API operations, and provider secrets in their proper runtime boundaries. The frontend uses HTTP Basic authentication for this single-user deployment; Cloudflare Access with a custom domain is a stronger alternative.

Deployed URLs:

- Frontend: https://pact-web.pact-ayan.workers.dev
- API: https://pact-api.pact-ayan.workers.dev

The frontend responds with an HTTP Basic challenge when unauthenticated. The API rejects requests that do not contain the internal service token; the browser does not receive that token.

## Current Limitations and Safety Notes

- Local task/context APIs use D1 and were verified to retain data across a Worker restart. The remote D1 database and initial schema are provisioned, and both Workers are deployed.
- Conversation messages are not yet persisted or restored; the schema exists, but chat currently sends only the latest user message to Groq.
- Assistant replies do not yet invoke validated tools. Task updates currently come from explicit UI actions.
- Production secrets must be set before deploying. The frontend fails closed without its password and service token, and the API fails closed without its internal token. CORS is not authentication.
- The frontend gate is single-password protection, not per-user identity management. Backups and retention policies remain to be configured before storing long-term personal history.

## Local Run

```powershell
npm run build
npm run db:migrate:local
npm run dev:worker
```

Open `http://127.0.0.1:8787/`. The local secret file is `.dev.vars`; do not commit it or paste its contents into chat.
