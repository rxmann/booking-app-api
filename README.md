# Booking App API

A movie ticket booking REST API built with NestJS and PostgreSQL. Primary learning focus: **PostgreSQL concurrency patterns** — row-level locking, transaction isolation, and preventing double-booking under concurrent load.

## Stack

- **NestJS** (TypeScript) — framework
- **PostgreSQL** — database
- **Prisma v7** — ORM and migrations
- **Jest** — testing

## Setup

**Prerequisites:** Node.js, pnpm, PostgreSQL running (or `docker compose up -d`)

```bash
# Start the database
docker compose up -d

# Install dependencies
pnpm install

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

Copy `.env.example` to `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL="postgresql://local:local@localhost:5432/booking-db"
```

## Run

```bash
# Development (watch mode)
pnpm start:dev

# Production
pnpm build && pnpm start:prod
```

API is available at `http://localhost:3000/api/v1`.

## Test

```bash
# Unit tests
pnpm test

# Unit tests in watch mode
pnpm test:watch

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/movies` | No | List movies |
| GET | `/api/v1/theatres` | No | List theatres |
| GET | `/api/v1/screenings` | No | List screenings (`?movieId=&theatreId=&date=`) |
| GET | `/api/v1/screenings/:id/seats` | No | Seat availability for a screening |
| POST | `/api/v1/bookings` | Yes | Hold seats (15 min TTL) |
| POST | `/api/v1/bookings/:id/confirm` | Yes | Confirm a hold |
| DELETE | `/api/v1/bookings/:id` | Yes | Cancel a booking |
| GET | `/api/v1/users/me/bookings` | Yes | My bookings |

## Future Plans

### Real-time with WebSockets

The natural next step is making seat availability and booking events real-time so clients see updates without polling.

- **Seat availability feed** — when a seat is held, confirmed, or released (expired/cancelled), broadcast the update to all clients viewing that screening.
- **Booking status updates** — notify the booking owner when their hold is about to expire or when the status changes.
- **NestJS WebSocket gateway** — use `@nestjs/websockets` with Socket.IO or the native WS adapter. A `ScreeningGateway` subscribes to booking events and emits to a `screening:{id}` room.
- **Hold expiry push** — instead of relying purely on client-side timers, the server emits a `booking:expired` event when a hold TTL lapses, so the UI can react immediately.
- **Concurrency visibility** — emit `seat:locked` and `seat:released` events during the transaction lifecycle, giving clients a live view of contention on popular screenings.
