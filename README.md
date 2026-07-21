# Laundry App Monorepo Deployment (Render)

This repository contains:
- `client` (Next.js frontend, exported as static files)
- `server` (Express API + static file host)

It is configured for **single-service deployment** on Render.

## Current Deployment Model

Render runs one Node Web Service that:
1. Builds the frontend into static files (`client/out`)
2. Starts Express
3. Serves API routes from `/api/*`
4. Serves frontend static pages for non-API routes

## Files Already Configured

- `render.yaml`
- `package.json` (repo root scripts)
- `server/server.js` (uses `process.env.PORT`)
- `server/src/app.js` (serves `client/out` in production)
- `client/next.config.ts` (`output: "export"`)

## Render Setup Steps

1. Push this repository to GitHub.
2. In Render, create a new service from the repo.
3. Render should detect `render.yaml` automatically.
4. Set required environment variables (below).
5. Deploy.

## Required Environment Variables (Render)

Set these in Render service environment settings:

- `NODE_ENV=production`
- `DATABASE_URL=<your managed database connection string>`
- `REDIS_URL=<your managed redis connection string>`
- `SESSION_SECRET=<strong random secret>`
- `NEXT_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com/api`

Optional (Google auth redirect handlers):

- `GOOGLE_LOGIN_URL=<your oauth entry URL>`
- `GOOGLE_SIGNUP_URL=<your oauth entry URL>`

Notes:
- Do not set `PORT` manually on Render. Render injects it.
- `BE_PORT` is for local/dev fallback only.

## Build and Start Commands (already in root `package.json`)

- Build: `npm run install:all && npm run build`
- Start: `npm run start`

## Local Verification

From repo root:

```bash
npm run install:all
npm run build
npm run start
```

Then open your app and API routes.
