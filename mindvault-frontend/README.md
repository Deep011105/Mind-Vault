# MindVault — Frontend

A calendar-first journal UI with mood tracking, a conversational companion, and
mood insights. React + TypeScript + Tailwind CSS. Talks to the MindVault Spring
Boot backend — single local user, no accounts.

## What changed from the original upload

This frontend (`journal-entry-frontend-main`, formerly "Daybook") was built
against a **different, incompatible backend contract**: JWT auth, numeric IDs,
a `title` field, responses wrapped in `ApiResponse<T>`, and a `/journal` path
with no mood/chat/insights concept at all. Per your call, auth is stripped
entirely (this is a local single-user app — there's nothing to log into), and
everything else is rewired to match the actual MindVault backend:

| Before | Now |
|---|---|
| Login/Signup, JWT in localStorage | Removed — goes straight to the journal |
| `id: number`, `title`, `date` | `id: string` (UUID), `mood`, `createdAt`/`updatedAt` |
| `/journal`, `/public/login`, etc. | `/api/journals`, `/api/chat`, `/api/moods/stats`, `/api/prompts/today`, `/api/export/*` |
| Responses wrapped in `ApiResponse<T>` | Plain JSON, matching the backend's actual DTOs |
| Entry modal: title + content | Entry modal: mood picker + content |
| — | New **Companion** page (chat) |
| — | New **Insights** page (mood breakdown, streaks, 30-day timeline) |
| — | Daily reflective prompt card on the dashboard |

Also fixed: `utils/date.ts` was slicing ISO strings assuming a timezone-naive
`LocalDateTime`. The backend now sends `Instant` (UTC), so day-keys are computed
from the parsed local `Date` instead — otherwise entries near midnight could
land on the wrong calendar day for anyone not in UTC (e.g. India, UTC+5:30).

## Setup

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL if your backend isn't on localhost:8080
npm run dev
```

**The backend needs CORS enabled for this to work** — it had none at all in
the version you gave me. I added a `CorsConfig` there allowing
`http://localhost:5173`; make sure that's included when you build the backend.

## I could not verify this builds

Same caveat as the backend: no network access in this environment, so
`npm install` / `npm run build` / `tsc` could not actually be run against real
dependencies. I reviewed every changed file carefully against `tsconfig.json`
(`noUnusedLocals`/`noUnusedParameters` are both off, so stray imports won't
break the build, but please still run `npm run build` yourself before trusting
this is 100% clean).

## Pages

- `/` — Dashboard: calendar, day panel, create/edit/delete, PDF export, daily prompt
- `/chat` — Companion: conversational chat, safety-intercepted replies get a
  distinct visual treatment so you can tell when the deterministic safety layer
  (not the LLM) responded
- `/insights` — Mood breakdown, current/longest streak, 30-day mood timeline
