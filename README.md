# 👛 FinBuddy — Student Finance & Smart Budgeting Platform

> **Your money. Your goals. Your smarter future.**

FinBuddy helps college students track income and expenses, build monthly budgets, reach savings goals and
understand their habits — with **Finny**, a wallet mascot who reacts to your spending and answers questions
using your *real* data. It doubles as a Full-Stack + DevOps academic project (Docker, tests, CI/CD, health checks).

## Features
Landing page · Register/Login (JWT + bcrypt) · Dashboard with live totals, **financial health score**, spending chart
(week / month / last month), budget bars with 80 % warning and 100 % danger states · Expenses & Income CRUD with search,
filters, sort · Monthly budgets with budget-vs-actual · Savings goals with estimated completion date ·
Insights (trend, donut, income-vs-expense, savings area chart, top categories, averages) · Notification centre
(auto budget alerts, goal progress) · **Finny chatbot** (floating on every page + full page; AI API with rule-based fallback) ·
Profile, avatar, currency, dark mode, alert preferences · Admin **DevOps dashboard** (service status + CI/CD pipeline) ·
Skeleton loaders, empty states and error states everywhere · Responsive (sidebar → drawer on mobile).

## Tech stack
React 18 + Vite + Tailwind + React Router + Recharts + Axios + Lucide · Node 20 + Express · PostgreSQL 16 + Prisma ·
JWT, bcryptjs, zod, helmet, express-rate-limit, CORS · Jest + Supertest (backend), Vitest + React Testing Library (frontend) ·
Docker, Docker Compose, GitHub Actions.

## Architecture
```
Browser (React SPA, nginx in Docker)
        │  HTTPS / JSON + Bearer JWT
        ▼
Express API ── middleware: helmet · CORS · rate-limit · auth · zod validation · error handler
   routes/  → thin HTTP layer
   services/finance.js  → PURE calculations (income, budgets, health score, projections, insights) ← unit tested
   services/data.js     → Prisma queries + snapshot used by dashboard / insights / chatbot
   services/notify.js   → budget & goal alerts
   services/ai.js       → chatbot abstraction (AI API ⇄ rule-based fallback)
        │ Prisma
        ▼
PostgreSQL
```

## Database schema
`users` 1─∞ `transactions` (type = income | expense) · `users` 1─∞ `budgets` (unique per user+month+year) 1─∞ `budget_categories` ·
`users` 1─∞ `savings_goals` · `users` 1─∞ `notifications`. All child rows cascade-delete with the user.
Indexes: `transactions(user_id, transaction_date)`, `transactions(user_id, type)`, `notifications(user_id, is_read)`, etc.
See `backend/prisma/schema.prisma`.

## Quick start — Docker (everything in one command)
```bash
docker compose up --build
```
* App: http://localhost:5173  · API: http://localhost:4000/api/health
* The backend creates the tables and loads the **demo user** automatically
  (`SEED_ON_START=true`): **jiya@finbuddy.demo / Demo@1234** (admin, sees the DevOps page).
* Set `SEED_ON_START=false` for a clean/production database.

## Local development (without Docker for the app)
Prerequisites: Node 20+, and a PostgreSQL (the easiest is the Docker one).
```bash
docker compose up -d postgres           # database on localhost:5432

cd backend
cp ../.env.example .env                 # (a ready-made backend/.env is already included)
npm install
npx prisma db push                      # create tables   (or: npx prisma migrate dev --name init)
npm run seed                            # demo data (Jiya)
npm run dev                             # API on :4000

cd ../frontend                          # new terminal
npm install
npm run dev                             # app on :5173
```

