"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ITask, TaskStatus } from "@taskflow/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface TaskRowProps {
  task: ITask;
  isActiveTimer: boolean;
  onEdit: (task: ITask) => void;
}

export function TaskRow({ task, isActiveTimer, onEdit }: TaskRowProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const startTimerMutation = useMutation({
    mutationFn: () => apiClient.post(`/tasks/${task.id}/timer/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: () => apiClient.post(`/tasks/${task.id}/timer/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: TaskStatus) =>
      apiClient.put(`/tasks/${task.id}`, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => apiClient.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
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
      className={`group flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 ${
        isActiveTimer
          ? "bg-primary/5 border-primary/40 shadow-xs"
          : "bg-card border-border hover:border-border/80 hover:bg-muted/30"
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
            <CheckCircle2 className="size-5 text-primary fill-primary/20" />
          ) : task.status === "IN_PROGRESS" ? (
            <Timer className="size-5 text-amber-500" />
          ) : (
            <CircleDashed className="size-5 hover:stroke-primary" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-sm truncate ${
                task.status === "COMPLETED"
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </span>

            {isActiveTimer && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Active
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Status Badge, Time Tracked, Timer Button, Actions Dropdown */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Status Badge */}
        <Badge
          variant={
            task.status === "COMPLETED"
              ? "default"
              : task.status === "IN_PROGRESS"
              ? "secondary"
              : "outline"
          }
          className="hidden sm:inline-flex text-[11px] font-medium"
        >
          {task.status === "IN_PROGRESS"
            ? "In Progress"
            : task.status === "COMPLETED"
            ? "Completed"
            : "Pending"}
        </Badge>

        {/* Time Tracked */}
        <div
          className="flex items-center gap-1 text-xs text-muted-foreground min-w-16 justify-end font-mono"
          title="Total time spent"
        >
          <Clock className="size-3 text-muted-foreground" />
          <span>{formatDuration(task.totalTimeSpentSeconds)}</span>
        </div>

        {/* 1-Click Timer Toggle Button */}
        {isActiveTimer ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => stopTimerMutation.mutate()}
            disabled={isTimerBusy}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium shrink-0"
          >
            <Square className="size-3.5 fill-current" />
            <span className="hidden md:inline">Stop</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => startTimerMutation.mutate()}
            disabled={isTimerBusy || task.status === "COMPLETED"}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          >
            <Play className="size-3.5 fill-current" />
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
