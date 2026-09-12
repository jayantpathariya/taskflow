import type { ITask } from "./task.types.js";

export interface ITimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string | null;
  durationSeconds: number;
  isRunning: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTimerInfo extends ITimeLog {
  task: Pick<ITask, "id" | "title" | "status">;
}

export interface ActiveTimerResponse {
  activeTimer: ActiveTimerInfo | null;
}

export interface TimeLogResponse {
  timeLog: ITimeLog;
}

export interface TimeLogsListResponse {
  timeLogs: ITimeLog[];
  totalDurationSeconds: number;
}
