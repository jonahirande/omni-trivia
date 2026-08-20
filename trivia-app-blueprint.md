# Trivia App — Full Architectural Blueprint

*Prepared as a Senior Full-Stack Engineer / Lead Product Designer working document.*

---

## 1. Tech Stack & System Architecture

### 1.1 Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile | **React Native (Expo, bare workflow after MVP)** | Single codebase for iOS/Android, huge ecosystem for animations (Reanimated, Lottie for kids-mode UI), OTA updates via EAS, easy Socket.io client integration. Flutter is a valid alternative if your team is more comfortable with Dart and wants pixel-perfect custom rendering — but RN wins on hiring pool + JS code-sharing with your backend/web admin panel. |
| Realtime | **Socket.io** (over raw WebSocket) | Built-in room abstraction (perfect for Live Quiz rooms), automatic reconnection/fallback, acknowledgement callbacks for answer submission receipts. |
| Backend API | **Node.js + Express (or Fastify)**, TypeScript | Shares types with RN client via a shared `packages/types` workspace (monorepo). Fastify if you want lower overhead at scale; Express if you want ecosystem maturity. |
| Primary DB | **PostgreSQL** | Relational integrity for users, questions, adventure progression, foreign-keyed leaderboards. Use **Prisma** or **Drizzle ORM** for type-safe queries shared with TS backend. |
| Cache / Leaderboards / Live State | **Redis** | Sorted Sets (`ZADD`/`ZRANGE`) for Global, Country, and Live Room leaderboards; Pub/Sub or Redis Streams to fan out live-room events across multiple Socket.io server instances (via `socket.io-redis-adapter`); short-TTL keys for "lives/energy" cooldown timers in Adventure Mode. |
| Media Storage | **S3-compatible object storage (AWS S3 / Cloudinary)** | Question images and audio clips (Music Trivia) stored as URLs in Postgres, served via CDN (CloudFront). Cloudinary preferred if you want on-the-fly image resizing for low-bandwidth Nigerian users. |
| Background Jobs | **BullMQ (Redis-backed)** | Question moderation queue, leaderboard recompute jobs, push-notification dispatch (streaks, "energy refilled"), nightly analytics rollups. |
| Auth | **Firebase Auth or Auth0**, custom JWT session on top | Social login (Google/Apple) + email, plus a **Kids Mode parental gate** (PIN or simple math challenge before entering Kids Mode / before purchases). |
| Push Notifications | **Firebase Cloud Messaging** | Streak reminders, live-tournament start alerts. |
| Infra | **Docker + AWS ECS/Fargate (or Render/Railway for MVP)**, Postgres via RDS, Redis via Elasticache | Start on a single modular monolith; split out the "Live Quiz" websocket service first if you need independent horizontal scaling (it has different scaling characteristics than the REST API). |
| Observability | **Sentry (errors) + Grafana/Prometheus or Datadog (metrics)** | Watch Socket.io connection counts and Redis latency closely — these are your two failure points under load. |

### 1.2 High-Level Architecture

```
┌──────────────────┐        ┌──────────────────┐
│  RN Mobile App    │        │  Admin Web Panel  │
│ (iOS / Android)   │        │ (React/Next.js)   │
└────────┬──────────┘        └─────────┬─────────┘
         │ REST (auth, profile, shop)   │ REST/GraphQL (question CMS)
         │ WebSocket (live quiz)        │
         ▼                              ▼
┌────────────────────────────────────────────────┐
│            API Gateway / Load Balancer          │
└───────────────┬───────────────────┬─────────────┘
                 │                   │
        ┌────────▼────────┐ ┌────────▼─────────┐
        │  REST API Svc    │ │ Realtime Svc      │
        │ (Express/Fastify)│ │ (Socket.io +      │
        │                  │ │  redis-adapter)   │
        └────────┬─────────┘ └────────┬──────────┘
                  │                    │
        ┌─────────▼────────┐ ┌─────────▼─────────┐
        │   PostgreSQL      │ │      Redis         │
        │ (source of truth) │ │ (leaderboards,      │
        │                   │ │  live room state,    │
        │                   │ │  pub/sub fan-out)    │
        └───────────────────┘ └──────────────────────┘
                  │
        ┌─────────▼────────┐        ┌───────────────┐
        │  S3 / Cloudinary  │        │  BullMQ Worker │
        │ (images, audio)   │        │ (jobs/queues)  │
        └───────────────────┘        └───────────────┘
```

