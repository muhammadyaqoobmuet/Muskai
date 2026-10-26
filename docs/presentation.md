# Muskarai — Text to Reels: Product Deck

Slide-by-slide presentation covering what Muskarai does, how it is built, and how to demo it.
All facts below reflect the codebase as of October 2026: Next 15 / React 19 web app, Express API, Prisma + Postgres, DashScope video generation, ffmpeg stitching.

---

## 1. Title: Muskarai

**On screen:** `muskai-logo-blue.png`, tagline: *"Text to Reels"*.
**One-liner:** A full-stack studio that turns a written prompt into a multi-segment, publish-ready vertical reel — generated, stitched, and shared in one workflow.
**Speaker note:** Introduce the repo as a working product, not just an AI script demo.

---

## 2. The Problem

**Slide content:**

- Creators want short vertical video, but blank-page starts are slow and skills (video editing, motion) are high-friction.
- Existing AI video tools produce one-shot clips; stitching multi-beat stories stays manual.
- Teams, not humans, compose reels, a3-aesthetic uses, a way to work consistently.

**Speaker note:** Frame the two gaps: generation quality **and** the assembly/publish gap.

---

## 3. The Solution

**Slide content:**

- Type a prompt in the Studio. Muskarai plans it into segments, queues DashScope video generation jobs, and stitches the outputs with ffmpeg into one `final.mp4` — automatically.
- Extend an existing reel by chaining more segments conditioned on the last frame.
- Publish to a public feed: reels get likes, creators get profiles at `/u/[handle]`.

**Key beats:** `segments 5 s each` · `chains via last frame` · `ffmpeg concat` · `one publish button`.
**Speaker note:** Emphasize multi-segment chaining as the differentiator, not raw quality of a single clip.

---

## 4. Architecture Overview

**Slide content:**

| Layer | Stack | Port |
| --- | --- | --- |
| Web (App Router) | Next 15, React 19, Tailwind 4, React Query, Motion | 3000 |
| API | Express 4 + zod-validated routes, tsx dev / tsc build | 4000 |
| Persistence | Prisma 6 (`@prisma/client`) on Postgres 16 (docker-compose) | 5433 → 5432 |
| AI provider | DashScope WAN family (wan2.2-t2v-plus, wan2.2-i2v-flash, wanx2.1-kf2v-plus, wan2.2-vace-plus) | — |
| Media assembly | ffmpeg on the API host (`stitch` service) | — |
| Files | `express.static` on `STORAGE_DIR`, exposed at `/files` so DashScope can fetch frame images | — |

**Speaker note:** The API is the orchestrator — the browser never talks to DashScope.

---

## 5. Core Flow: Prompt → Published Reel

**Slide content (numbered):**

1. POST `/api/generations` (idempotency key in `clientRequestId @unique`).
2. `segment-planner` splits the prompt into 5-second segments.
3. `model-router` picks the DashScope model per segment (mode + availability).
4. Each segment: submit → poll task → download → `seg-N.mp4` under `storage/<generationId>/`.
5. `worker` extracts each segment's last frame to seed the next segment (beat chaining).
6. `stitch` concatenates segments → `final.mp4` (+ poster), marks **SUCCEEDED**.
7. User polls GET `/api/generations/:id` from the JobList (React Query), then Publishes.

**Status journey:** `QUEUED → RUNNING → STITCHING → SUCCEEDED | FAILED`.
**Speaker note:** Generation is asynchronous with idempotency; publishing is a guarded, explicit step.

---

## 6. Multi-Segment Chaining & Extension

**Slide content:**

- `Extension Mode`: POST `/api/generations/:id/extend` continues a SUCCEEDED reel with new segments, seeded from its `lastFrameUrl`.
- `Five generation modes:` TEXT_TO_VIDEO · IMAGE_TO_VIDEO · KEYFRAMES · REFERENCE · EDIT.
- VACE (`wan2.2-vace-plus`) covers reference-image and edit-driven segments.
- Optional last-frame keyframes drive transitions between beats.

**Speaker note:** "Extend" is the loop that turns one prompt into a longer story. Composer exposes all five modes.

---

## 7. Social Layer & Public Feed

**Slide content:**

