# MindVault — backend

Private, local-first journaling app with a conversational AI companion. Everything
runs on-device: Postgres + pgvector for storage/retrieval, Ollama for the local LLM.
No journal content ever leaves the machine.

## What changed / what's new (merge of `LifeVault` + `RagQueryService`)

The two source projects you gave me were **not compatible as-is**:

- `LifeVault` referenced `JournalCreatedEvent`/`JournalUpdatedEvent` that were never
  defined, had no controller at all, and its DB migration column (`mood_emoji`)
  didn't match the entity field (`mood`) — it would not have started.
- `RagQueryService` was from a different, generic multi-tenant document-Q&A project
  (`com.docmind`), using an "answer only from the provided context" prompt and a
  document/user-filtered vector search — this is the source of the "acts like a
  document bot, not a chat companion" problem, and it hard-fails when nothing is
  retrieved.

This version merges everything into one project (package kept as `com.lifevault`
to avoid a mechanical rename across every file — product name is "MindVault", see
`pom.xml` / `application.yaml`), fixes the above, and adds:

| Area | What's new |
|---|---|
| Journal CRUD | `JournalController` (didn't exist before) |
| Embedding pipeline | `JournalEmbeddingListener` — keeps pgvector in sync on create/update/delete, no PDF round-trip |
| Long-term memory | `UserProfileSummary` entity + `ProfileSummaryService` — one evolving summary, updated incrementally |
| Context strategy | `MemoryContextBuilder` — recency buffer + semantic retrieval + profile summary, see below |
| Chat companion | `ChatService` + `ChatController` — conversational prompt, not document-QA |
| Safety layer | `SafetyDetectionService` — deterministic crisis-language check, runs before the LLM |
| Mood tracking | `MoodStatsService` + `MoodController` — mood counts, streaks, 30-day timeline |
| Daily prompts | `DailyPromptService` + `PromptController` — personalized once a profile exists, static fallback otherwise |
| PDF export | `PdfExportService` + `ExportController` — **export only**, not the RAG source |
| CORS | `CorsConfig` — was completely missing; without it the React frontend (localhost:5173) can't call this API (localhost:8080) at all due to browser same-origin policy |

## The memory strategy (your point 6)

`MemoryContextBuilder` combines three layers instead of "last 4 raw + compress the rest":

1. **Recency buffer** — last N entries (`app.rag.recency-buffer-size`, default 4) in full.
2. **Semantic retrieval** — pgvector similarity search over *all* entries against the
   current message, so a stressor from 3 months ago can still surface if it's relevant
   today. Results already covered by the recency buffer are filtered out to avoid
   duplication.
3. **Profile summary** — one continuously-updated document (recurring stressors, goals,
   coping patterns, tone) instead of a growing pile of compressed history. Updated via
   a cheap "merge this new entry in" LLM call after each journal entry, not a full
   re-summarization.

Cold start (no entries, or a short first entry) is handled as a normal state, not an
error — `MemoryContextBuilder` returns a valid (mostly empty) context, and
`ChatService`'s system prompt explicitly tells the model sparse/no history is fine.

## Setup

1. **Postgres with pgvector** running locally, database `demo` (or update
   `application.yaml`). The extension is created by `V2__enable_pgvector.sql`; if your
   DB role can't `CREATE EXTENSION`, run that line manually as a superuser first.
2. **Ollama** running locally (`http://localhost:11434` by default) with your existing
   chat model pulled, plus an embedding model — `application.yaml` defaults to
   `nomic-embed-text` (768-dim, matches `spring.ai.vectorstore.pgvector.dimensions`).
   If you use a different embedding model, update both the model name and the
   `dimensions` value together — they must match.
3. `./mvnw spring-boot:run`

## Things I could not verify without a build environment

I don't have network/Maven access in this environment, so I could not actually
compile or run this — I wrote it carefully against the Spring AI API used in your
own `RagQueryService.java` (same package paths: `org.springframework.ai.vectorstore.*`,
`FilterExpressionBuilder`, etc.), but please run `./mvnw compile` yourself before
relying on it, and check these specifically:

- `VectorStore.delete(Filter.Expression)` — used in `JournalEmbeddingListener` to
  remove stale vectors on update/delete. Confirm this overload exists in your exact
  Spring AI version; if not, switch to `delete(List<String> ids)` and track chunk IDs.
- The chat model name in `application.yaml` (`llama2:7b-q4_0`) — **placeholder**,
  replace with whatever you already had configured, since you asked to keep the model
  unchanged.
- Crisis helpline text in `application.yaml` — **placeholder, not verified for India**.
  Please replace with a locally-accurate, currently-correct helpline before this is
  used by anyone other than you for testing.

## Not yet built (flagged, not silently skipped)

- Frontend integration (React) — backend now exposes `/api/journals`, `/api/chat`,
  `/api/moods/stats`, `/api/prompts/today`, `/api/export/*`.
- Auth — this is a single-user local app, so there's no login. If you ever add
  multi-user support, the old `RagQueryService`'s `userId` filtering pattern is the
  right template to bring back.
- Lightweight per-entry topic tagging (mentioned as a v2 option instead of full
  GraphRAG) — not implemented; `MoodStatsService` covers mood-only analytics for now.
