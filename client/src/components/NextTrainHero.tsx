import { memo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, ArrowRight, TrainFront, ArrowUpDown } from "lucide-react";
import type { Prediction } from "@shared/schema";
import { useCountdown } from "@/hooks/use-countdown";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";

interface NextTrainHeroProps {
  prediction: Prediction;
  walkTime: number;
}

export const NextTrainHero = memo(function NextTrainHero({ prediction, walkTime }: NextTrainHeroProps) {
  const { minutesUntilDeparture, departByTime, arrivalTime, departureTime } = prediction;

  // Live countdown hook - updates every second
  const countdown = useCountdown(departByTime);

  // Settings for direction toggle
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const handleDirectionToggle = () => {
    const newDirection = settings?.directionId === 0 ? 1 : 0;
    updateSettings.mutate({ directionId: newDirection });
  };

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

  const isLeavingSoon = countdown.totalSeconds <= 120 && countdown.totalSeconds > 0;
  const isMissed = countdown.isExpired;
  // "NOW!" state: show for 60 seconds after departure time (0 to -60 seconds)
  const isNow = countdown.totalSeconds <= 0 && countdown.totalSeconds >= -60;

  let urgencyColor = "text-primary";
  let urgencyBg = "bg-primary";
  let urgencyLightBg = "bg-primary/10";

  if (isNow) {
    urgencyColor = "text-white";
    urgencyBg = "bg-destructive";
    urgencyLightBg = "bg-destructive";
  } else if (isMissed) {
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
        ${isNow ? 'bg-destructive border-destructive shadow-destructive/30' : isMissed ? 'bg-secondary' : isLeavingSoon ? 'bg-destructive/5 border-destructive/20 shadow-destructive/10' : 'bg-primary/5 border-primary/20 shadow-primary/10'}`}
    >
      <div className="flex flex-col items-center text-center space-y-6 relative z-10">
        
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${urgencyLightBg} ${urgencyColor}`}>
          <Clock className="w-4 h-4" />
          {isNow ? "LEAVE NOW!" : isMissed ? "You likely missed this one" : isLeavingSoon ? "Leave immediately!" : "Next optimal departure"}
        </div>

        <div className="space-y-2">
          {isNow ? (
            <>
              {/* "NOW!" state - shown for 60 seconds after departure time */}
              <h1 className="font-display text-8xl md:text-[12rem] font-black tracking-tighter text-white animate-pulse">
                NOW!
              </h1>
              <p className="text-base md:text-lg font-medium text-white/90">
                You should be leaving right now!
              </p>
            </>
          ) : (
            <>
              <p className="text-lg md:text-xl font-medium text-muted-foreground">
                {isMissed ? "Departed at" : "Time to leave"}
              </p>

              {!isMissed ? (
                <div className="space-y-2">
                  {/* Live countdown timer */}
                  <h1 className={`font-display text-7xl md:text-9xl font-black tracking-tighter ${urgencyColor} tabular-nums`}>
                    {countdown.minutes}:{countdown.seconds.toString().padStart(2, '0')}
                  </h1>
                  <p className="text-base md:text-lg font-medium text-muted-foreground">
                    Depart by <span className="font-bold text-foreground">{formattedDepartBy}</span>
                  </p>
                </div>
              ) : (
                <h1 className={`font-display text-6xl md:text-8xl font-black tracking-tighter ${urgencyColor}`}>
                  {formattedDepartBy}
                </h1>
              )}
            </>
          )}
        </div>

        <div className={`w-full max-w-sm h-px my-4 ${isNow ? 'bg-white/30' : 'bg-border'}`} />

        <div className={`flex items-center justify-center gap-4 font-medium w-full ${isNow ? 'text-white/80' : 'text-muted-foreground'}`}>
          <div className="flex flex-col items-center">
            <span className="text-sm uppercase tracking-wider mb-1">Walk</span>
            <span className={`font-bold ${isNow ? 'text-white' : 'text-foreground'}`}>{walkTime} min</span>
          </div>
          <ArrowRight className="w-5 h-5 opacity-50" />
          <div className="flex flex-col items-center">
            <span className="text-sm uppercase tracking-wider mb-1">Train Arrives</span>
            <span className={`font-bold ${isNow ? 'text-white' : 'text-foreground'}`}>{formattedTrainTime}</span>
          </div>
        </div>

        {/* Direction Toggle */}
        <button
          onClick={handleDirectionToggle}
          className={`mt-6 px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 w-full max-w-sm ${
            isNow
              ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
              : 'bg-secondary hover:bg-secondary/80 text-foreground border border-border'
          }`}
        >
          <ArrowUpDown className="w-4 h-4" />
          {settings?.directionId === 0 ? 'Switch to Northbound' : 'Switch to Southbound'}
        </button>
      </div>
      
      {/* Background ambient gradient */}
      <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none ${urgencyBg}`} />
      <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none ${urgencyBg}`} />
    </motion.div>
  );
});