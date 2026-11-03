# CLAUDE.md

## Project Overview

A small movie ticket booking REST API.

## Tech Stack

- TypeScript
- NestJS
- PostgreSQL
- Prisma (ORM and migrations)
- Jest
- REST API (versioned)

## Domain Models

- **User** — Normal authenticated user.
- **Movie** — Movie information (title, description, duration, etc.).
- **Theatre** — Cinema location with address.
- **Auditorium** — Individual hall inside a theatre.
- **Screening** — A movie scheduled in an auditorium at a specific date/time.
- **Seat** — Physical seat belonging to an auditorium.
- **Booking** — Reservation made by a user for a screening.
- **BookingSeat** — Join entity connecting a booking with its selected seats.

## Important Relationships

- Theatre has many auditoriums.
- Auditorium has many seats.
- Auditorium has many screenings.
- Movie has many screenings.
- Screening belongs to one movie and one auditorium.
- User has many bookings.
- Booking belongs to one screening.
- Booking has many BookingSeats.
- BookingSeat references one physical seat.

## Booking Statuses

- HOLD
- CONFIRMED
- CANCELLED
- EXPIRED

## Seat Reservation Rules

- Creating a booking reserves selected seats with status HOLD.
- Hold duration: 15 minutes.
- Each booking has an expiresAt timestamp.
- Expired holds must release their seats.
- Confirming a valid hold changes status to CONFIRMED.
- Cancelling a booking changes status to CANCELLED.
- Expired bookings cannot be confirmed.
- Confirmed bookings cannot be held or confirmed again.

## Concurrency & Data Integrity

- Never allow the same seat to be booked twice for the same screening.
- Use PostgreSQL transactions for booking operations.
- Use row-level locking or an equivalent concurrency-safe mechanism.
- Lock/check selected seats in a consistent order.
- Validate that selected seats belong to the screening's auditorium.
- Handle expired holds during availability checks and booking operations.
- Enforce appropriate database constraints and indexes.

## API Design

Base path: `/api/v1`

### Movies

- GET `/movies`
- GET `/movies/:id`

### Theatres

- GET `/theatres`
- GET `/theatres/:id`

### Screenings

- GET `/screenings?movieId=&theatreId=&date=`
- GET `/screenings/:id`
- GET `/screenings/:id/seats`

### Bookings

- POST `/bookings` — Create a seat hold.
- POST `/bookings/:id/confirm` — Confirm booking.
- DELETE `/bookings/:id` — Cancel booking.
- GET `/bookings/:id` — Get booking details.
- GET `/users/me/bookings` — Get authenticated user's bookings.

## Authentication & Authorization

- Only authenticated users can make bookings.
- No anonymous bookings.
- Users can only access and manage their own bookings.
- Protect booking endpoints with authentication guards.

## Validation

- Validate request payloads using DTOs.
- Validate IDs and entity relationships.
- Prevent invalid seat selections.
- Prevent bookings for past screenings.
- Validate booking ownership and status transitions.

## Testing

Use Jest.

Cover:

- Unit tests for business logic.
- Integration tests for database operations.
- E2E tests for API endpoints.
- Concurrent booking attempts for the same seats.
- Hold expiration and confirmation scenarios.

## Database & Migrations

- Use Prisma as the ORM for schema definition and database access.
- Define all models in `prisma/schema.prisma`.
- Use Prisma Migrate (`prisma migrate dev`) for all schema changes; never edit the database manually.
- Do not rely on `prisma db push` or automatic schema synchronization in production.
- Use the Prisma Client generated types throughout the codebase.
- For raw SQL (e.g., row-level locking), use `prisma.$queryRaw` or `prisma.$executeRaw`.
- Seed data goes in `prisma/seed.ts`.

## Development Guidelines

- Follow NestJS module architecture.
- Keep controllers thin; business logic belongs in services.
- Use DTOs for request validation.
- Keep business logic testable.
- Avoid unnecessary abstractions and overengineering.
- Follow existing project conventions before introducing new patterns.
