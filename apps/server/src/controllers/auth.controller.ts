import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { status } from "http-status";
import { User } from "../models/user.model.js";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.util.js";
import {
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from "../utils/cookie.util.js";
import {
  storeRefreshToken,
  getStoredRefreshToken,
  removeRefreshToken,
} from "../services/token.service.js";
import type { RegisterInput, LoginInput } from "@taskflow/shared";

export const register = async (
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(status.CONFLICT).json({
        error: "An account with this email already exists",
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    const tokens = generateTokens(user._id.toString());
    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    setAuthCookies(res, tokens);

    res.status(status.CREATED).json({
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(status.UNAUTHORIZED).json({
        error: "Invalid email or password",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(status.UNAUTHORIZED).json({
        error: "Invalid email or password",
      });
      return;
    }

    const tokens = generateTokens(user._id.toString());
    await storeRefreshToken(user._id.toString(), tokens.refreshToken);

    setAuthCookies(res, tokens);

    res.status(status.OK).json({
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      res.status(status.UNAUTHORIZED).json({
        error: "No refresh token provided",
      });
      return;
    }

    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      clearAuthCookies(res);
      res.status(status.UNAUTHORIZED).json({
        error: "Invalid or expired refresh token",
      });
      return;
    }

    const storedToken = await getStoredRefreshToken(payload.userId);
    if (!storedToken || storedToken !== refreshToken) {
      clearAuthCookies(res);
      res.status(status.UNAUTHORIZED).json({
        error: "Refresh token is invalid or has been revoked",
      });
      return;
    }

    const tokens = generateTokens(payload.userId);
    await storeRefreshToken(payload.userId, tokens.refreshToken);

    setAuthCookies(res, tokens);

    res.status(status.OK).json({
      message: "Token refreshed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await removeRefreshToken(payload.userId);
      } catch {}
    }

    clearAuthCookies(res);

    res.status(status.OK).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
