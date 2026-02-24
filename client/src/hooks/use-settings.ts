import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { getSettings, updateSettings } from "@/lib/settings-storage";
import type { UpdateSettingsRequest } from "@shared/schema";

const SETTINGS_QUERY_KEY = ["settings"];

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => {
      // Read from localStorage synchronously
      return getSettings();
    },
    // Settings are always fresh (no stale time)
    staleTime: Infinity,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettingsRequest) => {
      // Update localStorage
      return updateSettings(data);
    },
    onSuccess: () => {
      // Invalidate settings query to trigger re-render
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      // Invalidate predictions so they refetch with new settings
      queryClient.invalidateQueries({ queryKey: [api.mbta.predictions.path] });
    },
  });
}
