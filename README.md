# AI Ride Matcher

Experimental full-stack ride-matching application built to test **TypeSafe/Jev** as a structured AI decision engine inside a real backend workflow.

Core engineering principle:

> AI recommends. Backend verifies. Database records. Application executes.

## Repository structure

```
ai-ride-matcher/
├── frontend/   Next.js + TypeScript (App Router)
├── backend/    Express + TypeScript REST API (MongoDB, Zod, JWT)
├── info.md     Product requirements and business rules
├── stack.md    Technology stack and build phases
└── AGENTS.md   Instructions for AI coding agents
```

## Requirements

- Node.js >= 20
- npm
- MongoDB (local or MongoDB Atlas)

## Backend setup

```bash
cd backend
npm install
cp .env.example .env   # fill in values
npm run dev            # http://localhost:4000
```

Health check: `GET /api/health` → `{ "status": "ok" }`

Seed development data (1 passenger + 10 drivers with varied vehicles, ratings, distances, availability):

```bash
npm run seed          # idempotent: replaces only the seed accounts
npm run seed:reset    # drops the whole database first
```

Seed logins: passenger `+15550000001 / passenger123`; drivers `+15550001001`..`+15550001010` / `driver123`.

## Testing

```bash
cd backend
npm test               # unit + integration tests
npm run typecheck:test # type-check test sources
```

Integration tests use a scratch database on `MONGODB_URI` and refuse to run unless the database name ends with `_test`.

Backend scripts:

| Script      | Purpose                    |
| ----------- | -------------------------- |
| `npm run dev`       | Run with hot reload (tsx) |
| `npm run build`     | Compile TypeScript to `dist/` |
| `npm start`         | Run compiled build |
| `npm run typecheck` | Type-check without emitting |
| `npm test`          | Unit + integration tests (local MongoDB required) |
| `npm run seed`      | Seed 1 passenger + 10 drivers |

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

Frontend scripts: `dev`, `build`, `start`, `lint`.

## Environment variables

Backend (see `backend/.env.example`):

- `PORT`, `MONGODB_URI`, `JWT_SECRET`, `TYPE_SAFE_API_KEY`, `TYPE_SAFE_MODEL`, `TYPE_SAFE_CONFIDENCE_THRESHOLD`, `OPENROUTER_API_KEY`, `DEEPSEEK_MODEL`

Frontend (see `frontend/.env.example`):

- `NEXT_PUBLIC_API_URL`

Never commit real secrets. `.env` files are gitignored.