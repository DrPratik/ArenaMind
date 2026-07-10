# ArenaMind 🏟️🧠

**A GenAI-enabled smart stadium operations copilot for the FIFA World Cup 2026.**

ArenaMind enhances stadium operations and the tournament experience across
**fans, organizers, and volunteers** through a unified AI assistant powered by
deterministic rules and Gemini function calling. Every response is **grounded
in verified stadium data** — the AI never invents facilities, routes, or
severity levels.

Modelled venue: **MetLife Stadium** (FIFA name *New York New Jersey Stadium*),
host of the 2026 Final. Languages: **English, Spanish, Portuguese, French,
Hindi, Arabic** — the response is fully localized in the fan's chosen language.

> **🌐 Live demo:** [`https://arenamind.onrender.com`](https://arenamind.onrender.com)
> — deployed as a monolithic Express + React build on Render.

---

## 1. Problem Statement Alignment

> *Build a GenAI-enabled solution that enhances stadium operations and the
> overall tournament experience for fans, organizers, volunteers, or venue
> staff.*

ArenaMind explicitly addresses **every** target area specified in the challenge:

| Problem Statement Area | ArenaMind Feature | Implementation |
|---|---|---|
| **Navigation** | Personalized step-by-step routing from e-ticket gate assignment | `server/src/rules/routes.ts` — pre-computed routes with turn-by-turn directions |
| **Accessibility** | Wheelchair-accessible routes, step-free paths, prayer rooms, nursing rooms | `server/src/rules/routes.ts` (mode=`wheelchair`), `server/src/db/seed.ts` (facilities) |
| **Crowd Management** | Real-time SVG heatmap + 30-min predictive crowd forecaster | `server/src/rules/crowd.ts` — linear trend extrapolation over time-series data |
| **Multilingual Assistance** | 6 languages (EN/ES/PT/FR/HI/AR) with Web Speech API voice input | `client/src/components/fan/ChatPanel.tsx`, `server/src/ai/prompts.ts` |
| **Operational Intelligence** | Organizer dashboard with Ops Assistant for natural-language directives | `server/src/api/organizer.ts`, `client/src/components/dashboard/` |
| **Real-time Decision Support** | Overload risk assessment with severity matrices and action items | `server/src/rules/crowd.ts` — `getOverloadRisk()` |
| **Sustainability** | Rules-first architecture minimizes LLM calls → reduced compute/energy usage | `server/src/ai/gemini.ts` — MockLLM fallback when Gemini is unavailable |
| **Transportation** | In-venue navigation with `less_crowded` mode that avoids congested concourses | `server/src/rules/routes.ts` (mode=`less_crowded`) |
| **Incident Triage** | AI-powered incident classification (P1-P4) with auto-department assignment | `server/src/rules/incidents.ts` — deterministic severity matrix |

---

## 2. Approach — "Rules Decide, the LLM Only Phrases"

The core design principle is **deterministic decisions first, language model last**:

```
UserQuery ──▶ Sanitize ──▶ Gemini (intent + tool selection)
                                    │
                                    ▼
                          Rules Engine (deterministic)
                          • pick facility    • route steps
                          • crowd forecast   • severity matrix
                          • accessibility    • department assignment
                                    │
                                    ▼
                          Resolved Facts (JSON)
                                    │
                                    ▼
                          Gemini (phrasing only) ──▶ Localized Response
```

1. **The rules engine resolves every fact** — the target facility, the route
   (pre-computed graph), the crowd forecast (time-series extrapolation), the
   incident priority (severity matrix), and any accessibility accommodations —
   using **only structured data**. No LLM is involved in any decision.

2. **The LLM only phrases/translates** those already-resolved facts into
   natural language in the requested language. It is explicitly forbidden
   (via a strict, delimited system prompt) from inventing facilities or
   following instructions embedded in user text. This **grounding prevents
   hallucination**.

3. If Gemini is unavailable (no API key, quota exceeded, network error),
   the app **transparently falls back** to a deterministic `MockLLM` with
   offline EN/ES/PT/FR/HI/AR templates — **no LLM call at all**.

### Rules Implemented

| Rule | Behaviour |
|------|-----------|
| Wheelchair route | Only **step-free** routes (mode=`wheelchair`) |
| Less crowded route | Alternate paths avoiding high-traffic concourses |
| Crowd forecast | Linear trend extrapolation over 60-min time-series → predicts level N minutes ahead |
| Overload risk | If trend is `rising` and forecasted `critical`, generates SEVERE alert with action items |
| Incident severity | `medical` → P1, `security` → P2, `maintenance`/`crowd` → P3, `other` → P4 |
| Department routing | Auto-assigns Medical Team, Security Team, Facilities Maintenance based on type |
| Dietary filtering | SQL `LIKE` filtering across comma-separated cuisine tags (halal, veg, gluten_free) |
| Nearest amenity | Euclidean distance calculation from fan's gate to all amenities of requested type |
| Multilingual intent | Keyword detection in EN/ES/PT/FR/HI/AR for offline MockLLM fallback |

---

## 3. Architecture & Software Principles

The codebase is engineered according to **SOLID principles** and Clean Architecture:

- **Single Responsibility (SRP):** Each rules module (`crowd.ts`, `routes.ts`, `incidents.ts`, `food.ts`, `gates.ts`) handles exactly one domain concern.
- **Open/Closed Principle:** New tools can be added to `ai/tools.ts` without modifying `ai/gemini.ts` — the tool execution switch is the only extension point.
- **Dependency Inversion:** All rules functions accept a `DatabaseSync` handle, making them fully testable with in-memory SQLite databases.
- **Controller/Service Pattern:** Express API routes (controllers) delegate all business logic to isolated rules modules (services).
- **Defensive Programming:** Zod schema validation on all inputs, SQL parameterization, input sanitization (`utils/sanitize.ts`), and MockLLM fallback ensure the system degrades gracefully.
- **Centralized Configuration:** All environment variables are validated and typed in a single `config.ts` module — no scattered `process.env` reads.
- **Structured Logging:** JSON-formatted logging via `utils/logger.ts` for production log aggregation.

### Project Structure

```
ArenaMind/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── fan/           # Fan-facing chat, voice input, match countdown
│       │   ├── dashboard/     # Organizer heatmap, forecaster, ops assistant
│       │   └── shared/        # Header, role selector, language picker
│       ├── hooks/             # useChat, useCrowd, useTournament
│       └── api/client.ts      # Type-safe API client
├── server/                    # Express + SQLite backend
│   └── src/
│       ├── ai/                # Gemini orchestration, prompts, tools, MockLLM
│       ├── api/               # Express route handlers + Zod validation
│       ├── db/                # Schema, seed data, connection management
│       ├── rules/             # Deterministic business logic (crowd, routes, etc.)
│       ├── middleware/        # Rate limiter
│       ├── services/          # Tournament data fetching + caching
│       ├── utils/             # Logger, sanitization
│       ├── tests/             # Vitest test suite (8 test files)
│       ├── config.ts          # Centralized typed configuration
│       └── types.ts           # Shared TypeScript interfaces
├── .github/workflows/ci.yml  # GitHub Actions CI pipeline
├── Dockerfile                 # Production container image
└── README.md
```

---

## 4. How It Works — Setup & Run

### Prerequisites

- **Node.js 22+** (required for native `node:sqlite` support)
- npm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/DrPratik/ArenaMind.git
cd ArenaMind

# Install all dependencies (monorepo workspaces)
npm install

# Create environment file (all optional — app runs fully offline)
cp .env.example .env
# Add GEMINI_API_KEY if you want live AI phrasing

# Start both frontend (Vite) and backend (Express) in development
cd server && npm run dev    # Terminal 1: backend on :3001
cd client && npm run dev    # Terminal 2: frontend on :5173
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `GEMINI_API_KEY` | Enables live Gemini phrasing. **Absent → offline MockLLM.** | *(unset)* |
| `GEMINI_MODEL` | Gemini model identifier | `gemini-3.1-flash-lite` |
| `FOOTBALL_DATA_API_KEY` | Live tournament data from football-data.org | *(unset — uses seed data)* |
| `PORT` | HTTP port | `3001` |
| `RATE_LIMIT_MAX` | Max requests per window | `30` |
| `NODE_ENV` | Environment mode | `development` |

> 🔐 The app runs **fully offline without any key**: if `GEMINI_API_KEY` is unset,
> it transparently falls back to a deterministic `MockLLM`, so it never crashes.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ask` | Fan/Volunteer AI chat (body: role, message, language) |
| `GET` | `/api/crowd` | All gate crowd levels for heatmap |
| `POST` | `/api/crowd/admin` | Update a gate's crowd level (organizer) |
| `GET` | `/api/incident` | List incidents (filterable by status, priority) |
| `POST` | `/api/incident` | File a new incident |
| `PATCH` | `/api/incident/:id/status` | Update incident status |
| `GET` | `/api/tournament` | Match schedule and scores |
| `GET` | `/api/ticket/scan/:qrPayload` | QR ticket validation |
| `GET` | `/api/organizer/query` | Natural-language organizer query |
| `GET` | `/api/organizer/briefing` | Auto-generated ops briefing |
| `GET` | `/api/health` | Health check with AI mode info |

---

## 5. Testing

A comprehensive test suite (8 test files, 25+ test cases) verifies the
deterministic business logic, security defences, and input sanitization:

```bash
cd server && npm test
```

| Test File | Coverage |
|-----------|----------|
| `crowd.test.ts` | Crowd trend calculation, overload risk severity, stable/low crowd handling |
| `security.test.ts` | Prompt injection, SQL injection, XSS, role bypass, tool access control (5 cases) |
| `routes.test.ts` | Standard, wheelchair, and missing route resolution |
| `food.test.ts` | Dietary preference filtering (halal, veg, gluten-free) |
| `incidents.test.ts` | Priority classification (P1-P4), department assignment |
| `gates.test.ts` | Gate status queries, accessibility flags, coordinate data |
| `sanitize.test.ts` | Control char stripping, whitespace collapse, length caps, injection detection |

All tests use **in-memory SQLite databases** (`:memory:`) for complete
isolation — no test depends on external services or persistent state.

---

## 6. Security

| Layer | Defence |
|-------|---------|
| Input validation | Zod schemas reject malformed requests before they reach business logic |
| Input sanitization | `sanitize.ts` strips control chars, caps length, collapses whitespace |
| SQL injection | All queries use parameterized prepared statements (`?` placeholders) |
| Prompt injection | System prompt with strict delimiters + role-based tool filtering |
| XSS | React auto-escapes all rendered text; raw HTML is never injected |
| Rate limiting | In-memory token-bucket limiter prevents API abuse |
| RBAC | Fans cannot access organizer tools; tool declarations are role-filtered |
| Helmet | HTTP security headers (CSP, X-Frame-Options, etc.) |

---

## 7. Deployment

### Render (Current)

The app is deployed as a monolithic build on Render. Express serves the
Vite-built React frontend and all API endpoints from a single process.

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Set `GEMINI_API_KEY` in Render Environment Variables
- **Node Version:** Set `NODE_VERSION=22` in Render Environment Variables

### Docker

```bash
docker build -t arenamind .
docker run -p 3001:3001 -e GEMINI_API_KEY=your_key arenamind
```

### CI/CD

GitHub Actions runs on every push to `main`:
1. Checks out code
2. Installs dependencies
3. Builds client + server (TypeScript strict mode)
4. Runs the full test suite

---

## 8. Assumptions

- Stadium map, facilities, and base crowd levels are **illustrative** —
  modelled after MetLife Stadium's real layout with 8 gates and 32 sections.
- Crowd data is simulated via time-series seeds; in production this would
  connect to real IoT sensors or turnstile counts.
- Tournament fixtures use FIFA World Cup 2026 group-stage matchday data
  with `football-data.org` live scores as an optional enhancement.
- The single-venue design is intentional — the architecture scales to
  multi-venue by partitioning the SQLite database per stadium.

---

## 📄 License

MIT — see [LICENSE](./LICENSE).
