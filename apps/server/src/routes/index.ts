import { Router } from "express";
import authRoutes from "./auth.route.js";
import taskRoutes from "./task.route.js";
import timerRoutes from "./timer.route.js";
import analyticsRoutes from "./analytics.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/timer", timerRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
