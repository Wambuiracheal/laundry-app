# Panda Laundry

A laundry pickup-and-delivery platform. Customers book pickups, choose services (wash & fold, dry cleaning, ironing, etc.), track orders, and manage requests such as rescheduling or cancelling. The repository is a monorepo with a **Next.js** web client and an **Express + Prisma** REST API backed by **MySQL** and **Redis**.

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

The app is a classic three-tier setup: a browser client, a stateless REST API, and a data layer (MySQL for persistent data, Redis for sessions, caching and pub/sub).

```mermaid
flowchart LR
    subgraph Browser
        UI["Next.js client<br/>(React 19, Tailwind 4)"]
        LS[("localStorage<br/>access + refresh tokens")]
        CK[("pl_session cookie<br/>presence flag")]
    end

    subgraph "Next.js server :3000"
        PX["proxy.ts<br/>route guard"]
        SSR["App Router pages"]
    end

    subgraph "Express API :5000"
        MW["Middleware<br/>cors · json · express-session · validators"]
        RT["Routers<br/>/api/auth · /api/orders · /api/services · ..."]
        PR["Prisma Client"]
        RU["Redis utils<br/>cache · session store · pub/sub"]
    end

    DB[("MySQL 8.4<br/>laundry_db")]
    RD[("Redis 7")]

    UI -->|page request| PX --> SSR
    PX -.reads.-> CK
    UI -->|fetch JSON| MW --> RT
    UI -.stores.-> LS
    RT --> PR --> DB
    RT --> RU --> RD
    MW -.session store.-> RD
```

### Key design decisions

