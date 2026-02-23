import { memo } from "react";
import { motion } from "framer-motion";
import { MapPin, Circle, Train } from "lucide-react";

interface Stop {
  id: string;
  name: string;
  shortName: string;
}

interface RouteMapProps {
  currentStation: string;
  direction: number;
  nextTrainStops?: number; // How many stops away the next train is
}

// Red Line stops in order (Southbound direction)
const RED_LINE_STOPS: Stop[] = [
  { id: "place-alfcl", name: "Alewife", shortName: "Alewife" },
  { id: "place-davis", name: "Davis", shortName: "Davis" },
  { id: "place-portr", name: "Porter", shortName: "Porter" },
  { id: "place-hrsq", name: "Harvard", shortName: "Harvard" },
  { id: "place-cntsq", name: "Central", shortName: "Central" },
  { id: "place-knncl", name: "Kendall/MIT", shortName: "Kendall" },
  { id: "place-chmnl", name: "Charles/MGH", shortName: "Charles" },
  { id: "place-pktrm", name: "Park Street", shortName: "Park" },
  { id: "place-dwnxg", name: "Downtown Crossing", shortName: "Downtown" },
  { id: "place-sstat", name: "South Station", shortName: "South Sta" },
  { id: "place-brdwy", name: "Broadway", shortName: "Broadway" },
  { id: "place-andrw", name: "Andrew", shortName: "Andrew" },
  { id: "place-jfk", name: "JFK/UMass", shortName: "JFK/UMass" },
  { id: "place-nqncy", name: "North Quincy", shortName: "N Quincy" },
  { id: "place-wlsta", name: "Wollaston", shortName: "Wollaston" },
  { id: "place-qnctr", name: "Quincy Center", shortName: "Q Center" },
  { id: "place-qamnl", name: "Quincy Adams", shortName: "Q Adams" },
  { id: "place-brntn", name: "Braintree", shortName: "Braintree" },
];

export const RouteMap = memo(function RouteMap({
  currentStation,
  direction,
  nextTrainStops
}: RouteMapProps) {
  const currentStopIndex = RED_LINE_STOPS.findIndex(stop => stop.id === currentStation);

  // For Northbound, reverse the order for display
  const displayStops = direction === 1 ? [...RED_LINE_STOPS].reverse() : RED_LINE_STOPS;
  const displayCurrentIndex = direction === 1
    ? RED_LINE_STOPS.length - 1 - currentStopIndex
    : currentStopIndex;

  // Calculate train position (stops away from current station)
  const trainStopIndex = nextTrainStops !== undefined
    ? displayCurrentIndex + (direction === 0 ? -nextTrainStops : nextTrainStops)
    : undefined;

  return (
    <div className="glass-card rounded-2xl p-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Red Line Route</h3>
            <p className="text-xs text-muted-foreground">
              {direction === 0 ? "Southbound to Ashmont/Braintree" : "Northbound to Alewife"}
            </p>
          </div>
        </div>
      </div>

      {/* Route visualization */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-primary/20" />

        {/* Stops */}
        <div className="flex justify-between items-start relative">
          {displayStops.map((stop, index) => {
            const isCurrent = index === displayCurrentIndex;
            const isPassed = direction === 0
              ? index < displayCurrentIndex
              : index > displayCurrentIndex;
            const hasTrain = trainStopIndex !== undefined && index === trainStopIndex;

            return (
              <div
                key={stop.id}
                className="flex flex-col items-center gap-2 relative"
                style={{ flex: '0 0 auto', minWidth: '60px' }}
              >
                {/* Train indicator */}
                {hasTrain && (
                  <motion.div
                    initial={{ scale: 0, y: -10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2"
                  >
                    <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                      <Train className="w-3 h-3" />
                    </div>
                  </motion.div>
                )}

                {/* Stop circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`
                    relative z-10 rounded-full border-2 flex items-center justify-center
                    ${isCurrent
                      ? 'w-10 h-10 bg-primary border-primary shadow-lg shadow-primary/30'
                      : isPassed
                        ? 'w-3 h-3 bg-primary/40 border-primary/40'
                        : 'w-3 h-3 bg-secondary border-border'
                    }
                  `}
                >
                  {isCurrent && (
                    <Circle className="w-4 h-4 text-primary-foreground fill-current" />
                  )}
                </motion.div>

                {/* Stop name */}
                <div className={`
                  text-center transition-all
                  ${isCurrent ? 'text-xs font-bold text-foreground' : 'text-[10px] text-muted-foreground'}
                `}>
                  <div className="whitespace-nowrap">
                    {stop.shortName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary border-2 border-primary flex items-center justify-center">
            <Circle className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          <span className="text-xs text-muted-foreground">Your Station</span>
        </div>
        {nextTrainStops !== undefined && (
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-full p-1.5">
              <Train className="w-3 h-3" />
            </div>
            <span className="text-xs text-muted-foreground">Next Train</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/40 border-2 border-primary/40" />
          <span className="text-xs text-muted-foreground">Passed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary border-2 border-border" />
          <span className="text-xs text-muted-foreground">Upcoming</span>
        </div>
      </div>
    </div>
  );
});
