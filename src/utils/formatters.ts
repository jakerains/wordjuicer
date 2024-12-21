/**
 * Formats a duration in minutes into a human-readable string
 * @param minutes Duration in minutes
 * @returns Formatted string (e.g., "2h 30m" or "45m")
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return `${hours}h ${mins}m`;
};