| Concern | Approach |
| --- | --- |
| **Client rendering** | Next.js App Router. Thin `app/*/page.tsx` route files render screen components from `components/`. |
| **Route protection (client)** | `client/proxy.ts` (Next.js 16's replacement for `middleware.ts`) checks for a `pl_session` presence cookie and redirects signed-out users to `/login?next=...`. It's an optimistic check only. The API is the source of truth. |
| **Auth tokens** | Short-lived **PASETO v2** access tokens (1h, Ed25519-signed via `tweetnacl`) plus opaque **refresh tokens** (7 days) stored as SHA-256 hashes in MySQL and **rotated** on every refresh. |
| **Passwords** | Hashed with `bcrypt`. |
| **Data access** | Prisma ORM over MySQL, with versioned SQL migrations in `server/prisma/migrations`. |
| **Caching** | Redis read-through cache (e.g. `GET /api/services` cached for 60s under `services:all`). Cache helpers fail soft, so the API keeps working if Redis is down. |
| **Sessions** | `express-session` with a `connect-redis` store (prefix `laundry:sess:`). |
| **Events** | Redis pub/sub on the `laundry-events` channel. The server subscribes at startup and logs incoming events. |
| **Validation** | Hand-written Express middlewares on the server (`src/middlewares/validator.js`) and matching client-side validators in `client/utils/*Validation.ts`. |
| **Deployment** | Multi-stage Docker images for both apps, orchestrated with Docker Compose. The server runs `prisma migrate deploy` on boot, and the client is built as a Next.js `standalone` bundle. |

### Request lifecycle (example: login)

1. The user submits the login form. `client/utils/loginValidation.ts` validates it in the browser.
2. `authApi.login()` calls `POST {NEXT_PUBLIC_API_BASE_URL}/api/auth/login` through `utils/apiClient.ts`.
3. Express runs `validateLoginRequest`, looks up the user with Prisma, and checks the password with bcrypt.
4. The API returns `{ accessToken, refreshToken }`.
5. The client's `saveSession()` stores the tokens in `localStorage` and sets the `pl_session` cookie.
6. `proxy.ts` now lets the user into protected pages, and `useSession()` (built on `useSyncExternalStore`) re-renders any component that depends on the session.

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
| [MySQL](https://www.mysql.com) | 8.4 | Primary database |
| [Redis](https://redis.io) (`redis` client) | 7 / 6.x | Cache, session store, pub/sub |
| `express-session` + `connect-redis` | — | Server sessions in Redis |
| `paseto` + `tweetnacl` | — | Signed access tokens (PASETO v2.public) |
| `bcrypt` | 6 | Password hashing |
| `cors`, `dotenv` | — | CORS handling, env loading |
| `nodemon` | 3 | Dev auto-reload |

### Infrastructure

| Tool | Purpose |
| --- | --- |
| Docker (multi-stage, `node:20-alpine`) | Container images for client and server |
| Docker Compose | Local orchestration of `mysql`, `redis`, `server`, `client` with health checks |

---

## Folder Structure

```text
laundry-app/
├── docker-compose.yml            # mysql + redis + server + client
├── README.md
│
├── client/                       # Next.js web app
│   ├── app/                      # App Router: one folder per route
│   │   ├── layout.tsx            # Root layout, fonts, metadata
│   │   ├── globals.css           # Tailwind entry + global styles
│   │   ├── page.tsx              # "/" landing page
│   │   ├── login/  register/  forgot-password/
│   │   ├── customer-dashboard/  dark-dashboard/
│   │   ├── new-order/  order-tracking/  profile/
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
    │   │   └── validator.js      # Signup/login/token request validation
    │   ├── routes/               # One router per resource
    │   │   ├── auth.js           # signup, login, refresh, logout, verify
    │   │   ├── orders.js  order-items.js  order-status-history.js
    │   │   ├── payments.js  transactions.js
    │   │   ├── services.js  reviews.js  users.js
    │   │   └── actions.js        # support, forgot-password, reschedule, cancellations
    │   └── utils/
    │       └── redis.js          # Redis client, cache helpers, session store, pub/sub
    ├── Dockerfile
    └── package.json
```

---

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (for Option A), or
- **Node.js 20+**, **npm**, **MySQL 8**, and **Redis 7** (for Option B)

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
| MySQL | `localhost:3306` (`laundry_user` / `laundry_pass`, db `laundry_db`) |
| Redis | `localhost:6379` |

The server container waits for MySQL and Redis health checks, then runs `prisma migrate deploy` before starting.

> `NEXT_PUBLIC_API_BASE_URL` is baked into the client **at build time**. If you change the API URL, rebuild with `docker compose build client`.

Useful commands:

```bash
docker compose logs -f server            # tail API logs
docker compose down                      # stop containers
docker compose down -v                   # stop and wipe the MySQL volume
```

### Option B: Run locally

You can still run just the databases in Docker:

```bash
docker compose up -d mysql redis
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
| `DATABASE_URL` | `mysql://laundry_user:laundry_pass@localhost:3306/laundry_db` | Prisma MySQL connection string |
| `BE_PORT` | `5000` | API port |
| `SESSION_SECRET` | `a-long-random-string` | Secret for `express-session` |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL (takes precedence) |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Alternative to `REDIS_URL` |

### Client (`client/.env.local`)

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` | Base URL of the Express API |
| `NEXT_PUBLIC_GOOGLE_LOGIN_PATH` | `/api/auth/login/google` | Google login path (not implemented on the server yet) |
| `NEXT_PUBLIC_GOOGLE_SIGNUP_PATH` | `/api/auth/signup/google` | Google signup path (not implemented on the server yet) |

---

## Database

The schema lives in [server/prisma/schema.prisma](server/prisma/schema.prisma). All primary keys are UUIDs.

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Order : "is rider for"
    User ||--o{ Review : writes
    User ||--o{ RefreshToken : owns
    Order ||--o{ OrderItem : contains
    Service ||--o{ OrderItem : "priced as"
    Order ||--o{ Payment : "paid by"
    Payment ||--o| Transaction : records
    Order ||--o{ OrderStatusHistory : tracks
    Order ||--o{ Review : receives
```

| Model | Purpose |
| --- | --- |
| `User` | Customers, admins, riders and staff (`role`) |
| `RefreshToken` | Hashed refresh tokens with expiry and revocation |
| `Service` | Catalogue items (`price_type`: `per_kg` / `per_item` / `fixed`) |
| `Order` | Pickup/delivery details, amounts, `payment_status`, assigned rider |
| `OrderItem` | Service line items on an order |
| `Payment` | Payments by `mpesa` / `card` / `cash` |
| `Transaction` | Ledger entry (M-Pesa ref, credit/debit) linked to a payment |
| `OrderStatusHistory` | Audit trail of status changes |
| `Review` | Rating and comment per order |
| `SupportTicket`, `PasswordResetRequest`, `PickupRescheduleRequest`, `CancellationRequest` | Records created by the `/api/actions/*` forms |

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
| POST | `/signup` | `fullName, email, phone, password, confirmPassword?, role?` | Create an account |
| POST | `/login` | `email, password` | Returns `{ accessToken, refreshToken }` |
| POST | `/refresh` | `refreshToken` | Rotates the refresh token and issues a new access token |
| POST | `/logout` | `refreshToken` | Revokes the refresh token |
| POST | `/verify` | `token` | Verifies a PASETO access token |
| POST | `/token` | `userId, role?` | Issues a token manually (testing only) |

Signup rules: email and E.164 phone format, a password of at least 8 characters with upper, lower, digit and symbol, and a full name with at least two words.

### Resources

| Resource | Base path | Endpoints |
| --- | --- | --- |
| Services | `/api/services` | `GET /` (Redis-cached for 60s) |
| Orders | `/api/orders` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Order items | `/api/order-items` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Order status history | `/api/order-status-history` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Payments | `/api/payments` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Transactions | `/api/transactions` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Reviews | `/api/reviews` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| Users | `/api/users` | `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |

### Customer actions: `/api/actions`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/support` | Submit a support ticket |
| POST | `/forgot-password` | Request a password reset |
| POST | `/reschedule` | Reschedule a pickup |
| POST | `/cancel-pickup` | Cancel a pickup |
| POST | `/cancel-order` | Cancel an order |

### Misc

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Health check (`Laundry API is running!`) |
| POST | `/api/redis/publish` | Publish `{ channel?, message }` to Redis pub/sub |

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant P as proxy.ts
    participant A as Express API
    participant D as MySQL

    B->>A: POST /api/auth/login
    A->>D: find user and check bcrypt hash
    A->>D: store SHA-256(refreshToken)
    A-->>B: accessToken (PASETO, 1h) + refreshToken (7d)
    B->>B: localStorage + pl_session cookie
    B->>P: GET /customer-dashboard
    P-->>B: allowed (cookie present)
    Note over B,A: When the access token expires
    B->>A: POST /api/auth/refresh
    A->>D: revoke old token, store new one
    A-->>B: new accessToken + refreshToken
    B->>A: POST /api/auth/logout
    A->>D: revoke refresh token
```

---

## Frontend Routes

| Route | Access | Screen |
| --- | --- | --- |
| `/` | Public | Landing page with booking modal |
| `/preview` | Public | Hub linking to every screen |
| `/login`, `/register` | Signed-out only | Auth screens (signed-in users go to the dashboard) |
| `/forgot-password` | Public | Password reset request |
| `/customer-dashboard` | Protected | Customer home |
| `/dark-dashboard` | Protected | Dark-theme dashboard variant |
| `/new-order` | Protected | Service selection and booking |
| `/order-tracking` | Protected | Order progress |
| `/profile` | Protected | User profile |
| `/support` | Protected | Contact support |
| `/reschedule`, `/cancel-pickup`, `/cancel-order` | Protected | Order management forms |

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

- **API authorization:** Resource routes (`/api/orders`, `/api/users`, etc.) don't verify the access token yet. An auth middleware using `V2.verify` still needs to be added.
- **Signing keys:** PASETO keys are generated in memory on each server start, so every access token becomes invalid after a restart. Load a fixed key from the environment for production.
- **Seed script:** `seed.js` writes `pricePerKg`, but the schema uses `price_type` / `base_price`. Update the seed data before running it.
- **Mock data:** Several dashboard and order screens read from `client/components/mobile/data.ts` rather than the API.
- **Google OAuth:** The client links to `/api/auth/*/google`, but those routes don't exist on the server yet.
- **Session cookie:** `cookie.secure` is `false`. Enable it behind HTTPS.
- **Tests:** No automated tests or CI yet.
- **Docker secrets:** `docker-compose.yml` has development credentials hard-coded. Don't reuse them in production.

---

## Contributing

1. Branch off `main` using a prefix: `feat/...`, `fix/...`, `chore/...`.
2. Keep commits focused and use [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, ...).
3. For schema changes, run `npx prisma migrate dev --name <change>` and commit the generated migration.
4. Run `npm run lint` in `client/` before opening a PR.
5. Open a pull request against `main`.
