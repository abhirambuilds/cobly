# Cobly frontend

React 19 + TypeScript single-page app for Cobly, built with Vite and styled with Tailwind CSS v4. It talks to the [Cobly API](../docs/API.md).

## Getting started

```bash
npm install
cp .env.example .env     # optional — code default is http://localhost:5000/api
npm run dev              # Vite dev server on http://localhost:5173
```

The backend must be running for the app to work; see the [root README](../README.md) and the [development guide](../docs/DEVELOPMENT.md).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` | Base URL of the Cobly API (must include the `/api` suffix — all backend routes are mounted under `/api`) |

`VITE_API_URL` is read at build time. When building the Docker image, pass it as a build argument (see [../DOCKER.md](../DOCKER.md)).

## Structure

- `src/services` — centralized fetch client (`api.ts`, which attaches the auth header, normalizes errors, handles `401`) and typed per-resource modules.
- `src/hooks` — `useAuth.tsx` auth context/provider; the JWT is stored in `localStorage` under `cobly_token`.
- `src/pages` — route-level screens.
- `src/components` — reusable UI.

When calling a new endpoint, add a typed function to the relevant `src/services` module rather than calling `fetch` from a component. See the [development guide](../docs/DEVELOPMENT.md#frontend-architecture) for conventions.
