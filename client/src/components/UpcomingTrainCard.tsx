import { format } from "date-fns";
import { motion } from "framer-motion";
import { Train, ArrowRight } from "lucide-react";
import type { Prediction } from "@shared/routes";

interface UpcomingTrainCardProps {
  prediction: Prediction;
  index: number;
}

export function UpcomingTrainCard({ prediction, index }: UpcomingTrainCardProps) {
  const { minutesUntilDeparture, departByTime, arrivalTime, departureTime } = prediction;
  
  if (!departByTime || minutesUntilDeparture === null) return null;

  const formattedDepartBy = format(new Date(departByTime), "h:mm a");
  const trainTime = departureTime || arrivalTime;
  const formattedTrainTime = trainTime ? format(new Date(trainTime), "h:mm a") : "--";

  const isMissed = minutesUntilDeparture <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`glass-card p-5 rounded-2xl flex items-center justify-between group hover:border-primary/30 hover:bg-card transition-all duration-300 ${isMissed ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
          <Train className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            Leave by <span className="text-foreground font-bold">{formattedDepartBy}</span>
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold">
            {isMissed ? (
              <span className="text-muted-foreground">Departed</span>
            ) : (
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                in {minutesUntilDeparture} min
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right flex flex-col items-end">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
          Train <ArrowRight className="w-3 h-3" />
        </span>
        <span className="font-display font-bold text-lg text-foreground">
          {formattedTrainTime}
        </span>
      </div>
    </motion.div>
  );
}
