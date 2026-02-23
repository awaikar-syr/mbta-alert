import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { subMinutes, differenceInMinutes, parseISO } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.settings.get.path, async (_req, res) => {
    try {
      const currentSettings = await storage.getSettings();
      res.json(currentSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch(api.settings.update.path, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const updatedSettings = await storage.updateSettings(input);
      res.json(updatedSettings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
        });
      }
      console.error("Error updating settings:", err);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get(api.mbta.predictions.path, async (_req, res) => {
    try {
      const currentSettings = await storage.getSettings();
      const { stationId, routeId, directionId, walkTimeMinutes } = currentSettings;

      // MBTA API endpoint for predictions
      const mbtaUrl = `https://api-v3.mbta.com/predictions?filter[stop]=${stationId}&filter[route]=${routeId}&filter[direction_id]=${directionId}&sort=departure_time`;
      
      const response = await fetch(mbtaUrl, {
        headers: {
          'Accept': 'application/vnd.api+json',
        }
      });

      if (!response.ok) {
        throw new Error(`MBTA API responded with ${response.status}`);
      }

      const data = await response.json();
      
      const now = new Date();

      const predictions = data.data
        .map((p: any) => {
          const attr = p.attributes;
          // Some predictions might only have arrival_time or only departure_time
          const targetTimeStr = attr.departure_time || attr.arrival_time;
          
          if (!targetTimeStr) return null;
          
          const targetTime = parseISO(targetTimeStr);
          const departBy = subMinutes(targetTime, walkTimeMinutes);
          const minsUntilDeparture = differenceInMinutes(departBy, now);
          
          return {
            id: p.id,
            arrivalTime: attr.arrival_time,
            departureTime: attr.departure_time,
            directionId: attr.direction_id,
            status: attr.status,
            vehicleId: p.relationships?.vehicle?.data?.id || null,
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
