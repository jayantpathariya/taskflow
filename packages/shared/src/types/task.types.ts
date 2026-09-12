export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface ITask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  totalTimeSpentSeconds?: number;
}
