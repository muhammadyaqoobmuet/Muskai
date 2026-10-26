# Muskai — Text to Reels Studio

Turn a sentence into a short vertical reel, publish it, and let other people watch it. Muskai is a small monorepo:

- **`apps/web`** — Next.js (App Router) + Tailwind v4 frontend: landing page, Studio, Library, community feed, creator profiles, auth.
- **`apps/api`** — Express + TypeScript API: accounts and sessions, generation queue, community feed, DashScope provider, ffmpeg stitching, PostgreSQL via Prisma.
- **`packages/shared`** — one source of truth for both apps: the model registry (with free-quota pools + fallback chains), zod schemas, and DTO types.

Video generation runs on **Alibaba Model Studio (DashScope, Singapore)** free quota. When one model's pool runs out (HTTP 403 `FreeTierOnly`), the API marks it exhausted and falls through the capability's fallback chain inside the same job. Longer reels are built from ~5s segments — each extension starts from the previous segment's last frame — and stitched with ffmpeg.

> ⚠️ The DashScope free quotas are finite and the pools expire. Keep **Stop-on-Exhaust** enabled in the Model Studio console so a drained pool can never turn into a bill.

## Setup

Prerequisites: Node.js 20+, npm, Docker (for the local database), and ffmpeg on your PATH (without it, multi-segment reels degrade to their first segment).

