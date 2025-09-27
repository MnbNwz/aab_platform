/**
 * Authentication utility functions
 */

/**
 * Check if authentication cookies exist
 * @returns {boolean} True if both accessToken and refreshToken cookies exist and have values
 */
export const hasAuthCookies = (): boolean => {
  const cookies = document.cookie.split(";");
  const hasAccessToken = cookies.some(
    (cookie) =>
      cookie.trim().startsWith("accessToken=") && cookie.trim().split("=")[1]
  );
  const hasRefreshToken = cookies.some(
    (cookie) =>
      cookie.trim().startsWith("refreshToken=") && cookie.trim().split("=")[1]
  );
  return hasAccessToken && hasRefreshToken;
};

