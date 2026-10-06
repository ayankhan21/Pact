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
- Use `wrangler.jsonc` as the foundation for local and production Cloudflare configuration

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
3. Configure production D1, secrets, and Cloudflare deployment
4. Add authentication before exposing personal data outside local development
