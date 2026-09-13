import type { Response, CookieOptions } from "express";
import type { AuthTokens } from "@taskflow/shared";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions & { partitioned?: boolean } = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  ...(isProduction ? { partitioned: true } : {}),
};

// 15 minutes for access token
const accessTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000,
};

// 7 days for refresh token
const refreshTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const setAuthCookies = (res: Response, tokens: AuthTokens): void => {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessTokenCookieOptions);
  res.cookie(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    refreshTokenCookieOptions
  );
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
};
