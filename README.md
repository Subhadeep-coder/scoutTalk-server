# ScoutTalk Backend

A NestJS backend application for ScoutTalk - a Discord clone with policy-based access control.

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Authentication**: PassportJS with Google OAuth 2.0 & JWT
- **Real-time**: Livekit for voice channels
- **Database**: (To be decided - PostgreSQL/MySQL recommended)

## Project Structure

```
backend/
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── decorators/       # Custom decorators (e.g., @Public)
│   │   ├── guards/           # Auth guards (e.g., JwtAuthGuard)
│   │   ├── strategies/       # Passport strategies (Google, JWT)
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── config/              # Configuration module
│   │   ├── interfaces/       # TypeScript interfaces
│   │   ├── app.config.ts
│   │   ├── google.config.ts
│   │   └── jwt.config.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example             # Environment variables template
└── package.json
```

---

## TODO - Project Roadmap

### Phase 1: Core Infrastructure

- [ ] Setup database (PostgreSQL with TypeORM or Prisma)
- [ ] Setup database migrations
- [ ] Create base entities (User, Server, Channel, Role, Message)
- [ ] Implement database seeders for development

### Phase 2: User Management

- [ ] User profile management (update name, avatar)
- [ ] User preferences settings
- [ ] User search functionality
- [ ] User relationship system (friends/block)

### Phase 3: Server (Guild) Management

- [ ] Create server
- [ ] Edit server details (name, icon)
- [ ] Delete server
- [ ] Server discovery/public servers
- [ ] Server invite system with unique invite codes
- [ ] Server member management

### Phase 4: Channel Management

- [ ] Text channel CRUD
- [ ] Voice channel CRUD
- [ ] Category management (organize channels)
- [ ] Channel permissions per-channel
- [ ] Channel pins/bookmarks

### Phase 5: Role & Permission System (RBAC)

#### Permission Types

- [ ] View Channel
- [ ] Manage Channel
- [ ] Send Messages
- [ ] Manage Messages
- [ ] Embed Links
- [ ] Attach Files
- [ ] Read Message History
- [ ] Send TTS Messages
- [ ] Use Emojis
- [ ] Add Reactions
- [ ] Use Slash Commands
- [ ] Manage Roles
- [ ] Manage Members
- [ ] Kick Members
- [ ] Ban Members
- [ ] Mute Members
- [ ] Deafen Members
- [ ] Move Members
- [ ] Voice Connect
- [ ] Voice Speak
- [ ] Voice Video
- [ ] Administrator (all permissions)
- [ ] Owner (irreversible actions)

#### Role System

- [ ] Create custom roles with color
- [ ] Role hierarchy (higher roles override lower)
- [ ] Assign roles to members
- [ ] Role permissions management

#### Permission Override System

- [ ] Server-level default permissions
- [ ] Channel-level permission overrides
- [ ] Role-based permission inheritance
- [ ] User-specific permission overrides
- [ ] Permission priority: User > Channel Role > Server Role
- [ ] @everyone role with base permissions

### Phase 6: Message System

- [ ] Send text messages
- [ ] Edit messages
- [ ] Delete messages
- [ ] Message threading
- [ ] Message reactions
- [ ] Message embeds (rich formatting)
- [ ] Message search
- [ ] Message history pagination
- [ ] Pinned messages
- [ ] Message status (edited, deleted indicators)

### Phase 7: Real-time Communication (Livekit)

- [ ] Setup Livekit server integration
- [ ] Voice channel connection
- [ ] Voice channel disconnect
- [ ] Voice channel mute/unmute
- [ ] Voice channel deafen/undeafen
- [ ] Voice channel video on/off
- [ ] Screen sharing
- [ ] Voice activity detection
- [ ] Join/leave notifications
- [ ] Multiple voice channels support

### Phase 8: Real-time Events (WebSocket/Gateway)

- [ ] WebSocket gateway setup
- [ ] Connection authentication
- [ ] Real-time message updates
- [ ] Real-time channel updates
- [ ] Real-time user status (online/away/offline)
- [ ] Real-time typing indicators
- [ ] Real-time voice state updates
- [ ] Real-time presence updates

### Phase 9: Additional Features

- [ ] Direct messages (DM)
- [ ] Group direct messages
- [ ] Server emotes (custom emoji)
- [ ] Server stickers
- [ ] Audit log
- [ ] Server templates
- [ ] User activity status (game, custom status)
- [ ] Notification settings per-channel

### Phase 10: Security & Performance

- [ ] Rate limiting
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] WebSocket security
- [ ] Caching strategy (Redis)
- [ ] Database indexing optimization
- [ ] API pagination & filtering

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14 (for production)

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
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/scouttalk

# Livekit
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_URL=wss://your-livekit-server.com
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > OAuth Client ID
5. Set Application type to Web application
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### Running the Application

```bash
# Development
pnpm start:dev

# Production
pnpm start:prod

# Build
pnpm build
```

## API Endpoints

### Authentication

| Method | Endpoint                | Description                     | Auth Required |
| ------ | ----------------------- | ------------------------------- | ------------- |
| GET    | `/auth/google`          | Initiate Google OAuth flow      | No            |
| GET    | `/auth/google/callback` | Google OAuth callback           | No            |
| GET    | `/auth/status`          | Check auth configuration status | No            |
| GET    | `/auth/me`              | Get current user info           | Yes           |

### Health Check

| Method | Endpoint | Description              |
| ------ | -------- | ------------------------ |
| GET    | `/`      | Application health check |

## Authentication Flow

1. User navigates to `/auth/google`
2. Redirected to Google for authentication
3. After successful auth, callback receives user profile
4. JWT token generated and returned
5. Token used in `Authorization: Bearer <token>` header

## Protected Routes

By default, all routes require authentication. Use `@Public()` decorator to make routes public:

```typescript
@Get('public-endpoint')
@Public()
async publicRoute() {
  return { message: 'Public' };
}
```

## Scripts

```bash
pnpm build         # Build for production
pnpm start         # Start production server
pnpm start:dev     # Start in development mode with hot reload
pnpm lint          # Run ESLint
pnpm test          # Run unit tests
pnpm test:e2e      # Run end-to-end tests
pnpm test:cov      # Run tests with coverage
```

## License

MIT