## Environment variables (`.env.example`)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string used to sign tokens — **change in production** |
| `ADMIN_EMAILS` | Comma-separated emails that become `admin` on registration (see DevOps page) |
| `FRONTEND_URL` | Allowed CORS origin(s) (comma-separated) |
| `BACKEND_URL` | Public API URL (used as `VITE_API_URL` when building the frontend) |
| `AI_API_KEY` | *Optional.* Anthropic API key. Empty ⇒ rule-based Finny. **Server-side only.** |
| `AI_MODEL` | Model name for the AI provider |
| `GITHUB_REPO`, `GITHUB_TOKEN` | *Optional.* `owner/repo` (+ token for private repos) → real GitHub Actions data on the DevOps page; empty ⇒ **mock** pipeline data |

## Testing
```bash
cd backend  && npm test        # Jest + Supertest: auth, transactions, authorization, health, budget/savings/analytics maths, chatbot
cd frontend && npm test        # Vitest + RTL: login form, expense form, budget bars, dashboard
npm run lint                   # in each folder
```
The backend API tests mock Prisma, so they need no database. Financial maths lives in pure functions
(`backend/src/services/finance.js`) so it is easy to test and to change (e.g. the health-score algorithm).

## CI/CD
* **`.github/workflows/ci.yml`** — on every push / PR: install → `prisma generate` + `prisma validate` → lint → backend tests → build →
  frontend lint/tests/build → build both Docker images. Any failing step fails the workflow.
* **`.github/workflows/cd.yml`** — runs only when CI **succeeds on `main`**: builds & pushes images to GitHub Container Registry,
  calls your host's deploy hooks, then polls `/api/health` until production is healthy.

Secrets / variables to add in *GitHub → Settings → Secrets and variables → Actions* (nothing is committed):
| Name | Type | Meaning |
|---|---|---|
| `BACKEND_DEPLOY_HOOK_URL` | secret | Render/Railway deploy-hook URL for the API |
| `FRONTEND_DEPLOY_HOOK_URL` | secret | Deploy-hook URL for the frontend |
| `BACKEND_URL` | variable | Public API URL, e.g. `https://finbuddy-api.onrender.com` |

Until these exist, the CD job still runs and clearly prints which deploy steps were skipped.

## Deployment (example: Render)
1. Create a **PostgreSQL** instance → copy its internal URL.
2. Create a **Web Service** from `backend/` (Docker). Env: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `ADMIN_EMAILS`, `SEED_ON_START=false`. Health check path: `/api/health`.
3. Create a **Web Service/Static Site** from `frontend/` (Docker, build arg `VITE_API_URL` = API URL).
4. Copy each service's *Deploy Hook* URL into the GitHub secrets above. Railway/AWS work the same way — nothing is provider-specific.

> Migrations: Docker uses `prisma db push` for convenience. For production run `npx prisma migrate dev --name init` once, commit
> `backend/prisma/migrations`, and change the Docker `CMD` to `prisma migrate deploy`.

## API
All routes except `auth/register`, `auth/login`, `health` need `Authorization: Bearer <token>`. Users can only touch their own rows.
| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` · `PUT /api/auth/me` |
| Expenses | `GET/POST /api/transactions` · `PUT/DELETE /api/transactions/:id` (`?type&category&from&to&q&sort`) |
| Income | `GET/POST /api/income` · `PUT/DELETE /api/income/:id` |
| Budgets | `GET /api/budgets?month&year` · `POST /api/budgets` · `PUT /api/budgets/:id` |
| Goals | `GET/POST /api/goals` · `PUT/DELETE /api/goals/:id` · `POST /api/goals/:id/contribute` |
| Analytics | `GET /api/analytics/overview?period=week\|month\|lastMonth` · `/spending` · `/trends` |
| Notifications | `GET /api/notifications` · `PUT /api/notifications/:id/read` · `PUT /api/notifications/read-all` · `DELETE /api/notifications/:id` |
| Chat | `POST /api/chat` `{message, history}` |
| Health | `GET /api/health` → `{status:"healthy",database:"connected",timestamp}` |
| DevOps (admin) | `GET /api/devops/status` |

## Folder structure
```
finbuddy/
├─ docker-compose.yml  .env.example  README.md
├─ .github/workflows/ci.yml  cd.yml
├─ backend/   Dockerfile  package.json
│  ├─ prisma/ schema.prisma  seed.js
│  ├─ src/    app.js server.js config.js db.js
│  │  ├─ middleware/ auth.js errors.js
│  │  ├─ routes/     auth transactions budgets goals analytics notifications chat health devops
│  │  └─ services/   finance data notify ai
│  └─ tests/  finance.test.js api.test.js
└─ frontend/  Dockerfile nginx.conf vite/tailwind config
   └─ src/ pages/ components/(ui/) context/ hooks/ api/ lib/ test/
