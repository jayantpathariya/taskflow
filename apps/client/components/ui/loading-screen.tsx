"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  label?: string;
  className?: string;
}

export function LoadingScreen({
  label = "Loading TaskFlow...",
  className = "min-h-screen",
}: LoadingScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(seconds);
      if (seconds >= 3) {
        setIsWarmingUp(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center bg-background px-4 ${className}`}
    >
      <div className="flex flex-col items-center max-w-sm text-center space-y-4">
        <Loader2 className="size-8 animate-spin text-primary" />

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">{label}</p>

          {isWarmingUp && (
            <div className="animate-in fade-in duration-500 space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground/90">
                Waking up server on Render ({elapsedSeconds}s)...
              </p>
              <p className="leading-relaxed">
                Render&apos;s free tier spins down after inactivity. First load takes
                ~20–30s. Subsequent requests will be fast!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
