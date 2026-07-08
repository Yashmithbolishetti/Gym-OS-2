export function getApiUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL || "";
  if (typeof window !== 'undefined') {
    // If we are in the browser and the environment variable points to localhost
    // but the actual page is served on a different domain, use relative paths.
    if (envUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
      return '';
    }
  }
  return envUrl;
}
