/**
 * Truncates a string to a specified maximum length, appending ellipsis if truncated
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation (default: 30)
 * @returns Truncated string with ellipsis if needed
 */
export const truncateString = (str: string, maxLength: number = 30): string => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
};

