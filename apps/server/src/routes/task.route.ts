import { Router } from "express";
import { createTask } from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createTaskSchema } from "@taskflow/shared";

const router = Router();

// Protect all task routes
router.use(authenticate);

router.post("/", validateBody(createTaskSchema), createTask);

export default router;
