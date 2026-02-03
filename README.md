# Healthcare Clinic System

Monorepo scaffold cho hệ thống phòng khám.

## Tech stack

- Web: React + Vite
- Backend (mới): Java 17 + Spring Boot + PostgreSQL + Flyway
- Backend (cũ/giữ lại tạm thời): Node.js + Express + Prisma

## Cấu trúc thư mục

- `apps/web`: Frontend (Vite)
- `apps/backend`: Spring Boot backend
- `apps/api`: Node/Express API (legacy trong giai đoạn migrate)
- `packages/shared`: Shared TS package

## Yêu cầu

- Node.js >= 20
- Java 17
- Maven
- Docker (để chạy PostgreSQL local)

## Chạy local (recommended)

1. Cài dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
npm run db:up
```

3. Run web + Spring Boot backend:

```bash
npm run dev
```

- Web: http://localhost:3000
- Backend health: http://localhost:4000/api/v1/health
- Actuator health: http://localhost:4000/actuator/health
- Swagger UI: http://localhost:4000/swagger-ui

## Chạy từng app

- Web:

```bash
npm run dev:web
```

- Spring Boot backend:

```bash
npm run dev:backend
```

- Node API (legacy):

```bash
npm run dev:api
```

Lưu ý: `apps/api` và `apps/backend` mặc định đều dùng port `4000`. Nếu cần chạy song song, hãy đổi **một trong hai**:

- Node API: set `PORT=4001` trong `apps/api/.env`
- Spring Boot: set `SERVER_PORT=4001` (env var)

## Environment variables

- `apps/backend/.env.example`: biến môi trường cho Spring Boot (không auto-load `.env`, dùng env thật hoặc IDE run config)
- `apps/api/.env.example`: biến môi trường cho Node API (được load bởi `dotenv`)

## Database & migrations

- PostgreSQL local chạy qua `docker-compose.yml` (DB: `clinic_dev`, user/pass: `postgres`)
- Spring Boot backend dùng Flyway và sẽ tự chạy migrations khi start app

## Scripts

- `npm run check`: lint + typecheck + prettier check
- `npm run check:all`: `check` + build tất cả workspaces
- `npm run lint`: ESLint
- `npm run lint:fix`: ESLint auto-fix
- `npm run typecheck`: TypeScript typecheck (workspace-safe)
- `npm run format`: Prettier (ignore unknown file types)
- `npm run format:check`: Prettier check
- `npm run build`: build tất cả workspaces
- `npm run db:up`: start PostgreSQL (docker compose)
- `npm run db:down`: stop PostgreSQL
- `npm run db:logs`: xem logs PostgreSQL

## Git hooks

Repo dùng Husky (v9). Pre-commit sẽ chạy:

- `npm run check`

Nếu clone repo mà hooks chưa hoạt động, chạy:

```bash
npm run prepare
```
