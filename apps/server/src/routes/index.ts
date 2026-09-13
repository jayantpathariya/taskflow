import { Router } from "express";
import authRoutes from "./auth.route.js";
import taskRoutes from "./task.route.js";
import timerRoutes from "./timer.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/timer", timerRoutes);

export default router;
