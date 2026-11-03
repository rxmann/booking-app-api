# Domain Models & Relationships

## Models
- **User** — Authenticated user. Has email + hashed password.
- **Movie** — Title, description, duration in minutes.
- **Theatre** — Cinema location with address.
- **Auditorium** — Hall inside a theatre. Has a fixed set of seats.
- **Seat** — Physical seat (row + number) in an auditorium. Unique per auditorium.
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

## Schema Location
`prisma/schema.prisma` — source of truth.
Generated client: `src/generated/prisma`.
