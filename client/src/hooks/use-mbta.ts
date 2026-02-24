import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useSettings } from "./use-settings";

export function useMBTAPredictions() {
  const { data: settings } = useSettings();

  return useQuery({
    queryKey: [api.mbta.predictions.path, settings],
    queryFn: async () => {
      if (!settings) throw new Error("Settings not loaded");

      // Build URL with settings as query params
      const params = new URLSearchParams({
        stationId: settings.stationId,
        routeId: settings.routeId,
        directionId: String(settings.directionId),
        walkTime: String(settings.walkTimeMinutes),
      });

      const url = `${api.mbta.predictions.path}?${params}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch MBTA predictions");
      return api.mbta.predictions.responses[200].parse(await res.json());
    },
    // Only fetch when settings are available
    enabled: !!settings,
    // Poll every 15 seconds for more real-time updates
    refetchInterval: 15000,
    // Keep it fresh
    staleTime: 5000,
  });
}
