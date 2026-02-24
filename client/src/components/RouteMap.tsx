import { memo } from "react";
import { motion } from "framer-motion";
import { MapPin, Circle, Train } from "lucide-react";

interface Stop {
  id: string;
  name: string;
  shortName: string;
  sequence: number; // Stop sequence number for Southbound direction
}

interface RouteMapProps {
  currentStation: string;
  direction: number;
  trainStopSequence?: number | null; // The stop sequence where the train currently is
  vehicleStatus?: string | null; // INCOMING_AT, STOPPED_AT, IN_TRANSIT_TO
  minutesUntilDeparture?: number | null; // Minutes until train departs from user's station
  branch?: string | null; // Ashmont, Braintree, or Alewife
  isActive?: boolean; // Highlight this map if it's for the next train
}

// Red Line main trunk (shared by both branches)
const RED_LINE_TRUNK: Stop[] = [
  { id: "place-alfcl", name: "Alewife", shortName: "Alewife", sequence: 10 },
  { id: "place-davis", name: "Davis", shortName: "Davis", sequence: 20 },
  { id: "place-portr", name: "Porter", shortName: "Porter", sequence: 30 },
  { id: "place-hrsq", name: "Harvard", shortName: "Harvard", sequence: 40 },
  { id: "place-cntsq", name: "Central", shortName: "Central", sequence: 50 },
  { id: "place-knncl", name: "Kendall/MIT", shortName: "Kendall", sequence: 60 },
  { id: "place-chmnl", name: "Charles/MGH", shortName: "Charles", sequence: 70 },
  { id: "place-pktrm", name: "Park Street", shortName: "Park", sequence: 80 },
  { id: "place-dwnxg", name: "Downtown Crossing", shortName: "Downtown", sequence: 90 },
  { id: "place-sstat", name: "South Station", shortName: "South Sta", sequence: 100 },
  { id: "place-brdwy", name: "Broadway", shortName: "Broadway", sequence: 110 },
  { id: "place-andrw", name: "Andrew", shortName: "Andrew", sequence: 120 },
  { id: "place-jfk", name: "JFK/UMass", shortName: "JFK/UMass", sequence: 130 },
];

// Ashmont Branch (after JFK/UMass)
const ASHMONT_BRANCH: Stop[] = [
  { id: "place-shmnl", name: "Savin Hill", shortName: "Savin Hill", sequence: 140 },
  { id: "place-fldcr", name: "Fields Corner", shortName: "Fields Cnr", sequence: 150 },
  { id: "place-smmnl", name: "Shawmut", shortName: "Shawmut", sequence: 160 },
  { id: "place-asmnl", name: "Ashmont", shortName: "Ashmont", sequence: 170 },
];

// Braintree Branch (after JFK/UMass)
const BRAINTREE_BRANCH: Stop[] = [
  { id: "place-nqncy", name: "North Quincy", shortName: "N Quincy", sequence: 140 },
  { id: "place-wlsta", name: "Wollaston", shortName: "Wollaston", sequence: 150 },
  { id: "place-qnctr", name: "Quincy Center", shortName: "Q Center", sequence: 160 },
  { id: "place-qamnl", name: "Quincy Adams", shortName: "Q Adams", sequence: 170 },
  { id: "place-brntn", name: "Braintree", shortName: "Braintree", sequence: 180 },
];

// Get stops for a specific branch
function getStopsForBranch(branch: string | null): Stop[] {
  if (branch === 'Ashmont') {
    return [...RED_LINE_TRUNK, ...ASHMONT_BRANCH];
  } else if (branch === 'Braintree') {
    return [...RED_LINE_TRUNK, ...BRAINTREE_BRANCH];
  }
  // Default to Braintree if branch not specified
  return [...RED_LINE_TRUNK, ...BRAINTREE_BRANCH];
}

