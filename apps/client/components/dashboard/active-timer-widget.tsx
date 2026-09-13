"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ActiveTimerResponse } from "@taskflow/shared";
import { Button } from "@/components/ui/button";
import { Timer, Square, Play, Sparkles } from "lucide-react";

export function ActiveTimerWidget() {
  const queryClient = useQueryClient();

  const { data: timerData } = useQuery<ActiveTimerResponse>({
    queryKey: ["timer", "active"],
    queryFn: async () => {
      const res = await apiClient.get<ActiveTimerResponse>("/timer/active");
      return res.data;
    },
    refetchInterval: 10000,
  });

  const activeTimer = timerData?.activeTimer;

  // Track live elapsed seconds locally with a 1-second interval
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!activeTimer?.startTime) {
      setElapsedSeconds(0);
      return;
    }

    const calculateElapsed = () => {
      const startMs = new Date(activeTimer.startTime).getTime();
      const nowMs = Date.now();
      return Math.max(0, Math.floor((nowMs - startMs) / 1000));
    };

    setElapsedSeconds(calculateElapsed());

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.startTime]);

  const stopTimerMutation = useMutation({
    mutationFn: (taskId: string) => apiClient.post('/tasks/' + taskId + '/timer/stop'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  if (!activeTimer) {
    return null;
  }

  const taskId =
    typeof activeTimer.taskId === "object"
      ? activeTimer.taskId.id
      : (activeTimer.taskId as string);

  const taskTitle =
    typeof activeTimer.taskId === "object"
      ? activeTimer.taskId.title
      : "Active Task";

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
    }
    return pad(minutes) + ':' + pad(seconds);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3.5 shadow-xl backdrop-blur-md">
      {/* Blinking indicator & icon */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Timer className="size-5 animate-pulse" />
      </div>

      {/* Task Details */}
      <div className="min-w-0 pr-1 max-w-[180px] sm:max-w-[240px]">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-ping" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Tracking Time
          </span>
        </div>
        <p className="text-xs font-semibold text-foreground truncate mt-0.5" title={taskTitle}>
          {taskTitle}
        </p>
      </div>

      {/* Live Counter Display */}
      <div className="rounded-xl bg-muted/70 px-2.5 py-1 font-mono text-sm font-bold tracking-tight text-foreground">
        {formatTimer(elapsedSeconds)}
      </div>

      {/* Stop Button */}
      <Button
        size="sm"
        variant="destructive"
        onClick={() => stopTimerMutation.mutate(taskId)}
        disabled={stopTimerMutation.isPending}
        className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs shrink-0"
      >
        <Square className="size-3.5 fill-current" />
        <span>Stop</span>
      </Button>
    </div>
  );
}
