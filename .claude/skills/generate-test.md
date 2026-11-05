# /generate-test

Generate test files for a NestJS service following the project's testing contract.

## Usage
```
/generate-test <service-name> [prompt]
```

- `<service-name>` — the module folder name (e.g. `auth`, `bookings`)
- `[prompt]` — optional: specific scenarios to focus on; default is full coverage

## Steps

1. Load `@.claude/rules/testing.md` and `@.claude/rules/domain.md`.
2. Read `src/modules/$ARGUMENTS[0]/$ARGUMENTS[0].service.ts` (and the controller if relevant).
3. From the prompt (if given) infer whether to generate a unit spec, e2e spec, or both. Default to both when ambiguous.
4. Generate the file(s) strictly following the patterns in `testing.md` — no deviations in structure.
5. Write directly to disk:
   - Unit: `src/modules/$ARGUMENTS[0]/$ARGUMENTS[0].service.spec.ts`
   - E2E: `test/$ARGUMENTS[0].e2e-spec.ts`
6. Report which files were written and suggest `pnpm test` / `pnpm test:e2e` to verify.