```

## Screenshots
_Add screenshots here: landing, dashboard, budget, goals, insights, Finny chat, DevOps._

## Demo flow
1. Open landing page → **Get Started** → register a student → you land on the dashboard (Finny: "Your financial journey starts here 🌱").
2. **Expenses → Add income**, then add several expenses → dashboard totals, chart and health score update.
3. **Budget → Create budget** (e.g. ₹10,000; Food ₹3,000…). Add food expenses until 80 % → warning + notification, Finny turns worried; exceed 100 % → sad.
4. **Goals** → create "Headphones", add money; reaching the target makes Finny celebrate and sends a notification.
5. **Insights** for trends. **Finny** → "How much did I spend this month?", "Can I afford ₹1,000 shopping this week?".
6. Log in as `jiya@finbuddy.demo` → **DevOps** page → pipeline & health.
7. Change something small (e.g. a label), then:
```bash
git add . && git commit -m "Improve budget calculations" && git push
```
8. GitHub → *Actions*: **CI** (lint → tests → build → Docker) then **CD** (push images → deploy → health check). The new version goes live.

## Git setup
```bash
git init && git add . && git commit -m "Initial commit: FinBuddy"
git branch -M main
git remote add origin https://github.com/<you>/finbuddy.git
git push -u origin main
```
After your first `npm install` in each folder, commit the generated `package-lock.json` files (then you can switch CI to `npm ci` + caching).

## Future improvements
Email password reset · recurring transactions · CSV export · receipts upload · multi-currency conversion · real GitHub webhook feed ·
e2e tests (Playwright) · push notifications.

## Possible viva questions
**Why JWT?** Stateless auth: the server signs `{userId, role}`; each request carries it, so the API scales without server sessions. Tokens expire in 7 days.
**How are passwords protected?** bcrypt with a per-password salt (cost 10); only the hash is stored; login returns one generic error to avoid revealing which emails exist.
**How do you stop user A seeing user B's data?** Every query filters by `userId` taken from the verified token, never from the request body; update/delete use `where {id, userId}` and return 404 otherwise (tested in `api.test.js`).
**How is SQL injection prevented?** Prisma uses parameterised queries; inputs are also validated with zod.
**Why separate `finance.js`?** Pure functions = no DB, deterministic, easy to unit test and to change (e.g. health-score weights).
**How is the health score computed?** 40 pts spending-vs-income, 25 pts savings rate, 25 pts budget adherence, 10 pts penalty for overspent categories.
**How does the chatbot use real data?** The backend builds a snapshot (totals, budgets, goals, recent transactions) and passes it to the AI API — or to a rule-based engine if no key — so answers come from the database. The key never reaches the browser.
**What is CI vs CD?** CI automatically lints, tests and builds every push; CD deploys only when CI passed on `main`, then verifies `/api/health`.
**Why Docker?** Same environment everywhere; `docker compose up` starts frontend, backend and Postgres together.
**What is the health endpoint for?** Load balancers / the CD job use it to confirm the app *and* database are up.
**What's mocked?** DevOps pipeline data when `GITHUB_REPO` isn't configured; "Forgot password" is UI only.

> FinBuddy provides educational budgeting assistance and is not a substitute for professional financial advice.
