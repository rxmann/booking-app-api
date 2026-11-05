# API Guidelines & Status

## Endpoint Status

### Auth
- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `GET  /api/v1/auth/profile` _(JWT required)_

### Movies
- [x] `GET /api/v1/movies` — paginated
- [x] `GET /api/v1/movies/:id`

### Theatres _(writes: Admin only)_
- [x] `GET    /api/v1/theatres` — paginated
- [x] `GET    /api/v1/theatres/:id`
- [x] `POST   /api/v1/theatres`
- [x] `PATCH  /api/v1/theatres/:id`
- [x] `DELETE /api/v1/theatres/:id`

### Auditoriums _(writes: Admin only)_
- [x] `GET    /api/v1/theatres/:theatreId/auditoriums`
- [x] `POST   /api/v1/theatres/:theatreId/auditoriums`
- [x] `PATCH  /api/v1/auditoriums/:id`
- [x] `DELETE /api/v1/auditoriums/:id`
- [x] `POST   /api/v1/auditoriums/:id/seats` — bulk create explicit seats
- [x] `GET    /api/v1/auditoriums/:id/seats`
- [x] `PATCH  /api/v1/auditoriums/:id/seats/:seatId/status` — ACTIVE/INACTIVE (maintenance toggle; INACTIVE blocked by upcoming bookings)
- [x] `DELETE /api/v1/auditoriums/:id/seats/:seatId` — soft delete (blocked by upcoming bookings)
- [x] `DELETE /api/v1/auditoriums/:id/seats` — soft delete all seats

### Screenings _(writes: Admin only)_
- [x] `GET    /api/v1/screenings` — paginated, optional `?movieId`
- [x] `GET    /api/v1/screenings/:id`
- [x] `GET    /api/v1/screenings/:id/seats` — availability
- [x] `POST   /api/v1/screenings`
- [x] `PATCH  /api/v1/screenings/:id`
- [x] `DELETE /api/v1/screenings/:id`
- [x] `GET /api/v1/movies/:movieId/theatres` — theatres showing this movie
- [x] `GET /api/v1/movies/:movieId/theatres/:theatreId/screenings` — timeslots for movie at theatre

### Bookings
- [x] `POST   /api/v1/bookings` — create hold _(JWT required)_
- [ ] `PATCH  /api/v1/bookings/:id/confirm` _(JWT required)_
- [ ] `DELETE /api/v1/bookings/:id` — cancel _(JWT required)_

---

## Design Rules

**Controller** — thin. Route binding, guard/decorator application, calling one service method, returning the result. No logic.

**DTO** — required for every request body and query params that need validation. Use `class-validator`. No DTO for path params (validate inline or via a pipe).

**Service** — business logic only. One method per use case. If a method grows beyond ~30 lines of meaningful logic, extract a private helper inside the same service. Cross-cutting helpers (shared across services) go in a `common/` util; don't create them preemptively.

**Pagination** — list endpoints (movies, theatres, screenings) take `?page=1&limit=10` (limit max 100) via `PaginationQueryDto` (`common/pagination`); extend it for extra filters (see `ListScreeningsQueryDto`). Services use `pageArgs(query)` + `paginated(items, total, query)` with a stable `orderBy` (add `id` as tiebreaker) and return `{ items, total, page, limit, totalPages }`. Bounded sub-resource lists (auditoriums of a theatre, seats, discovery routes) stay unpaginated. Query params always go through a DTO — never parse them by hand.

**Screening rules** — create/update reject past `startsAt`, unknown movie/auditorium (404), overlapping slots in the same auditorium (409), and moving a screening with bookings to another auditorium (409).

**Response envelope** — controllers return raw data; `ResponseInterceptor` (`common/interceptors`) wraps it as `{ success: true, statusCode, data, timestamp }`. Never build the envelope by hand. Swagger mirrors it automatically (`common/swagger/response-envelope.ts`): `@ApiResponse` only states status + description; 4xx/5xx point to the shared `ErrorResponse` schema and routes with a body get a 422 added.

**Error handling** — services and guards throw only the types in `common/exceptions` (never Nest built-ins):
- `ResourceNotFoundException('Movie', id)` → 404
- `ValidationException(msg)` → 400 (business-rule failures; DTO failures are 422 from `AppValidationPipe`)
- `AuthException()` → 401, `AuthException('Forbidden', HttpStatus.FORBIDDEN)` → 403
- `AppException(msg, HttpStatus.CONFLICT)` → 409 and any other status

Global filters (`common/filters`) shape every error into `{ success: false, statusCode, error, message, errors?, timestamp, path }`: `HttpExceptionFilter` (all `HttpException`), `PrismaExceptionFilter` (P2001/P2002/P2003/P2025 → 404/409/400/404), `AllExceptionsFilter` (anything else → logged, generic 500, nothing leaked). Do not catch Prisma errors in services; let the filter map them. Add a new status only via the existing types.

**Prisma** — use generated types everywhere; no `as any` or manual casting. Raw SQL (`$queryRaw`) only for locking or queries Prisma can't express.

**Auth** — no global guard; routes are public by default. Apply `@UseGuards(JwtGuard)` per-route for JWT-protected endpoints, `@UseGuards(AdminGuard)` for admin-only write endpoints. `AdminGuard` is a combined JWT + role check (no need to stack both guards). See `@.claude/rules/domain.md` for the full auth matrix.

---

## Todos
- DTO response mappers / serialization (exclude internal fields consistently)
- Controller-level response entities / `ClassSerializerInterceptor`
