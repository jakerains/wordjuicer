// Get version from package.json
export const APP_VERSION = '1.0.10';

// Format version with prefix
export function getFormattedVersion() {
  return `v${APP_VERSION}`;
}