- **Feed** (`/explore`): public reels, like buttons (persisted via `Like` join table).
- **Reel page** (`/reel/[id]`): player, meta, like, and "more from this creator" links.
- **Profiles** (`/u/[handle]`): bio, all generations, published showcase.
- **Library** (`/library`): user's own jobs, drafts, and failures side by side.

**DTOS / guards implemented:** publish is rejected unless the reel is `SUCCEEDED`; `viewCount` on the reel row.
**Speaker note:** The like + profile loop makes it feel like a product, not a lab tool.

---

## 8. Tech Stack at a Glance

**Slide content:**

| Concern | What we chose | Why it shows up in code |
| --- | --- | --- |
| Rendering | Next 15 App Router + React 19 | Server components, `middleware.ts`, `/reel/[id]` dynamic routes |
| Data | TanStack Query v5 + Motion + Phosphor icons | JobList polling, animated transitions |
| API | Express 4 + zod schemas, scrypt sessions (cookie-based) | `routes/*.ts`, `auth` lib |
| DB | Prisma 6 + Postgres 16 | `schema.prisma` — 6 models |
| AI | DashScope (WAN family) | `providers/dashscope.provider.ts` + `client.ts` |
| Media | ffmpeg CLI (`ffmpegAvailable` on `/health`) | `stitch.ts` |

**Speaker note:** No heavy runtime frameworks — the stack is deliberately boring and inspectable.

---

## 9. Data Model

**Slide content — schema.prisma, 6 models:**

- `User` — scrypt `passwordHash`, `handle` unique, `bio?`
- `Generation` — `clientRequestId @unique` (idempotency), `aspectRatio` default `"9:16"`, `targetDurationSec` default `10`, `status` default `QUEUED`, `published`, last-frame & video URLs, `outputPath = "<id>/final.mp4"`
- `Segment` — `index`, per-segment DashScope `taskId`, `durationSec` default `5`, `outputPath = "<generationId>/seg-N.mp4"`; `@@unique([generationId, index])`
- `Like` — `@@id([userId, generationId])`
- `ModelUsage` — live per-model quota trace (`exhausted`, `unitsObservedUsed`)

**Speaker note:** Everything it takes to rebuild the UI is derivable from these tables.

---

## 10. Demo Script — 4 Minutes

**Slide content (walk through, in order):**

1. Log in at `/login` — showcase `showcase@muskai.local` / `showcase-pass-123`.
2. **Studio:** submit a text prompt, watch the JobItem run QUEUED → STITCHING → SUCCEEDED live.
3. **Auto-follow to Reel page** when production finishes; hit **Publish**.
4. **Explore** `/explore`, like the reel, view `u/muskai-studio` profile.
5. Back to Studio: hit **Extend** on a reel to show VACE chaining growth.
6. **Library:** show drafts + failures sampling the data model.

**Speaker note:** Preloaded demo reels installed: coastline, tokyo-rain, desert-drive — 3 public reels ready under `muskai-studio`.

---

## 11. Roadmap

**Slide content (near-term, concrete — from code):**

- **ModelUsage console** — admin view of the live quota trace, which model is exhausted.
- **localStorage project split** — keep drafts per browser context, workspaces per project.
- **Template pickers** — route-by-template selection flow for `N segments × aspectRatio`.
- **Unit cleanup** — smaller unit boundaries, less single-file risk.

**Speaker note:** These are already scoped from standing code observations; nothing speculative.

---

## 12. Why It Matters / Closing

**Slide content:**

- Full AI-video pipeline that is inspectable: explicit segments, ids, `final.mp4` under `storage/<generationId>/`.
- Boring, stable stack (Express, Prisma, ffmpeg) around a stateful orchestration loop.
- Social-first: prompts become **published reels** with real identities.
- Ready to demo end-to-end with one command per side (`npm run dev`).

**Speaker note:** Close on "Try it" — docker compose + `npm run setup` is the full local run.

---

## 13. Thank You / Contact

**Slide content:** Repository: `muskai/text-to-reels` · Studio: `http://localhost:3000/studio` · Logo/social: shown on `/u/muskai-studio`.
**Speaker note:** Offer the `/docs/readme.md` as the quickstart reference.
