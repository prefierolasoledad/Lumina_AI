# syntax=docker/dockerfile:1

# ---- Build stage: compile TypeScript -> dist ----
FROM node:20-alpine AS build
WORKDIR /app

# Install ALL deps (incl. dev) so tsc is available
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Deps stage: production-only node_modules ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Production dependencies and compiled output
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Multer writes uploaded files here; create it and hand ownership to the
# non-root `node` user that ships with the base image.
RUN mkdir -p uploads && chown -R node:node /app
USER node

EXPOSE 5000
CMD ["node", "dist/index.js"]
