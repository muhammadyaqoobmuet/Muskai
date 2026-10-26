# Text-to-Reels — System Design

**Product (working title):** a text-to-reels studio — type a prompt, get a 10–20s vertical reel.
**Stack:** Next.js (TypeScript) frontend · Express (TypeScript) backend · Alibaba DashScope (Model Studio, Singapore region) as the generation engine.
**Product name: Muskai** (set by Yaqoob 2026-10-20, replacing the "Reely" placeholder).
**Design language:** VEED style reference supplied by Yaqoob — white canvas, single lime ignition accent `#96ff1a`, neo-grotesque UI type + editorial serif display type, dark `#121212` rhythm bands. Layout system, tokens and component patterns follow the reference; branding, name and copy are this product's own.
**Status:** v2 APPROVED by Yaqoob 2026-10-20 ("everything is fine, lets build the app") with two notes: name it Muskai, and don't overcomplicate the system. Logo/branding must look sleek, modern SaaS. **Database: PostgreSQL** (Yaqoob's call 2026-10-20, replacing the SQLite draft; local dev via the included docker-compose).

---

## 1. What the product does

1. User writes a prompt (optionally uploads a start image or keyframes).
2. User picks a mode: **Text→Video**, **Image→Video**, **Keyframes→Video**, **Reference→Video**, **Video Edit**.
3. User picks duration target (5 / 10 / 15 / 20s) and aspect ratio (9:16 default for reels, 16:9, 1:1).
4. Backend generates the reel from Alibaba's free-quota models, rotating across models as each model's quota pool runs out, stitching segments with ffmpeg when the target duration exceeds one clip.
5. User watches, downloads, or extends the result. All generations live in a library.

**Hard constraints from the real world (verified Oct 2026):**
- Every Alibaba model has its **own separate free quota pool**; when a pool empties, DashScope returns **403 `AllocationQuota.FreeTierOnly`** (Stop-on-Exhaust is enabled on the account — the API stops instead of billing).
- DashScope video generation is **asynchronous**: create task → poll task → download result.
- DashScope result URLs are **temporary** (expire in ~24h) — outputs must be downloaded and stored by the backend immediately.
- A single clip is ~5s (some models 10s) — a 10–20s reel is **multiple segments stitched**, not one call.
- The quota *unit* (1 call vs 1 second) is unknown until the first real calls — the system must keep its own usage ledger and stay conservative.

---

## 2. Design v1 — the naive first pass

- Next.js page with a prompt box; on submit it calls Express `POST /generate`.
- Express holds one hard-coded model (`wan2.1-t2v-turbo`), calls DashScope **synchronously inside the request**, waits, returns the video URL from DashScope directly to the browser.
- React state holds the job list. Videos are `<video src={dashscopeUrl}>`.
- No database — jobs live in an in-memory array. No duration handling: whatever one clip gives is the result.
- API key read from an env var; frontend and backend in one repo folder, loosely organised.

This "works" for exactly one demo run. It then breaks in production-shaped ways — see §3.

---

## 3. Reasoning — where v1 breaks (the critique)

1. **Dead links within a day.** DashScope result URLs expire (~24h). v1 hands those URLs to the browser, so the whole library rots overnight. *Fix: backend downloads every result to local storage the moment a task succeeds, and serves files itself.*
2. **Request-blocking generation.** A video task takes 1–5 minutes. Holding an HTTP request open for that long dies to timeouts and freezes the UI. *Fix: true async jobs — `POST` returns `202` + job id immediately; a background worker drives the task lifecycle; frontend polls job status.*
3. **Quota death.** One hard-coded model = the app dies the day turbo's 200 units run out, even though 10 other models sit idle with quota. *Fix: a model registry with per-model quota state; a router that walks a fallback chain per capability. The 403 quota error becomes a signal, not a failure.*
4. **5s ≠ a reel.** The product promise is 10–20s. v1 has no concept of segments. *Fix: a segment planner — segment 1 from text-to-video; each extension takes the previous segment's last frame into image-to-video (`wan2.6-i2v`); or keyframes mode generates frames with the image model and animates between them (`wan2.1-kf2v-plus`). ffmpeg extracts frames and concatenates segments.*
5. **Double-click = double burn.** Impatient users re-submit; every duplicate burns real quota. *Fix: client-generated `clientRequestId` with a unique constraint — retries are idempotent.*
6. **In-memory jobs evaporate.** Server restart = all history lost, and the demo looks broken. *Fix: a real database. SQLite via Prisma for v1 (zero infra, runs anywhere) with a Postgres-compatible schema for later.*
7. **Queue infra overkill.** BullMQ + Redis is the "proper" answer but adds a service a class deployment may not have. *Fix: DB-backed job queue with a worker loop inside the API process (concurrency 2). The service boundary is drawn so BullMQ can replace the loop without touching business logic.*
8. **Key leakage.** Any design where the browser talks to DashScope directly exposes the API key. *Fix: the key exists only in the backend's env; the browser only ever talks to Express.*
9. **Unknown quota units.** If a unit is a *second*, a 200-unit pool is 40 clips, not 200. v1 would promise users generations it can't deliver. *Fix: a `ModelUsage` ledger records every call and observed quota behaviour; the UI labels pools as "units" until calibrated.*
10. **Unreadable code risk.** "Perfect, readable code" is an explicit requirement. A single-file Express app with logic in route handlers fails it. *Fix: strict layering — routes → controllers → services → providers — shared types + zod schemas in a shared package, strict TypeScript everywhere.*

