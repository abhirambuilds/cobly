# syntax=docker/dockerfile:1

########################################
# Stage 1: Build (Vite production bundle)
########################################
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install dependencies using the lockfile. On a Linux/glibc image this pulls the
# correct native bindings (rolldown, @tailwindcss/oxide, lightningcss).
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source (node_modules/dist/.env are excluded by .dockerignore).
COPY . .

# VITE_API_URL is a BUILD-TIME variable: Vite inlines it into the static bundle.
# It is the URL the USER'S BROWSER uses to reach the backend, so it must be a
# host-reachable URL (e.g. http://localhost:5000/api) — never an internal Docker
# service name like http://backend:5000. It is a public URL, not a secret.
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

########################################
# Stage 2: Serve static assets with nginx
########################################
FROM nginx:1.27-alpine AS runtime

# SPA fallback config so deep links (/login, /dashboard/workspaces/:id, ...) work.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Only the built static assets are copied into the runtime image.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Lightweight health check using busybox wget (bundled in nginx:alpine).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null 2>&1 || exit 1

# nginx runs in the foreground (NOT the Vite dev server).
CMD ["nginx", "-g", "daemon off;"]