**Key architectural decisions:**
- **Modular monolith first.** Don't over-engineer microservices at launch — split the codebase into clear modules (`auth`, `catalog`, `adventure`, `live-quiz`, `leaderboards`) inside one deployable, but keep the Realtime service as a *separate process* from day one since it scales differently (long-lived connections vs. stateless request/response).
- **Redis is the source of truth for anything time-sensitive** (live room state, current question timer, lives/energy countdown). Postgres persists the durable record after the fact (match results, XP earned).
- **Multi-instance Socket.io** needs the Redis adapter from day one if you plan more than one server instance — otherwise players in the same room but connected to different server instances won't see each other's answers.

---

## 2. Database Schema

Using PostgreSQL DDL (works directly with Prisma/Drizzle migrations too).

### 2.1 Users & Profiles

```sql
CREATE TYPE account_type AS ENUM ('standard', 'kids');
CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple');

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) UNIQUE,
    username          VARCHAR(30) UNIQUE NOT NULL,
    display_name      VARCHAR(50),
    avatar_url        TEXT,
    country_code      CHAR(2),                     -- ISO 3166-1 alpha-2, drives Country Leaderboard
    account_type      account_type NOT NULL DEFAULT 'standard',
    parent_user_id     UUID REFERENCES users(id),   -- links a kids sub-profile to a parent account
    auth_provider     auth_provider NOT NULL DEFAULT 'email',
    password_hash     TEXT,                         -- null for social logins
    xp_total          INTEGER NOT NULL DEFAULT 0,
    coins_balance     INTEGER NOT NULL DEFAULT 0,
    lives_current     SMALLINT NOT NULL DEFAULT 5,
    lives_refill_at   TIMESTAMPTZ,                   -- when next life regenerates
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at    TIMESTAMPTZ,
    is_banned         BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE user_settings (
    user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    input_mode        VARCHAR(20) NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice' | 'direct_input'
    sound_enabled     BOOLEAN NOT NULL DEFAULT true,
    preferred_categories UUID[] DEFAULT '{}',
    notif_streak_reminder BOOLEAN NOT NULL DEFAULT true
);
```

### 2.2 Categories & Questions

```sql
CREATE TABLE categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug          VARCHAR(50) UNIQUE NOT NULL,       -- 'football', 'nigerian_history', etc.
    name          VARCHAR(100) NOT NULL,
    icon_url      TEXT,
    is_kids_safe  BOOLEAN NOT NULL DEFAULT false,     -- whitelist for Kids Mode
    sort_order    SMALLINT DEFAULT 0
);

CREATE TYPE question_media_type AS ENUM ('text', 'image', 'audio');
CREATE TYPE difficulty_level AS ENUM ('starter', 'easy', 'medium', 'hard', 'expert', 'pro');

CREATE TABLE questions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id       UUID NOT NULL REFERENCES categories(id),
    difficulty        difficulty_level NOT NULL,
    media_type        question_media_type NOT NULL DEFAULT 'text',
    prompt_text       TEXT NOT NULL,
    media_url         TEXT,                          -- image or audio clip URL (S3/Cloudinary)
    audio_clip_start_ms INTEGER,                      -- for "guess the song" snippet start
    audio_clip_duration_ms INTEGER,
    correct_answer    TEXT NOT NULL,                  -- canonical answer, used for direct-input matching
    accepted_variants TEXT[] DEFAULT '{}',             -- alt spellings for direct-input fuzzy match
    explanation       TEXT,                            -- shown after answering (edu value)
    is_kids_safe      BOOLEAN NOT NULL DEFAULT false,
    time_limit_sec    SMALLINT NOT NULL DEFAULT 15,
    base_points       INTEGER NOT NULL DEFAULT 100,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_by        UUID REFERENCES users(id),       -- admin/content team
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_options (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id   UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text   TEXT NOT NULL,
    option_image_url TEXT,                            -- for visual MCQ (kids mode)
    is_correct    BOOLEAN NOT NULL DEFAULT false,
    sort_order    SMALLINT DEFAULT 0
);

CREATE INDEX idx_questions_category_difficulty ON questions(category_id, difficulty) WHERE is_active;
```