---

## 4. Design v2 — the improved system (for approval)

### 4.1 Architecture

```
┌──────────────────────────────┐        ┌────────────────────────────────────────────┐
│  Next.js (apps/web)          │  HTTP  │  Express API (apps/api)                    │
│  • Landing (VEED-style)      │ ─────► │  routes → controllers → services           │
│  • Studio (create)           │  JSON  │    ├─ GenerationService (job lifecycle)    │
│  • Library                   │ ◄───── │    ├─ SegmentPlanner (5s blocks → target)  │
│  • Polls job status (3s)     │        │    ├─ ModelRouter (fallback chain)         │
└──────────────────────────────┘        │    ├─ DashScopeClient (async task API)     │
                                        │    ├─ StitchService (ffmpeg)               │
                                        │    ├─ StorageService (download + serve)    │
                                        │    └─ Worker (DB queue loop, conc. 2)      │
                                        │  Prisma → PostgreSQL (docker-compose local)│
                                        │  Files → ./storage (mp4 + poster jpg)      │
                                        └──────────────────┬─────────────────────────┘
                                                           │ HTTPS, key server-side only
                                                           ▼
                                        Alibaba DashScope (Singapore)
                                        video-synthesis + image-gen async tasks
```

Monorepo (npm workspaces): `apps/web`, `apps/api`, `packages/shared` (types + zod schemas used by both sides). One `npm install`, one dev command runs both apps.

### 4.2 The model registry — every model from Yaqoob's account

| Model | Capability | Free quota | Role in the chain |
|---|---|---|---|
| `wan2.1-t2v-turbo` | Text→Video | 200 | **Primary** — fastest, biggest pool |
| `wan2.1-t2v-plus` | Text→Video | 200 | Fallback 1 / quality mode |
| `wan2.2-t2v-plus` | Text→Video | 50 | Fallback 2 — newer, better motion |
| `wan2.5-t2v-preview` | Text→Video | 50 | Fallback 3 — newest preview |
| `happyhorse-1.1-t2v` | Text→Video | 10 | Last-resort T2V |
| `wan2.6-i2v` | Image→Video | 50 | **Extension engine** — last frame → next segment |
| `wan2.5-i2v-preview` | Image→Video | 50 | I2V fallback |
| `wan2.1-kf2v-plus` | Keyframes→Video | 200 | **Keyframes mode** — start/end frame animation |
| `wan2.2-t2i-flash` | Text→Image | 100 | Keyframe + poster image generation |
| `happyhorse-1.1-r2v` | Reference→Video | 10 | Reference mode |
| `wan2.1-vace-plus` | Video Edit / Reference | 50 | Edit mode — primary |
| `happyhorse-1.0-video-edit` | Video Edit | 10 | Edit mode — fallback |

Routing rules:
- The user picks a **mode** (capability), optionally a specific model. Default = "Auto" → router walks the chain for that capability.
- On **403 quota** from a model: mark pool exhausted in the ledger, move to the next model, same job continues — the user sees "switched engine", not an error.
- On task failure (bad prompt, provider error): one retry on the same model, then next model in chain, then the job fails cleanly with the real error shown.
- The `/api/models` endpoint exposes the registry + live pool state so the UI can show honest quota badges.

### 4.3 Generation flow (one reel, 15s target, text mode)

1. `POST /api/generations` { prompt, mode, aspectRatio, targetDurationSec, clientRequestId } → job `QUEUED`, `202`.
2. Worker claims the job → **SegmentPlanner** splits 15s into 3 × ~5s segments.
3. Segment 1: ModelRouter picks `wan2.1-t2v-turbo` → DashScopeClient creates task → worker polls every ~10s → on success, StorageService downloads the mp4 immediately.
4. Segments 2–3: StitchService extracts segment N's **last frame** (ffmpeg) → `wan2.6-i2v` animates from it with a continuation prompt → download.
   *(Keyframes mode instead: `wan2.2-t2i-flash` generates start/end frames → `wan2.1-kf2v-plus` animates between them per segment.)*
