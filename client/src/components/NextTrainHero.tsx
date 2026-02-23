import { memo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, ArrowRight, TrainFront } from "lucide-react";
import type { Prediction } from "@shared/routes";

interface NextTrainHeroProps {
  prediction: Prediction;
  walkTime: number;
}

export const NextTrainHero = memo(function NextTrainHero({ prediction, walkTime }: NextTrainHeroProps) {
  const { minutesUntilDeparture, departByTime, arrivalTime, departureTime } = prediction;
  
  // If we don't have a departByTime, fallback to standard display
  if (!departByTime || minutesUntilDeparture === null) {
    return (
      <div className="glass-card rounded-3xl p-8 md:p-12 w-full text-center flex flex-col items-center justify-center min-h-[300px]">
        <TrainFront className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">Awaiting Live Times</h2>
        <p className="text-muted-foreground mt-2">Checking schedule...</p>
      </div>
    );
  }

  const isLeavingSoon = minutesUntilDeparture <= 2 && minutesUntilDeparture > 0;
  const isMissed = minutesUntilDeparture <= 0;

  let urgencyColor = "text-primary";
  let urgencyBg = "bg-primary";
  let urgencyLightBg = "bg-primary/10";
  
  if (isMissed) {
    urgencyColor = "text-muted-foreground";
    urgencyBg = "bg-muted-foreground";
    urgencyLightBg = "bg-muted";
  } else if (isLeavingSoon) {
    urgencyColor = "text-destructive";
    urgencyBg = "bg-destructive";
    urgencyLightBg = "bg-destructive/10";
  }

  // Convert valid ISO string back to date for nicer formatting
  const formattedDepartBy = format(new Date(departByTime), "h:mm a");
  const trainTime = departureTime || arrivalTime;
  const formattedTrainTime = trainTime ? format(new Date(trainTime), "h:mm a") : "--";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-8 md:p-12 w-full shadow-2xl transition-colors duration-500 border border-transparent
        ${isMissed ? 'bg-secondary' : isLeavingSoon ? 'bg-destructive/5 border-destructive/20 shadow-destructive/10' : 'bg-primary/5 border-primary/20 shadow-primary/10'}`}
    >
      <div className="flex flex-col items-center text-center space-y-6 relative z-10">
        
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${urgencyLightBg} ${urgencyColor}`}>
          <Clock className="w-4 h-4" />
          {isMissed ? "You likely missed this one" : isLeavingSoon ? "Leave immediately!" : "Next optimal departure"}
        </div>

        <div className="space-y-2">
          <p className="text-lg md:text-xl font-medium text-muted-foreground">
            {isMissed ? "Departed at" : "Leave house by"}
          </p>
          
          <h1 className={`font-display text-6xl md:text-8xl font-black tracking-tighter ${urgencyColor}`}>
            {formattedDepartBy}
          </h1>
          
          {!isMissed && (
            <p className="text-xl md:text-2xl font-medium mt-4">
              in <span className="font-bold">{minutesUntilDeparture}</span> min
            </p>
          )}
        </div>

        <div className="w-full max-w-sm h-px bg-border my-4" />

        <div className="flex items-center justify-center gap-4 text-muted-foreground font-medium w-full">
          <div className="flex flex-col items-center">
            <span className="text-sm uppercase tracking-wider mb-1">Walk</span>
            <span className="text-foreground font-bold">{walkTime} min</span>
          </div>
          <ArrowRight className="w-5 h-5 opacity-50" />
          <div className="flex flex-col items-center">
            <span className="text-sm uppercase tracking-wider mb-1">Train Arrives</span>
            <span className="text-foreground font-bold">{formattedTrainTime}</span>
          </div>
        </div>
      </div>
      
      {/* Background ambient gradient */}
      <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none ${urgencyBg}`} />
      <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none ${urgencyBg}`} />
    </motion.div>
  );
});