### 2.3 Adventure Mode

```sql
CREATE TABLE adventure_worlds (       -- optional grouping, e.g. per category
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID NOT NULL REFERENCES categories(id),
    name          VARCHAR(100) NOT NULL,
    sort_order    SMALLINT DEFAULT 0
);

CREATE TABLE adventure_stages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id          UUID NOT NULL REFERENCES adventure_worlds(id),
    stage_number      INTEGER NOT NULL,               -- global ordering, 1..N
    difficulty        difficulty_level NOT NULL,       -- maps to the 6 tiers
    question_count    SMALLINT NOT NULL DEFAULT 10,
    pass_threshold_pct SMALLINT NOT NULL DEFAULT 70,   -- % correct to pass/unlock next
    energy_cost       SMALLINT NOT NULL DEFAULT 1,
    star_thresholds   INTEGER[] NOT NULL DEFAULT '{70,85,100}', -- % for 1/2/3 stars
    unlock_stage_id   UUID REFERENCES adventure_stages(id), -- prerequisite
    UNIQUE(world_id, stage_number)
);

CREATE TABLE stage_questions (        -- explicit mapping OR use dynamic pool by category+difficulty
    stage_id      UUID NOT NULL REFERENCES adventure_stages(id) ON DELETE CASCADE,
    question_id   UUID NOT NULL REFERENCES questions(id),
    sort_order    SMALLINT DEFAULT 0,
    PRIMARY KEY (stage_id, question_id)
);

CREATE TABLE user_stage_progress (
    user_id           UUID NOT NULL REFERENCES users(id),
    stage_id          UUID NOT NULL REFERENCES adventure_stages(id),
    stars_earned      SMALLINT NOT NULL DEFAULT 0,
    best_score_pct    SMALLINT NOT NULL DEFAULT 0,
    is_unlocked       BOOLEAN NOT NULL DEFAULT false,
    is_completed      BOOLEAN NOT NULL DEFAULT false,
    completed_at      TIMESTAMPTZ,
    PRIMARY KEY (user_id, stage_id)
);
```

### 2.4 Live Multiplayer

```sql
CREATE TABLE live_rooms (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code     VARCHAR(8) UNIQUE NOT NULL,          -- shareable join code
    category_id   UUID REFERENCES categories(id),
    difficulty    difficulty_level,
    host_user_id  UUID REFERENCES users(id),
    status        VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting|active|finished
    max_players   SMALLINT NOT NULL DEFAULT 8,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at      TIMESTAMPTZ
);

CREATE TABLE live_room_results (      -- persisted AFTER the room ends; live state itself lives in Redis
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id         UUID NOT NULL REFERENCES live_rooms(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    final_score     INTEGER NOT NULL,
    correct_count   SMALLINT NOT NULL,
    avg_response_ms INTEGER,
    placement       SMALLINT,                          -- 1st, 2nd, 3rd...
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5 High Scores / Leaderboards (Postgres durable log; Redis for hot reads)

```sql
CREATE TYPE game_mode AS ENUM ('quick_play', 'adventure', 'live_multiplayer');

CREATE TABLE match_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    game_mode       game_mode NOT NULL,
    category_id     UUID REFERENCES categories(id),
    stage_id        UUID REFERENCES adventure_stages(id), -- null unless adventure
    room_id         UUID REFERENCES live_rooms(id),        -- null unless live
    score           INTEGER NOT NULL,
    input_mode      VARCHAR(20) NOT NULL,                   -- multiple_choice | direct_input
    played_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_results_leaderboard ON match_results(game_mode, category_id, score DESC);
