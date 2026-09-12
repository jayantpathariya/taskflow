import { Router } from "express";
import authRoutes from "./auth.route.js";
import taskRoutes from "./task.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);

export default router;
