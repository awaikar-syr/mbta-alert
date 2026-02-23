import { db } from "./db";
import { settings, type Settings, type InsertSettings, type UpdateSettingsRequest } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSettings(): Promise<Settings>;
  updateSettings(updates: UpdateSettingsRequest): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<Settings> {
    const allSettings = await db.select().from(settings);
    if (allSettings.length === 0) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(settings).values({
        walkTimeMinutes: 6,
        stationId: 'place-jfk',
        routeId: 'Red',
        directionId: 0, // Ashmont/Braintree by default
      }).returning();
      return newSettings;
    }
    return allSettings[0];
  }

  async updateSettings(updates: UpdateSettingsRequest): Promise<Settings> {
    const current = await this.getSettings();
    const [updated] = await db.update(settings)
      .set(updates)
      .where(eq(settings.id, current.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
