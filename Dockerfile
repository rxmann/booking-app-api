# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm

# pnpm-workspace.yaml carries allowBuilds (bcrypt, prisma engines) — needed at install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Client is generated to src/generated/prisma and compiled into dist/generated
RUN pnpm prisma generate
RUN pnpm build

# drop dev dependencies
RUN pnpm prune --prod

# ─── Stage 3: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER node

EXPOSE 3000

# Run `prisma migrate deploy` separately (prisma CLI is a dev dependency, not in this image)
CMD ["node", "dist/main.js"]
