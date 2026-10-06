# Pact

Pact is a personal accountability assistant for short-term goal execution. It pairs a structured plan with a lightweight dashboard and chat layer so the user can track what is scheduled, what actually happened, and where reality diverges from the intended plan.

## Current architecture

- Frontend: React + TypeScript + Vite
- State model: dated job-switch plan, task-state utilities, and tests
- Backend and persistence: Cloudflare Worker APIs backed by local D1 migrations for plans, tasks, schedules, events, context, conversations, and messages
- LLM boundary: Groq chat is called from the Worker; the API key stays in `.dev.vars`

## Local setup

```bash
npm install
npm run build
npm run db:migrate:local
npm run dev:worker
```

The Worker serves the dashboard and API at http://127.0.0.1:8787. For Vite hot reload, run `npm run dev` in a second terminal; its `/api` requests proxy to the Worker.

## Scripts

```bash
npm run dev
npm run dev:worker
npm run db:migrate:local
npm run build
npm test
npm run lint
```

## Environment and Cloudflare setup

- Copy `.dev.vars.example` to `.dev.vars` when running local Worker development, then set `GROQ_API_KEY` locally
- Keep the Groq API key server-side and never commit it to Git
- The first local API request seeds the dated job-switch itinerary and context into D1 if that plan is empty
- `wrangler.jsonc` is for local development; `wrangler.api.jsonc` and `wrangler.frontend.jsonc` define separate production Workers

## Production deployment

Live Workers:

- Frontend: https://pact-web.pact-ayan.workers.dev
- API: https://pact-api.pact-ayan.workers.dev

Frontend username/password login is currently disabled with `REQUIRE_LOGIN=false`. Anyone who knows the frontend URL can access the app and its personal plan/context data. The API URL still rejects direct requests; the frontend Worker accesses it using the service binding and shared `PACT_API_TOKEN` secret. Re-enable the login by setting `REQUIRE_LOGIN` to `true` in `wrangler.frontend.jsonc` and redeploying the frontend.

Before deploying, register a `workers.dev` subdomain in Cloudflare Dashboard under **Workers & Pages**. Set the secrets before publishing so the frontend fails closed until access is configured:

```powershell
npx wrangler secret put GROQ_API_KEY --config wrangler.api.jsonc
npx wrangler secret put PACT_API_TOKEN --config wrangler.api.jsonc
npx wrangler secret put PACT_API_TOKEN --config wrangler.frontend.jsonc
npx wrangler secret put PACT_ACCESS_PASSWORD --config wrangler.frontend.jsonc
npm run deploy:api
npm run deploy:web
```

Enter secrets only at Wrangler's terminal prompt. Use the same randomly generated `PACT_API_TOKEN` value for both Workers; the frontend Worker adds it to service-binding requests, and the API rejects direct unauthenticated requests. `PACT_ACCESS_PASSWORD` is retained for when frontend login is re-enabled. Do not paste secrets into chat or source files.

The remote D1 database `pact-prod` has already been created and its initial migration applied. To apply later migrations, run `npm run db:migrate:remote` before deploying the API.

## MVP focus

The current implementation covers:

- foundational React dashboard shell
- polished Pact-style task board
- task state transitions and completion math
- the October 6-November 10 job-switch itinerary as dated, initially-open tasks
- task status and context APIs backed by local D1 storage
- Groq-backed chat API with server-side credentials

## Next stages

1. Add LLM tool calls that perform validated task and schedule mutations
2. Add conversation history persistence and restore it in the UI
3. Finish the two-Worker Cloudflare deployment and verify hosted URLs
4. Add persisted conversation history, backups, and retention controls
