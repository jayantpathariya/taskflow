"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { DailySummaryResponse } from "@taskflow/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  Timer,
  CircleDashed,
  Activity,
  Calendar,
  Layers,
  History,
} from "lucide-react";

export function DailyAnalytics() {
  const { data: analytics, isLoading } = useQuery<DailySummaryResponse>({
    queryKey: ["analytics", "daily"],
    queryFn: async () => {
      const res = await apiClient.get<DailySummaryResponse>("/analytics/daily");
      return res.data;
    },
    refetchInterval: 15000,
  });

  const formatTotalTime = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return hours + "h " + minutes + "m";
    }
    return minutes + "m";
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-card" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-border bg-card/60 p-4"
            />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Focus Time Today",
      value: formatTotalTime(analytics?.totalTimeTrackedSeconds || 0),
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Total recorded time",
    },
    {
      title: "Completed Tasks",
      value: analytics?.completedTasksCount || 0,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description: "Marked as done",
    },
    {
      title: "In Progress Tasks",
      value: analytics?.inProgressTasksCount || 0,
      icon: Timer,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "Active work in flight",
    },
    {
      title: "Pending Tasks",
      value: analytics?.pendingTasksCount || 0,
      icon: CircleDashed,
      color: "text-muted-foreground",
      bg: "bg-muted",
      description: "Tasks awaiting action",
    },
  ];

  const tasksWorkedOn = analytics?.tasksWorkedOn || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-5 rounded-2xl border border-border">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <Activity className="size-4" />
            <span>Productivity Dashboard</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">
            Today's Performance Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time breakdown of time logged and workflow completion
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-muted/60 border border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground font-medium">
          <Calendar className="size-3.5 text-primary" />
          <span>{todayStr}</span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="border-border bg-card hover:border-border/80 transition-all shadow-xs"
            >
              <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {card.title}
                  </span>
                  <div
                    className={
                      "flex size-8 items-center justify-center rounded-xl " +
                      card.bg +
                      " " +
                      card.color
                    }
                  >
                    <Icon className="size-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {card.value}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tasks Worked On Breakdown */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Tasks Tracked Today
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {tasksWorkedOn.length} {tasksWorkedOn.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {tasksWorkedOn.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Layers className="size-8 stroke-1 text-muted-foreground mb-2" />
            <p className="text-xs font-medium">No time tracked yet today.</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Start a timer on any task to record focus time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {tasksWorkedOn.map((t) => (
              <div
                key={t.taskId}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    <Clock className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mt-0.5">
                      {t.status.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="font-mono text-xs font-semibold">
                    {formatTotalTime(t.durationSeconds)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
