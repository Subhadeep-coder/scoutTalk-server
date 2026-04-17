# AGENTS.md - ScoutTalk Backend

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build for production
pnpm start:dev        # Start with hot reload
pnpm lint             # Run ESLint (fixes with --fix)
pnpm test             # Run Jest unit tests (rootDir: src)
pnpm test:e2e         # Run e2e tests (test/jest-e2e.json)
pnpm test:cov         # Coverage report
```

## Key Conventions

- **Package manager**: pnpm (not npm/yarn)
- **All routes require auth by default** - use `@Public()` decorator to make routes public
- **Jest unit tests**: Located in `src/**/*.spec.ts` (rootDir is `src`)
- **E2E tests**: Located in `test/` directory
- **Database**: Not yet implemented (see README.md roadmap)

## Architecture

- Entry point: `src/main.ts`
- App module: `src/app.module.ts`
- Auth module: `src/auth/` (Google OAuth + JWT via PassportJS)
- Config: `src/config/` (uses `@nestjs/config`)

## Testing

- Single test file: `pnpm test -- src/path/to/file.spec.ts`
- Single test: `pnpm test -- --testNamePattern="test name"`

## Env Setup

Copy `.env.example` to `.env` before running. Required vars:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `PORT`, `NODE_ENV`
