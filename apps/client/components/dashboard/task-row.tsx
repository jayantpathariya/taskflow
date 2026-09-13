"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ITask, TaskStatus } from "@taskflow/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Play,
  Square,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  CircleDashed,
  Timer,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Eye } from "lucide-react";

interface TaskRowProps {
  task: ITask;
  isActiveTimer: boolean;
  onEdit: (task: ITask) => void;
  onSelect?: (task: ITask) => void;
}

export function TaskRow({ task, isActiveTimer, onEdit, onSelect }: TaskRowProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const startTimerMutation = useMutation({
    mutationFn: () => apiClient.post(`/tasks/${task.id}/timer/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "time-logs"] });
      toast.info("Timer started", {
        description: `Tracking focus time for "${task.title}".`,
      });
    },
    onError: () => {
      toast.error("Failed to start timer");
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: () => apiClient.post(`/tasks/${task.id}/timer/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "time-logs"] });
      toast.success("Timer stopped", {
        description: `Logged session duration for "${task.title}".`,
      });
    },
    onError: () => {
      toast.error("Failed to stop timer");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: TaskStatus) =>
      apiClient.put(`/tasks/${task.id}`, { status: newStatus }),
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
        description: `"${task.title}" moved to ${statusLabel}.`,
      });
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => apiClient.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.error("Task deleted", {
        description: `"${task.title}" has been deleted.`,
      });
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  const isTimerBusy =
    startTimerMutation.isPending || stopTimerMutation.isPending;

  const formatDuration = (totalSeconds: number = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleToggleComplete = () => {
    const nextStatus: TaskStatus =
      task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    updateStatusMutation.mutate(nextStatus);
  };

  return (
    <div
      className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border transition-colors ${
        isActiveTimer
          ? "bg-primary/5 border-primary/40 shadow-xs"
          : "bg-card border-border hover:border-border/90 hover:bg-muted/40"
      }`}
    >
      {/* Left side: Status checkbox & Title/Description */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={handleToggleComplete}
          disabled={updateStatusMutation.isPending}
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
          title={
            task.status === "COMPLETED"
              ? "Mark as pending"
              : "Mark as completed"
          }
        >
          {task.status === "COMPLETED" ? (
            <CheckCircle2 className="size-4.5 text-primary fill-primary/20" />
          ) : task.status === "IN_PROGRESS" ? (
            <Timer className="size-4.5 text-amber-500" />
          ) : (
            <CircleDashed className="size-4.5 hover:stroke-primary" />
          )}
        </button>

        <div
          onClick={() => onSelect?.(task)}
          className="min-w-0 flex-1 cursor-pointer group/title"
          title="Click to view details and time logs"
        >
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-xs sm:text-sm truncate group-hover/title:text-primary transition-colors ${
                task.status === "COMPLETED"
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </span>

            {isActiveTimer && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Recording
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5 max-w-xl">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Status indicator, Time Tracked, Timer Button, Actions Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Compact Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs min-w-20">
          <span
            className={`size-1.5 rounded-full ${
              task.status === "COMPLETED"
                ? "bg-emerald-500"
                : task.status === "IN_PROGRESS"
                ? "bg-amber-500"
                : "bg-muted-foreground/50"
            }`}
          />
          <span className="text-muted-foreground text-[11px]">
            {task.status === "IN_PROGRESS"
              ? "In Progress"
              : task.status === "COMPLETED"
              ? "Completed"
              : "Pending"}
          </span>
        </div>

        {/* Time Tracked (Tabular Monospace) */}
        <div
          className="flex items-center gap-1 text-xs text-muted-foreground min-w-14 justify-end font-mono tabular-nums"
          title="Total time spent"
        >
          <Clock className="size-3 text-muted-foreground/70" />
          <span>{formatDuration(task.totalTimeSpentSeconds)}</span>
        </div>

        {/* 1-Click Timer Toggle Button */}
        {isActiveTimer ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => stopTimerMutation.mutate()}
            disabled={isTimerBusy}
            className="h-7 gap-1 px-2.5 text-xs font-medium shrink-0"
          >
            <Square className="size-3 fill-current" />
            <span className="hidden md:inline">Stop</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => startTimerMutation.mutate()}
            disabled={isTimerBusy || task.status === "COMPLETED"}
            className="h-7 gap-1 px-2.5 text-xs font-medium shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
            <Play className="size-3 fill-current" />
            <span className="hidden md:inline">Start</span>
          </Button>
        )}

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground shrink-0 size-8"
              />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onClick={() => onSelect?.(task)} className="gap-2 whitespace-nowrap">
              <Eye className="size-3.5" />
              <span>View Details</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2 whitespace-nowrap">
              <Pencil className="size-3.5" />
              <span>Edit</span>
            </DropdownMenuItem>

            {task.status !== "PENDING" && (
              <DropdownMenuItem
                onClick={() => updateStatusMutation.mutate("PENDING")}
                className="gap-2 whitespace-nowrap"
              >
                <CircleDashed className="size-3.5" />
                <span>Mark as Pending</span>
              </DropdownMenuItem>
            )}

            {task.status !== "IN_PROGRESS" && (
              <DropdownMenuItem
                onClick={() => updateStatusMutation.mutate("IN_PROGRESS")}
                className="gap-2 whitespace-nowrap"
              >
                <Timer className="size-3.5" />
                <span>Mark as In Progress</span>
              </DropdownMenuItem>
            )}

            {task.status !== "COMPLETED" && (
              <DropdownMenuItem
                onClick={() => updateStatusMutation.mutate("COMPLETED")}
                className="gap-2 whitespace-nowrap"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Mark as Completed</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{task.title}&rdquo;? This action cannot be undone and will permanently remove all associated time logs.
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
                onClick={() => {
                  deleteTaskMutation.mutate(undefined, {
                    onSuccess: () => setIsDeleteDialogOpen(false),
                  });
                }}
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
      </div>
    </div>
  );
}