```

**Leaderboard read pattern:** every `match_results` insert also fires a Redis `ZADD leaderboard:global:{mode} {score} {user_id}` (and a country-scoped key `leaderboard:country:{code}:{mode}`). Postgres remains the audit trail / source of truth for recomputation if Redis is ever flushed; Redis serves all read traffic (`ZREVRANGE ... WITHSCORES`) since leaderboard reads happen far more often than writes.

---

## 3. Speed-Scoring Algorithm & Real-Time Payloads

### 3.1 Time-Decay Scoring Formula

Goal: reward speed without punishing correctness — a right answer at 90% of the time limit should still beat a wrong answer, and the decay curve shouldn't feel punishing near the deadline.

```
score = basePoints * (minFraction + (1 - minFraction) * (remainingTime / timeLimit) ^ decayExponent)
```

- `basePoints` — per-question base value (from `questions.base_points`, e.g. 100).
- `remainingTime` — seconds left when the answer was submitted, clamped to `[0, timeLimit]`.
- `minFraction` — floor so a last-second correct answer still earns something (recommend `0.3`, i.e. 30%).
- `decayExponent` — controls curve shape; `1.0` = linear decay, `>1` = punishes lateness harder near the end, `<1` = more forgiving early, sharper at the very end. Recommend `1.3` for a "still fair but rewards quick fingers" feel.
- **Direct Input multiplier**: apply `* 1.5` (configurable) on top of the decayed score for players using "Direct Input / No Options" mode, since it's strictly harder.

```javascript
function calculateScore({ basePoints, timeLimitSec, remainingTimeSec, isCorrect, inputMode }) {
  if (!isCorrect) return 0;

  const MIN_FRACTION = 0.3;
  const DECAY_EXPONENT = 1.3;
  const DIRECT_INPUT_MULTIPLIER = 1.5;

  const clampedRemaining = Math.max(0, Math.min(remainingTimeSec, timeLimitSec));
  const timeFraction = clampedRemaining / timeLimitSec;

  const decayFactor = MIN_FRACTION + (1 - MIN_FRACTION) * Math.pow(timeFraction, DECAY_EXPONENT);
  let score = Math.round(basePoints * decayFactor);

  if (inputMode === 'direct_input') {
    score = Math.round(score * DIRECT_INPUT_MULTIPLIER);
  }

  return score;
}
```

**Server-authoritative timing is critical:** the client sends its submission, but the server computes `remainingTimeSec` using `questionStartedAt` (a server timestamp broadcast when the question opened) vs. `Date.now()` on receipt — never trust a client-reported elapsed time, or players will spoof near-instant answers.

### 3.2 WebSocket Event Contract (Socket.io)

**Namespace:** `/live-quiz`, rooms keyed by `room:{roomId}`.

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `room:join` | `{ roomCode, userId }` |
| Server → Room | `room:playerJoined` | `{ userId, username, avatarUrl, playerCount }` |
| Server → Room | `room:playerList` | `{ players: [{userId, username, ready}] }` |
| Client → Server | `player:ready` | `{ userId }` |
| Server → Room | `question:start` | `{ questionId, prompt, mediaUrl, options[], timeLimitSec, serverStartTs }` |
| Client → Server | `answer:submit` | `{ questionId, userId, selectedOptionId \| typedAnswer, clientSentTs }` |
| Server → Client (ack) | `answer:received` | `{ questionId, received: true }` — immediate ack, no result yet |
| Server → Room | `question:end` | `{ questionId, correctOptionId, correctAnswerText }` |
| Server → Room | `leaderboard:update` | `{ roomId, standings: [{userId, username, roundScore, totalScore, rank}] }` |
| Server → Room | `match:end` | `{ roomId, finalStandings[], resultId }` |
| Server → Client | `error` | `{ code, message }` (e.g. `ROOM_FULL`, `ALREADY_ANSWERED`) |

### 3.3 Server-Side Handling (sketch)

```javascript
// server: on question start, stamp the authoritative start time
io.to(`room:${roomId}`).emit('question:start', {
  questionId: q.id,
  prompt: q.promptText,
  mediaUrl: q.mediaUrl,
  options: q.options,
  timeLimitSec: q.timeLimitSec,
  serverStartTs: Date.now(),          // client uses this to render its own countdown
});

