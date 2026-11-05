# Booking App API

A movie ticket booking REST API built with NestJS and PostgreSQL. Primary learning focus: **PostgreSQL concurrency patterns** — row-level locking, transaction isolation, and preventing double-booking under concurrent load.

## Stack

- **NestJS** (TypeScript) — framework
- **PostgreSQL** — database
- **Prisma v7** — ORM and migrations
- **Jest** — testing
- **pnpm** — package manager

## Setup

**Prerequisites:** Node.js 22+, pnpm, PostgreSQL (or use Docker Compose)

```bash
# 1. Start the database
docker compose up -d

# 2. Copy env and fill in values
cp .env.example .env

# 3. Install dependencies
pnpm install

# 4. Run migrations
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. Seed database (movies, theatres, screenings + admin user)
npx prisma db seed
```

See `.env.example` for all required variables. The `DATABASE_URL` must point to the Postgres instance started by Compose (default port `5555`).

## Run

```bash
# Development (watch mode)
pnpm start:dev

# Production build
pnpm build && pnpm start:prod
```

- API base: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

## Docker

```bash
# Build the image
docker build -t booking-app-api .

# Run against an already-running Postgres (uses host network)
docker run --rm --network host --env-file .env booking-app-api
```

> Migrations are not run inside the container. Run `npx prisma migrate deploy` from the host before starting the container.

## Test

```bash
pnpm test          # unit tests
pnpm test:watch    # watch mode
pnpm test:e2e      # end-to-end tests
pnpm test:cov      # coverage report
```

## API Overview

Full interactive docs at `/api/docs` (Swagger UI). All responses are wrapped in `{ success, statusCode, data, timestamp }`. Errors return `{ success: false, statusCode, error, message }`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register a new user |
| POST | `/api/v1/auth/login` | — | Login, returns JWT |
| GET | `/api/v1/auth/profile` | JWT | Current user profile |

### Movies
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/movies` | — | List movies (paginated) |
| GET | `/api/v1/movies/:id` | — | Movie detail |
| GET | `/api/v1/movies/:id/theatres` | — | Theatres showing this movie |
| GET | `/api/v1/movies/:id/theatres/:theatreId/screenings` | — | Screening timeslots |

### Theatres _(writes: admin only)_
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/theatres` | — | List theatres (paginated) |
| GET | `/api/v1/theatres/:id` | — | Theatre detail |
| POST | `/api/v1/theatres` | Admin | Create theatre with address |
| PATCH | `/api/v1/theatres/:id` | Admin | Update theatre / address |
| DELETE | `/api/v1/theatres/:id` | Admin | Delete (blocked if auditoriums exist) |
| GET | `/api/v1/theatres/:id/auditoriums` | — | List auditoriums in a theatre |
| POST | `/api/v1/theatres/:id/auditoriums` | Admin | Add an auditorium |

### Auditoriums _(writes: admin only)_
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/api/v1/auditoriums/:id` | Admin | Update auditorium |
| DELETE | `/api/v1/auditoriums/:id` | Admin | Delete (blocked if screenings exist) |
| GET | `/api/v1/auditoriums/:id/seats` | — | List seats |
| POST | `/api/v1/auditoriums/:id/seats` | Admin | Bulk-create explicit seats |
| PATCH | `/api/v1/auditoriums/:id/seats/:seatId/status` | Admin | Toggle ACTIVE / INACTIVE |
| DELETE | `/api/v1/auditoriums/:id/seats/:seatId` | Admin | Soft-delete a seat |
| DELETE | `/api/v1/auditoriums/:id/seats` | Admin | Soft-delete all seats |

### Screenings _(writes: admin only)_
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/screenings` | — | List screenings (paginated, `?movieId`) |
| GET | `/api/v1/screenings/:id` | — | Screening detail |
| GET | `/api/v1/screenings/:id/seats` | — | Seat availability |
| POST | `/api/v1/screenings` | Admin | Create screening |
| PATCH | `/api/v1/screenings/:id` | Admin | Update screening |
| DELETE | `/api/v1/screenings/:id` | Admin | Delete (blocked if bookings exist) |

### Bookings _(JWT required)_
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/bookings` | JWT | Hold seats (15 min TTL) |

## Pagination

List endpoints accept `?page=1&limit=10` (max `limit=100`). Response shape:

```json
{ "items": [], "total": 0, "page": 1, "limit": 10, "totalPages": 0 }
```

## Admin Seed

`npx prisma db seed` upserts an admin user:

| Field | Default | Override |
|-------|---------|----------|
| Email | `admin@example.com` | `SEED_ADMIN_EMAIL` |
| Password | `admin12345` | `SEED_ADMIN_PASSWORD` |

Role is baked into the JWT — re-login after any role change.

## Concurrency

Seat holds are enforced by a `@@unique([screeningId, seatId])` constraint on `BookingSeat`. Concurrent requests for the same seat hit a Prisma P2002, which the global `PrismaExceptionFilter` maps to a `409 Conflict`. No application-level locking is needed.
