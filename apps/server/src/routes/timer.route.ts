import { Router } from "express";
import {
  getActiveTimer,
  getAllUserTimeLogs,
} from "../controllers/timer.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all timer/time-log routes
router.use(authenticate);

router.get("/active", getActiveTimer);
router.get("/logs", getAllUserTimeLogs);

export default router;
