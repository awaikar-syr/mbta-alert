import { Skeleton } from "@/components/ui/skeleton";

export function PredictionsSkeleton() {
  return (
    <div className="space-y-12">
      {/* Hero Skeleton */}
      <div className="rounded-3xl p-8 md:p-12 bg-secondary/20 space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-64" />
          <Skeleton className="h-8 w-24 mt-4" />
        </div>
        <div className="w-full max-w-sm h-px bg-border mx-auto my-4" />
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-5 w-5" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>

      {/* Upcoming Trains Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="glass-card p-5 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
