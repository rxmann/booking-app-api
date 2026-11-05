# API Guidelines & Status

## Endpoint Status

### Auth
- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `GET  /api/v1/auth/profile` _(JWT required)_

### Movies
- [x] `GET /api/v1/movies`
- [x] `GET /api/v1/movies/:id`

### Screenings
- [x] `GET /api/v1/movies/:movieId/theatres` — theatres showing this movie
- [x] `GET /api/v1/movies/:movieId/theatres/:theatreId/screenings` — timeslots for movie at theatre
- [x] `GET /api/v1/screenings/:id/seats`

### Bookings
- [x] `POST   /api/v1/bookings` — create hold
- [ ] `PATCH  /api/v1/bookings/:id/confirm`
- [ ] `DELETE /api/v1/bookings/:id` — cancel

---

## Design Rules

**Controller** — thin. Route binding, guard/decorator application, calling one service method, returning the result. No logic.

**DTO** — required for every request body and query params that need validation. Use `class-validator`. No DTO for path params (validate inline or via a pipe).

**Service** — business logic only. One method per use case. If a method grows beyond ~30 lines of meaningful logic, extract a private helper inside the same service. Cross-cutting helpers (shared across services) go in a `common/` util; don't create them preemptively.

**Error handling** — throw NestJS built-in exceptions (`NotFoundException`, `ConflictException`, etc.) from the service. No custom exception filters unless there's a clear repeated pattern.

**Prisma** — use generated types everywhere; no `as any` or manual casting. Raw SQL (`$queryRaw`) only for locking or queries Prisma can't express.

**Auth** — no global guard; routes are public by default. Apply `@UseGuards(JwtGuard)` per-route for protected endpoints. See `@.claude/rules/domain.md` for which endpoints require auth.

---

## Todos
- DTO response mappers / serialization (exclude internal fields consistently)
- Controller-level response entities / `ClassSerializerInterceptor`
- Centralised exception / error handling strategy
