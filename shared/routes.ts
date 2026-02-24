import { z } from 'zod';

export const errorSchemas = {
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  mbta: {
    predictions: {
      method: 'GET' as const,
      path: '/api/mbta/predictions' as const,
      responses: {
        200: z.object({
          predictions: z.array(z.object({
            id: z.string(),
            arrivalTime: z.string().nullable(),
            departureTime: z.string().nullable(),
            directionId: z.number(),
            status: z.string().nullable(),
            vehicleId: z.string().nullable(),
            currentStopId: z.string().nullable(),
            stopSequence: z.number().nullable(),
            vehicleStatus: z.string().nullable(),
            branch: z.string().nullable(),
            departByTime: z.string().nullable(),
            minutesUntilDeparture: z.number().nullable(),
          }))
        }),
        500: errorSchemas.internal,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type PredictionsResponse = z.infer<typeof api.mbta.predictions.responses[200]>;
