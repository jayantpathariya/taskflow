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
  BarChart2,
  PieChart as PieChartIcon,
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
  const totalSeconds = analytics?.totalTimeTrackedSeconds || 0;

  // Max duration for scaling the bars relative to highest task
  const maxTaskDuration = Math.max(
    ...tasksWorkedOn.map((t) => t.durationSeconds),
    1
  );

  const totalTasks =
    (analytics?.completedTasksCount || 0) +
    (analytics?.inProgressTasksCount || 0) +
    (analytics?.pendingTasksCount || 0);

  const completedPct = totalTasks > 0 ? Math.round(((analytics?.completedTasksCount || 0) / totalTasks) * 100) : 0;
  const inProgressPct = totalTasks > 0 ? Math.round(((analytics?.inProgressTasksCount || 0) / totalTasks) * 100) : 0;
  const pendingPct = totalTasks > 0 ? Math.round(((analytics?.pendingTasksCount || 0) / totalTasks) * 100) : 0;

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
            Today&apos;s Performance Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time breakdown of time logged, task focus distribution, and workflow completion
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

      {/* Visual Productivity Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Focus Time Allocation per Task (Horizontal Bar Chart) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="size-4 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Task Focus Distribution
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Time invested per task today
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Total: {formatTotalTime(totalSeconds)}
            </span>
          </div>

          {tasksWorkedOn.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Layers className="size-8 stroke-1 text-muted-foreground mb-2" />
              <p className="text-xs font-medium">No task focus logged today.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Start a timer on any task to visualize focus allocation here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 pt-2">
              {tasksWorkedOn.map((t) => {
                const percentOfMax = Math.round((t.durationSeconds / maxTaskDuration) * 100);
                const percentOfTotal = totalSeconds > 0 ? Math.round((t.durationSeconds / totalSeconds) * 100) : 0;

                return (
                  <div key={t.taskId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[280px]" title={t.title}>
                        {t.title}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
                        <span className="font-semibold text-foreground">
                          {formatTotalTime(t.durationSeconds)}
                        </span>
                        <span className="text-muted-foreground/70">({percentOfTotal}%)</span>
                      </div>
                    </div>

                    {/* Progress Track & Animated Bar */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60 p-0.5">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: percentOfMax + "%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Workflow Status Breakdown (Stacked Proportion Bar & Breakdown) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PieChartIcon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Workflow Status Breakdown
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Overall completion progress across {totalTasks} total tasks
            </p>
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-2 py-2">
            <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted/60 p-0.5 gap-1">
              {completedPct > 0 && (
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: completedPct + "%" }}
                  title={'Completed: ' + completedPct + '%'}
                />
              )}
              {inProgressPct > 0 && (
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: inProgressPct + "%" }}
                  title={'In Progress: ' + inProgressPct + '%'}
                />
              )}
              {pendingPct > 0 && (
                <div
                  className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500"
                  style={{ width: pendingPct + "%" }}
                  title={'Pending: ' + pendingPct + '%'}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-1">
              <span>0%</span>
              <span className="font-semibold text-foreground">{completedPct}% Completed</span>
              <span>100%</span>
            </div>
          </div>

          {/* Detailed Status Breakdown Rows */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-semibold text-foreground">{analytics?.completedTasksCount || 0}</span>
                <span className="text-muted-foreground/70">({completedPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-semibold text-foreground">{analytics?.inProgressTasksCount || 0}</span>
                <span className="text-muted-foreground/70">({inProgressPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground/50" />
                <span className="text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-semibold text-foreground">{analytics?.pendingTasksCount || 0}</span>
                <span className="text-muted-foreground/70">({pendingPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Worked On Breakdown List */}
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
