import { Response } from "express";
import { AUTHORIZATION_CONSTANTS, getCookieConfig } from "@middlewares/constants";
import { ENV_CONFIG } from "@config/env";

const DEFAULT_AUTH_COOKIES = [
  AUTHORIZATION_CONSTANTS.ACCESS_TOKEN_COOKIE,
  AUTHORIZATION_CONSTANTS.REFRESH_TOKEN_COOKIE,
];

export const clearAuthCookies = (res: Response, cookies: string[] = DEFAULT_AUTH_COOKIES): void => {
  const cookieConfig = getCookieConfig(ENV_CONFIG.SECURE_COOKIES);
  cookies.forEach((cookieName) => {
    res.clearCookie(cookieName, cookieConfig);
  });
};
