# Testing Strategy

## Stack

Jest (`jest.config.ts`). E2E config: `test/jest-e2e.json`.

## Unit Tests (`src/**/*.spec.ts`)

- Use `Testing.Module`; mock all deps with `jest.fn()`; reset in `beforeEach`.
- Assert both the return value and the exact Prisma/service calls (args included).
- No DB, no HTTP.

## E2E Tests (`test/**/*.e2e-spec.ts`)

- Boot the full app with `createNestApplication`; mirror `main.ts` exactly (global prefix `api/v1`, `ValidationPipe` with `whitelist: true, transform: true`).
- Use a dedicated test-only user/data; delete it in `afterAll` via `prisma.deleteMany`.
- For protected routes: obtain a real JWT via login in `beforeAll`; attach as `Authorization: Bearer <token>`.
- Assert sensitive fields (e.g. `password`) are absent from every response body.

## Concurrency Tests (e2e layer only)

Use `Promise.all` for simultaneous requests; assert exactly one success and the rest conflicts:

```ts
const results = await Promise.all(
  Array.from({ length: 5 }, () =>
    request(app).post('/api/v1/bookings').send(payload),
  ),
);
expect(results.filter((r) => r.status === 201)).toHaveLength(1);
expect(results.filter((r) => r.status === 409)).toHaveLength(4);
```
