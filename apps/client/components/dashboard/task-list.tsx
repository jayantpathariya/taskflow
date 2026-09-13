"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ITask, TasksListResponse } from "@taskflow/shared";
import { TaskRow } from "./task-row";
import { TaskDialog } from "./task-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  ListTodo,
  Loader2,
  Search,
  SlidersHorizontal,
  Clock,
} from "lucide-react";

interface ActiveTimerResponse {
  timer: {
    id: string;
    taskId: string;
    startTime: string;
  } | null;
}

interface TaskListProps {
  currentFilter: string;
  onOpenCreate: () => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  taskToEdit: ITask | null;
  setTaskToEdit: (task: ITask | null) => void;
  onCountsUpdate?: (counts: {
    all: number;
    pending: number;
    inProgress: number;
    completed: number;
  }) => void;
}

export function TaskList({
  currentFilter,
  onOpenCreate,
  isDialogOpen,
  setIsDialogOpen,
  taskToEdit,
  setTaskToEdit,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all tasks without filter for counts and filter client-side or by query
  const { data: allTasksData, isLoading: tasksLoading } = useQuery<TasksListResponse>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await apiClient.get<TasksListResponse>("/tasks");
      return res.data;
    },
  });

  const { data: timerData } = useQuery<ActiveTimerResponse>({
    queryKey: ["timer", "active"],
    queryFn: async () => {
      const res = await apiClient.get<ActiveTimerResponse>("/timer/active");
      return res.data;
    },
    refetchInterval: 5000,
  });

  const activeTaskId = timerData?.timer?.taskId;

  const handleOpenEdit = (task: ITask) => {
    setTaskToEdit(task);
    setIsDialogOpen(true);
  };

  // Filter tasks based on status and search
  const filteredTasks = useMemo(() => {
    const tasks = allTasksData?.tasks || [];
    return tasks.filter((task) => {
      const matchesStatus =
        currentFilter === "ALL" || task.status === currentFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [allTasksData?.tasks, currentFilter, searchQuery]);

  const viewTitle =
    currentFilter === "PENDING"
      ? "Pending Tasks"
      : currentFilter === "IN_PROGRESS"
      ? "In Progress Tasks"
      : currentFilter === "COMPLETED"
      ? "Completed Tasks"
      : "All Tasks";

  return (
    <div className="space-y-4">
      {/* List Header / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{viewTitle}</h2>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>
          <Button
            size="sm"
            onClick={onOpenCreate}
            className="h-8 gap-1.5 px-3 text-xs font-medium shrink-0"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>

      {/* Task Rows List */}
      {tasksLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Loading tasks...</span>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <ListTodo className="size-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery ? "No matching tasks" : "No tasks in this view"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            {searchQuery
              ? `No tasks matched your search query "${searchQuery}".`
              : currentFilter === "ALL"
              ? "You haven't created any tasks yet. Get started by adding a task or generating one with AI."
              : `There are currently no tasks with status "${currentFilter}".`}
          </p>
          <Button size="sm" onClick={onOpenCreate} className="h-8 gap-1.5 text-xs font-medium">
            <Plus className="size-3.5" />
            <span>Create Task</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isActiveTimer={activeTaskId === task.id}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
