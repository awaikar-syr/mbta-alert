# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MBTA Red Line Timer - A lightweight real-time train prediction dashboard that tells you when to leave based on your walking time to the station. Fetches live predictions from MBTA's public API and calculates "depart by" times accounting for user's walk time.

**Settings are stored in browser localStorage** - no database required!

## Development Setup

### Prerequisites
- Node.js 22.19.0+ (required by Vite 7.3.0)
- Environment variables in `.env`:
  - `PORT=5001` (5000 conflicts with macOS Control Center)

### Essential Commands

```bash
# Development (runs server with Vite middleware for HMR)
npm run dev

# Production build
npm run build             # Builds client to dist/public, server to dist/index.cjs
npm start                 # Run production build

# Type checking
npm run check             # TypeScript compilation check
```

### First-Time Setup
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open http://localhost:5001

That's it! No database setup needed.

## Architecture

### Monorepo Structure
```
├── client/          # React frontend (Vite + React Query)
│   └── src/
│       ├── hooks/           # React Query hooks for data fetching
│       ├── lib/             # Utilities (localStorage management)
│       └── components/      # React components
├── server/          # Express backend (MBTA API proxy)
├── shared/          # Shared types and API contract
└── script/          # Build scripts
```

### Settings Persistence (localStorage)

**User settings are stored in browser localStorage**, not a database:

**client/src/lib/settings-storage.ts**: localStorage abstraction
- `getSettings()` - Reads from localStorage with fallback to defaults
- `updateSettings(partial)` - Merges and saves to localStorage
- `resetSettings()` - Resets to defaults
- Validates with Zod schema for type safety
- Uses key: `mbta-settings`

**Default settings:**
- Station: JFK/UMass (`place-jfk`)
- Route: Red Line
- Direction: Southbound (0)
- Walk time: 6 minutes

**Benefits of localStorage approach:**
- No database setup required
- Instant reads (no HTTP round-trip)
- Settings persist across browser sessions
- Perfect for single-user apps
- Zero infrastructure overhead

### Type-Safe API Contract (shared/)

The `shared/` directory defines a type-safe API contract used by both client and server:

**shared/schema.ts**: TypeScript interfaces + Zod validation
- Plain TypeScript interfaces (no ORM)
- `Settings` interface with default values
- Zod schemas for runtime validation
- `Prediction` and `PredictionsResponse` types

**shared/routes.ts**: API endpoint definitions
- Each endpoint specifies: `method`, `path`, `responses` schemas
- Example: `api.mbta.predictions` defines GET /api/mbta/predictions
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
- **MBTA predictions endpoint** (`GET /api/mbta/predictions`)
  - Accepts query params: `stationId`, `routeId`, `directionId`, `walkTime`
  - Fetches from `https://api-v3.mbta.com/predictions`
  - Calculates "depart by" time: `departBy = trainTime - walkTimeMinutes`
  - Returns next 5 trains sorted by departure time

**server/vite.ts**: Development middleware
- Runs Vite in middleware mode (not standalone server)
- Handles HMR via `/vite-hmr` endpoint
- Transforms and serves `client/index.html`
- Injects cache-busting query param on main.tsx

### Client Architecture (client/)

**React + Vite + shadcn/ui stack**

**client/src/App.tsx**: Router setup using Wouter
- Single route: `/` → Dashboard
- Wraps app in QueryClientProvider for React Query

**client/src/pages/Dashboard.tsx**: Main UI
- Displays next train predictions with countdown
- Shows "depart by" times accounting for walk time
- Settings dialog for configuring station, route, direction, walk time

**client/src/hooks/use-settings.ts**: Settings management (localStorage)
- `useSettings()` - Reads from localStorage via React Query
- `useUpdateSettings()` - Updates localStorage and invalidates predictions
- No HTTP calls, instant synchronous reads

**client/src/hooks/use-mbta.ts**: Data fetching
- React Query hook that polls `/api/mbta/predictions` every 30 seconds
- Passes settings as query params to API
- Auto-refetches when settings change (via query invalidation)
- Zod validation ensures type safety of API response

**client/src/lib/settings-storage.ts**: localStorage utilities
- Encapsulates all localStorage logic
- Type-safe with Zod validation
- Handles errors gracefully (fallback to defaults)

### MBTA Integration

**API Usage**: Public MBTA v3 API (no auth required)
- Endpoint: `https://api-v3.mbta.com/predictions`
- Filters: `stop`, `route`, `direction_id`
- Returns predictions with `arrival_time`, `departure_time`, `status`

**Prediction Processing** (server/routes.ts):
1. Read settings from query params (stationId, routeId, directionId, walkTime)
2. Fetch predictions from MBTA API for configured station/route/direction
3. For each prediction: calculate `departBy = trainTime - walkTimeMinutes`
4. Calculate `minutesUntilDeparture` from current time to departBy
5. Filter out trains already missed (< -1 minute)
6. Sort by departure time, return next 5 trains

**Client Display**:
- Shows countdown to "depart by" time
- Updates every 30 seconds via polling
- Highlights next train user should catch

## Key Patterns

### Path Aliases (tsconfig.json)
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Settings Persistence
- Stored in browser localStorage (key: `mbta-settings`)
- Default settings: JFK/UMass, Red Line, Southbound, 6min walk
- Updates are partial (merge semantics)
- No database required!

### Error Handling
- Zod validation errors return 400 with first error message
- API errors return 500 with generic message
- Client displays errors via toast notifications (shadcn/ui)
- localStorage errors fall back to default settings

## Development Notes

### macOS Compatibility
- Port 5000 conflicts with Control Center, use 5001 instead

### Node Version
- Vite 7.3.0 requires Node ^20.19.0 || >=22.12.0
- Install via Homebrew: `brew install node@22`
- Add to PATH: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`

### Environment Variable Loading
- `.env` file loaded automatically via `dotenv-cli`
- No manual exports needed: just run `npm run dev`

### Hot Module Replacement
- Vite HMR works in dev mode via WebSocket connection
- Server must be started before client can connect
- Changes to client code hot-reload automatically
- Changes to server code require manual restart

### MBTA API Rate Limits
- Public API has no documented rate limits
- App polls every 30 seconds per client
- No server-side caching needed for single-user app

### localStorage Considerations
- Settings are browser-specific (not synced across devices)
- Private browsing mode may clear settings on close
- 5-10MB storage limit (settings use <1KB)
- Cleared if user clears browser data

# currentDate
Today's date is 2026-02-23.
