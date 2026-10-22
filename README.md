# Panda Laundry

A laundry pickup-and-delivery platform. Customers book pickups, choose services (wash & fold, dry cleaning, ironing, etc.), track orders, and manage requests such as rescheduling or cancelling. The repository is a monorepo with a **Next.js** web client and an **Express + Prisma** REST API backed by **PostgreSQL** (Supabase in production) and optional **Redis**. See [DEPLOY.md](DEPLOY.md) for hosting on Supabase, Render and Netlify.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
  - [Option A: Docker Compose (recommended)](#option-a-docker-compose-recommended)
  - [Option B: Run locally](#option-b-run-locally)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Frontend Routes](#frontend-routes)
- [Scripts](#scripts)
- [Known Gaps / Roadmap](#known-gaps--roadmap)
- [Contributing](#contributing)

---

## Architecture

The app is a classic three-tier setup: a browser client, a stateless REST API, and a data layer (PostgreSQL for persistent data, optional Redis for caching and pub/sub).

```mermaid
flowchart LR
    subgraph Browser
        UI["Next.js client<br/>(React 19, Tailwind 4)"]
        LS[("localStorage<br/>Supabase session")]
        CK[("pl_session cookie<br/>presence flag")]
    end

    subgraph "Next.js server :3000"
        PX["proxy.ts<br/>route guard"]
        SSR["App Router pages"]
    end

    subgraph "Express API :5000"
        MW["Middleware<br/>cors · json · auth · validators"]
        RT["Routers<br/>/api/auth · /api/orders · /api/services · ..."]
        PR["Prisma Client"]
        RU["Redis utils<br/>cache · pub/sub"]
    end

    DB[("PostgreSQL 16<br/>laundry_db")]
    RD[("Redis 7")]

    UI -->|page request| PX --> SSR
    PX -.reads.-> CK
    UI -->|fetch JSON| MW --> RT
    UI -.stores.-> LS
    RT --> PR --> DB
    RT --> RU --> RD
```

### Key design decisions

| Concern | Approach |
| --- | --- |
| **Client rendering** | Next.js App Router. Thin `app/*/page.tsx` route files render screen components from `components/`. |
| **Route protection (client)** | `client/proxy.ts` (Next.js 16's replacement for `middleware.ts`) checks for a `pl_session` presence cookie and redirects signed-out users to `/login?next=...`. It's an optimistic check only. The API is the source of truth. |
| **Sign-in** | **Supabase Auth**: email/password with email confirmation, Google, Facebook and Apple, and password resets, called from the browser with `@supabase/supabase-js`. Supabase stores the passwords and refreshes the tokens. |
| **API auth** | The API verifies the Supabase access token (JWT) with `jose`, then loads the user from its own `User` table by `auth_id`. Roles live only in that table, so a user can't grant themselves one; a new account first completes its profile (name, phone, customer or rider). |
| **Data access** | Prisma ORM over PostgreSQL, with versioned SQL migrations in `server/prisma/migrations`. |
| **Caching** | Redis read-through cache (e.g. `GET /api/services` cached for 60s under `services:all`). Cache helpers fail soft, so the API keeps working if Redis is down. |
| **Events** | Redis pub/sub on the `laundry-events` channel. The server subscribes at startup and logs incoming events. |
| **Validation** | Hand-written Express middlewares on the server (`src/middlewares/validator.js`) and matching client-side validators in `client/utils/*Validation.ts`. |
| **Deployment** | Multi-stage Docker images for both apps, orchestrated with Docker Compose. The server runs `prisma migrate deploy` on boot, and the client is built as a Next.js `standalone` bundle. |

### Request lifecycle (example: login)

1. The user submits the login form. `client/utils/loginValidation.ts` validates it in the browser.
2. `authApi.signInWithEmail()` signs in with Supabase Auth, which keeps the session in `localStorage`.
3. It then calls `GET /api/auth/me` with the Supabase access token. Express verifies the token and loads the user's profile and role.
4. The client's `saveSession()` caches the profile and sets the `pl_session` role cookie.
5. `proxy.ts` now lets the user into protected pages, and `useSession()` (built on `useSyncExternalStore`) re-renders any component that depends on the session. `utils/apiClient.ts` attaches the current Supabase token to every API call.

---

## Tech Stack

### Frontend (`client/`)

| Tool | Version | Purpose |
| --- | --- | --- |
| [Next.js](https://nextjs.org) | 16.2 | React framework (App Router, `proxy.ts`, standalone output) |
| [React](https://react.dev) | 19.2 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5 | Static typing |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utility-first styling (via `@tailwindcss/postcss`) |
| [ESLint](https://eslint.org) | 9 | Linting (`eslint-config-next`) |
| `next/font` (Geist) | — | Self-hosted fonts |

### Backend (`server/`)

| Tool | Version | Purpose |
| --- | --- | --- |
| [Node.js](https://nodejs.org) | 20 | Runtime |
| [Express](https://expressjs.com) | 5 | HTTP framework |
| [Prisma](https://www.prisma.io) | 5.22 | ORM, migrations |
| [PostgreSQL](https://www.postgresql.org) | 16 | Primary database (Supabase in production) |
| [Redis](https://redis.io) (`redis` client) | 7 / 6.x | Optional: cache, pub/sub |
| `@supabase/supabase-js` | 2 | Supabase Auth admin API (creating and linking accounts) |
| `jose` | 5 | Verifying Supabase access tokens (JWT) |
| `cors`, `dotenv` | — | CORS handling, env loading |
| `nodemon` | 3 | Dev auto-reload |

### Infrastructure

| Tool | Purpose |
| --- | --- |
| Docker (multi-stage, `node:20-alpine`) | Container images for client and server |
| Docker Compose | Local orchestration of `postgres`, `redis`, `server`, `client` with health checks |
| Render, Netlify, Supabase | Production hosting for the API, the web client and the database ([DEPLOY.md](DEPLOY.md)) |

---

## Folder Structure

```text
laundry-app/
├── docker-compose.yml            # postgres + redis + server + client
├── render.yaml                   # Render Blueprint for the API
├── netlify.toml                  # Netlify build for the client
├── DEPLOY.md                     # Supabase + Render + Netlify guide
├── README.md
│
├── client/                       # Next.js web app
│   ├── app/                      # App Router: one folder per route
│   │   ├── layout.tsx            # Root layout, fonts, metadata
│   │   ├── globals.css           # Tailwind entry + global styles
│   │   ├── page.tsx              # "/" landing page
│   │   ├── login/  register/  forgot-password/  reset-password/
│   │   ├── auth/callback/  complete-profile/
│   │   ├── customer-dashboard/  dark-dashboard/
│   │   ├── new-order/  order-tracking/  notifications/  profile/
│   │   ├── reschedule/  cancel-pickup/  cancel-order/  support/
│   │   └── preview/              # Dev hub linking to every screen
│   ├── components/
│   │   ├── landing/              # Marketing page, booking modal, icons, UI bits
│   │   ├── mobile/               # App shell: nav, primitives, icons, mock data
│   │   │   └── screens/          # Full-screen views (Dashboard, Login, NewOrder, ...)
│   │   └── shared/               # Layouts & forms reused across pages
│   │       └── form/FormField.tsx
│   ├── hooks/
│   │   └── useSession.ts         # Reactive session hook (useSyncExternalStore)
│   ├── utils/
│   │   ├── apiClient.ts          # fetch wrapper (postJson) + error handling
│   │   ├── authApi.ts            # login / signup calls
│   │   ├── session.ts            # save/clear session, cookie, logout
│   │   └── *Validation.ts        # Client-side form validators
│   ├── public/                   # Static SVG/PNG assets (landing, services, mobile)
│   ├── proxy.ts                  # Route guard for protected pages
│   ├── next.config.ts            # output: "standalone"
│   ├── Dockerfile
│   └── package.json
│
└── server/                       # Express REST API
    ├── server.js                 # Entry: connect DB → init Redis → start app
    ├── seed.js                   # Seed script for services
    ├── .env.example
    ├── prisma/
    │   ├── schema.prisma         # Data model
    │   └── migrations/           # Versioned SQL migrations (0_init baseline)
    ├── src/
    │   ├── app.js                # Express app: middleware + route mounting
    │   ├── middlewares/
    │   │   ├── auth.js           # Supabase token check, role guard
    │   │   └── validator.js      # Profile and phone validation
    │   ├── routes/               # One router per resource
    │   │   ├── auth.js           # profile for a Supabase account (me, complete sign-up)
    │   │   ├── orders.js  mpesa.js  riders.js  tracking.js
    │   │   ├── services.js  settings.js  notifications.js
    │   │   └── actions.js        # support tickets
    │   └── utils/
    │       └── redis.js          # Redis client, cache helpers, pub/sub
    ├── Dockerfile
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (for Option A), or
- **Node.js 20+**, **npm** and **PostgreSQL 16** (for Option B); Redis 7 is optional

```bash
git clone https://github.com/Wambuiracheal/laundry-app.git
cd laundry-app
```

### Option A: Docker Compose (recommended)

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web client | http://localhost:3000 |
| API | http://localhost:5000 |
| PostgreSQL | `localhost:5432` (`laundry_user` / `laundry_pass`, db `laundry_db`) |
| Redis | `localhost:6379` |

The server container waits for the PostgreSQL and Redis health checks, then runs `prisma migrate deploy` before starting.

> `NEXT_PUBLIC_API_BASE_URL` is baked into the client **at build time**. If you change the API URL, rebuild with `docker compose build client`.

Useful commands:

```bash
docker compose logs -f server            # tail API logs
docker compose down                      # stop containers
docker compose down -v                   # stop and wipe the database volume
```

### Option B: Run locally

You can still run just the databases in Docker:

```bash
docker compose up -d postgres redis
```

**1. Backend**

```bash
cd server
cp .env.example .env                     # then edit DATABASE_URL etc.
npm install
npx prisma migrate deploy                # apply migrations
npx prisma generate                      # generate Prisma client
npm run dev                              # http://localhost:5000 (nodemon)
```

**2. Frontend** (in a new terminal)

```bash
cd client
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5000" > .env.local
npm install
npm run dev                              # http://localhost:3000
```

Open http://localhost:3000/preview for a hub that links to every screen.

---

## Environment Variables

### Server (`server/.env`)

| Variable | Example | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://laundry_user:laundry_pass@localhost:5432/laundry_db` | PostgreSQL connection the app queries through |
| `DIRECT_URL` | same as `DATABASE_URL` locally | Connection used by `prisma migrate` (Supabase session pooler in production) |
| `BE_PORT` / `PORT` | `5000` | API port (`PORT` wins; hosts like Render set it) |
| `CLIENT_URL` | `https://your-site.netlify.app` | Origins allowed by CORS, comma-separated; unset allows any |
| `SUPABASE_URL` | `https://abcd1234.supabase.co` | Supabase project, for checking sign-in tokens |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Server-only admin key (create-user, migrate-auth, linking accounts) |
| `SUPABASE_JWT_SECRET` | — | Only for projects on the legacy JWT secret |
| `REDIS_URL` | `redis://localhost:6379` | Optional Redis connection URL (takes precedence); unset runs without Redis |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Alternative to `REDIS_URL` |

### Client (`client/.env.local`)

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` | Base URL of the Express API |
| `NEXT_PUBLIC_SUPABASE_URL` | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | Supabase anon / publishable key (browser-safe) |

---

## Database

The schema lives in [server/prisma/schema.prisma](server/prisma/schema.prisma). All primary keys are UUIDs.

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Order : "is rider for"
    User ||--o{ Review : writes
    Order ||--o{ OrderItem : contains
    Service ||--o{ OrderItem : "priced as"
    Order ||--o{ Payment : "paid by"
    Payment ||--o| Transaction : records
    Order ||--o{ OrderStatusHistory : tracks
    Order ||--o{ Review : receives
```

| Model | Purpose |
| --- | --- |
| `User` | Customers, admins, riders and staff (`role`), linked to Supabase Auth by `auth_id` |
| `Service` | Catalogue items (`price_type`: `per_kg` / `per_item` / `fixed`) |
| `Order` | Pickup/delivery details, amounts, `payment_status`, assigned rider |
| `OrderItem` | Service line items on an order |
| `Payment` | Payments by `mpesa` / `card` / `cash` |
| `Transaction` | Ledger entry (M-Pesa ref, credit/debit) linked to a payment |
| `OrderStatusHistory` | Audit trail of status changes |
| `Review` | Rating and comment per order |
| `SupportTicket`, `CancellationRequest` | Support tickets, and the reasons customers give when cancelling |
| `PasswordResetRequest`, `PickupRescheduleRequest` | No longer written (resets moved to Supabase, reschedules act on the order); kept so existing rows aren't lost |

### Common Prisma commands

```bash
cd server
npx prisma migrate dev --name <change>   # create and apply a new migration (dev)
npx prisma migrate deploy                # apply pending migrations (prod/Docker)
npx prisma generate                      # regenerate the client after schema changes
npx prisma studio                        # browse data in the browser
```

---

## API Reference

Base URL: `http://localhost:5000`. All bodies are JSON.

### Auth: `/api/auth`

| Method | Path | Body | Description |
| --- | --- | --- | --- |
Sign-up, login, social logins, logout and password resets go to Supabase Auth directly from the browser. Every API request sends the Supabase access token as `Authorization: Bearer <token>`.

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| GET | `/me` | — | The signed-in user's profile, or 404 `profile_required` with details to prefill the profile form |
| POST | `/profile` | `fullName, phone, role?` | Completes a new account (`role`: `customer` or `rider`) |

Profile rules: a full name with at least two words and a valid mobile number (Kenyan numbers are stored as `+2547…`). Accounts made before Supabase, or by an admin, are linked by email once Supabase confirms the address. Admin and staff accounts come from `npm run create-user`.

### Resources

All endpoints except the M-Pesa callback and support need a signed-in user; the role each one needs is checked on the server.

| Resource | Base path | Endpoints |
| --- | --- | --- |
| Services | `/api/services` | `GET /` (Redis-cached for 60s), `PATCH /:id` (admin pricing) |
| Orders (customer) | `/api/orders` | `GET /delivery-quote`, `POST /request`, `GET /mine`, `PATCH /:id/reschedule`, `PATCH /:id/cancel` |
| Orders (shop) | `/api/orders` | `GET /queue`, `GET /riders`, `PATCH /:id/assign`, `PATCH /:id/measure`, `PATCH /:id/status`, `POST /:id/damages`, `DELETE /:id/damages/:damageId` |
| Orders (rider) | `/api/orders` | `GET /rider/jobs`, `POST /:id/claim`, `PATCH /:id/rider-status` |
| M-Pesa | `/api/payments/mpesa` | `POST /stk`, `GET /:paymentId`, `GET /` (admin), `POST /callback/:secret` (Daraja) |
| Riders | `/api/riders` | `GET /me/earnings`, `GET /payouts`, `POST /:riderId/payout` |
| Settings | `/api/settings` | `GET /`, `PATCH /` (admin) |
| Tracking | `/api/tracking` | `PUT /me/location`, `DELETE /me/location`, `GET /jobs/:orderId/route`, `GET /orders/:orderId`, `GET /live` |
| Notifications | `/api/notifications` | `GET /mine`, `POST /read`, `GET /preferences`, `PATCH /preferences` |
| Support | `/api/actions` | `POST /support` |

### Misc

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Health check (`Laundry API is running!`) |

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as proxy.ts
    participant S as Supabase Auth
    participant A as Express API
    participant D as PostgreSQL

    B->>S: sign in (password, Google, Facebook or Apple)
    S-->>B: Supabase session (JWT access + refresh token)
    B->>A: GET /api/auth/me (Bearer JWT)
    A->>A: verify JWT signature, issuer, audience
    A->>D: find User by auth_id
    A-->>B: profile + role (or 404 profile_required)
    B->>B: cache profile + pl_session role cookie
    B->>P: GET /customer-dashboard
    P-->>B: allowed (role cookie)
    Note over B,S: supabase-js refreshes the token before it expires
    B->>S: sign out (revokes the refresh token)
```

---

## Frontend Routes

| Route | Access | Screen |
| --- | --- | --- |
| `/` | Public | Landing page with booking modal |
| `/preview` | Public | Hub linking to every screen |
| `/login`, `/register` | Signed-out only | Auth screens (signed-in users go to the dashboard) |
| `/forgot-password`, `/reset-password` | Public | Request a reset email; choose a new password from its link |
| `/auth/callback` | Public | Finishes social logins and email confirmation links |
| `/complete-profile` | Signed in | Name and phone for new accounts (mostly social logins) |
| `/customer-dashboard` | Protected | Customer home |
| `/dark-dashboard` | Protected | Dark-theme dashboard variant |
| `/new-order` | Protected | Service selection and booking |
| `/order-tracking` | Protected | Order progress |
| `/notifications` | Protected | Order updates (also sent by SMS) |
| `/profile` | Protected | User profile |
| `/support` | Protected | Contact support |
| `/reschedule`, `/cancel-pickup`, `/cancel-order` | Protected | Reschedule or cancel a pickup before it's collected |

---

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| `client/` | `npm run dev` | Next.js dev server on :3000 |
| `client/` | `npm run build` / `npm start` | Production build and serve |
| `client/` | `npm run lint` | ESLint |
| `server/` | `npm run dev` | API with nodemon auto-reload |
| `server/` | `npm start` | API in production mode |
| `server/` | `node seed.js` | Seed services (see known gaps) |
| root | `docker compose up --build` | Run the full stack |

---

## Known Gaps / Roadmap

These are current limitations worth knowing before building on the code:

- **Mock data:** Several dashboard and order screens read from `client/components/mobile/data.ts` rather than the API.
- **CI:** Tests run locally (`npm test` in `client/` and `server/`) but there's no CI pipeline yet.
- **Docker secrets:** `docker-compose.yml` has development credentials hard-coded. Don't reuse them in production.

---

## Contributing

1. Branch off `main` using a prefix: `feat/...`, `fix/...`, `chore/...`.
2. Keep commits focused and use [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, ...).
3. For schema changes, run `npx prisma migrate dev --name <change>` and commit the generated migration.
4. Run `npm run lint` in `client/` before opening a PR.
5. Open a pull request against `main`.