// per-question in-memory/Redis state
await redis.set(`room:${roomId}:q:${q.id}:startTs`, Date.now(), 'EX', q.timeLimitSec + 5);

socket.on('answer:submit', async ({ questionId, userId, selectedOptionId, typedAnswer }) => {
  const alreadyAnswered = await redis.sismember(`room:${roomId}:q:${questionId}:answered`, userId);
  if (alreadyAnswered) return socket.emit('error', { code: 'ALREADY_ANSWERED' });

  const startTs = Number(await redis.get(`room:${roomId}:q:${questionId}:startTs`));
  const elapsedSec = (Date.now() - startTs) / 1000;        // SERVER-measured elapsed time
  const remainingTimeSec = question.timeLimitSec - elapsedSec;

  const isCorrect = checkAnswer(question, selectedOptionId, typedAnswer);
  const points = calculateScore({
    basePoints: question.basePoints,
    timeLimitSec: question.timeLimitSec,
    remainingTimeSec,
    isCorrect,
    inputMode: player.inputMode,
  });

  await redis.sadd(`room:${roomId}:q:${questionId}:answered`, userId);
  await redis.zincrby(`room:${roomId}:scores`, points, userId);
  socket.emit('answer:received', { questionId, received: true, pointsPreview: points });

  const standings = await redis.zrevrange(`room:${roomId}:scores`, 0, -1, 'WITHSCORES');
  io.to(`room:${roomId}`).emit('leaderboard:update', { roomId, standings: formatStandings(standings) });
});
```

**Notes:**
- Use `socket.io-redis-adapter` so this works correctly across multiple server instances — `io.to(room)` will fan out via Redis Pub/Sub to all instances.
- Each question's countdown lives entirely server-side; clients only *render* a countdown from `serverStartTs` + `timeLimitSec`, they never decide when time is up.
- On `match:end`, batch-write the round to `match_results` (Postgres) and `live_room_results`, then fire the same leaderboard-write path used by Quick Play/Adventure so Global/Country boards stay consistent across all three modes.

---

## 4. UI/UX Strategy

### 4.1 Core Screen Flow (Standard Mode)

```
Splash → Auth (or Guest) → Home
                              ├─ Quick Play → Category Picker → Difficulty (optional) → Play → Results → Home
                              ├─ Adventure  → World Map (stage nodes, lives indicator) → Stage Intro → Play → Stars/Rewards → Map
                              ├─ Live Quiz  → Create/Join Room → Lobby (player list, ready-up) → Countdown → Live Play → Live Leaderboard → Final Results
                              └─ Leaderboards → Tabs: Global | Country | (Live, contextual during a match)
