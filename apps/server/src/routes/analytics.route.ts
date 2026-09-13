import { Router } from "express";
import { getDailySummary } from "../controllers/analytics.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all analytics routes
router.use(authenticate);

router.get("/daily", getDailySummary);

export default router;
