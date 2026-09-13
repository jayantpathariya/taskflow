"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { TimeLogsListResponse } from "@taskflow/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Clock,
  Calendar,
  Layers,
  Loader2,
  Timer,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";

export function TimeLogsHistory() {
  const { data, isLoading } = useQuery<TimeLogsListResponse>({
    queryKey: ["timer", "logs"],
    queryFn: async () => {
      const res = await apiClient.get<TimeLogsListResponse>("/timer/logs");
      return res.data;
    },
    refetchInterval: 10000,
  });

  const formatDuration = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return hours + "h " + minutes + "m " + seconds + "s";
    }
    if (minutes > 0) {
      return minutes + "m " + seconds + "s";
    }
    return seconds + "s";
  };

  // 12-hour format with AM/PM
  const formatTimeOnly = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateOnly = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const timeLogs = data?.timeLogs || [];
  const totalDurationSeconds = data?.totalDurationSeconds || 0;

  const totalSessions = timeLogs.length;
  const activeSessions = timeLogs.filter((l) => l.isRunning).length;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Time Card */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground block">
                Total Tracked Time
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {formatDuration(totalDurationSeconds)}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                All-time recorded duration
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Sessions Card */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground block">
                Total Sessions
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {totalSessions}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Completed focus intervals
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Layers className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Timer Card - Clean, no blinking pulse dot */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-muted-foreground block">
                Live Recording
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {activeSessions > 0 ? "1 Active" : "Idle"}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {activeSessions > 0 ? "Timer running right now" : "No timer in progress"}
              </span>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <Timer className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List Container */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Session Log History</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
            {totalSessions} {totalSessions === 1 ? "entry" : "entries"}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading session history...</span>
            </div>
          </div>
        ) : timeLogs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
              <Clock className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No time logs recorded</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Start tracking time on any of your tasks to generate audit sessions here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {timeLogs.map((log) => {
              const taskTitle =
                typeof log.taskId === "object" && log.taskId
                  ? log.taskId.title
                  : "General Focus Session";

              const taskStatus =
                typeof log.taskId === "object" && log.taskId
                  ? log.taskId.status
                  : null;

              return (
                <div
                  key={log.id}
                  className={
                    "group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-150 " +
                    (log.isRunning
                      ? "bg-primary/5 border-primary/40 shadow-xs"
                      : "bg-card border-border hover:border-border/80 hover:bg-muted/30")
                  }
                >
                  {/* Left: Task Info & Status */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={
                        "flex size-9 shrink-0 items-center justify-center rounded-xl " +
                        (log.isRunning
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground group-hover:text-foreground")
                      }
                    >
                      {log.isRunning ? (
                        <Timer className="size-4.5" />
                      ) : (
                        <Clock className="size-4.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate" title={taskTitle}>
                          {taskTitle}
                        </span>
                        {log.isRunning && (
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                            Recording
                          </span>
                        )}
                      </div>

                      {taskStatus && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                            {taskStatus === "COMPLETED" ? (
                              <CheckCircle2 className="size-3 text-emerald-500" />
                            ) : taskStatus === "IN_PROGRESS" ? (
                              <Timer className="size-3 text-amber-500" />
                            ) : (
                              <CircleDashed className="size-3 text-muted-foreground" />
                            )}
                            {taskStatus === "IN_PROGRESS"
                              ? "In Progress"
                              : taskStatus === "COMPLETED"
                              ? "Completed"
                              : "Pending"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Timestamp (12-hour format) & Duration */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    {/* Date & Time range (12-hour format) */}
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Calendar className="size-3 text-muted-foreground" />
                        <span>{formatDateOnly(log.startTime)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {formatTimeOnly(log.startTime)}
                        {log.endTime ? (
                          <>
                            <span className="mx-1 text-muted-foreground/60">→</span>
                            {formatTimeOnly(log.endTime)}
                          </>
                        ) : (
                          <span className="text-primary font-sans ml-1">(active)</span>
                        )}
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="min-w-20 text-right">
                      <Badge
                        variant={log.isRunning ? "default" : "outline"}
                        className={
                          "font-mono text-xs font-semibold px-2.5 py-1 " +
                          (log.isRunning ? "shadow-xs" : "bg-muted/40 text-foreground")
                        }
                      >
                        {log.isRunning ? "Active" : formatDuration(log.durationSeconds)}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
