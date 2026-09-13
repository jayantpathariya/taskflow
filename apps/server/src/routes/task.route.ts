import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  suggestTask,
} from "../controllers/task.controller.js";
import {
  startTimer,
  stopTimer,
  getTaskTimeLogs,
} from "../controllers/timer.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  aiTaskSuggestionSchema,
} from "@taskflow/shared";

const router = Router();

// Protect all task routes
router.use(authenticate);

router.post("/ai-suggest", validateBody(aiTaskSuggestionSchema), suggestTask);

router.get("/", getTasks);
router.post("/", validateBody(createTaskSchema), createTask);
router.get("/:id", getTaskById);
router.put("/:id", validateBody(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);

// Task Timer routes
router.post("/:id/timer/start", startTimer);
router.post("/:id/timer/stop", stopTimer);
router.get("/:id/time-logs", getTaskTimeLogs);

export default router;
