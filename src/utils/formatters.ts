/**
 * Format duration in seconds to human readable format
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "2h 30m 15s" or "45m")
 */
export function formatDuration(seconds: number): string {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Format a timestamp in seconds to HH:MM:SS format
 * @param seconds Timestamp in seconds
 * @returns Formatted string (e.g., "02:30:15")
 */
export function formatTimestamp(seconds: number): string {
  const date = new Date(seconds * 1000);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const secs = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
}