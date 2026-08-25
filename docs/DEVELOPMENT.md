# Development guide

This guide explains how Cobly's backend and frontend are structured, how to run and test them locally, and the conventions to follow when extending the codebase. For the HTTP contract, see [API.md](API.md). For containers and CI, see [../DOCKER.md](../DOCKER.md).

- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Project layout](#project-layout)
- [Backend architecture](#backend-architecture)
- [Authorization model](#authorization-model)
- [Response and error conventions](#response-and-error-conventions)
- [Adding a new resource](#adding-a-new-resource)
- [Frontend architecture](#frontend-architecture)
- [Testing](#testing)
- [Coding conventions](#coding-conventions)
- [Git conventions](#git-conventions)

---

## Prerequisites

- **Node.js 22+** and npm.
- **MongoDB** — either a local `mongod` or a connection string to a hosted instance. (Docker Compose can provide one; see [../DOCKER.md](../DOCKER.md).)

---

## Local setup

Backend and frontend are independent npm packages. Run them in two terminals.

**Backend**

```bash
cd backend
npm install
cp .env.example .env        # then edit — JWT_SECRET is required and must be >= 32 chars
npm run dev                 # tsx watch on http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env        # optional; defaults target http://localhost:5000
npm run dev                 # Vite dev server on http://localhost:5173
```

The backend refuses to start if `JWT_SECRET` is missing or shorter than 32 characters — this is intentional fail-fast behavior, not a bug. See `backend/src/config/index.ts` for every setting and its default.

**Backend scripts:** `npm run dev` (watch), `npm run build` (`tsc` → `dist/`), `npm start` (run built server), `npm test`, `npm run test:coverage`.

**Frontend scripts:** `npm run dev`, `npm run build` (`tsc -b` then `vite build`), `npm run preview`, `npm run lint` (oxlint).

---

## Project layout

```
cobly/
├── backend/
│   ├── src/
│   │   ├── config/        # env loading + validation (fail-fast)
│   │   ├── controllers/   # thin HTTP handlers, one per resource
│   │   ├── middleware/    # requireAuth, validate, errorHandler, requestLogger, rate limiters
│   │   ├── models/        # Mongoose schemas + TypeScript interfaces
│   │   ├── routes/        # express.Router() per resource, wired in routes/index.ts
│   │   ├── services/      # business logic + authorization (the core layer)
│   │   ├── types/         # ambient types (e.g. express req.user augmentation)
│   │   ├── utils/         # shared helpers (AppError, etc.)
│   │   ├── validators/    # Zod schemas per resource
│   │   ├── app.ts         # Express app assembly (middleware order lives here)
│   │   └── server.ts      # bootstrap: connect Mongo, listen, graceful shutdown
│   └── tests/             # Jest + Supertest integration tests
└── frontend/
    └── src/
        ├── api/           # centralized fetch client + typed per-resource modules
        ├── components/    # reusable UI
        ├── context/       # auth context/provider
        ├── pages/         # route-level screens
        └── main.tsx       # app entry + router
```

---

## Backend architecture

The backend is a classic layered Express application. A request flows through the layers in one direction:

```
route → validate(Zod) → requireAuth → controller → service → model (Mongoose) → MongoDB
```

Each layer has a single responsibility:

- **Routes** (`src/routes`) declare paths and attach middleware. They contain no logic. Every router is composed in `src/routes/index.ts` and mounted under `/api` in `app.ts`.
- **Validation** (`src/validators` via the `validate` middleware) parses and type-narrows `body`, `params`, and `query` with Zod *before* any controller runs. Invalid input never reaches business logic.
- **Controllers** (`src/controllers`) are thin. They read the validated input and `req.user.id`, call a service method, and shape the HTTP response. They do not talk to Mongoose directly.
- **Services** (`src/services`) hold all business logic *and* authorization. This is where the app's real work happens.
- **Models** (`src/models`) are Mongoose schemas paired with a TypeScript interface describing a document.

Middleware order in `app.ts` is deliberate: `trust proxy` (prod) → `helmet` → `cors` → rate limiter → request logger → `express.json({ limit: '100kb' })` → routes → `notFoundHandler` → `errorHandler` (last). The error handler must be registered last so it can catch everything ahead of it.

---

## Authorization model

Cobly has no global roles beyond a per-workspace `owner`/`member` distinction. **Authorization is enforced in the service layer, not in middleware**, because every check depends on the resource being accessed and the workspace it belongs to.

Each resource service has a private `getContext(...)` helper that is the single choke point for access control. It:

1. Loads the workspace and confirms the caller is a member (throws `403` otherwise).
2. Scopes every parent lookup by its owning id — e.g. a project is loaded with `findOne({ _id: projectId, workspaceId })`, a task with `findOne({ _id: taskId, projectId })`.

Because a resource is only ever found *through* its verified parent chain, a caller cannot reach another workspace's data by guessing IDs — the query simply returns `null` and the service throws `404`. This is what prevents IDOR (insecure direct object reference) and cross-workspace leakage, and it is covered by dedicated tests (see [Testing](#testing)).

Role-gated actions (creating/deleting a workspace, managing members) additionally check `membership.role === 'owner'` inside the service and throw `403` if not.

When you add a resource, **route every data access through `getContext`**. Never query a model by `_id` alone in a handler.

---

## Response and error conventions

**Never return a raw Mongoose document.** Services map documents to hand-built `Safe*` interfaces (`SafeWorkspace`, `SafeTask`, …) that expose only intended fields and omit internals like `passwordHash` or the raw `members` array. The exact shapes are documented in [API.md](API.md).

**Success responses** wrap the payload under a named key (`{ workspace }`, `{ tasks }`, `{ members }`). Deletes and simple actions return `{ success: true, message }`.

**Errors** are thrown as `AppError` (see `src/utils`) with a `statusCode`. The central `errorHandler` serializes them to `{ error: { message } }`, adding a `stack` only outside production and collapsing unexpected `500`s to a generic message in production. Throw `AppError` from services rather than sending responses from deep in the call stack.

---

## Adding a new resource

Follow the existing resources as templates (tasks and discussions are good references). To add, say, a "label" resource:

1. **Model** — add `src/models/Label.ts`: a Mongoose schema plus an `ILabel` interface. Reference parents by `ObjectId`.
2. **Validator** — add `src/validators/labelValidators.ts` with Zod schemas for create/update/params.
3. **Service** — add `src/services/labelService.ts`. Implement a private `getContext` that verifies membership and scopes parents, a `SafeLabel` interface, a `toSafeLabel` mapper, and the CRUD methods. All authorization lives here.
4. **Controller** — add `src/controllers/labelController.ts` with thin handlers that call the service and shape responses.
5. **Route** — add `src/routes/labelRoutes.ts`, attach `requireAuth` and `validate(...)`, then mount it in `src/routes/index.ts`.
6. **Tests** — add `tests/label.test.ts` covering happy paths *and* an isolation case (a non-member/other-workspace user must be denied).
7. **Docs** — add the endpoints to [API.md](API.md).

Run `npm run build` (type-check) and `npm test` before committing.

---

## Frontend architecture

The frontend is a React 19 + TypeScript SPA built with Vite and styled with Tailwind CSS v4 (via `@tailwindcss/vite` — there is no separate Tailwind config/PostCSS step). Routing uses `react-router-dom` 7.

All network calls go through a **centralized API client** in `src/api`. The client attaches the `Authorization: Bearer <token>` header from the stored token, normalizes error responses into a consistent shape, and centralizes `401` handling (clearing the session and redirecting to login) so individual screens don't repeat that logic. The JWT is stored in `localStorage` under `cobly_token`. Auth state is provided app-wide through the context in `src/context`.

Screens live in `src/pages` (route-level) and share presentational pieces from `src/components`. When adding a call to a new endpoint, add a typed function to the relevant `src/api` module rather than calling `fetch` directly from a component — this keeps auth, error normalization, and types in one place.

> **Tailwind v4 note:** opacity utilities use slash syntax (`bg-black/50`), not the removed `bg-opacity-*` classes.

---

## Testing

Backend tests use **Jest + ts-jest**, with **Supertest** driving the real Express app and **mongodb-memory-server** providing an in-memory MongoDB — so tests run without any external database and exercise the full route → service → model stack.

```bash
cd backend
npm test                 # run the suite
npm run test:coverage    # run with a coverage report
```

Test helpers in `tests/helpers` build the app and create authenticated users. Coverage is collected from `src/**/*.ts` (excluding `server.ts` and `config/**`). The suite deliberately includes security regressions: cross-workspace isolation, role enforcement (a member cannot add members), mass-assignment rejection (`_id`/`owner` injection), rate-limit and Helmet headers, the 100 kB body limit, and the `JWT_SECRET` fail-fast check.

When adding a resource, always include at least one isolation test proving a user from another workspace is denied.

---

## Coding conventions

- **TypeScript strict, no escape hatches.** Do not introduce `any`, `as any`, or `@ts-ignore`. Prefer `unknown` with a type guard, precise interfaces, or discriminated unions. Casts like `x as SomeType` are only acceptable when genuinely sound (e.g. narrowing a populated Mongoose ref whose runtime shape you control).
- **Validate at the boundary.** Every external input is parsed by Zod in the validation layer; downstream code can trust its types.
- **Keep controllers thin, put logic in services**, and route every data access through `getContext`.
- **Never leak internal fields** — map to `Safe*` DTOs.
- **No secrets in code or logs.** Configuration comes from the environment via `src/config`; never log tokens or credentials.

---

## Git conventions

Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`). Keep commits focused and preserve history (no force-pushing shared branches). CI (`.github/workflows/ci.yml`) runs backend build + coverage, frontend lint + build, security hygiene checks, and Docker image builds on every push and pull request; make sure it passes before merging.
