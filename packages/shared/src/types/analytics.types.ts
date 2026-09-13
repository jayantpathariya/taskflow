import type { TaskStatus } from "./task.types.js";

export interface DailyWorkedTask {
  taskId: string;
  title: string;
  status: TaskStatus;
  durationSeconds: number;
}

export interface DailySummaryResponse {
  date: string; // YYYY-MM-DD
  totalTimeTrackedSeconds: number;
  completedTasksCount: number;
  inProgressTasksCount: number;
  pendingTasksCount: number;
  tasksWorkedOn: DailyWorkedTask[];
}
