# API Design

Base path: `/api/v1`

## Endpoints

### Movies
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/movies` | No | List all |
| GET | `/movies/:id` | No | |

### Theatres
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/theatres` | No | List all |
| GET | `/theatres/:id` | No | |

### Screenings
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/screenings` | No | Query: `?movieId=&theatreId=&date=` |
| GET | `/screenings/:id` | No | |
| GET | `/screenings/:id/seats` | No | Returns seats with availability status |

### Bookings
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/bookings` | Required | Body: `{ screeningId, seatIds[] }` — creates HOLD |
| POST | `/bookings/:id/confirm` | Required | Owner only |
| DELETE | `/bookings/:id` | Required | Owner only |
| GET | `/bookings/:id` | Required | Owner only |
| GET | `/users/me/bookings` | Required | Authenticated user's bookings |

## Authentication
- JWT Bearer token.
- Auth guard on all booking endpoints.
- User extracted from JWT payload; no trust of user ID from request body.
- Users can only read/modify their own bookings (ownership check in service).

## Validation
- All payloads validated via class-validator DTOs.
- `seatIds` must be non-empty array of integers.
- `screeningId` must reference an existing, future screening.
- Return `400` for validation errors, `401` for unauthenticated, `403` for ownership violations, `404` for missing resources, `409` for seat conflicts.

## Response Shape
Follow NestJS defaults. No custom envelope. HTTP status codes carry semantics.
