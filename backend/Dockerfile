# syntax=docker/dockerfile:1

########################################
# Stage 1: Build (compile TypeScript)
########################################
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install ALL dependencies (incl. devDependencies) using the lockfile.
# bcrypt ships prebuilt binaries via node-gyp-build, so no build tools are needed.
COPY package.json package-lock.json ./
RUN npm ci

# Copy only what the compiler needs, then build to ./dist
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

########################################
# Stage 2: Production dependencies only
########################################
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

########################################
# Stage 3: Runtime (slim, non-root)
########################################
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules and compiled output only.
# No source .ts, no devDependencies, no .env are present in this image.
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist

# Run as the built-in unprivileged user provided by the base image.
USER node

# Documented port; the app reads the actual port from the PORT env var (default 5000).
EXPOSE 5000

# Container-level health check hits the readiness probe, which reports 200 only
# once MongoDB is connected. Uses Node's built-in fetch (no curl/wget dependency)
# and a modest interval so it does not generate excessive traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health/readiness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run the compiled production server (NOT the dev server).
CMD ["node", "dist/server.js"]
