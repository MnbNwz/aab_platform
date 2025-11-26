/**
 * Formats a date string to a readable format
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", options);
  } catch {
    return dateString;
  }
};

/**
 * Formats a date string to include time
 * @param dateString - ISO date string
 * @returns Formatted date string with time
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

