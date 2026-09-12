import type { Request, Response, NextFunction } from "express";
import { status } from "http-status";
import { Task } from "../models/task.model.js";
import type { CreateTaskInput } from "@taskflow/shared";

export const createTask = async (
  req: Request<unknown, unknown, CreateTaskInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(status.UNAUTHORIZED).json({
        error: "Authentication required",
      });
      return;
    }

    const { title, description, status: taskStatus } = req.body;

    const task = await Task.create({
      userId,
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
