import type { Request, Response } from "express";
import { status } from "http-status";
import { Task } from "../models/task.model.js";
import { TimeLog } from "../models/timeLog.model.js";

export const startTimer = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id: taskId } = req.params;
  const userId = req.userId!;

  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    res.status(status.NOT_FOUND).json({ error: "Task not found" });
    return;
  }

  const existingRunning = await TimeLog.findOne({
    taskId,
    userId,
    isRunning: true,
  });

  if (existingRunning) {
    res.status(status.CONFLICT).json({
      error: "A timer is already running for this task",
      timeLog: existingRunning,
    });
    return;
  }

  // Stop any other currently running timers for this user
  const runningTimers = await TimeLog.find({ userId, isRunning: true });
  const now = new Date();

  for (const running of runningTimers) {
    const elapsedSeconds = Math.max(
      0,
      Math.round((now.getTime() - running.startTime.getTime()) / 1000)
    );
    running.endTime = now;
    running.durationSeconds = elapsedSeconds;
    running.isRunning = false;
    await running.save();

    // Accumulate total time spent on the previously timed task
    await Task.findOneAndUpdate(
      { _id: running.taskId, userId },
      { $inc: { totalTimeSpentSeconds: elapsedSeconds } }
    );
  }

  if (task.status === "PENDING") {
    task.status = "IN_PROGRESS";
    await task.save();
  }

  const timeLog = await TimeLog.create({
    taskId,
    userId,
    startTime: now,
    isRunning: true,
  });

  res.status(status.CREATED).json({
    timeLog,
    serverTime: now.toISOString(),
  });
};

export const stopTimer = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id: taskId } = req.params;
  const userId = req.userId!;

  const runningTimer = await TimeLog.findOne({
    taskId,
    userId,
    isRunning: true,
  });

  if (!runningTimer) {
    res.status(status.NOT_FOUND).json({
      error: "No active running timer found for this task",
    });
    return;
  }

  const now = new Date();
  const elapsedSeconds = Math.max(
    0,
    Math.round((now.getTime() - runningTimer.startTime.getTime()) / 1000)
  );

  runningTimer.endTime = now;
  runningTimer.durationSeconds = elapsedSeconds;
  runningTimer.isRunning = false;
  await runningTimer.save();

  // Accumulate total time spent on this task
  await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { $inc: { totalTimeSpentSeconds: elapsedSeconds } }
  );

  res.status(status.OK).json({
    timeLog: runningTimer,
    serverTime: now.toISOString(),
  });
};

export const getActiveTimer = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId!;

  const activeTimer = await TimeLog.findOne({ userId, isRunning: true })
    .sort({ startTime: -1 })
    .populate("taskId", "title status");

  res.status(status.OK).json({
    activeTimer,
    serverTime: new Date().toISOString(),
  });
};

export const getTaskTimeLogs = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id: taskId } = req.params;
  const userId = req.userId!;

  const logs = await TimeLog.find({ taskId, userId }).sort({ startTime: -1 });

  const totalDurationSeconds = logs.reduce(
    (sum, log: any) => sum + (log.durationSeconds || 0),
    0
  );

  res.status(status.OK).json({
    timeLogs: logs,
    totalDurationSeconds,
  });
};

export const getAllUserTimeLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.userId!;

  const logs = await TimeLog.find({ userId })
    .populate("taskId", "title status")
    .sort({ startTime: -1 });

  const totalDurationSeconds = logs.reduce(
    (sum, log: any) => sum + (log.durationSeconds || 0),
    0
  );

  res.status(status.OK).json({
    timeLogs: logs,
    totalDurationSeconds,
  });
};
