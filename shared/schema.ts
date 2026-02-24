import { z } from "zod";

// Plain TypeScript interface for Settings (no database)
export interface Settings {
  walkTimeMinutes: number;
  stationId: string;
  routeId: string;
  directionId: number;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  walkTimeMinutes: 6,
  stationId: "place-jfk",
  routeId: "Red",
  // Direction IDs (per MBTA API):
  // 0 = South (Ashmont/Braintree) - Southbound
  // 1 = North (Alewife) - Northbound
  directionId: 0,
};

// Zod validation schema for settings
export const settingsSchema = z.object({
  walkTimeMinutes: z.number().int().min(1).max(60),
  stationId: z.string().min(1),
  routeId: z.string().min(1),
  directionId: z.number().int().min(0).max(1),
});

export type InsertSettings = Settings;
export type UpdateSettingsRequest = Partial<Settings>;

// Prediction types
export interface Prediction {
  id: string;
  arrivalTime: string | null;
  departureTime: string | null;
  directionId: number;
  status: string | null;
  vehicleId: string | null;
  currentStopId: string | null; // Where the vehicle currently is
  stopSequence: number | null; // Stop sequence number for calculating position
  vehicleStatus: string | null; // INCOMING_AT, STOPPED_AT, IN_TRANSIT_TO
  branch: string | null; // Ashmont, Braintree, or Alewife
  departByTime: string | null;
  minutesUntilDeparture: number | null;
}

export interface PredictionsResponse {
  predictions: Prediction[];
}
