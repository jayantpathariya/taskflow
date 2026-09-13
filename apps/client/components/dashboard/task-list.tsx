"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ITask, TasksListResponse, ActiveTimerResponse } from "@taskflow/shared";
import { TaskRow } from "./task-row";
import { TaskDetailSheet } from "./task-detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ListTodo, Loader2, Search, X as ClearIcon, ArrowUpDown } from "lucide-react";

type SortOption = "newest" | "oldest" | "time";

interface TaskListProps {
  currentFilter: "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED";
  onOpenCreate: () => void;
  onOpenEdit: (task: ITask) => void;
  onOpenDetail?: (task: ITask) => void;
}

export function TaskList({
  currentFilter,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Fetch all tasks
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

  const activeTaskId =
    timerData?.activeTimer &&
    (typeof timerData.activeTimer.taskId === "object"
      ? timerData.activeTimer.taskId.id
      : (timerData.activeTimer.taskId as string));

  // Filter tasks based on status and search query, then sort
  const filteredAndSortedTasks = useMemo(() => {
    const tasks = allTasksData?.tasks || [];
    const filtered = tasks.filter((task) => {
      const matchesStatus =
        currentFilter === "ALL" || task.status === currentFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "time") {
        return (b.totalTimeSpentSeconds || 0) - (a.totalTimeSpentSeconds || 0);
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allTasksData?.tasks, currentFilter, searchQuery, sortBy]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return allTasksData?.tasks.find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, allTasksData?.tasks]);

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
      {/* Clean Un-nested Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-foreground tracking-tight">{viewTitle}</h2>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md border border-border/40">
            {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Bar with clear button */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear search"
              >
                <ClearIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-2.5 size-3 text-muted-foreground pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-8 pl-7 pr-2.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              title="Sort tasks"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="time">Most time spent</option>
            </select>
          </div>

          {/* Add Task Button */}
          <Button
            size="sm"
            onClick={onOpenCreate}
            className="h-8 gap-1.5 px-3 text-xs font-medium shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Add Task</span>
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
      ) : filteredAndSortedTasks.length === 0 ? (
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
          {filteredAndSortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isActiveTimer={activeTaskId === task.id}
              onEdit={onOpenEdit}
              onSelect={onOpenDetail ? onOpenDetail : (t) => setSelectedTaskId(t.id)}
            />
          ))}
        </div>
      )}

      {/* Fallback Task Detail Slide-over Sheet (if parent did not provide onOpenDetail) */}
      {!onOpenDetail && (
        <TaskDetailSheet
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          onEditTask={onOpenEdit}
        />
      )}
    </div>
  );
}
