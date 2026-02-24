# 🚇 MBTA Red Line Timer

A beautiful, lightweight real-time web dashboard that tells you exactly when to leave your house to catch the next Red Line train. Never miss your train or wait on the platform again!

**No database required** - settings stored in your browser!

## ✨ Features

- **🎯 Smart Departure Alerts**: Calculates your exact "leave by" time based on your walking distance
- **⚡ Real-Time Predictions**: Live train data from MBTA's official API, updated every 30 seconds
- **🎨 Beautiful UI**: Modern glass-morphism design with smooth animations (Framer Motion)
- **🔔 Urgency Indicators**: Visual cues when you need to leave immediately
- **⚙️ Customizable Settings**:
  - Configure your walk time to the station
  - Choose your travel direction (Northbound/Southbound)
  - Personalized for JFK/UMass station
  - **Settings persist in browser localStorage** (no database needed!)
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🌙 Modern Design System**: Built with shadcn/ui components and Tailwind CSS

## 🎥 What It Looks Like

The dashboard displays:
- **Hero Card**: Large, prominent display of when you need to leave (in giant numbers!)
- **Countdown Timer**: Minutes until departure in real-time
- **Upcoming Trains**: Up to 4 additional upcoming departures
- **Live Status**: Shows train status ("Stopped 2 stops away", etc.)
- **Visual Urgency**: Color-coded alerts (calm blue → urgent red)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Build tool and dev server
- **TanStack Query (React Query)** - Data fetching and caching
- **Wouter** - Lightweight routing
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Modern UI components
- **Tailwind CSS** - Utility-first styling
- **date-fns** - Date/time formatting
- **Lucide React** - Icons
- **localStorage** - Settings persistence

### Backend
- **Node.js 22+** - Runtime
- **Express 5** - Web server
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **tsx** - TypeScript execution

### Architecture
- **Type-Safe API Contract**: Shared types between client/server via `shared/` directory
- **Vite Middleware Mode**: Single server for both API and HMR in development
- **Real-Time Polling**: Auto-refresh predictions every 30 seconds
- **localStorage Persistence**: No database needed, settings stored in browser

## 📋 Prerequisites

- **Node.js**: v22.19.0 or higher (required by Vite 7)
- **npm**: v10 or higher

That's it! No database installation required.

### macOS Installation

```bash
# Install Node.js 22
brew install node@22
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/awaikar-syr/mbta-alert.git
cd mbta-alert
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment (Optional)

Create a `.env` file in the root directory:

```env
PORT=5001
```

> **Note**: Port 5000 conflicts with macOS Control Center, so we use 5001 instead.

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5001**

That's it! No database setup needed. 🎉

## 📖 Usage

1. **First Visit**: The app opens with default settings (JFK/UMass station, 6-minute walk, Southbound)
2. **View Next Train**: The hero card shows your next train and when to leave
3. **Customize Settings**: Click the ⚙️ icon in the top-right to:
   - Adjust your walk time (1-60 minutes)
   - Select direction (Northbound to Alewife / Southbound to Ashmont/Braintree)
   - Settings automatically save to browser localStorage
4. **Monitor**: The app automatically refreshes predictions every 30 seconds
5. **Multiple Trains**: View up to 5 upcoming departures

### Understanding the Display

- **Leave by Time**: Large numbers showing when you should leave your house
- **Countdown**: "in X min" shows time until you need to leave
- **Train Arrival**: Shows when the train actually arrives at the station
- **Status Indicators**:
  - 🔵 **Blue** - You have plenty of time
  - 🔴 **Red** - Leave immediately! (2 minutes or less)
  - ⚫ **Gray** - Train already departed

## 🏗️ Project Structure

```
mbta-alert/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # UI components (Hero, Cards, Settings)
│   │   ├── hooks/       # React Query hooks (useMBTA, useSettings)
│   │   ├── pages/       # Dashboard page
│   │   └── lib/         # Utilities (settings-storage, queryClient)
│   └── index.html       # Entry HTML
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API endpoints
│   ├── vite.ts          # Vite middleware (dev mode)
│   └── static.ts        # Static file serving (prod)
├── shared/              # Shared types/contracts
│   ├── schema.ts        # TypeScript interfaces + Zod types
│   └── routes.ts        # API contract definitions
└── script/              # Build scripts
```

## 🔧 Development

### Available Commands

```bash
npm run dev          # Start development server (port 5001)
npm run build        # Build for production
npm start            # Run production build
npm run check        # TypeScript type checking
```

### Settings Persistence

User settings are stored in **browser localStorage** under the key `mbta-settings`:

- **Default values**: JFK/UMass, Red Line, Southbound, 6-minute walk
- **Validation**: Settings are validated with Zod schemas for type safety
- **Fallback**: Invalid data falls back to defaults automatically
- **Privacy**: Settings are browser-specific (not synced across devices)

To reset settings, clear browser localStorage or delete the `mbta-settings` key.

### API Endpoints

- `GET /api/mbta/predictions?stationId=X&routeId=Y&directionId=Z&walkTime=N` - Get train predictions with settings as query params

## 🌐 MBTA API Integration

This app uses the **MBTA V3 API** (public, no API key required):

- **Endpoint**: `https://api-v3.mbta.com/predictions`
- **Filters**:
  - `stop`: Station ID (default: `place-jfk`)
  - `route`: Route ID (default: `Red`)
  - `direction_id`: 0 (South) or 1 (North)
- **Update Frequency**: Predictions are fetched every 30 seconds
- **Rate Limits**: No documented limits for public API

### How It Works

1. Client reads settings from localStorage
2. App fetches predictions from backend with settings as query params
3. Backend queries MBTA API with user's settings
4. For each prediction, calculates: `departByTime = trainArrival - walkTimeMinutes`
5. Calculates: `minutesUntilDeparture = departByTime - currentTime`
6. Filters out already-departed trains (< -1 minute)
7. Sorts by departure time and shows next 5 trains
8. Client displays results with real-time countdown

## 🚀 Production Build

```bash
# Build client and server
npm run build

# Output:
# - dist/public/   (static client files)
# - dist/index.cjs (bundled server)

# Run production server
npm start
```

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Maintain type safety (use TypeScript strictly)
- Follow the shared API contract pattern
- Add Zod schemas for new endpoints/types
- Keep components focused and reusable
- Test on both desktop and mobile viewports
- Settings should use localStorage, not backend storage

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- **MBTA** for providing free, public real-time transit data
- **shadcn/ui** for beautiful, accessible components
- Built with ❤️ for daily commuters on the Red Line

## 📞 Support

For bugs or feature requests, please [open an issue](https://github.com/awaikar-syr/mbta-alert/issues).

---

**Made for commuters, by commuters.** 🚇

_Lightweight, fast, and database-free!_ ✨
