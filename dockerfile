# multi-stage Dockerfile using official Node image (public)
FROM node:20-bullseye AS builder
WORKDIR /app

# copy package files and install (including dev deps for build)
COPY package*.json ./
RUN npm ci

# copy app, generate prisma client, build
COPY . .
# generate Prisma client (reads schema.prisma, doesn't need DB)
RUN npx prisma generate
RUN npm run build

FROM node:20-bullseye-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# copy built app and node_modules from builder
COPY --from=builder /app ./

# remove dev deps to slim image
RUN npm prune --production || true

EXPOSE 3000

# use an entrypoint that runs migrations (if desired) then starts services
ENTRYPOINT ["sh", "/app/entrypoint.sh"]