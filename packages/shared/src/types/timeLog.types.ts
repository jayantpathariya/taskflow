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

export interface ActiveTimerInfo extends Omit<ITimeLog, "taskId"> {
  taskId: Pick<ITask, "id" | "title" | "status">;
}

export interface ActiveTimerResponse {
  activeTimer: ActiveTimerInfo | null;
}

export interface TimeLogResponse {
  timeLog: ITimeLog;
}

export interface ITimeLogItem extends Omit<ITimeLog, "taskId"> {
  taskId: Pick<ITask, "id" | "title" | "status"> | string;
}

export interface TimeLogsListResponse {
  timeLogs: ITimeLogItem[];
  totalDurationSeconds: number;
}
