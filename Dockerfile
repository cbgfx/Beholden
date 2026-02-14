# ===== 1) Build web =====
FROM node:20-alpine AS web-build
WORKDIR /app/web

# install deps
COPY web/package*.json ./
RUN npm install

# build
COPY web/ ./
RUN npm run build


# ===== 2) Build server =====
FROM node:20-alpine AS server-build
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server/ ./
RUN npm run build

# If your server is TS and has a build step, keep this.
# If it is plain JS, this should still be harmless if build script exists.
RUN npm run build


# ===== 3) Runtime =====
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2385
ENV HOST=0.0.0.0

# Server production deps only
COPY --from=server-build /app/server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Server build output + runtime files
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/src ./src
COPY --from=server-build /app/server/server.js ./server.js
COPY --from=server-build /app/server/server.ts ./server.ts
COPY --from=server-build /app/server/data ./data

# Web build output gets served statically by the server (recommended)
# This assumes your server serves ../web/dist (we’ll wire that if needed).
WORKDIR /app
COPY --from=web-build /app/web/dist ./web/dist

WORKDIR /app/server
EXPOSE 2385

# Prefer dist entry if present; fallback to server.js if that’s what you use.
# Adjust this line to match your real runtime entry:
CMD ["node", "dist/index.js"]