```bash
# 1. Start the local PostgreSQL database
docker compose up -d

# 2. Install all workspace dependencies
npm install

# 3. Configure the API key and the session secret
cp apps/api/.env.example apps/api/.env
#   → edit apps/api/.env and set DASHSCOPE_API_KEY (sk-… from Model Studio, Singapore)
#   → set SESSION_SECRET to a long random string (it signs the login cookies)
#   Optional for the web app: cp apps/web/.env.example apps/web/.env.local

# 4. Build the shared package + create the Prisma client and database tables
npm run setup        # builds @muskai/shared, then prisma generate + db push (apps/api)

# 5. Run everything
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 — `GET /health`, `GET /api/models`, media under `/files/*`

Without a key the API still boots: `/health` reports `dashscopeKeyConfigured: false` and generation jobs fail gracefully with a clear error.

## Accounts and sessions

- Sign up or sign in at `/signup` and `/login`. A session is a signed, httpOnly cookie (`muskai_session`) issued by the API; the browser never holds a token.
- Passwords are hashed with `scrypt` (`node:crypto`), salted per user. The session token is an HMAC-SHA256 over the user id and expiry, signed with `SESSION_SECRET`.
- Every generation belongs to its creator. The API scopes `/api/generations` to the signed-in user, and the web app hides `/studio` and `/library` behind a route guard.
- `GET /api/auth/me` returns `200 { "user": null }` for guests so public pages do not log a failed request.

## Community feed

- A creator publishes a finished reel from `/library`. Publishing is a single flag (`Generation.published`), so it is instant and reversible.
- `/explore` lists every published reel, newest first. The landing page shows the same feed as a compact rail.
- `/reel/<id>` plays one reel. Opening it increments `viewCount`; the like button toggles a `Like` row and updates optimistically.
- `/u/<handle>` is a creator profile with their published reels and totals.

## How quota safety works

- Every provider call is recorded in the `ModelUsage` table (+1 observed unit).
- A quota `403` marks that model `exhausted` — the router skips it from then on and the job continues on the next model in the chain.
- Retried submissions are idempotent (`clientRequestId`): the same key returns the existing job instead of creating a second one.
- DashScope result URLs expire within ~24h, so results are downloaded into `apps/api/storage/<generationId>/` the moment a task succeeds.

## API surface

### Auth

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` → `201` + user, sets the session cookie |
| POST | `/api/auth/login` | `{ email, password }` → `200` + user, sets the session cookie |
| POST | `/api/auth/logout` | Clears the session cookie |
| GET | `/api/auth/me` | `200` + `{ user }`; `user` is `null` for guests |
| PATCH | `/api/auth/me` | Update `name` or `bio` |

### Generation (requires a session)

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/api/generations` | `{ prompt, mode, modelId?, aspectRatio, targetDurationSec, media URLs…, clientRequestId }` → `202` + DTO |
| GET | `/api/generations` | Newest first, scoped to the signed-in user |
| GET | `/api/generations/:id` | One job + segment progress |
| POST | `/api/generations/:id/extend` | Add one ~5s segment to a finished reel |
| POST | `/api/generations/:id/publish` | Publish to the community feed (or unpublish) |
| DELETE | `/api/generations/:id` | Removes the job and its files |
| GET | `/api/models` | Registry + observed usage + remaining quota |
| GET | `/files/*` | Generated media (static) |
| GET | `/health` | Liveness; never requires the API key |

### Community

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/reels` | Published reels, newest first. `?handle=` filters by creator, `?limit=` caps the page |
| GET | `/api/reels/:id` | One published reel; increments `viewCount` |
| POST | `/api/reels/:id/like` | Toggles the like for the signed-in user (requires a session) |
| GET | `/api/users/:handle` | Creator profile: totals + published reels |

## Web pages

| Route | What it does |
| --- | --- |
| `/` | Landing page: hero composer, live model quota, community reel strip |
| `/explore` | The community feed |
| `/studio` | Composer + job list (session required) |
| `/library` | Your reels, publish and download (session required) |
| `/reel/[id]` | One published reel, with likes and view count |
| `/u/[handle]` | Creator profile |
| `/login`, `/signup` | Auth screens |

## UI components (shadcn + Kobra registry)

The web app uses shadcn for registry plumbing. `apps/web/components.json` points the
`@kobra` namespace at `https://kobra.systems/r/{name}.json` and reads the token from
`KOBRA_REGISTRY_TOKEN` (put it in `apps/web/.env.local`).

```bash
cd apps/web
npx shadcn@latest add @kobra/button
```

Kobra ships some components for free (`@kobra/input-otp`, `@kobra/video`,
`@kobra/carousel`, `@kobra/toast`, `@kobra/navigation-menu`, `@kobra/command-menu`,
`@kobra/ai-editor`, `@kobra/conversation`, `@kobra/halftone-dots`, `@kobra/sound`).
Everything else needs a paid token from <https://kobra.systems/dashboard>.

`@kobra/button`, `@kobra/input-dissolve`, `@kobra/tabs` and `@kobra/dropdown-menu` are
paid. Until a token is in place, the prompt fields use the in-house `DissolveTextarea`
(`src/components/ui/DissolveTextarea.tsx`), which does the same job: the spent value
blurs, lifts and fades, then the field clears; the Studio mode switcher uses the
in-house `Tabs` (`src/components/ui/Tabs.tsx`) with a sliding pill and arrow-key
navigation; and the header user menu in `Nav.tsx` has the menu keyboard contract
(focus on open, arrows/Home/End, Escape returns to the trigger). Swapping any of them
for the Kobra item is a one-file change.

Registry components install into `src/components/shadcn/` (the `ui` alias in
`components.json`), so they never collide with the hand-built Muskai components in
`src/components/ui/`. The shadcn token names (`--background`, `--primary`, `--ring`,
...) are bridged onto the Muskai ramp in `src/app/globals.css`, so a registry
component inherits the light canvas, ink ramp and single blue accent.

## Notes & limits

- DashScope must fetch image inputs by URL. Locally generated frames (extensions, generated keyframes) are sent to DashScope as base64 data URIs; if a model rejects those, expose the API publicly (e.g. a tunnel) and set `PUBLIC_FILES_BASE_URL` in `apps/api/.env`.
- Segment duration is fixed at ~5s (the reliable per-call duration); target durations are 5/10/15/20s.
- `SESSION_SECRET` must be set in production. Changing it invalidates every session.
- `WEB_ORIGIN` is the one browser origin allowed to call the API with cookies. Add preview or second-port origins with `EXTRA_WEB_ORIGINS` (comma separated).
