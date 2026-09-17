# MindVault — Bug Review & Fixes Summary

Full backend + frontend review of the Daily Planning System implementation.
All confirmed issues below are fixed in this zip (`MindVault/` backend,
`mindvault-frontend/` frontend). I have no network access in this environment,
so I could not actually run `mvn compile` / `npm run build` — please run both
yourself before your demo and let me know if anything surfaces.

## Backend — critical (would likely break startup or core functionality)

1. **Schema validation mismatch (likely startup failure).** `journal_entries.stress/energy`,
   `daily_plans.completion_percent`, `ai_insights.confidence` were declared `SMALLINT` in
   migrations V5/V7/V8, but map to plain `Integer` fields — Hibernate's `ddl-auto: validate`
   expects `INTEGER` and would reject this at boot with "wrong column type" errors.
   Fixed via a new `V9__widen_smallint_columns.sql` (can't edit V5/V7/V8 directly — Flyway
   would reject the checksum change if they're already applied to your DB).

2. **Plan generation/retrieval date mismatch.** `generateTomorrowsPlan()` always targeted
   tomorrow's date, but `getTodaysPlan()` looks for today — a freshly generated plan was
   invisible until the calendar actually rolled over. This is exactly what your own
   implementation note flagged. Renamed to `generateNextPlan()`: targets today if no plan
   exists yet, tomorrow otherwise.

3. **Goal/task priority sorting was alphabetical, not by importance.** `ORDER BY priority ASC`
   on a string-enum column sorts HIGH, LOW, MEDIUM — not HIGH, MEDIUM, LOW. Fixed with an
   explicit CASE-based query in `UserGoalRepository`.

4. **Fragile JSON parsing from the LLM.** Both `DailyPlanService` and `EveningReflectionService`
   only stripped markdown fences; if the local model added so much as a stray sentence before/
   after the JSON (common for a small model despite "return ONLY JSON" instructions), parsing
   failed outright. Added bracket-matching fallback extraction to both.

5. **Unhandled LLM call failures.** Neither service wrapped the actual `chatClient...call()`
   in try/catch — an unreachable Ollama instance threw a raw exception straight to a generic
   500. Now caught with a friendly message.

6. **Wrong HTTP status on plan-generation failure.** Parse failures threw `IllegalStateException`,
   which maps to 409 Conflict — semantically wrong, and collides with real conflict cases (like
   "PIN already configured"). Added a dedicated `PlanGenerationException` → 502 Bad Gateway.

7. **NPE risk** in `PlanningContextBuilder`: `String.format("%d", insight.getConfidence())`
   would NPE if confidence were ever null (nullable in the entity/DB, currently just dormant
   because `InsightService` always sets it — still fragile). Guarded.

8. **Timezone bug** in `PlanningContextBuilder`: was slicing the raw UTC `Instant.toString()`
   for the date shown to the AI instead of converting to local time — same class of bug fixed
   in the frontend earlier. Fixed.

9. **`DailyPlan.overallMood` was never set anywhere**, despite being part of the intended
   planning context (the spec explicitly lists mood as something the evening review should
   factor in). Wired up in `EveningReflectionService` to pull from today's most recent journal
   entry.

10. **Missing validation** on `stress`/`energy` in both journal DTOs — only caught by a raw
    Postgres CHECK constraint, surfacing as an ugly 500 instead of a clean 400. Added
    `@Min(1)/@Max(5)`.

## Frontend — critical

11. **Planner.tsx never reloaded the plan after generating one.** `handleGenerate()` called the
    API, then just showed a browser `alert()` — the task list stayed empty/stale until a manual
    page refresh. Fixed: reloads the plan and shows a toast instead.

12. **Undefined Tailwind color token.** `Goals.tsx` and `Planner.tsx` used `dark:bg-night-light`,
    which doesn't exist in your Tailwind config (the actual token is `night-raised`, used
    correctly everywhere else in the app) — cards rendered with no background at all in dark
    mode. Fixed across both files.

13. **Stress/energy slider display-vs-saved mismatch** in `EntryModal`. Sliders visually
    defaulted to showing "3" via a `value={stress || 3}` fallback, but the underlying state
    stayed `undefined` until the user actually dragged it — so what a user saw didn't match
    what got saved unless they touched the slider. Fixed by defaulting the state itself to 3.

14. **No "Partial" completion option in the Planner UI**, despite `TaskStatus.PARTIAL` existing
    in the backend and being explicitly called out in your original spec ("not just completed/
    not completed" was the whole point of richer task granularity). Added a Partial button.

15. **Insights.tsx: Planning Intelligence section only rendered if mood stats also loaded
    successfully** — the two are independent API calls, so a mood-stats failure would hide
    planning insights even if they loaded fine. Decoupled the two.

16. **No manual way to re-lock the app** for a demo — previously required clearing
    localStorage by hand in devtools. Added a lock button to the navbar.

17. **Inconsistent error handling** — `Goals.tsx`/`Planner.tsx` used `alert()`/`console.error`
    instead of the app's existing toast pattern (used everywhere else). Replaced with
    `useToast()` throughout, including success confirmations on goal create/deactivate.

## One thing I did NOT change, flagging instead

`InsightService.updateInsights()` requires 3+ days of plan history before it generates
anything — meaning "Planning Intelligence" will show its empty state through most of a
same-day demo/testing session, since accumulating 3 distinct calendar dates of plan history
needs 3 real days (or manually seeded data). Not a bug, just worth knowing going in — let me
know if you want a quick seed script for demo data.
