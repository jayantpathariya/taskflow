import type { Request, Response, NextFunction } from "express";
import { status } from "http-status";
import mongoose from "mongoose";
import { Task } from "../models/task.model.js";
import { TimeLog } from "../models/timeLog.model.js";

export const startTimer = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: taskId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

    // Verify task exists and belongs to this user
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      res.status(status.NOT_FOUND).json({ error: "Task not found" });
      return;
    }

    // Check if this task already has a running timer
    const existingRunning = await TimeLog.findOne({
      taskId,
      userId,
      isRunning: true,
    });

    if (existingRunning) {
      res.status(status.CONFLICT).json({
        error: "A timer is already running for this task",
        timeLog: existingRunning.toJSON(),
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
    }

    // Automatically transition task status to IN_PROGRESS if PENDING
    if (task.status === "PENDING") {
      task.status = "IN_PROGRESS";
      await task.save();
    }

    // Start new time log
    const timeLog = await TimeLog.create({
      taskId,
      userId,
      startTime: now,
      isRunning: true,
    });

    res.status(status.CREATED).json({
      timeLog: timeLog.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const stopTimer = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: taskId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

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

    res.status(status.OK).json({
      timeLog: runningTimer.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveTimer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

    const activeTimer = await TimeLog.findOne({
      userId,
      isRunning: true,
    }).populate("taskId", "title status");

    res.status(status.OK).json({ activeTimer });
  } catch (error) {
    next(error);
  }
};

export const getTaskTimeLogs = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: taskId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

    const logs = await TimeLog.find({ taskId, userId }).sort({ startTime: -1 });

    const totalDurationSeconds = logs.reduce(
      (sum, log) => sum + (log.durationSeconds || 0),
      0
    );

    res.status(status.OK).json({
      timeLogs: logs.map((log) => log.toJSON()),
      totalDurationSeconds,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUserTimeLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

    const logs = await TimeLog.find({ userId }).sort({ startTime: -1 });

    const totalDurationSeconds = logs.reduce(
      (sum, log) => sum + (log.durationSeconds || 0),
      0
    );

    res.status(status.OK).json({
      timeLogs: logs.map((log) => log.toJSON()),
      totalDurationSeconds,
    });
  } catch (error) {
    next(error);
  }
};
