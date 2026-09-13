import type { Request, Response } from "express";
import { status } from "http-status";
import { Task } from "../models/task.model.js";
import { TimeLog } from "../models/timeLog.model.js";
import { generateTaskSuggestion } from "../services/ai.service.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  AiTaskSuggestionInput,
} from "@taskflow/shared";

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { status: statusFilter } = req.query;

  const filter: Record<string, any> = { userId };
  if (
    statusFilter &&
    ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(statusFilter as string)
  ) {
    filter.status = statusFilter;
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 });

  // Calculate accumulated time for tasks from TimeLogs if totalTimeSpentSeconds is missing or unsynced
  const taskIds = tasks.map((t) => t._id);
  const durationAgg = await TimeLog.aggregate([
    { $match: { taskId: { $in: taskIds } } },
    { $group: { _id: "$taskId", totalDuration: { $sum: "$durationSeconds" } } },
  ]);

  const durationMap = new Map<string, number>(
    durationAgg.map((d: any) => [d._id.toString(), d.totalDuration])
  );

  const tasksWithTotal = tasks.map((task) => {
    const taskObj = task.toJSON();
    const loggedSeconds = durationMap.get(task._id.toString()) || 0;
    taskObj.totalTimeSpentSeconds = Math.max(
      taskObj.totalTimeSpentSeconds || 0,
      loggedSeconds
    );
    return taskObj;
  });

  res
    .status(status.OK)
    .json({ tasks: tasksWithTotal, total: tasksWithTotal.length });
};

export const getTaskById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.userId!;

  const task = await Task.findOne({ _id: id, userId });
  if (!task) {
    res.status(status.NOT_FOUND).json({ error: "Task not found" });
    return;
  }

  const durationAgg = await TimeLog.aggregate([
    { $match: { taskId: task._id } },
    { $group: { _id: "$taskId", totalDuration: { $sum: "$durationSeconds" } } },
  ]);

  const taskObj = task.toJSON();
  const loggedSeconds = durationAgg[0]?.totalDuration || 0;
  taskObj.totalTimeSpentSeconds = Math.max(
    taskObj.totalTimeSpentSeconds || 0,
    loggedSeconds
  );

  res.status(status.OK).json({ task: taskObj });
};

export const createTask = async (
  req: Request<unknown, unknown, CreateTaskInput>,
  res: Response
): Promise<void> => {
  const userId = req.userId!;
  const { title, description, status: taskStatus } = req.body;

  const task = await Task.create({
    userId,
    title,
    description,
    status: taskStatus || "PENDING",
  });

  res.status(status.CREATED).json({ task });
};

export const updateTask = async (
  req: Request<{ id: string }, unknown, UpdateTaskInput>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.userId!;

  // If status is being changed to COMPLETED, stop any running timer for this task
  if (req.body.status === "COMPLETED") {
    const runningTimer = await TimeLog.findOne({
      taskId: id,
      userId,
      isRunning: true,
    });

    if (runningTimer) {
      const now = new Date();
      const elapsedSeconds = Math.max(
        0,
        Math.round((now.getTime() - runningTimer.startTime.getTime()) / 1000)
      );
      runningTimer.endTime = now;
      runningTimer.durationSeconds = elapsedSeconds;
      runningTimer.isRunning = false;
      await runningTimer.save();

      // Accumulate total time spent on task
      await Task.findOneAndUpdate(
        { _id: id, userId },
        { $inc: { totalTimeSpentSeconds: elapsedSeconds } }
      );
    }
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, userId },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!task) {
    res.status(status.NOT_FOUND).json({ error: "Task not found" });
    return;
  }

  res.status(status.OK).json({ task });
};

export const deleteTask = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const userId = req.userId!;

  // Stop running timer if any before deletion
  const runningTimer = await TimeLog.findOne({
    taskId: id,
    userId,
    isRunning: true,
  });
  if (runningTimer) {
    const now = new Date();
    runningTimer.endTime = now;
    runningTimer.durationSeconds = Math.max(
      0,
      Math.round((now.getTime() - runningTimer.startTime.getTime()) / 1000)
    );
    runningTimer.isRunning = false;
    await runningTimer.save();
  }

  const task = await Task.findOneAndDelete({ _id: id, userId });
  if (!task) {
    res.status(status.NOT_FOUND).json({ error: "Task not found" });
    return;
  }

  res.status(status.OK).json({ message: "Task deleted successfully" });
};

export const suggestTask = async (
  req: Request<unknown, unknown, AiTaskSuggestionInput>,
  res: Response
): Promise<void> => {
  const { prompt } = req.body;
  const suggestion = await generateTaskSuggestion(prompt);
  res.status(status.OK).json(suggestion);
};
