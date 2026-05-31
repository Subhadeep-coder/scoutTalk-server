# ScoutTalk Backend

NestJS + TypeORM + PostgreSQL. Google OAuth + JWT auth. Swagger at `/api/docs`.

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # nest build (output: dist/)
pnpm start:dev        # nest start --watch (hot reload)
pnpm start:prod       # node dist/main
pnpm lint             # ESLint (with --fix)
pnpm format           # Prettier src/ test/
pnpm test             # Jest (rootDir: test/)
pnpm test:e2e         # jest --config test/jest-e2e.json
pnpm test:cov         # Jest with coverage
pnpm test:watch       # Jest --watch
```

Unit tests are in `test/` (not `src/`). All `*.spec.ts` under `test/` are run by `pnpm test`.

**Single test file:** `pnpm test -- test/users/users.service.spec.ts`

## Architecture

| Area | Path | Notes |
|------|------|-------|
| Entrypoint | `src/main.ts` | Creates NestJS app, sets up Swagger, CORS, ValidationPipe |
| App module | `src/app.module.ts` | Registers all modules, global guards |
| Auth | `src/auth/` | Google OAuth + JWT via PassportJS |
| Users | `src/users/` | CRUD, onboarding flow |
| Database | `src/database/` | TypeORM postgres, entities: User, RefreshToken |
| Config | `src/config/` | `@nestjs/config`, loaded from `.env` |
| Docs/Swagger | `docs/` | Swagger config + shared DTOs |

**Two global guards** applied in `app.module.ts`:
- `JwtAuthGuard` — requires JWT on every route by default
- `OnboardingGuard` — blocks un-onboarded users except `/auth/*` and routes with `@SkipOnboarding()`

**Public routes:** use `@Public()` decorator to skip `JwtAuthGuard`.

**Path alias** `@/` maps to `src/` in Jest config only (no tsconfig path alias for `@/`).

## Env

Copy `.env.example` to `.env`. The app reads these vars (database.module.ts is source of truth):

`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_SYNCHRONIZE`, `DATABASE_LOGGING`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLIENT_ID_ANDROID`, `JWT_SECRET`

## Testing quirks

- Tests live under `test/`, not `src/`. Specs import source via relative paths (e.g. `../../src/users/users.service`).
- E2E tests use `test/jest-e2e.json` config (`*.e2e-spec.ts`).
- Tests are fully mocked — no database required.