Settings (always accessible): Input Toggle (MCQ/Direct), Sound, Account, Kids Mode switch (parental gate)
```

### 4.2 Kids Mode vs. Standard Mode

| Dimension | Standard Mode | Kids Mode (Ages 5–12) |
|---|---|---|
| Entry | Direct from Home | Requires parental gate (simple math challenge or PIN) to **enter or exit** |
| Vocabulary | Full complexity, idioms okay | Simplified sentence structure, short prompts, no idioms |
| Question format | Text-heavy fine | Image/visual-heavy by default (`media_type = image` preferred), audio narration of the question optional |
| Touch targets | Standard 44pt minimum | 64pt+ minimum, generous spacing, no fine-motor precision required |
| Timer | Strict, drives speed-scoring | **No hard penalty** — extended/soft timer, a gentle visual nudge (friendly character) rather than a countdown clock ticking down |
| Feedback on wrong answer | Score impact, "Incorrect" | No score penalty; warm, encouraging copy ("Nice try! The answer was…") with the explanation always shown |
| Color/tone | Competitive, sleek, dark-mode friendly | Bright, high-contrast, rounded shapes, mascot-driven |
| Categories available | All | Curated whitelist only (`categories.is_kids_safe = true`) — excludes Politics, and Bible/Religion or Nigerian/World History content is filtered to age-appropriate question sets |
| Live Multiplayer | Full speed-based competitive | Recommend **disabling or heavily softening** live speed-competition for the youngest band (5–8); async "Kids Adventure" only. If enabled for 9–12, remove visible countdown pressure and de-emphasize leaderboard rank in favor of "stars collected" |
| Leaderboards | Global/Country rank, competitive framing | Optional, off by default; if shown, frame as personal-best/streak tracking rather than public ranking |
| Purchases/Ads | Standard IAP/ad flow | No ads, no IAP inside Kids Mode session (COPPA/GDPR-K compliance) — all purchases happen from the parent's Standard account settings |

### 4.3 Key Screens to Design First (MVP priority)

1. **Home** — mode selector (3 big cards: Quick Play / Adventure / Live), streak + lives indicator, category shortcuts.
2. **Adventure World Map** — vertical/winding path of stage nodes (locked/unlocked/completed-with-stars), matches the 6 difficulty tiers as visually distinct "worlds" or zones.
3. **Question Screen** — the single most-used screen; needs both MCQ layout and Direct Input layout as variants, plus image/audio question variants, plus a distinct Kids Mode skin.
4. **Live Lobby** — room code, player avatars joining in real time, "Ready" button, host controls.
5. **Live Play + Real-time Leaderboard sidebar/overlay** — score deltas animate in as opponents answer.
6. **Results/Post-Match** — score breakdown (base points earned vs. speed bonus vs. direct-input multiplier), XP/coins earned, share button.
7. **Leaderboard hub** — Global/Country tabs, filter by game mode, "your rank" pinned row.
8. **Parental Gate + Kids Mode toggle** — must be a genuine friction point (not bypassable by a child), per COPPA-style norms.

### 4.4 Accessibility & Localization Notes

- Nigerian audience skew (per your category list) → prioritize **low-bandwidth image compression** and **offline-friendly Adventure Mode** (cache next 2–3 stages' questions locally) since connectivity is inconsistent.
- Support at least English first; structure `questions.prompt_text` and category names for future i18n (don't hardcode strings).
- Audio questions (Music Trivia) need a **transcript/caption fallback** for accessibility and for silent-environment play.

---

## 5. Product Roadmap

### Phase 1 — MVP (Weeks 1–8)
- Auth (email + Google/Apple), core Users/Questions schema, Category CMS (admin panel, even basic).
- **Quick Play only**, Standard Mode, MCQ input, 4–5 launch categories (Science, Geography, Football, General Knowledge, Nigerian History).
- Global + Country leaderboard (Redis-backed).
- Basic Kids Mode toggle with a curated 1-category question set to validate the concept, not full build-out.

### Phase 2 — Adventure Mode (Weeks 9–14)
- 6-tier stage system, world map UI, lives/energy mechanic, stars/rewards.
- Direct Input toggle + score multiplier.
- Push notifications for streaks/life-refill.

### Phase 3 — Live Multiplayer (Weeks 15–22)
- Socket.io realtime service, Redis adapter, room creation/join-by-code, speed-scoring engine as specified above.
- Live Room Scoreboard UI, post-match results, matchmaking (random opponents) as a stretch goal beyond friend-code rooms.

### Phase 4 — Content & Retention Expansion (Weeks 23+)
- Remaining categories (Music & Audio, Other Sports, Tech & Innovation, Bible & Religion, Politics, World History).
- Full Kids Mode build-out (visual questions, mascot, parental dashboard with progress reports).
- Social features: friends, challenges, tournaments/seasons, cosmetic rewards shop (coins).
- Analytics-driven difficulty tuning (track per-question accuracy/response time to auto-flag miscalibrated difficulty tags).

---

### Open Decisions to Confirm With Stakeholders
- Flutter vs React Native — confirm based on existing team skillset.
- Kids Mode as separate app vs. in-app mode (separate app stores better for App Store Kids Category compliance, but fragments your codebase and user base).
- Monetization model (ads vs. subscription vs. cosmetic IAP) — affects the `coins_balance`/shop schema not yet detailed here.
- Matchmaking for Live Quiz — friend-only rooms are simple; skill-based public matchmaking is a significantly bigger scope item worth its own design pass.
