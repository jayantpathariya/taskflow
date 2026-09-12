import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import {
  startTimer,
  stopTimer,
} from "../controllers/timer.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createTaskSchema, updateTaskSchema } from "@taskflow/shared";

const router = Router();

// Protect all task routes
router.use(authenticate);

router.get("/", getTasks);
router.post("/", validateBody(createTaskSchema), createTask);
router.get("/:id", getTaskById);
router.put("/:id", validateBody(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);

// Timer routes
router.post("/:id/timer/start", startTimer);
router.post("/:id/timer/stop", stopTimer);

export default router;
