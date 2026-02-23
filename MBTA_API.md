# MBTA API Documentation & Integration Guide

This document details the MBTA V3 API integration, current usage, available features, and enhancement opportunities for the Red Line Timer app.

## 📚 Official Documentation

- **API Docs**: https://api-v3.mbta.com/docs/swagger/index.html
- **Swagger JSON**: https://api-v3.mbta.com/docs/swagger/swagger.json
- **Base URL**: `https://api-v3.mbta.com`

## 🔑 Authentication

The MBTA API supports both authenticated and unauthenticated requests:

### Unauthenticated (Current)
- **Rate Limit**: 20 requests per minute per IP
- No API key required
- Sufficient for single-user apps

### Authenticated (Optional)
- **Rate Limit**: 1000+ requests per minute
- Requires API key via:
  - Header: `x-api-key: YOUR_KEY`
  - Query param: `?api_key=YOUR_KEY`
- Get key at: https://api-v3.mbta.com/register

**Current Implementation**: Unauthenticated (adequate for our polling frequency of 30s)

## 📡 Current API Usage

### Predictions Endpoint

**Endpoint**: `GET /predictions`

**Current Implementation** (server/routes.ts:45-51):
```javascript
const mbtaUrl = `https://api-v3.mbta.com/predictions?filter[stop]=${stationId}&filter[route]=${routeId}&filter[direction_id]=${directionId}&sort=departure_time`;
```

**Query Parameters Used**:
- `filter[stop]=place-jfk` - JFK/UMass station
- `filter[route]=Red` - Red Line only
- `filter[direction_id]=0` or `1` - Southbound (0) or Northbound (1)
- `sort=departure_time` - Earliest trains first

**Attributes Used**:
- `arrival_time` - When train arrives at station
- `departure_time` - When train leaves station
- `direction_id` - Direction of travel (0 or 1)
- `status` - Real-time status ("Stopped 2 stops away", etc.)
- `vehicleId` - Train identifier

**Data Processing**:
1. Fetch predictions for user's station/route/direction
2. Calculate `departBy = trainTime - walkTimeMinutes`
3. Calculate `minutesUntilDeparture = departBy - now`
4. Filter out trains missed by >1 minute
5. Return next 5 trains sorted by departure time

## 🌐 Available MBTA API Endpoints

### 1. Predictions `/predictions` ✅ (Currently Used)
Real-time arrival/departure forecasts.

**All Available Attributes**:
| Attribute | Type | Description | Used? |
|-----------|------|-------------|-------|
| `arrival_time` | ISO8601 | When train arrives | ✅ Yes |
| `departure_time` | ISO8601 | When train departs | ✅ Yes |
| `direction_id` | 0 or 1 | Travel direction | ✅ Yes |
| `status` | string | Real-time status | ✅ Yes |
| `schedule_relationship` | string | SCHEDULED, ADDED, CANCELLED, SKIPPED | ❌ No |
| `stop_sequence` | integer | Stop number on route | ❌ No |
| `arrival_uncertainty` | integer | Confidence in seconds | ❌ No |
| `departure_uncertainty` | integer | Confidence in seconds | ❌ No |
| `last_trip` | boolean | Is this the last train? | ❌ No |
| `revenue_status` | string | Revenue or non-revenue service | ❌ No |
| `update_type` | string | Source of prediction | ❌ No |

**Relationships** (via `include` param):
- `stop` - Stop details (name, location, accessibility)
- `trip` - Trip details (headsign, block_id)
- `vehicle` - Vehicle details (current location, bearing, speed)
- `route` - Route details (color, type, long_name)
- `schedule` - Scheduled time vs predicted

### 2. Alerts `/alerts` ❌ (Not Used)
Service disruptions, delays, and notices.

**Use Cases**:
- Station closures
- Shuttle bus replacements
- Service delays or suspensions
- Elevator outages
- Special events

**Key Attributes**:
- `header` - Brief alert title
- `description` - Detailed alert description
- `severity` - 1-10 scale (10 = most severe)
- `effect` - Type: DELAY, SUSPENSION, STATION_CLOSURE, etc.
- `active_period` - Start/end times
- `informed_entity` - Affected routes/stops/trips

**Example Query**:
```
GET /alerts?filter[route]=Red&filter[stop]=place-jfk
```

### 3. Vehicles `/vehicles` ❌ (Not Used)
Real-time vehicle positions and status.

**Key Attributes**:
- `latitude` / `longitude` - Current position
- `bearing` - Direction of travel (0-359°)
- `speed` - Current speed in m/s
- `current_stop_sequence` - Which stop they're at
- `current_status` - INCOMING_AT, STOPPED_AT, IN_TRANSIT_TO
- `updated_at` - Last GPS update

**Use Cases**:
- Show "Train is 2 stops away"
- Display train on map
- Show real-time progress

**Example Query**:
```
GET /vehicles?filter[route]=Red&filter[direction_id]=0
```

### 4. Schedules `/schedules` ❌ (Not Used)
Static scheduled times (not real-time).

**Key Attributes**:
- `arrival_time` - Scheduled arrival
- `departure_time` - Scheduled departure
- `stop_sequence` - Stop order

**Use Cases**:
- Fallback when predictions unavailable
- Planning future trips
- Comparing scheduled vs actual times

### 5. Stops `/stops` ❌ (Not Used)
Station/stop information.

**Key Attributes**:
- `name` - Stop name ("JFK/UMass")
- `description` - Platform details
- `latitude` / `longitude` - Location
- `wheelchair_boarding` - Accessibility (0, 1, 2)
- `platform_code` - Platform identifier
- `platform_name` - "Ashmont/Braintree", "Alewife"

**Use Cases**:
- Station search/picker
- Multi-station support
- Accessibility information

### 6. Routes `/routes` ❌ (Not Used)
Route information and metadata.

**Key Attributes**:
- `color` - Route color (#DA291C for Red Line)
- `text_color` - Text color for contrast
- `long_name` - "Red Line"
- `short_name` - "Red"
- `direction_names` - ["South", "North"]
- `direction_destinations` - ["Ashmont/Braintree", "Alewife"]

**Use Cases**:
- Multi-route support (Orange, Blue, Green, etc.)
- Display proper route colors
- Show destination names

### 7. Route Patterns `/route_patterns` ❌ (Not Used)
Different branches and patterns on a route.

**Use Cases**:
- Distinguish Ashmont vs Braintree branches
- Show which stops are on each branch
- Filter predictions by branch

### 8. Trips `/trips` ❌ (Not Used)
Individual trip/journey information.

**Key Attributes**:
- `headsign` - "Ashmont", "Braintree", "Alewife"
- `block_id` - Train block identifier
- `wheelchair_accessible` - 0, 1, 2

**Use Cases**:
- Show trip destination
- Group trips by block
- Accessibility information

### 9. Shapes `/shapes` ❌ (Not Used)
Encoded polylines for drawing routes on maps.

**Use Cases**:
- Display route on map
- Show train position on route

### 10. Services `/services` ❌ (Not Used)
Service calendars (weekday, weekend, holidays).

**Use Cases**:
- Show service changes for holidays
- Weekend schedule differences

## 🚀 Enhancement Opportunities

### Priority 1: Service Alerts (High Impact, Easy Implementation)

**Why**: Critical for user experience - users need to know about delays, closures, or disruptions.

**Implementation**:

1. **Add alerts endpoint to routes** (server/routes.ts):
```typescript
app.get(api.mbta.alerts.path, async (_req, res) => {
  try {
    const currentSettings = await storage.getSettings();
    const { stationId, routeId } = currentSettings;

    const alertsUrl = `https://api-v3.mbta.com/alerts?filter[route]=${routeId}&filter[stop]=${stationId}`;

    const response = await fetch(alertsUrl, {
      headers: { 'Accept': 'application/vnd.api+json' }
    });

    const data = await response.json();

    const alerts = data.data.map((alert: any) => ({
      id: alert.id,
      header: alert.attributes.header,
      description: alert.attributes.description,
      severity: alert.attributes.severity,
      effect: alert.attributes.effect,
      activePeriod: alert.attributes.active_period
    }));

    res.json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
});
```

2. **Add API contract** (shared/routes.ts):
```typescript
alerts: {
  method: 'GET' as const,
  path: '/api/mbta/alerts' as const,
  responses: {
    200: z.object({
      alerts: z.array(z.object({
        id: z.string(),
        header: z.string(),
        description: z.string(),
        severity: z.number(),
        effect: z.string(),
        activePeriod: z.array(z.object({
          start: z.string(),
          end: z.string().nullable()
        }))
      }))
    })
  }
}
```

3. **Create AlertBanner component** (client/src/components/AlertBanner.tsx):
```typescript
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-6"
    >
      {alerts.map(alert => (
        <div key={alert.id} className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-destructive mb-1">{alert.header}</h4>
            <p className="text-sm text-foreground/80">{alert.description}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
```

**Impact**: Users immediately see service disruptions affecting their route.

---

### Priority 2: Vehicle Position (High Impact, Medium Effort)

**Why**: "Train is 2 stops away" is more intuitive than just a time estimate.

**Implementation**:

1. **Include vehicle relationship in predictions**:
```typescript
const mbtaUrl = `https://api-v3.mbta.com/predictions?filter[stop]=${stationId}&filter[route]=${routeId}&filter[direction_id]=${directionId}&include=vehicle&sort=departure_time`;
```

2. **Fetch vehicle data separately** (optional for real-time updates):
```typescript
app.get('/api/mbta/vehicles', async (_req, res) => {
  const vehiclesUrl = `https://api-v3.mbta.com/vehicles?filter[route]=Red&filter[direction_id]=0`;
  // ... fetch and return vehicle positions
});
```

3. **Add to prediction response**:
```typescript
vehiclePosition: {
  currentStopSequence: vehicle.attributes.current_stop_sequence,
  status: vehicle.attributes.current_status,
  stopsAway: Math.abs(vehicle.attributes.current_stop_sequence - targetStopSequence)
}
```

4. **Display in UI**:
```tsx
{prediction.vehiclePosition && (
  <p className="text-sm text-muted-foreground">
    Train is {prediction.vehiclePosition.stopsAway} stops away
  </p>
)}
```

**Impact**: Builds user trust with tangible progress information.

---

### Priority 3: Prediction Confidence (Medium Impact, Easy)

**Why**: Helps users understand reliability of predictions.

**Implementation**:

1. **Include uncertainty in predictions response**:
```typescript
return {
  id: p.id,
  // ... existing fields
  confidence: {
    arrivalUncertainty: attr.arrival_uncertainty,
    departureUncertainty: attr.departure_uncertainty,
    level: attr.departure_uncertainty < 60 ? 'high' :
           attr.departure_uncertainty < 180 ? 'medium' : 'low'
  }
};
```

2. **Display confidence visually**:
```tsx
<span className={`text-lg ${
  confidence.level === 'high' ? 'text-foreground' :
  confidence.level === 'medium' ? 'text-foreground/70' :
  'text-foreground/50'
}`}>
  {confidence.level === 'low' && '~'}{formattedTime}
</span>
```

**Impact**: Sets proper user expectations for prediction accuracy.

---

### Priority 4: Multi-Station Support (High Impact, High Effort)

**Why**: Makes app useful for all Red Line riders, not just JFK/UMass.

**Implementation Steps**:

1. **Fetch all Red Line stops**:
```typescript
GET /stops?filter[route]=Red
```

2. **Update database schema** (shared/schema.ts):
```typescript
// Already supported! Just need UI
// Current schema allows any stationId
```

3. **Create StationPicker component**:
```tsx
<Select value={settings.stationId} onChange={updateStation}>
  {redLineStops.map(stop => (
    <option value={stop.id}>{stop.name}</option>
  ))}
</Select>
```

4. **Update settings to save selected station**

**Impact**: Expands user base from single station to entire Red Line.

---

### Priority 5: Schedule Relationship Status

**Why**: Show when trains are cancelled, added, or running off-schedule.

**Implementation**:

1. **Add to prediction processing**:
```typescript
scheduleRelationship: attr.schedule_relationship,
isLast: attr.last_trip
```

2. **Display badges**:
```tsx
{prediction.scheduleRelationship === 'CANCELLED' && (
  <Badge variant="destructive">Cancelled</Badge>
)}
{prediction.scheduleRelationship === 'ADDED' && (
  <Badge variant="secondary">Extra Train</Badge>
)}
{prediction.isLast && (
  <Badge variant="outline">Last Train</Badge>
)}
```

**Impact**: Users know when service deviates from schedule.

---

## 📊 API Best Practices

### Rate Limiting
- **Current**: 20 req/min unauthenticated
- **Strategy**: Poll every 30s = 2 req/min (safe margin)
- **Optimization**: Consider caching predictions server-side if multiple clients

### Error Handling
- Handle network failures gracefully
- Fall back to last known predictions
- Show user-friendly error messages

### Data Freshness
- Predictions update frequency: Real-time (updates as trains move)
- Acceptable staleness: 30-60 seconds
- Current polling: 30 seconds ✅

### Response Optimization
Use `fields[prediction]` to request only needed attributes:
```
?fields[prediction]=arrival_time,departure_time,status
```

### Includes
Use `include` parameter to get related data in one request:
```
?include=vehicle,stop,trip
```

## 🔄 Migration Path

To implement enhancements:

1. **Phase 1 (Quick Wins)**:
   - Add service alerts (1-2 hours)
   - Add prediction confidence (30 min)
   - Add schedule relationship badges (30 min)

2. **Phase 2 (Medium Effort)**:
   - Add vehicle position tracking (3-4 hours)
   - Enhance UI with stop sequence (2 hours)

3. **Phase 3 (Major Features)**:
   - Multi-station support (8-12 hours)
   - Route patterns for branches (4-6 hours)
   - Map visualization (16+ hours)

## 📝 Testing Endpoints

### Quick API Tests

```bash
# Get predictions
curl "https://api-v3.mbta.com/predictions?filter[stop]=place-jfk&filter[route]=Red&filter[direction_id]=0"

# Get alerts
curl "https://api-v3.mbta.com/alerts?filter[route]=Red"

# Get vehicles
curl "https://api-v3.mbta.com/vehicles?filter[route]=Red"

# Get all Red Line stops
curl "https://api-v3.mbta.com/stops?filter[route]=Red"

# Get prediction with vehicle included
curl "https://api-v3.mbta.com/predictions?filter[stop]=place-jfk&include=vehicle"
```

## 🎯 Recommended Implementation Order

Based on impact vs. effort:

1. ✅ **Service Alerts** - Quick win, high impact
2. ✅ **Prediction Confidence** - Easy visual improvement
3. ✅ **Schedule Status Badges** - Quick feature add
4. 🔄 **Vehicle Position** - Moderate effort, high value
5. 🔄 **Multi-Station Support** - Significant effort, major feature

## 📚 Additional Resources

- **MBTA Developer Portal**: https://www.mbta.com/developers
- **API Status**: https://api-v3.mbta.com/health
- **GTFS Realtime Spec**: https://gtfs.org/realtime/ (underlying standard)

---

**Last Updated**: February 2026
**API Version**: V3
**Status**: Active Development
