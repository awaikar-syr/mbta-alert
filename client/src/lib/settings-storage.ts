import { settingsSchema, DEFAULT_SETTINGS, type Settings, type UpdateSettingsRequest } from "@shared/schema";

const STORAGE_KEY = "mbta-settings";

/**
 * Get settings from localStorage, with fallback to defaults
 */
export function getSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored);
    const validated = settingsSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error("Error reading settings from localStorage:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update settings in localStorage (partial update)
 */
export function updateSettings(updates: UpdateSettingsRequest): Settings {
  const current = getSettings();
  const updated = { ...current, ...updates };

  try {
    const validated = settingsSchema.parse(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return validated;
  } catch (error) {
    console.error("Error saving settings to localStorage:", error);
    throw error;
  }
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): Settings {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  return DEFAULT_SETTINGS;
}
