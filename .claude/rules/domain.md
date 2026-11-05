# Domain Models & Relationships

## Models
- **User** — Authenticated user. Has email + hashed password + `role` (string: `USER` | `ADMIN`, default `USER`).
- **Movie** — Title, description, duration in minutes.
- **Theatre** — Cinema location with address.
- **Auditorium** — Hall inside a theatre. Has a fixed set of seats.
- **Seat** — Physical seat (row + number) in an auditorium. Unique per auditorium. Has `status` (`ACTIVE` | `INACTIVE` | `DELETED`). Never hard-deleted: `DELETED` rows stay so past bookings keep their reference. `INACTIVE` = maintenance, blocks new holds. Both `INACTIVE` and `DELETED` are refused (409) while the seat has upcoming CONFIRMED/unexpired-HOLD bookings — cancel those first. Listings hide `DELETED`; re-creating a deleted row/number restores it.
- **Screening** — A movie scheduled in an auditorium at a specific datetime.
- **Booking** — A user's reservation for a screening. Has status + expiresAt.
- **BookingSeat** — Join between a Booking and a Seat. Carries screeningId for the DB-level uniqueness constraint.

## Relationships
- Theatre → many Auditoriums
- Auditorium → many Seats, many Screenings
- Movie → many Screenings
- Screening → one Movie, one Auditorium
- User → many Bookings
- Booking → one Screening, many BookingSeats
- BookingSeat → one Booking, one Seat

## Booking Statuses
```
HOLD       — seats reserved, pending payment/confirmation (15 min TTL)
CONFIRMED  — booking finalised
CANCELLED  — user cancelled
EXPIRED    — hold TTL passed without confirmation
```

## Auth Rules
No global guard — routes are public by default.

- `@UseGuards(JwtGuard)` — requires a valid JWT (any authenticated user)
- `@UseGuards(AdminGuard)` — requires a valid JWT **and** `role === 'ADMIN'`; it is a single combined guard, no need to stack both

| Endpoint group | Guard |
|---|---|
| `auth/register`, `auth/login` | None |
| `auth/profile` | `JwtGuard` |
| `movies/*` | None |
| `theatres/*` reads | None |
| `theatres/*` writes | `AdminGuard` |
| `auditoriums/*` reads | None |
| `auditoriums/*` writes | `AdminGuard` |
| `screenings/*` reads | None |
| `screenings/*` writes | `AdminGuard` |
| `bookings/*` | `JwtGuard` |

**Enums (code-only, not in DB):**
- `Role` — `src/modules/auth/enums/role.enum.ts` (`USER`, `ADMIN`)
- `SeatType` — `src/modules/auditoriums/enums/seat-type.enum.ts` (`STANDARD`, `VIP`)
- `SeatStatus` — `src/modules/auditoriums/enums/seat-status.enum.ts` (`ACTIVE`, `INACTIVE`, `DELETED`)

`npx prisma db seed` upserts an admin (`admin@example.com` / `admin12345`; override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). To promote anyone else: set `role = 'ADMIN'` in the DB (no promotion endpoint yet). The role is baked into the JWT, so re-login after a change.

## Schema Location
`prisma/schema.prisma` — source of truth.
Generated client: `src/generated/prisma`.
