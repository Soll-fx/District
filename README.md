# Trading Rebuild

Пересборка приложения по технической спецификации (нижний док, 12 разделов, светлая тема).

## Структура

```
apps/
  web/   — Next.js 16 (App Router, TypeScript, Tailwind 4) — фронтенд
  api/   — NestJS + Prisma + PostgreSQL — бэкенд
docker-compose.yml — PostgreSQL для локальной разработки
```

## Быстрый старт

Требования: Node.js 20+ (проверено на 24), локальный PostgreSQL 16 (см. ниже).

```bash
# 1. База данных (если ещё не запущена)
cd apps/api
npm run db:start          # статус: npm run db:status

# 2. Бэкенд
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run start:dev

# 3. Фронтенд
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Фронтенд: http://localhost:3000
API: http://localhost:4000/api — swagger /docs

## Вход и связка с API

Фронтенд защищён JWT-авторизацией. Первый запуск ведёт на http://localhost:3000/login:

```bash
Email:    district@example.com
Пароль:   district123
```

На реальные данные переведены: дашборд, журнал сделок, аналитика, страница рейтинга
(метрики, винрейт, достижения) и лента «SOLO Achievements» (REST + WebSocket в реальном времени).
Остальные разделы (идеи, changelog, inbox, библиотеки, настройки, корзина) пока на моках.

Переменные фронтенда — `apps/web/.env.local` (см. `.env.local.example`):
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`.

## Локальная база данных (PostgreSQL 16)

Docker в системе отсутствует, поэтому PostgreSQL ставится локально в `~/.local/postgres`,
данные кластера — `~/.local/pgdata`, порт `5432`, БД `trading`, логин/пароль `postgres`/`postgres`.

```bash
# Запуск/остановка
npm run db:start
npm run db:stop
npm run db:status
```

Управление из npm-скриптов (`apps/api/package.json`): `db:start`, `db:stop`, `db:status`.
В `docker-compose.yml` оставлен альтернативный вариант с Docker (требует установленного Docker).

## Локальный Node

Node не был установлен в системе — ставится в `~/.local/node`:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
```

## Стек

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts, TanStack Query, Zustand, lucide-react
- **Backend**: NestJS 11, Prisma, PostgreSQL, JWT (passport), Socket.io, class-validator
