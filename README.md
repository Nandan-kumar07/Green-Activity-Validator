# EcoLearn — Green Activity Validator

A local-first web app for validating eco-friendly student activities, SDG learning, assessments, and gamification.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+
- [PostgreSQL](https://www.postgresql.org/) running locally

## Setup

1. **Clone and install dependencies**

```bash
pnpm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API server port (default `3000`) |
| `SESSION_SECRET` | Random secret for session cookies |
| `OPENAI_API_KEY` | Your OpenAI API key (for EcoBot & image verification) |

3. **Create the database**

```sql
CREATE DATABASE green_activity;
```

4. **Push the database schema**

```bash
pnpm run db:push
```

## Run locally

Start both the API server and frontend with one command:

```bash
pnpm run dev
```

Or run them separately:

```bash
pnpm run dev:api   # API at http://127.0.0.1:3000
pnpm run dev:web   # App at http://127.0.0.1:5173
```

Open **http://127.0.0.1:5173** in your browser.

## Project structure

```
artifacts/
  api-server/   Express API (auth, activities, assessments)
  ecolearn/     React + Vite frontend
lib/
  db/           Drizzle ORM + PostgreSQL schema
  api-zod/      Zod validation schemas
  api-client-react/  Generated React Query hooks
```

## Default local PostgreSQL connection

```
postgresql://postgres:postgres123@localhost:5432/green_activity
```

Update `DATABASE_URL` in `.env` to match your local PostgreSQL username and password.
