# Pact

Pact is a personal accountability assistant for short-term goal execution. It pairs a structured plan with a lightweight dashboard and chat layer so the user can track what is scheduled, what actually happened, and where reality diverges from the intended plan.

## Current architecture

- Frontend: React + TypeScript + Vite
- State model: shared task-state utilities with tests
- Cloudflare foundation: Wrangler + D1-ready config
- Database model: relational schema skeleton for plans, tasks, schedules, task events, context, and conversations
- LLM boundary: Groq integration will be added behind a dedicated service layer and kept server-side only

## Local setup

```bash
npm install
npm run dev -- --host 0.0.0.0
```

The local dashboard is available at http://localhost:5173.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Environment and Cloudflare setup

- Copy `.dev.vars.example` to `.dev.vars` when running local Worker development
- Keep the Groq API key server-side and never commit it to Git
- Use `wrangler.jsonc` as the foundation for local and production Cloudflare configuration

## MVP focus

The current implementation covers:

- foundational React dashboard shell
- polished Pact-style task board
- task state transitions and completion math
- core task status and context schema design
- Cloudflare + D1 project configuration groundwork

## Next stages

1. Add a real D1 schema and migration layer
2. Add task APIs and persistence
3. Build chat + tool-call state updates
4. Add Groq-backed assistant behavior
5. Configure production Cloudflare secrets and deployment
