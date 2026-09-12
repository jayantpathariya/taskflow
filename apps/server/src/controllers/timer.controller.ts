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
    const task = await Task.findOne({
      _id: taskId,
      userId: userId,
    });

    if (!task) {
      res.status(status.NOT_FOUND).json({ error: "Task not found" });
      return;
    }

    // Check if this task already has a running timer
    const existingRunning = await TimeLog.findOne({
      taskId: taskId,
      userId: userId,
      isRunning: true,
    });

    if (existingRunning) {
      res.status(status.CONFLICT).json({
        error: "A timer is already running for this task",
        timeLog: existingRunning.toJSON(),
      });
      return;
    }

    // Stop any OTHER currently running timers for this user (only 1 active timer allowed at a time)
    const runningTimers = await TimeLog.find({
      userId: userId,
      isRunning: true,
    });

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

    // Automatically transition task status to IN_PROGRESS if it was PENDING
    if (task.status === "PENDING") {
      task.status = "IN_PROGRESS";
      await task.save();
    }

    // Start new time log
    const timeLog = await TimeLog.create({
      taskId: taskId,
      userId: userId,
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

    // Find active running timer for this task
    const runningTimer = await TimeLog.findOne({
      taskId: taskId,
      userId: userId,
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
