# Booking Rules & Concurrency

## Reservation Lifecycle
1. POST `/bookings` → creates Booking with status `HOLD`, sets `expiresAt = now + 15min`, creates BookingSeat rows.
2. POST `/bookings/:id/confirm` → transitions `HOLD → CONFIRMED`. Fails if expired.
3. DELETE `/bookings/:id` → transitions any active status → `CANCELLED`.

## Status Transition Rules
- `HOLD` → `CONFIRMED` or `CANCELLED` or `EXPIRED`
- `CONFIRMED` → `CANCELLED` only
- `CANCELLED` / `EXPIRED` → terminal, no further transitions

## Hold Expiry
- Expired bookings must be treated as released during seat availability checks.
- Query: exclude BookingSeats whose Booking has `status = EXPIRED` or `expiresAt < now`.
- A background job or on-demand check handles expiry; no cron is strictly required for correctness if availability queries filter expired holds.

## Concurrency Strategy
Goal: never allow two bookings to claim the same seat for the same screening.

### DB-level guard
`BookingSeat` has `@@unique([screeningId, seatId])` — hard prevents duplicates at write time.

### Application-level locking (booking creation)
Use a PostgreSQL transaction with `SELECT ... FOR UPDATE` on the target seats:
```sql
SELECT * FROM "Seat"
WHERE id = ANY($1)
ORDER BY id   -- consistent order prevents deadlocks
FOR UPDATE
```
Run via `prisma.$queryRaw`. Inside the same transaction:
1. Re-check seats are not already booked for the screening.
2. Insert Booking + BookingSeat rows.
3. Commit.

### Ordering rule
Always lock/check seats in ascending `id` order to prevent deadlock between concurrent transactions.

## Validation at Booking Time
- Screening must exist and be in the future.
- All selected seats must belong to the screening's auditorium.
- No seat may already have an active (non-expired) BookingSeat for that screening.
- Minimum 1 seat per booking.
