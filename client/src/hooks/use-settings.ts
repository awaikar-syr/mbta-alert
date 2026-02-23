import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type UpdateSettingsInput } from "@shared/routes";

export function useSettings() {
  return useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateSettingsInput) => {
      const res = await fetch(api.settings.update.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return api.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate both settings and predictions so they are immediately recalculated
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.mbta.predictions.path] });
    },
  });
}
