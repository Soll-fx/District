# District API — Docker (для Koyeb / любого Docker-хостинга)
# Build-контекст: корень репозитория (monorepo). Dockerfile: apps/api/Dockerfile

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY apps/api/package.json apps/api/package-lock.json ./apps/api/
WORKDIR /app/apps/api
RUN npm ci
COPY apps/api/ .
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app/apps/api
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* && mkdir -p uploads
COPY --from=build /app/apps/api/package.json /app/apps/api/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/node_modules/@prisma ./node_modules/@prisma
EXPOSE 4000
CMD ["sh", "-c", "echo '=== running migrations ==='; npx prisma migrate deploy; echo '=== migrations done ==='; PORT=${PORT:-4000} node dist/src/main.js"]
