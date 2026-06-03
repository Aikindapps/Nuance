# Multi-stage Dockerfile for the Nuance Stripe proxy.
# Build stage compiles TypeScript; runtime stage runs only the compiled JS + prod deps.

FROM node:20-alpine AS build
WORKDIR /app

# Install all deps (incl. dev) for the build
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and the Subscription canister declarations the proxy depends on
COPY tsconfig.json ./
COPY src ./src
COPY declarations ./declarations

# Compile TypeScript -> dist/
RUN npx tsc

# ---

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Compiled JS + the IDL the runtime imports
COPY --from=build /app/dist ./dist
COPY --from=build /app/declarations ./declarations

EXPOSE 3001

# Render passes PORT via env; the server reads process.env.PORT (defaults to 3001)
CMD ["node", "dist/server.js"]
