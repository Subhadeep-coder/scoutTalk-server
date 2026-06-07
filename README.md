# ScoutTalk Backend

A NestJS backend application for ScoutTalk — a Discord clone with policy-based access control.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Database**: PostgreSQL + TypeORM
- **Authentication**: Email/password (argon2) + Google OAuth 2.0 + JWT (access + refresh tokens)
- **Email**: Nodemailer with EJS templates
- **Real-time (planned)**: LiveKit for voice/video, Socket.IO for messaging
- **Docs**: Swagger at `/api/docs`

## Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── decorators/         # @Public, @SkipOnboardingCheck
│   ├── guards/             # JwtAuthGuard, OnboardingGuard, GoogleAuthGuard
│   ├── strategies/         # Passport strategies (JWT, Local, Google)
│   ├── dto/                # SignupDto, LoginDto
│   ├── auth.controller.ts  # 14 auth endpoints
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/                  # User profile & onboarding
│   ├── dto/                # UpdateUsernameDto, UpdateProfileDto
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── mail/                   # Email sending
│   ├── templates/          # email-verification.ejs, password-reset.ejs
│   ├── mail.module.ts
│   └── mail.service.ts
├── database/               # TypeORM setup
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── refresh-token.entity.ts
│   │   ├── email-verification-token.entity.ts
│   │   └── password-reset-token.entity.ts
│   ├── database.module.ts
│   └── index.ts
├── config/                 # @nestjs/config namespaces
│   ├── interfaces/
│   ├── app.config.ts
│   ├── google.config.ts
│   └── jwt.config.ts
├── app.controller.ts
├── app.module.ts
└── main.ts
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

### Installation

```bash
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Application
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=scoutTalk
DATABASE_SYNCHRONIZE=false
DATABASE_LOGGING=false

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CLIENT_ID_ANDROID=your_google_client_id_android

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Mail (SMTP)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your@email.com
MAIL_PASS=your-password
MAIL_FROM=noreply@scouttalk.com
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **Credentials** > **OAuth Client ID**
4. Set Application type to **Web application**
5. Add authorized redirect URI: `http://localhost:PORT/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### Running the Application

```bash
pnpm start:dev     # Hot reload
pnpm start:prod    # Production
pnpm build         # Build to dist/
```

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | Public | Register with email & password (sends verification email) |
| POST | `/auth/login` | Public | Login with email & password (returns JWT tokens) |
| POST | `/auth/verify-email` | Public | Verify email with token (returns JWT tokens) |
| POST | `/auth/resend-verification` | Public | Resend verification email |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/refresh` | Public | Exchange refresh token for new token pair |
| POST | `/auth/logout` | Public | Revoke refresh token |
| GET | `/auth/google` | Public | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | Public | Google OAuth callback (redirect) |
| POST | `/auth/google/mobile` | Public | Google ID token validation (Android/iOS) |
| GET | `/auth/status` | Public | Check auth configuration status |

### Users (`/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | JWT | Get current user profile |
| GET | `/users/me/onboarding-status` | JWT | Check onboarding status |
| POST | `/users/me/username` | JWT | Set username (completes onboarding) |
| PUT | `/users/me` | JWT | Update profile (display name, avatar) |
| GET | `/users/username/:username` | Public | Check username availability |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | Health check |
| GET | `/api/docs` | Public | Swagger documentation |

## Authentication Flow

### Email / Password
1. `POST /auth/signup` — creates unverified account, sends verification email
2. User clicks link → `POST /auth/verify-email` — marks email verified, returns JWT tokens
3. `POST /auth/login` — returns `{ access_token, refresh_token, user }`
4. Use `Authorization: Bearer <access_token>` for authenticated requests
5. When access token expires, use `POST /auth/refresh` with `{ refresh_token }` to get a new pair

### Google OAuth
1. Web: `GET /auth/google` → redirects to Google → callback at `/auth/google/callback`
2. Mobile: `POST /auth/google/mobile` with `{ idToken }` → validates with Google

## Global Guards

All routes require JWT by default. Use `@Public()` to opt out:

```typescript
@Get('public-endpoint')
@Public()
async publicRoute() {
  return { message: 'Public' };
}
```

Un-onboarded users (no username) are blocked except on `/auth/*` and routes with `@SkipOnboardingCheck()`.

## Swagger Docs

Interactive API documentation at `/api/docs` when the server is running.

## Scripts

```bash
pnpm build         # Build for production
pnpm start:dev     # Development with hot reload
pnpm start:prod    # Production
pnpm lint          # ESLint (with --fix)
pnpm format        # Prettier
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm test:cov      # Coverage
```

## TODO — Project Roadmap

### Phase 1: Core Infrastructure

- [x] Setup database (PostgreSQL with TypeORM)
- [ ] Setup database migrations (currently using `synchronize`)
- [ ] Create base entities (User done; Server, Channel, Role, Message upcoming)
- [ ] Implement database seeders for development

### Phase 2: User Management

- [x] Email/password registration with email verification
- [x] Google OAuth login (web + mobile)
- [x] JWT access + refresh token flow
- [x] User profile management (name, avatar, display name)
- [x] Forgot / reset password
- [x] Username setup & onboarding flow
- [ ] User preferences settings
- [ ] User relationship system (friends/block)

### Phase 3–10

⬜ **Not started** — Servers, channels, messaging, roles, LiveKit voice, WebSocket gateway, and additional features.

## License

MIT
