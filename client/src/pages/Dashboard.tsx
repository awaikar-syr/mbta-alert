import { useMBTAPredictions } from "@/hooks/use-mbta";
import { useSettings } from "@/hooks/use-settings";
import { SettingsDialog } from "@/components/SettingsDialog";
import { NextTrainHero } from "@/components/NextTrainHero";
import { UpcomingTrainCard } from "@/components/UpcomingTrainCard";
import { PredictionsSkeleton } from "@/components/PredictionsSkeleton";
import { RouteMap } from "@/components/RouteMap";
import { Train, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { data: mbtaData, isLoading: isLoadingMBTA, isError: isErrorMBTA, error } = useMBTAPredictions();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  const isLoading = isLoadingMBTA || isLoadingSettings;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50" role="banner">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight leading-none">JFK/UMass</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="live-dot" />
                <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Live MBTA Red Line</span>
              </div>
            </div>
          </div>
          
          <SettingsDialog />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 space-y-12" role="main" aria-label="Train predictions dashboard">
        {isLoading ? (
          <PredictionsSkeleton />
        ) : isErrorMBTA ? (
          <div className="glass-card rounded-3xl p-8 border-destructive/20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Unable to load predictions</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't connect to the MBTA API. Please check your connection or try again later.
            </p>
          </div>
        ) : !mbtaData || mbtaData.predictions.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 flex flex-col items-center text-center">
            <Train className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No upcoming trains</h2>
            <p className="text-muted-foreground">There are currently no scheduled departures for your selected direction.</p>
          </div>
        ) : (
          <>
            {/* Find the first train that hasn't been completely missed and separate by branch */}
            {(() => {
              const predictions = mbtaData.predictions;
              const nextValidIndex = predictions.findIndex(p => (p.minutesUntilDeparture ?? -1) > -5);
              const heroPrediction = nextValidIndex >= 0 ? predictions[nextValidIndex] : predictions[0];
              // Show next 3 upcoming trains only
              const upcomingPredictions = predictions.slice(nextValidIndex + 1, nextValidIndex + 4);

              // Separate predictions by branch (for southbound only)
              const isGoingSouth = settings?.directionId === 0;
              let ashmontPredictions = predictions.filter(p => p.branch === 'Ashmont');
              let braintreePredictions = predictions.filter(p => p.branch === 'Braintree');

              // Get next train for each branch
              const nextAshmont = ashmontPredictions.find(p => (p.minutesUntilDeparture ?? -1) > -5) || ashmontPredictions[0];
              const nextBraintree = braintreePredictions.find(p => (p.minutesUntilDeparture ?? -1) > -5) || braintreePredictions[0];

              return (
                <>
                  <section>
                    <NextTrainHero
                      prediction={heroPrediction}
                      walkTime={settings?.walkTimeMinutes || 6}
                    />
                  </section>

                  {/* Dual Route Maps - only show for southbound (where the split happens) */}
                  {isGoingSouth ? (
                    <section className="space-y-4">
                      <h3 className="font-display text-xl font-bold text-foreground pl-2">
                        Route Maps
                      </h3>
                      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* Ashmont Branch Map */}
                        {nextAshmont && (
                          <RouteMap
                            currentStation={settings?.stationId || "place-jfk"}
                            direction={settings?.directionId || 0}
                            trainStopSequence={nextAshmont.stopSequence}
                            vehicleStatus={nextAshmont.vehicleStatus}
                            minutesUntilDeparture={nextAshmont.minutesUntilDeparture}
                            branch="Ashmont"
                            isActive={heroPrediction.branch === 'Ashmont'}
                          />
                        )}

                        {/* Braintree Branch Map */}
                        {nextBraintree && (
                          <RouteMap
                            currentStation={settings?.stationId || "place-jfk"}
                            direction={settings?.directionId || 0}
                            trainStopSequence={nextBraintree.stopSequence}
                            vehicleStatus={nextBraintree.vehicleStatus}
                            minutesUntilDeparture={nextBraintree.minutesUntilDeparture}
                            branch="Braintree"
                            isActive={heroPrediction.branch === 'Braintree'}
                          />
                        )}
                      </div>
                    </section>
                  ) : (
                    /* Single Route Map for Northbound */
                    <section>
                      <RouteMap
                        currentStation={settings?.stationId || "place-jfk"}
                        direction={settings?.directionId || 0}
                        trainStopSequence={heroPrediction.stopSequence}
                        vehicleStatus={heroPrediction.vehicleStatus}
                        minutesUntilDeparture={heroPrediction.minutesUntilDeparture}
                        branch={heroPrediction.branch}
                        isActive={true}
                      />
                    </section>
                  )}

                  {upcomingPredictions.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="font-display text-xl font-bold text-foreground pl-2 flex items-center gap-2">
                        Later Departures
                        <span className="bg-secondary text-secondary-foreground text-xs py-1 px-2 rounded-full font-sans font-semibold">
                          {upcomingPredictions.length}
                        </span>
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                        {upcomingPredictions.map((pred, i) => (
                          <UpcomingTrainCard key={pred.id} prediction={pred} index={i} />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
