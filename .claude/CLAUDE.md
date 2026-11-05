# Booking App API

Movie ticket booking REST API. Learning project focused on concurrency patterns.

## Stack
- NestJS (TypeScript) · PostgreSQL · Prisma v7 · Jest
- Base path: `/api/v1`
- Prisma client generated to `src/generated/prisma`
- pnpm as package manager

## Key Commands
```bash
pnpm start:dev                          # dev server
pnpm build                              # compile
pnpm test                               # unit tests
npx prisma migrate dev --name <name>    # new migration
npx prisma generate                     # regenerate client
npx prisma db seed                      # wipes+seeds catalog (movies, theatres, screenings); upserts admin user
```

## Dev Guidelines
- Controllers thin — business logic in services.
- DTOs for all request validation (`class-validator`).
- Prisma client types everywhere; no raw type casting.
- Throw only `common/exceptions` types; return raw data from controllers (envelope/error shape are global). See `@.claude/rules/api-guidelines.md`.
- For raw SQL (locking): `prisma.$queryRaw` / `prisma.$executeRaw`.
- Migrations only via `prisma migrate dev`; never edit DB manually.
- No unnecessary abstractions. Follow existing patterns first.

## On-Demand Context
Load these with `@` when working on the relevant area:
- `@.claude/rules/domain.md` — models, relationships, auth rules
- `@.claude/rules/booking-rules.md` — reservation rules, concurrency & locking strategy
- `@.claude/rules/api-guidelines.md` — endpoint status (done/pending) and design contract
- `@.claude/rules/testing.md` — testing contract (unit + e2e patterns, concurrency)

## Skills
Procedures to follow when performing a specific task. Invoke with `/skill-name`:
- `generate-test` — `/generate-test <service> [prompt]` — generates spec files following the testing contract
