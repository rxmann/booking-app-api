# Testing Strategy

## Stack
Jest (configured in `jest.config.ts`). E2E config in `test/jest-e2e.json`.

## Layers

### Unit Tests (`src/**/*.spec.ts`)
- Test service methods in isolation.
- Mock Prisma client with `jest.fn()` or a manual mock.
- Cover: status transition logic, expiry checks, seat validation, ownership checks.
- No DB, no HTTP.

### Integration Tests (`test/**/*.integration.spec.ts`)
- Hit a real test database (separate DB or same with transaction rollback per test).
- Wrap each test in a transaction, roll back after — keeps tests isolated and fast.
- Cover: Prisma queries, migration correctness, unique constraint enforcement.

### E2E Tests (`test/**/*.e2e-spec.ts`)
- Spin up the full NestJS app with `supertest`.
- Cover the golden path for each endpoint.
- Auth: generate a real JWT or use a test helper.

## Critical Scenarios to Cover
1. **Concurrent hold attempts** — two requests try to book the same seat simultaneously; only one succeeds, the other gets a 409.
2. **Hold expiry + confirm** — expired booking returns 422/409 on confirm attempt.
3. **Hold expiry + new booking** — expired seat becomes available again.
4. **Seat ownership** — confirm/cancel by a different user returns 403.
5. **Past screening** — booking a past screening returns 400.
6. **Seat not in auditorium** — booking a seat from the wrong auditorium returns 400.

## Concurrency Test Pattern
Use `Promise.all` with multiple simultaneous requests for the same seat:
```ts
const results = await Promise.all(
  Array.from({ length: 5 }, () => request(app).post('/api/v1/bookings').send(payload))
);
const successes = results.filter(r => r.status === 201);
const conflicts = results.filter(r => r.status === 409);
expect(successes).toHaveLength(1);
expect(conflicts).toHaveLength(4);
```
