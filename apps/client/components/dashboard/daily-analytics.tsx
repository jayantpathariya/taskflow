"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { DailySummaryResponse } from "@taskflow/shared";
import {
  Clock,
  CheckCircle2,
  Timer,
  CircleDashed,
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
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-muted/60" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-22 rounded-lg border border-border bg-card/60 p-3.5"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 h-64 rounded-lg border border-border bg-card/60" />
          <div className="lg:col-span-5 h-64 rounded-lg border border-border bg-card/60" />
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
      description: "Recorded duration",
    },
    {
      title: "Completed",
      value: analytics?.completedTasksCount || 0,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      description: "Tasks finished",
    },
    {
      title: "In Progress",
      value: analytics?.inProgressTasksCount || 0,
      icon: Timer,
      color: "text-amber-600 dark:text-amber-400",
      description: "Tasks active",
    },
    {
      title: "Pending",
      value: analytics?.pendingTasksCount || 0,
      icon: CircleDashed,
      color: "text-muted-foreground",
      description: "Tasks waiting",
    },
  ];

  const tasksWorkedOn = analytics?.tasksWorkedOn || [];
  const totalSeconds = analytics?.totalTimeTrackedSeconds || 0;

  const maxTaskDuration = Math.max(
    ...tasksWorkedOn.map((t) => t.durationSeconds),
    1
  );

  const totalTasks =
    (analytics?.completedTasksCount || 0) +
    (analytics?.inProgressTasksCount || 0) +
    (analytics?.pendingTasksCount || 0);

  const completedPct =
    totalTasks > 0
      ? Math.round(((analytics?.completedTasksCount || 0) / totalTasks) * 100)
      : 0;
  const inProgressPct =
    totalTasks > 0
      ? Math.round(((analytics?.inProgressTasksCount || 0) / totalTasks) * 100)
      : 0;
  const pendingPct =
    totalTasks > 0
      ? Math.round(((analytics?.pendingTasksCount || 0) / totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Clean Flush Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Performance & Insights
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily breakdown of recorded focus time, task focus allocation, and
            status breakdown.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground font-mono tabular-nums border border-border/40">
          <Calendar className="size-3 text-muted-foreground/70" />
          <span>{todayStr}</span>
        </div>
      </div>

      {/* Metrics Grid (Utilitarian, High-Density) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-lg border border-border bg-card p-3.5 flex flex-col justify-between h-full transition-colors hover:border-border/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </span>
                <Icon className={`size-3.5 ${card.color}`} />
              </div>

              <div className="mt-2.5">
                <div className="text-xl font-bold font-mono tabular-nums tracking-tight text-foreground">
                  {card.value}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Task Focus Distribution */}
        <div className="lg:col-span-7 rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Task Focus Allocation
              </h3>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/40">
              Total: {formatTotalTime(totalSeconds)}
            </span>
          </div>

          {tasksWorkedOn.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Layers className="size-6 text-muted-foreground/50 mb-1.5" />
              <p className="text-xs font-medium text-foreground">
                No focus time logged today
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Start a timer on any task to record focus sessions here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {tasksWorkedOn.map((t) => {
                const percentOfMax = Math.round(
                  (t.durationSeconds / maxTaskDuration) * 100
                );
                const percentOfTotal =
                  totalSeconds > 0
                    ? Math.round((t.durationSeconds / totalSeconds) * 100)
                    : 0;

                return (
                  <div key={t.taskId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className="font-medium text-foreground truncate max-w-[220px] sm:max-w-xs text-xs"
                        title={t.title}
                      >
                        {t.title}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-muted-foreground shrink-0">
                        <span className="font-semibold text-foreground">
                          {formatTotalTime(t.durationSeconds)}
                        </span>
                        <span className="text-muted-foreground/70">
                          ({percentOfTotal}%)
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${percentOfMax}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Workflow Status Breakdown */}
        <div className="lg:col-span-5 rounded-lg border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PieChartIcon className="size-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workflow Status Breakdown
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Overall completion across {totalTasks} total tasks
            </p>
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-2 py-1">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted gap-0.5">
              {completedPct > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${completedPct}%` }}
                  title={`Completed: ${completedPct}%`}
                />
              )}
              {inProgressPct > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${inProgressPct}%` }}
                  title={`In Progress: ${inProgressPct}%`}
                />
              )}
              {pendingPct > 0 && (
                <div
                  className="h-full bg-muted-foreground/40 transition-all duration-300"
                  style={{ width: `${pendingPct}%` }}
                  title={`Pending: ${pendingPct}%`}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono tabular-nums pt-0.5">
              <span>0%</span>
              <span className="font-semibold text-foreground">
                {completedPct}% Completed
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* Detailed Status Breakdown Rows */}
          <div className="space-y-1.5 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground text-[11px]">
                  Completed
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                <span className="font-semibold text-foreground">
                  {analytics?.completedTasksCount || 0}
                </span>
                <span className="text-muted-foreground/70">
                  ({completedPct}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-amber-500" />
                <span className="text-muted-foreground text-[11px]">
                  In Progress
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                <span className="font-semibold text-foreground">
                  {analytics?.inProgressTasksCount || 0}
                </span>
                <span className="text-muted-foreground/70">
                  ({inProgressPct}%)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-0.5">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                <span className="text-muted-foreground text-[11px]">
                  Pending
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                <span className="font-semibold text-foreground">
                  {analytics?.pendingTasksCount || 0}
                </span>
                <span className="text-muted-foreground/70">
                  ({pendingPct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Worked On Log Table */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tasks Tracked Today
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {tasksWorkedOn.length}{" "}
            {tasksWorkedOn.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {tasksWorkedOn.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Layers className="size-6 text-muted-foreground/50 mb-1.5" />
            <p className="text-xs font-medium text-foreground">
              No sessions logged today
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Start a timer on any task to record focus activity.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {tasksWorkedOn.map((t) => (
              <div
                key={t.taskId}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                  <span
                    className={`size-1.5 rounded-full shrink-0 ${
                      t.status === "COMPLETED"
                        ? "bg-emerald-500"
                        : t.status === "IN_PROGRESS"
                          ? "bg-amber-500"
                          : "bg-muted-foreground/50"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mt-0.2">
                      {t.status.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono tabular-nums text-xs font-semibold text-foreground px-2 py-0.5 rounded border border-border/50 bg-muted/30">
                    {formatTotalTime(t.durationSeconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
