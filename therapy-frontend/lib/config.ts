/**
 * Frontend configuration
 * All environment variables prefixed with NEXT_PUBLIC_ are exposed to the browser
 */

// Get base URL and ensure it includes /api suffix
function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!envUrl) {
    return 'http://localhost:3001/api';
  }
  
  // Ensure URL ends with /api
  const url = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  return url.endsWith('/api') ? url : `${url}/api`;
}

export const config = {
  api: {
    baseUrl: getApiBaseUrl(),
  },
} as const;

export type Config = typeof config;
