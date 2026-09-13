# TaskFlow - Full-Stack Task & Time Tracking Platform

TaskFlow is a task management and real-time productivity tracking web application. Users can organize tasks, track duration using a real-time stopwatch timer, auto-generate structured task titles and descriptions using AI, and view daily productivity insights.

---

## Architecture Overview

TaskFlow is structured as a TypeScript monorepo using **pnpm workspaces**:

- **`apps/client`**: Next.js 16 (App Router) frontend built with React 19, Tailwind CSS v4, Base UI, Sonner, and TanStack Query.
- **`apps/server`**: Express 5 backend with TypeScript, Mongoose (MongoDB), and ioredis (Redis).
- **`packages/shared`**: Shared Zod schemas and TypeScript types used by both client and server.
- **MongoDB**: Persistent database storing users, tasks, and historical time logs.
- **Redis**: In-memory token store for JWT refresh token validation and revocation (session logout).
- **Google Gemini**: AI task enhancement using `@ai-sdk/google`.

---

## Key Features

- **Real-Time Time Tracking**: 1-click timer controls with a docked status bar, tabular monospace clock (`tabular-nums`), and background synchronization.
- **Slide-Over Task Detail Drawer**: Inspect task details, modify status, start/stop timers, and view the individual session history audit trail (`GET /api/v1/tasks/:id/time-logs`).
- **Productivity Performance & Insights**: Daily breakdown of recorded focus time, task focus allocation, and workflow status distribution.
- **AI Task Enhancement**: Auto-structure natural language prompts into actionable titles and descriptions using Google Gemini.
- **Toast Notifications System**: Instant visual feedback for task CRUD, status changes, timer start/stop, and error handling via Sonner.
- **Sorting & Quick Filtering**: Filter by workflow status (*Pending*, *In Progress*, *Completed*) and sort by *Newest*, *Oldest*, or *Most Time Spent*.
- **Dual-Token JWT Security**: Access tokens stored in HTTP-only cookies with Redis-backed refresh token rotation and session logout revocation.
- **Evaluator-Friendly UX**: 1-click demo credential auto-fill directly on `/login` with upfront cold-start notices.

---

## Live Demo & Test Credentials

- **Live Web App:** [https://taskflow-jayant.vercel.app](https://taskflow-jayant.vercel.app)
- **API Base URL:** [https://taskflow-demm.onrender.com/api/v1](https://taskflow-demm.onrender.com/api/v1)

> [!NOTE]
> **Render Free Tier Cold Starts:** The backend is deployed on Render's free tier, which spins down after 15 minutes of inactivity. If the initial request takes ~30–50s, the instance is waking up from a cold start. Subsequent requests will be fast.

### Test Credentials

| Email | Password |
|---|---|
| `johndoe@test.com` | `Test@1234` |

*(You can also use the 1-click **"Auto-fill demo credentials"** button directly on `/login`, or register a new account on `/register`).*

---

## Local Setup Guide

### Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **pnpm**: `v10.x` or `v12.x`
- **Docker & Docker Compose**

---

### Step 1: Clone Repository

```bash
git clone https://github.com/jayantpathariya/taskflow.git
cd taskflow
```

---

### Step 2: Start MongoDB & Redis

Start the containerized MongoDB and Redis services defined in `docker-compose.yml`:

```bash
docker compose up -d
```

---

### Step 3: Install Dependencies

Install dependencies across all workspace packages:

```bash
pnpm install
```

---

### Step 4: Environment Variables Configuration

Copy the `.env.example` templates:

#### 1. Server (`apps/server/.env`)

```bash
cp apps/server/.env.example apps/server/.env
```

Default variables:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB & Redis (from docker-compose.yml)
MONGODB_URI=mongodb://localhost:27017/taskflow
REDIS_URL=redis://localhost:6379

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_chars
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Google Gemini AI (Optional)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
GOOGLE_AI_MODEL=gemini-2.5-flash
```

#### 2. Client (`apps/client/.env.local`)

```bash
cp apps/client/.env.example apps/client/.env.local
```

Default variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

### Step 5: Run Development Server

Run both client and server concurrently:

```bash
pnpm dev
```

- Client: [http://localhost:3000](http://localhost:3000)
- Server: [http://localhost:5000](http://localhost:5000)
- Health Check: [http://localhost:5000/health](http://localhost:5000/health)

---

## API Endpoints Documentation

All protected routes under `/api/v1/tasks`, `/api/v1/timer`, and `/api/v1/analytics` (as well as `GET /api/v1/auth/me`) require authentication via the `accessToken` HTTP-only cookie.

### 1. Health
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Server health check | Public |

---

### 2. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth | Request Body |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register user | Public | `{ name, email, password }` |
| `POST` | `/api/v1/auth/login` | Log in user | Public | `{ email, password }` |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Public | `refreshToken` HTTP-only cookie |
| `POST` | `/api/v1/auth/logout` | Log out and clear cookies | Public | - |
| `GET` | `/api/v1/auth/me` | Current authenticated user | Required | - |

---

### 3. Tasks (`/api/v1/tasks`)
| Method | Endpoint | Description | Auth | Request Body / Query |
|---|---|---|---|---|
| `GET` | `/api/v1/tasks` | Get user's tasks | Required | Query: `?status=PENDING` (optional) |
| `POST` | `/api/v1/tasks` | Create task | Required | `{ title, description?, status? }` |
| `GET` | `/api/v1/tasks/:id` | Get task by ID | Required | - |
| `PUT` | `/api/v1/tasks/:id` | Update task | Required | `{ title?, description?, status? }` |
| `DELETE`| `/api/v1/tasks/:id` | Delete task and its time logs | Required | - |
| `POST` | `/api/v1/tasks/ai-suggest`| AI task title & description | Required | `{ prompt: string }` |

---

### 4. Timer & Time Tracking (`/api/v1/tasks`, `/api/v1/timer`)
| Method | Endpoint | Description | Auth | Details |
|---|---|---|---|---|
| `POST` | `/api/v1/tasks/:id/timer/start` | Start timer for task | Required | Auto-stops any other running timer |
| `POST` | `/api/v1/tasks/:id/timer/stop` | Stop running timer | Required | Records elapsed duration in DB |
| `GET` | `/api/v1/tasks/:id/time-logs` | Get time logs for task | Required | Task specific history |
| `GET` | `/api/v1/timer/active` | Get current running timer | Required | Queries active `TimeLog` for user |
| `GET` | `/api/v1/timer/logs` | Get all time logs for user | Required | Full user time history |

---

### 5. Analytics (`/api/v1/analytics`)
| Method | Endpoint | Description | Auth | Details |
|---|---|---|---|---|
| `GET` | `/api/v1/analytics/daily` | Daily summary & statistics | Required | Total focus time, completion rate, status distribution |

---

## Workspace Scripts Reference

| Command | Description |
|---|---|
| `pnpm dev` | Starts client (`:3000`) and server (`:5000`) in parallel |
| `pnpm build` | Builds all workspace packages |
| `pnpm typecheck` | Type-checks all packages |
| `docker compose up -d` | Starts MongoDB and Redis containers |
| `docker compose down` | Stops MongoDB and Redis containers |
