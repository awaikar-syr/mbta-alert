import { useState, useEffect } from "react";

interface CountdownResult {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

/**
 * Hook that provides a live countdown to a target time
 * Updates every second
 */
export function useCountdown(targetTime: string | null): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>({
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!targetTime) {
      setCountdown({ minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true });
      return;
    }

    const calculateCountdown = () => {
      const now = new Date();
      const target = new Date(targetTime);
      const diffMs = target.getTime() - now.getTime();
      const totalSeconds = Math.floor(diffMs / 1000);

      if (totalSeconds <= 0) {
        // Keep counting into negative for "NOW!" state (up to -60 seconds)
        setCountdown({
          minutes: 0,
          seconds: 0,
          totalSeconds,
          isExpired: true
        });
        return;
      }

      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setCountdown({ minutes, seconds, totalSeconds, isExpired: false });
    };

    // Calculate immediately
    calculateCountdown();

    // Update every second
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return countdown;
}
