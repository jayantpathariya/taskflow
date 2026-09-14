"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  ITask,
  TasksListResponse,
  ActiveTimerResponse,
} from "@taskflow/shared";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TaskDialog } from "@/components/dashboard/task-dialog";
import { TaskDetailSheet } from "@/components/dashboard/task-detail-sheet";
import { ActiveTimerWidget } from "@/components/dashboard/active-timer-widget";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Menu, Clock } from "lucide-react";

interface DashboardShellProps {
  children: (props: {
    onOpenCreate: () => void;
    onOpenEdit: (task: ITask) => void;
    onOpenDetail?: (task: ITask) => void;
  }) => React.ReactNode;
  pageTitle: string;
}

export function DashboardShell({ children, pageTitle }: DashboardShellProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<ITask | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Fetch tasks to calculate counts
  const { data: tasksData } = useQuery<TasksListResponse>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await apiClient.get<TasksListResponse>("/tasks");
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch active timer for top indicator
  const { data: timerData } = useQuery<ActiveTimerResponse>({
    queryKey: ["timer", "active"],
    queryFn: async () => {
      const res = await apiClient.get<ActiveTimerResponse>("/timer/active");
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const tasks = tasksData?.tasks;
  const activeTimer = timerData?.activeTimer;

  const taskCounts = useMemo(() => {
    const list = tasks || [];
    return {
      all: list.length,
      pending: list.filter((t) => t.status === "PENDING").length,
      inProgress: list.filter((t) => t.status === "IN_PROGRESS").length,
      completed: list.filter((t) => t.status === "COMPLETED").length,
    };
  }, [tasks]);

  const activeTask = useMemo(() => {
    if (!activeTimer || !tasks) return null;
    const activeId =
      typeof activeTimer.taskId === "object"
        ? activeTimer.taskId.id
        : activeTimer.taskId;
    return tasks.find((t) => t.id === activeId);
  }, [activeTimer, tasks]);

  const detailTask = useMemo(() => {
    if (!detailTaskId || !tasks) return null;
    return tasks.find((t) => t.id === detailTaskId) || null;
  }, [detailTaskId, tasks]);

  if (isLoading || !user) {
    return <LoadingScreen label="Loading TaskFlow..." />;
  }

  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: ITask) => {
    setTaskToEdit(task);
    setIsDialogOpen(true);
  };

  const handleOpenDetail = (task: ITask) => {
    setDetailTaskId(task.id);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar navigation */}
      <Sidebar
        onNewTask={handleOpenCreate}
        taskCounts={taskCounts}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm hidden sm:inline">
                Workspace
              </span>
              <span className="text-muted-foreground hidden sm:inline">/</span>
              <span className="text-sm font-medium text-foreground">
                {pageTitle}
              </span>
            </div>
          </div>

          {/* Active Timer Indicator / Status in Header */}
          {activeTask && (
            <button
              type="button"
              onClick={() => handleOpenDetail(activeTask)}
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
              title="Click to view active task details & sessions"
            >
              <span className="size-2 rounded-full bg-primary animate-ping" />
              <Clock className="size-3.5" />
              <span className="hidden sm:inline">Recording:</span>
              <span className="font-semibold truncate max-w-[140px]">
                {activeTask.title}
              </span>
            </button>
          )}
        </header>

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children({
            onOpenCreate: handleOpenCreate,
            onOpenEdit: handleOpenEdit,
            onOpenDetail: handleOpenDetail,
          })}
        </main>
      </div>

      {/* Create / Edit Dialog */}
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        taskToEdit={taskToEdit}
      />

      {/* Task Detail Slide-over Sheet */}
      <TaskDetailSheet
        task={detailTask}
        open={!!detailTask}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
        onEditTask={handleOpenEdit}
      />

      {/* Floating Active Timer Widget */}
      <ActiveTimerWidget />
    </div>
  );
}