5. StitchService concatenates segments (ffmpeg concat, uniform 9:16 encode), generates a poster frame.
6. Job → `SUCCEEDED` with local file URLs. Frontend polls see progress per segment ("Segment 2 of 3 · wan2.6-i2v").
7. Every DashScope call is written to the `ModelUsage` ledger (model, task id, outcome) — quota state is always explainable.

### 4.4 Data model (Prisma, PostgreSQL)

- **Generation** — id, prompt, mode, requestedModel, aspectRatio, targetDurationSec, status (`QUEUED|RUNNING|STITCHING|SUCCEEDED|FAILED`), outputPath, posterPath, errorCode, errorMessage, clientRequestId (unique), createdAt, updatedAt.
- **Segment** — id, generationId, index, model (actual engine used), dashscopeTaskId, status, sourceFramePath, outputPath, durationSec.
- **ModelUsage** — model (unique), capability, quotaTotal, unitsObservedUsed, exhausted (bool), lastError, updatedAt.

### 4.5 API contract

| Endpoint | Purpose |
|---|---|
| `POST /api/generations` | Create a job (202, idempotent via clientRequestId) |
| `GET /api/generations` | Library list, newest first |
| `GET /api/generations/:id` | Job + segments (frontend polls this) |
| `POST /api/generations/:id/extend` | Add one more segment to a finished reel |
| `DELETE /api/generations/:id` | Delete job + files |
| `GET /api/models` | Registry + per-model quota state |
| `GET /files/*` | Serve stored mp4/posters |
| `GET /health` | Liveness + DashScope key presence (never the key) |

All request bodies validated with zod from `packages/shared`. Errors are one shape: `{ error: { code, message } }`.

### 4.6 Frontend (VEED design system, faithfully applied)

- **Tokens:** the supplied VEED reference becomes Tailwind v4 `@theme` tokens verbatim — lime `#96ff1a` rationed to the create action + active states only, carbon `#0c0a09` text (never pure black), fog `#e6e6e7` hairlines, mist `#f2f1f0` surfaces, onyx `#121212` dark bands. Radius discipline: 10px controls, 16px media cards, 9999px true pills. No card drop shadows — borders and surface contrast only.
- **Fonts:** Inter (SwissNow substitute) for all UI; Playfair Display (PPEditorialNew substitute) **only** for 40px+ display headlines, tight tracking, per the reference's discipline.
- **Pages:**
  - `/` — Landing: hairline nav; serif hero headline; **the AI prompt input as the hero centrepiece** (white card, 16px radius, lime circular submit) that carries the typed prompt straight into the Studio; portrait use-case cards row; onyx dark band presenting the model fleet; footer.
  - `/studio` — the working app: prompt composer, mode tabs, model picker with quota badges, aspect + duration controls, live job cards with per-segment progress, result player with Download / Extend.
  - `/library` — every generation as media cards (poster, prompt, model used, duration, status chip), click through to the player.
- **Data:** TanStack Query; job polling every 3s while anything is active; optimistic job card on submit.
- **Motion:** subtle only — hover states, progress shimmer in spring-wash, no gradient gimmicks. The reference is a calm gallery wall; the lime does the talking.

### 4.7 Code quality rules (explicit requirement)

- TypeScript `strict` in both apps; no `any` without a comment saying why.
- Layered backend: a route file never contains business logic; a service never builds URLs (the DashScope client owns that); providers are swappable behind one interface (`VideoProvider`) so a second provider (HF/Pollinations) can be added later without touching services.
- Shared zod schemas = the single source of truth for API payloads, imported by both apps.
- ESLint + Prettier configs in the repo; `.env.example` documents every variable; README with exact run steps.
- The DashScope API key lives **only** in `apps/api/.env`. The frontend has no provider keys, ever.

### 4.8 Deliverable

A ZIP of the monorepo (no `node_modules`): `apps/web`, `apps/api`, `packages/shared`, this design doc, README with setup (add key → `npm install` → `npm run dev`), `.env.example`. Runs locally: web on :3000, api on :4000, storage + SQLite created on first run. ffmpeg is the one system dependency (documented; stitch step degrades gracefully to single-segment output if absent).

### 4.9 Explicitly out of scope for v1

User accounts/auth, payments, public hosting/deploy, audio/music track generation, subtitles. Each has a drawn boundary in the design (auth middleware slot, provider interface, storage interface) so it can be added without a rewrite.

### 4.10 Decisions I need from Yaqoob

1. Approve v2 as designed (or say what to change).
2. Product name — placeholder **Reely** is in the design; give me the real name if you have one.
3. SQLite for v1 (recommended — zero setup) vs Postgres now (more infra, same schema).

---

*Implementation starts only after approval, per Yaqoob's instruction (2026-10-20).*
