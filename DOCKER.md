# Running Cobly with Docker

A single command brings up the full stack — MongoDB, the backend API, and the
frontend — using Docker Compose.

## Prerequisites

- Docker Engine with the Docker Compose v2 plugin (`docker compose`, not the
  legacy `docker-compose`). Docker Desktop includes both.

## 1. Configure environment

Copy the template and set a secret:

```bash
cp .env.docker.example .env
```

Then edit `.env` and set a strong `JWT_SECRET` (at least 32 characters):

```bash
# .env is gitignored — your secrets are never committed
openssl rand -hex 32   # paste the output as JWT_SECRET
```

| Variable         | Used by            | Default (in compose)            | Notes |
|------------------|--------------------|---------------------------------|-------|
| `JWT_SECRET`     | backend            | _(required — no default)_       | ≥ 32 chars. Compose refuses to start without it. |
| `JWT_EXPIRES_IN` | backend            | `1h`                            | Token lifetime. |
| `MONGODB_URI`    | backend            | `mongodb://mongo:27017/cobly`   | Internal Docker address. Override for a managed DB (e.g. Atlas). |
| `FRONTEND_URL`   | backend (CORS)     | `http://localhost:8080`         | Must match where the browser loads the frontend. |
| `VITE_API_URL`   | frontend (build)   | `http://localhost:5000/api`     | Browser-facing backend URL. See note below. |
| `BACKEND_PORT`   | host port mapping  | `5000`                          | Host port → backend container `5000`. |
| `FRONTEND_PORT`  | host port mapping  | `8080`                          | Host port → frontend container `80`. |

## 2. Build and start

```bash
docker compose build
docker compose up -d
```

Check status and logs:

```bash
docker compose ps
docker compose logs -f backend
```

## 3. Open the app

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- Backend health (liveness): http://localhost:5000/api/health
- Backend readiness (checks MongoDB): http://localhost:5000/api/health/readiness

## Frontend API URL — important

`VITE_API_URL` is baked into the frontend at **build time** and is used by the
**browser**, which runs *outside* the Docker network. It must therefore be a
host-reachable URL such as `http://localhost:5000/api`.

Do **not** set it to `http://backend:5000`: the `backend` service name only
resolves *inside* the Docker network, so the browser cannot use it. The `/api`
suffix is required because all backend routes are mounted under `/api`.

If you change `FRONTEND_PORT` or `BACKEND_PORT`, update `FRONTEND_URL` and
`VITE_API_URL` to match, then rebuild the frontend (`docker compose build
frontend`) so the new URL is baked in.

## Stopping and cleaning up

```bash
docker compose down          # stop and remove containers (keeps data)
docker compose down -v       # also remove the MongoDB volume (deletes all data)
```

## MongoDB persistence

MongoDB data is stored in a named Docker volume (`mongo_data`) mounted at
`/data/db`, so it survives `docker compose down` and container restarts. It is
only removed if you run `docker compose down -v`. MongoDB is **not** published to
the host — it is reachable only by the backend over the internal Docker network.

## Startup order & health

Compose starts MongoDB first and waits until its healthcheck passes before
starting the backend (`depends_on: condition: service_healthy`). The backend
image has its own healthcheck against `/api/health/readiness`, which reports
healthy only once MongoDB is connected. The frontend starts after the backend.
