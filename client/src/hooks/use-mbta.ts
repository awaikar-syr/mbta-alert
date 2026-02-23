import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useMBTAPredictions() {
  return useQuery({
    queryKey: [api.mbta.predictions.path],
    queryFn: async () => {
      const res = await fetch(api.mbta.predictions.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch MBTA predictions");
      return api.mbta.predictions.responses[200].parse(await res.json());
    },
    // Poll every 30 seconds
    refetchInterval: 30000,
    // Keep it fresh
    staleTime: 10000,
  });
}
