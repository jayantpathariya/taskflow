import type { Request, Response, NextFunction } from "express";
import { status } from "http-status";
import mongoose from "mongoose";
import { Task } from "../models/task.model.js";
import type { CreateTaskInput, UpdateTaskInput } from "@taskflow/shared";

export const getTasks = async (
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

    const { status: statusFilter } = req.query;
    const filter: Record<string, any> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (
      statusFilter &&
      ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(statusFilter as string)
    ) {
      filter.status = statusFilter;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(status.OK).json({
      tasks: tasks.map((t) => t.toJSON()),
      total: tasks.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!task) {
      res.status(status.NOT_FOUND).json({
        error: "Task not found",
      });
      return;
    }

    res.status(status.OK).json({
      task: task.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: Request<unknown, unknown, CreateTaskInput>,
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

    const { title, description, status: taskStatus } = req.body;

    const task = await Task.create({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      description,
      status: taskStatus,
    });

    res.status(status.CREATED).json({
      task: task.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request<{ id: string }, unknown, UpdateTaskInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

    const updates = req.body;

    const task = await Task.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) {
      res.status(status.NOT_FOUND).json({
        error: "Task not found",
      });
      return;
    }

    res.status(status.OK).json({
      task: task.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res
        .status(status.UNAUTHORIZED)
        .json({ error: "Authentication required" });
      return;
    }

    const task = await Task.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!task) {
      res.status(status.NOT_FOUND).json({
        error: "Task not found",
      });
      return;
    }

    res.status(status.OK).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
