import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We can store user preferences like walk time, preferred station, etc.
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  walkTimeMinutes: integer("walk_time_minutes").notNull().default(6),
  stationId: text("station_id").notNull().default("place-jfk"),
  routeId: text("route_id").notNull().default("Red"),
  // Direction IDs (per MBTA API):
  // 0 = South (Ashmont/Braintree) - Southbound
  // 1 = North (Alewife) - Northbound
  directionId: integer("direction_id").notNull().default(0),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Request and Response Types
export type UpdateSettingsRequest = Partial<InsertSettings>;

export interface Prediction {
  id: string;
  arrivalTime: string | null;
  departureTime: string | null;
  directionId: number;
  status: string | null;
  vehicleId: string | null;
  departByTime: string | null; // Calculated on the frontend or backend
  minutesUntilDeparture: number | null; // Calculated
}

export interface PredictionsResponse {
  predictions: Prediction[];
}
