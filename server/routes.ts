import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { z } from "zod";
import { subMinutes, differenceInMinutes, parseISO } from "date-fns";

// Query params schema for predictions endpoint
const predictionsQuerySchema = z.object({
  stationId: z.string().default("place-jfk"),
  routeId: z.string().default("Red"),
  directionId: z.coerce.number().int().default(0),
  walkTime: z.coerce.number().int().default(6),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // MBTA Predictions endpoint - reads settings from query params
  app.get(api.mbta.predictions.path, async (req, res) => {
    try {
      // Parse and validate query params
      const { stationId, routeId, directionId, walkTime } = predictionsQuerySchema.parse(req.query);

      // MBTA API endpoint for predictions - include trip data to get branch (Ashmont/Braintree)
      const mbtaUrl = `https://api-v3.mbta.com/predictions?filter[stop]=${stationId}&filter[route]=${routeId}&filter[direction_id]=${directionId}&include=stop,vehicle,trip&sort=departure_time`;

      const response = await fetch(mbtaUrl, {
        headers: {
          'Accept': 'application/vnd.api+json',
        }
      });

      if (!response.ok) {
        throw new Error(`MBTA API responded with ${response.status}`);
      }

      const data = await response.json();

      // Build maps of included data for easy lookup
      const stopsMap = new Map();
      const vehiclesMap = new Map();
      const tripsMap = new Map();

      if (data.included) {
        for (const item of data.included) {
          if (item.type === 'stop') {
            stopsMap.set(item.id, item);
          } else if (item.type === 'vehicle') {
            vehiclesMap.set(item.id, item);
          } else if (item.type === 'trip') {
            tripsMap.set(item.id, item);
          }
        }
      }

      const now = new Date();

      const predictions = data.data
        .map((p: any) => {
          const attr = p.attributes;
          // Some predictions might only have arrival_time or only departure_time
          const targetTimeStr = attr.departure_time || attr.arrival_time;

          if (!targetTimeStr) return null;

          const targetTime = parseISO(targetTimeStr);
          const departBy = subMinutes(targetTime, walkTime);
          const minsUntilDeparture = differenceInMinutes(departBy, now);

          // Get vehicle data if available
          const vehicleId = p.relationships?.vehicle?.data?.id || null;
          const vehicle = vehicleId ? vehiclesMap.get(vehicleId) : null;

          // Get vehicle's current stop sequence (where the train is now)
          const vehicleCurrentStopSequence = vehicle?.attributes?.current_stop_sequence || null;

          // Get vehicle's current status (INCOMING_AT, STOPPED_AT, IN_TRANSIT_TO)
          const vehicleCurrentStatus = vehicle?.attributes?.current_status || null;

          // Get trip data to determine branch (Ashmont/Braintree)
          const tripId = p.relationships?.trip?.data?.id || null;
          const trip = tripId ? tripsMap.get(tripId) : null;
          const headsign = trip?.attributes?.headsign || null;

          // Determine branch from headsign
          let branch: string | null = null;
          if (headsign) {
            if (headsign.includes('Ashmont')) {
              branch = 'Ashmont';
            } else if (headsign.includes('Braintree')) {
              branch = 'Braintree';
            } else if (headsign.includes('Alewife')) {
              branch = 'Alewife';
            }
          }

          // Get stop sequence from the prediction's stop (where the prediction is for - user's station)
          const predictionStopSequence = attr.stop_sequence || null;

          return {
            id: p.id,
            arrivalTime: attr.arrival_time,
            departureTime: attr.departure_time,
            directionId: attr.direction_id,
            status: attr.status,
            vehicleId: vehicleId,
            currentStopId: null, // Deprecated, using sequences instead
            stopSequence: vehicleCurrentStopSequence, // Where the train currently is
            vehicleStatus: vehicleCurrentStatus, // INCOMING_AT, STOPPED_AT, IN_TRANSIT_TO
            branch: branch, // Ashmont, Braintree, or Alewife
            departByTime: departBy.toISOString(),
            minutesUntilDeparture: minsUntilDeparture,
          };
        })
        .filter((p: any) => p !== null && p.minutesUntilDeparture >= -1) // Filter out trains you've already missed by more than 1 min
        .sort((a: any, b: any) => a.minutesUntilDeparture - b.minutesUntilDeparture)
        .slice(0, 5); // Return next 5

      res.json({ predictions });
    } catch (error) {
      console.error("Error fetching MBTA predictions:", error);
      res.status(500).json({ message: "Failed to fetch predictions" });
    }
  });

  return httpServer;
}
