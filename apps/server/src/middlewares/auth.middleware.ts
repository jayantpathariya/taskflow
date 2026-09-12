import type { Request, Response, NextFunction } from "express";
import { status } from "http-status";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { ACCESS_TOKEN_COOKIE } from "../utils/cookie.util.js";
import { User, type IUserDocument } from "../models/user.model.js";

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      userId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token) {
      res.status(status.UNAUTHORIZED).json({
        error: "Authentication required",
      });
      return;
    }

    let payload: { userId: string };
    try {
      payload = verifyAccessToken(token);
    } catch {
      res.status(status.UNAUTHORIZED).json({
        error: "Invalid or expired access token",
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(status.UNAUTHORIZED).json({
        error: "User not found or account no longer active",
      });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    next(error);
  }
};
