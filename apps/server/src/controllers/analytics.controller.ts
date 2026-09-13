import type { Request, Response } from "express";
import { status } from "http-status";
import { Task } from "../models/task.model.js";
import { TimeLog } from "../models/timeLog.model.js";
import type {
  DailyWorkedTask,
  DailySummaryResponse,
  TaskStatus,
} from "@taskflow/shared";

export const getDailySummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId!;

  // Parse target date from query (default to today)
  const dateParam = typeof req.query.date === "string" ? req.query.date : null;
  const targetDate = dateParam ? new Date(dateParam) : new Date();

  // Define start and end of the day (UTC)
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Fetch all time logs that started on this day for the user
  const timeLogs = await TimeLog.find({
    userId,
    startTime: { $gte: startOfDay, $lte: endOfDay },
  }).populate("taskId", "title status");

  // 2. Aggregate time tracked per task and total time tracked today
  let totalTimeTrackedSeconds = 0;
  const taskMap = new Map<string, DailyWorkedTask>();

  const now = new Date();

  for (const log of timeLogs) {
    const task = log.taskId as any;
    if (!task) continue;

    // Calculate effective duration (if running, count up to now/endOfDay)
    let duration = log.durationSeconds || 0;
    if (log.isRunning) {
      const liveEnd = now < endOfDay ? now : endOfDay;
      duration = Math.max(
        0,
        Math.round((liveEnd.getTime() - log.startTime.getTime()) / 1000)
      );
    }

    totalTimeTrackedSeconds += duration;

    const taskIdStr = task._id.toString();
    const existing = taskMap.get(taskIdStr);

    if (existing) {
      existing.durationSeconds += duration;
    } else {
      taskMap.set(taskIdStr, {
        taskId: taskIdStr,
        title: task.title,
        status: task.status as TaskStatus,
        durationSeconds: duration,
      });
    }
  }

  // 3. Count user's tasks by status (Completed, In Progress, Pending)
  const [completedTasksCount, inProgressTasksCount, pendingTasksCount] =
    await Promise.all([
      Task.countDocuments({ userId, status: "COMPLETED" }),
      Task.countDocuments({ userId, status: "IN_PROGRESS" }),
      Task.countDocuments({ userId, status: "PENDING" }),
    ]);

  const dateString = startOfDay.toISOString().split("T")[0]!;

  const response: DailySummaryResponse = {
    date: dateString,
    totalTimeTrackedSeconds,
    completedTasksCount,
    inProgressTasksCount,
    pendingTasksCount,
    tasksWorkedOn: Array.from(taskMap.values()),
  };

  res.status(status.OK).json(response);
};