export const RouteMap = memo(function RouteMap({
  currentStation,
  direction,
  trainStopSequence,
  vehicleStatus,
  minutesUntilDeparture,
  branch,
  isActive = false
}: RouteMapProps) {
  // Get stops for the specific branch
  const RED_LINE_STOPS = getStopsForBranch(branch);
  const currentStopIndex = RED_LINE_STOPS.findIndex(stop => stop.id === currentStation);

  // Find where the train currently is based on stop sequence
  const trainActualIndex = trainStopSequence
    ? RED_LINE_STOPS.findIndex(stop => stop.sequence === trainStopSequence)
    : -1;

  // Determine if train is between stops (in transit)
  // IN_TRANSIT_TO means heading to next stop
  const isTrainInTransit = vehicleStatus === "IN_TRANSIT_TO";

  // If in transit, calculate fractional position (halfway between current and next stop)
  const trainFractionalPosition = isTrainInTransit && trainActualIndex >= 0
    ? (direction === 0 ? trainActualIndex + 0.5 : trainActualIndex - 0.5)
    : trainActualIndex;

  // Show only nearby stops (5 before and 5 after user's station) to keep it centered
  const STOPS_RANGE = 5;
  const startIndex = Math.max(0, currentStopIndex - STOPS_RANGE);
  const endIndex = Math.min(RED_LINE_STOPS.length, currentStopIndex + STOPS_RANGE + 1);
  const nearbyStops = RED_LINE_STOPS.slice(startIndex, endIndex);

  // For Northbound, reverse the order for display
  const displayStops = direction === 1 ? [...nearbyStops].reverse() : nearbyStops;

  // Recalculate indices for the subset of stops
  const displayCurrentIndex = nearbyStops.findIndex(stop => stop.id === currentStation);
  const adjustedDisplayIndex = direction === 1
    ? nearbyStops.length - 1 - displayCurrentIndex
    : displayCurrentIndex;

  // Calculate train position on the display
  const displayTrainIndex = trainActualIndex >= 0
    ? displayStops.findIndex(stop => stop.sequence === trainStopSequence)
    : undefined;

  // Determine if train should be shown between stops
  const trainInTransitBetweenStops = isTrainInTransit && displayTrainIndex !== undefined && displayTrainIndex >= 0;

  // Calculate which two stops the train is between (for in-transit visualization)
  let trainBetweenIndex1 = -1;
  let trainBetweenIndex2 = -1;
  if (trainInTransitBetweenStops) {
    trainBetweenIndex1 = displayTrainIndex;
    trainBetweenIndex2 = direction === 0 ? displayTrainIndex + 1 : displayTrainIndex - 1;
  }

  return (
    <div className={`glass-card rounded-2xl p-6 w-full overflow-hidden transition-all duration-300 ${
      isActive
        ? 'border-2 border-primary shadow-lg shadow-primary/20 bg-primary/5'
        : 'border border-transparent opacity-60 hover:opacity-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
          }`}>
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {branch ? `${branch} Branch` : 'Red Line Route'}
              {isActive && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Next Train</span>}
            </h3>
            <p className="text-xs text-muted-foreground">
              {direction === 0 ? `Southbound to ${branch || 'Ashmont/Braintree'}` : "Northbound to Alewife"}
            </p>
          </div>
        </div>
      </div>

      {/* Route visualization */}
      <div className="relative w-full">
        {/* Connection line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-primary/20" />

        {/* Stops */}
        <div className="flex justify-between items-start relative w-full">
          {displayStops.map((stop, index) => {
            const isCurrent = index === adjustedDisplayIndex;

            // Only mark as "passed" if:
            // 1. There's a train
            // 2. Train departs in less than 3.5 minutes
            // 3. This stop is between the train and the current station
            const shouldShowPassed = minutesUntilDeparture !== null && minutesUntilDeparture < 3.5;
            const isPassed = shouldShowPassed && displayTrainIndex !== undefined && (
              (direction === 0 && index > displayTrainIndex && index < adjustedDisplayIndex) ||
              (direction === 1 && index < displayTrainIndex && index > adjustedDisplayIndex)
            );

            const hasTrain = displayTrainIndex !== undefined && index === displayTrainIndex && !trainInTransitBetweenStops;
            const isTrainBetweenHere = trainInTransitBetweenStops && (index === trainBetweenIndex1 || index === trainBetweenIndex2);

            return (
              <div
                key={stop.id}
                className="flex flex-col items-center gap-2 relative flex-1"
                style={{ minWidth: '50px', maxWidth: '80px' }}
              >
                {/* Train indicator - at stop */}
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

                {/* Train indicator - in transit between stops */}
                {isTrainBetweenHere && index === trainBetweenIndex1 && (
                  <motion.div
                    initial={{ scale: 0, y: -10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute -top-8 left-[150%] -translate-x-1/2 z-20"
                  >
                    <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg animate-pulse">
                      <Train className="w-3 h-3" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        In Transit
                      </span>
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
        {displayTrainIndex !== undefined && (
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
