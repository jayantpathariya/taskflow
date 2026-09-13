"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { apiClient } from "@/lib/api";
import type {
  ITask,
  TaskStatus,
  TimeLogsListResponse,
  ActiveTimerResponse,
} from "@taskflow/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  X,
  Play,
  Square,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Timer,
  History,
  Loader2,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TaskDetailSheetProps {
  task: ITask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTask: (task: ITask) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onEditTask,
}: TaskDetailSheetProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch individual time logs for this specific task
  const { data: logsData, isLoading: logsLoading } =
    useQuery<TimeLogsListResponse>({
      queryKey: ["tasks", task?.id, "time-logs"],
      queryFn: async () => {
        if (!task?.id) return { timeLogs: [], totalDurationSeconds: 0 };
        const res = await apiClient.get<TimeLogsListResponse>(
          `/tasks/${task.id}/time-logs`
        );
        return res.data;
      },
      enabled: !!task?.id && open,
      refetchInterval: 5000,
    });

  // Query active timer to check if this task is currently being timed
  const { data: activeTimerData } = useQuery<ActiveTimerResponse>({
    queryKey: ["timer", "active"],
    queryFn: async () => {
      const res = await apiClient.get<ActiveTimerResponse>("/timer/active");
      return res.data;
    },
    enabled: open,
    refetchInterval: 3000,
  });

  const activeTimer = activeTimerData?.activeTimer;
  const isTimerActiveForThisTask =
    !!activeTimer &&
    (typeof activeTimer.taskId === "object"
      ? activeTimer.taskId.id === task?.id
      : activeTimer.taskId === task?.id);

  // Mutations
  const startTimerMutation = useMutation({
    mutationFn: () => apiClient.post(`/tasks/${task?.id}/timer/start`),
    onSuccess: (res) => {
      const timeLog = res.data?.timeLog;
      if (timeLog && task) {
        queryClient.setQueryData(["timer", "active"], {
          activeTimer: {
            ...timeLog,
            taskId: { id: task.id, title: task.title, status: task.status },
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({
        queryKey: ["tasks", task?.id, "time-logs"],
      });
      toast.info("Timer started", {
        description: `Tracking focus time for "${task?.title}".`,
      });
    },
    onError: () => {
      toast.error("Failed to start timer");
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: () => apiClient.post(`/tasks/${task?.id}/timer/stop`),
    onSuccess: () => {
      queryClient.setQueryData(["timer", "active"], { activeTimer: null });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({
        queryKey: ["tasks", task?.id, "time-logs"],
      });
      toast.success("Timer stopped", {
        description: `Logged session duration for "${task?.title}".`,
      });
    },
    onError: () => {
      toast.error("Failed to stop timer");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: TaskStatus) =>
      apiClient.put(`/tasks/${task?.id}`, { status: newStatus }),
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      const statusLabel =
        newStatus === "COMPLETED"
          ? "Completed"
          : newStatus === "IN_PROGRESS"
            ? "In Progress"
            : "Pending";
      toast.success("Status updated", {
        description: `"${task?.title}" moved to ${statusLabel}.`,
      });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => apiClient.delete(`/tasks/${task?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
      toast.error("Task deleted", {
        description: `"${task?.title}" and associated time logs were removed.`,
      });
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  if (!task) return null;

  const isTimerBusy =
    startTimerMutation.isPending || stopTimerMutation.isPending;

  const formatDuration = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatShortDuration = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0)
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    return `${seconds}s`;
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const timeLogs = logsData?.timeLogs || [];
  const totalTrackedSeconds =
    logsData?.totalDurationSeconds ?? (task.totalTimeSpentSeconds || 0);

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />

          <DialogPrimitive.Popup className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-lg flex-col bg-card text-card-foreground border-l border-border shadow-2xl duration-200 outline-none data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right">
            {/* Top Action Bar */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Task Details
                </span>
                {isTimerActiveForThisTask && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    Recording
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onEditTask(task)}
                  title="Edit task"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title="Delete task"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </Button>
                <DialogPrimitive.Close
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-foreground ml-1"
                    />
                  }
                >
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Title & Status Selector */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
                  {task.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground font-medium mr-1">
                    Status:
                  </span>
                  {(
                    ["PENDING", "IN_PROGRESS", "COMPLETED"] as TaskStatus[]
                  ).map((status) => {
                    const isSelected = task.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatusMutation.mutate(status)}
                        disabled={updateStatusMutation.isPending}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold"
                              : status === "IN_PROGRESS"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold"
                                : "bg-primary/15 text-primary border border-primary/30 font-semibold"
                            : "border border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        {status === "COMPLETED" && (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {status === "IN_PROGRESS" && (
                          <Timer className="size-3.5" />
                        )}
                        {status === "PENDING" && (
                          <CircleDashed className="size-3.5" />
                        )}
                        <span>
                          {status === "COMPLETED"
                            ? "Completed"
                            : status === "IN_PROGRESS"
                              ? "In Progress"
                              : "Pending"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timer Control Card */}
              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Focus Time Tracker
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Total spent: {formatDuration(totalTrackedSeconds)}
                      </span>
                    </div>
                  </div>

                  {isTimerActiveForThisTask ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => stopTimerMutation.mutate()}
                      disabled={isTimerBusy}
                      className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
                    >
                      <Square className="size-3.5 fill-current" />
                      <span>Stop Timer</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => startTimerMutation.mutate()}
                      disabled={isTimerBusy || task.status === "COMPLETED"}
                      className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
                    >
                      <Play className="size-3.5 fill-current" />
                      <span>Start Timer</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </span>
                <div className="rounded-2xl border border-border bg-card p-4 text-xs text-foreground leading-relaxed min-h-[70px]">
                  {task.description ? (
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description provided. Click the edit icon above to add
                      context.
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata Section */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium mb-1">
                    <Calendar className="size-3.5" />
                    <span>Created</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {formatDate(task.createdAt)}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium mb-1">
                    <Layers className="size-3.5" />
                    <span>Total Sessions</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground font-mono">
                    {timeLogs.length}{" "}
                    {timeLogs.length === 1 ? "session" : "sessions"}
                  </p>
                </div>
              </div>

              {/* Session History (GET /api/v1/tasks/:id/time-logs) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Session Logs for this Task
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    {formatShortDuration(totalTrackedSeconds)}
                  </span>
                </div>

                {logsLoading ? (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-card">
                    <Loader2 className="size-5 animate-spin text-primary" />
                  </div>
                ) : timeLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
                    <Clock className="size-7 text-muted-foreground/60 mb-2" />
                    <p className="text-xs font-semibold text-foreground">
                      No time logged on this task yet
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                      Click &ldquo;Start Timer&rdquo; to begin tracking your
                      focused effort on this task.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {timeLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                          log.isRunning
                            ? "bg-primary/5 border-primary/40 shadow-xs"
                            : "bg-card border-border hover:border-border/80"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {formatDate(log.startTime)}
                            </span>
                            {log.isRunning && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono mt-0.5">
                            <span>{formatTime(log.startTime)}</span>
                            {log.endTime ? (
                              <>
                                <ArrowRight className="size-3 text-muted-foreground/50" />
                                <span>{formatTime(log.endTime)}</span>
                              </>
                            ) : (
                              <span className="text-primary font-sans">
                                (in progress)
                              </span>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant={log.isRunning ? "default" : "outline"}
                          className="font-mono text-xs font-semibold shrink-0"
                        >
                          {log.isRunning
                            ? "Timing..."
                            : formatDuration(log.durationSeconds)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{task.title}&rdquo;? This
              will permanently remove the task and all {timeLogs.length}{" "}
              associated focus logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTaskMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteTaskMutation.mutate()}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
