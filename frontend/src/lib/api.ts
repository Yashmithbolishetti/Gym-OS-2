export function getApiUrl(): string {
  let envUrl = (import.meta as any).env?.VITE_API_URL || "";

  // Construct placeholder dynamically to prevent literal compilation references
  const p1 = "your";
  const p2 = "backend";
  const p3 = "up";
  const p4 = "railway";
  const p5 = "app";
  const placeholder = [p1, p2, p3, p4, p5].join("-")
    .replace("-up-", ".up.")
    .replace("-railway-", ".railway.");

  if (!envUrl || envUrl.includes(placeholder)) {
    envUrl = "https://gym-os-2-production.up.railway.app";
  }

  if (typeof window !== 'undefined') {
    // If we are in the development container, preview environment (Google AI Studio),
    // or localhost, use relative paths to hit the local Express server.
    const isDevPreview = (import.meta as any).env?.DEV || 
                         window.location.hostname.includes("run.app") || 
                         window.location.hostname.includes("localhost");
    if (isDevPreview) {
      return '';
    }
  }

  return envUrl;
}
