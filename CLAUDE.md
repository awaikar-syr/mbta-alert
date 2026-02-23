# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MBTA Red Line Timer - A real-time train prediction dashboard that tells you when to leave based on your walking time to the station. Fetches live predictions from MBTA's public API and calculates "depart by" times accounting for user's walk time.

## Development Setup

### Prerequisites
- Node.js 22.19.0+ (required by Vite 7.3.0)
- PostgreSQL 16
- Environment variables in `.env`:
  - `DATABASE_URL=postgresql://user@localhost:5432/mbta_alert`
  - `PORT=5001` (5000 conflicts with macOS Control Center)

### Essential Commands

```bash
# Development (runs server with Vite middleware for HMR)
npm run dev

# Database operations
npm run db:push           # Apply schema changes to database
drizzle-kit generate      # Generate migration files (if needed)

# Production build
npm run build             # Builds client to dist/public, server to dist/index.cjs
npm start                 # Run production build

# Type checking
npm run check             # TypeScript compilation check
```

### First-Time Setup
1. Install dependencies: `npm install`
2. Create database: `createdb mbta_alert`
3. Apply schema: `npm run db:push`
4. Start dev server: `npm run dev`

## Architecture

### Monorepo Structure
```
├── client/          # React frontend (Vite + React Query)
├── server/          # Express backend
├── shared/          # Shared types and API contract
└── script/          # Build scripts
```

### Type-Safe API Contract (shared/)

The `shared/` directory defines a type-safe API contract used by both client and server:

**shared/schema.ts**: Drizzle ORM schema + Zod validation
- Database table definitions (e.g., `settings` table)
- Type inference for `Settings`, `InsertSettings`
- Zod schemas for request validation

**shared/routes.ts**: API endpoint definitions
- Each endpoint specifies: `method`, `path`, `input` schema, `responses` schemas
- Example: `api.settings.update` defines PATCH /api/settings with partial settings input
- Client uses these for type-safe fetching, server uses for validation

This shared contract ensures client and server stay in sync. When adding endpoints:
1. Define in `shared/routes.ts` with Zod schemas
2. Implement in `server/routes.ts`
3. Use in client with React Query hooks

### Server Architecture (server/)

**Single HTTP server pattern**: One Express server handles both API routes and Vite dev middleware.

**server/index.ts**: Main entry point
- Creates HTTP server
- Registers API routes via `registerRoutes()`
- In dev: Attaches Vite middleware for HMR
- In prod: Serves static files from `dist/public`

**server/routes.ts**: API endpoints
- All routes prefixed with `/api`
- Uses `storage` abstraction for database operations
- MBTA predictions endpoint fetches from `https://api-v3.mbta.com/predictions`
- Calculates "depart by" time: `departBy = trainTime - walkTimeMinutes`

**server/storage.ts**: Database abstraction
- `IStorage` interface for testability
- `DatabaseStorage` implements with Drizzle ORM
- Auto-creates default settings on first access (JFK/UMass, Red Line, 6min walk)

**server/vite.ts**: Development middleware
- Runs Vite in middleware mode (not standalone server)
- Handles HMR via `/vite-hmr` endpoint
- Transforms and serves `client/index.html`
- Injects cache-busting query param on main.tsx

**server/db.ts**: Database connection
- PostgreSQL pool via `pg` package
- Drizzle ORM instance with schema

### Client Architecture (client/)

**React + Vite + shadcn/ui stack**

**client/src/App.tsx**: Router setup using Wouter
- Single route: `/` → Dashboard
- Wraps app in QueryClientProvider for React Query

**client/src/pages/Dashboard.tsx**: Main UI
- Displays next train predictions with countdown
- Shows "depart by" times accounting for walk time
- Settings dialog for configuring station, route, direction, walk time

**client/src/hooks/use-mbta.ts**: Data fetching
- React Query hook that polls `/api/mbta/predictions` every 30 seconds
- Auto-refetches when settings change (via query invalidation)
- Zod validation ensures type safety of API response

**client/src/hooks/use-settings.ts**: Settings management
- Fetches and updates user settings
- Mutations invalidate predictions query to trigger recalculation

### MBTA Integration

**API Usage**: Public MBTA v3 API (no auth required)
- Endpoint: `https://api-v3.mbta.com/predictions`
- Filters: `stop`, `route`, `direction_id`
- Returns predictions with `arrival_time`, `departure_time`, `status`

**Prediction Processing** (server/routes.ts):
1. Fetch predictions for configured station/route/direction
2. For each prediction: calculate `departBy = trainTime - walkTimeMinutes`
3. Calculate `minutesUntilDeparture` from current time to departBy
4. Filter out trains already missed (< -1 minute)
5. Sort by departure time, return next 5 trains

**Client Display**:
- Shows countdown to "depart by" time
- Updates every 30 seconds via polling
- Highlights next train user should catch

## Key Patterns

### Path Aliases (tsconfig.json)
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Database Migrations
- Schema defined in `shared/schema.ts`
- Use `npm run db:push` for schema sync in development
- For production migrations, use `drizzle-kit generate` + manual SQL

### Settings Persistence
- Single-row `settings` table (id, walkTimeMinutes, stationId, routeId, directionId)
- Auto-created with defaults if missing
- Updates are partial (PATCH semantics)

### Error Handling
- Zod validation errors return 400 with first error message
- API errors return 500 with generic message
- Client displays errors via toast notifications (shadcn/ui)

## Development Notes

### macOS Compatibility
- Port 5000 conflicts with Control Center, use 5001 instead
- `reusePort: true` not supported on macOS, removed from server config

### Node Version
- Vite 7.3.0 requires Node ^20.19.0 || >=22.12.0
- Install via Homebrew: `brew install node@22`
- Add to PATH: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`

### Environment Variable Loading
- `.env` file not auto-loaded by tsx
- Explicitly export vars before running: `export DATABASE_URL=... && npm run dev`
- Or use a tool like `dotenv-cli`

### Hot Module Replacement
- Vite HMR works in dev mode via WebSocket connection
- Server must be started before client can connect
- Changes to server code require manual restart

### MBTA API Rate Limits
- Public API has no documented rate limits
- App polls every 30 seconds per client
- Consider caching predictions server-side if scaling
