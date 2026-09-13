"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ActiveTimerResponse } from "@taskflow/shared";
import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";
import { toast } from "sonner";

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

  // Track live elapsed time using 1-second interval
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeTimer?.startTime) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTimer?.startTime]);

  const elapsedSeconds = activeTimer?.startTime
    ? Math.max(
        0,
        Math.floor((now - new Date(activeTimer.startTime).getTime()) / 1000)
      )
    : 0;

  const taskId = activeTimer
    ? typeof activeTimer.taskId === "object"
      ? activeTimer.taskId.id
      : String(activeTimer.taskId)
    : "";

  const taskTitle = activeTimer
    ? typeof activeTimer.taskId === "object"
      ? activeTimer.taskId.title
      : "Active Task"
    : "Active Task";

  const stopTimerMutation = useMutation({
    mutationFn: (id: string) => apiClient.post('/tasks/' + id + '/timer/stop'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "time-logs"] });
      toast.success("Timer stopped", {
        description: `Focus session recorded for "${taskTitle}".`,
      });
    },
    onError: () => {
      toast.error("Failed to stop timer");
    },
  });

  if (!activeTimer) {
    return null;
  }

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
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur-md text-xs">
      {/* Live Indicator & Task Title */}
      <div className="flex items-center gap-2 min-w-0 max-w-[180px] sm:max-w-xs">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span className="truncate font-medium text-foreground text-xs" title={taskTitle}>
          {taskTitle}
        </span>
      </div>

      {/* Tabular Monospace Counter */}
      <div className="rounded bg-muted px-2 py-0.5 font-mono tabular-nums text-xs font-semibold text-foreground tracking-tight shrink-0 border border-border/40">
        {formatTimer(elapsedSeconds)}
      </div>

      {/* Stop Button */}
      <Button
        size="sm"
        variant="destructive"
        onClick={() => stopTimerMutation.mutate(taskId)}
        disabled={stopTimerMutation.isPending}
        className="h-6.5 gap-1 px-2 text-xs font-medium shrink-0 cursor-pointer"
        title="Stop tracking time"
      >
        <Square className="size-3 fill-current" />
        <span>Stop</span>
      </Button>
    </div>
  );
}
