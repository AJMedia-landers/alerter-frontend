/**
 * Server-side configuration for environment variables
 * This should only be imported in server-side code (API routes, server components)
 */

/**
 * Validate and return the API base URL from environment variables
 * This function validates the API_BASE_URL at runtime
 */
function validateApiBaseUrl(): string {
  const apiUrl = process.env.API_BASE_URL;
  
  if (!apiUrl) {
    throw new Error(
      "API_BASE_URL environment variable is not set. " +
      "Please set it in your .env.local file or environment configuration."
    );
  }
  
  // Validate URL format
  try {
    new URL(apiUrl);
  } catch (error) {
    throw new Error(
      `API_BASE_URL is not a valid URL: ${apiUrl}. ` +
      "Please provide a valid URL (e.g., http://localhost:5000 or https://api.example.com)"
    );
  }
  
  return apiUrl;
}

// Cache the validated URL to avoid redundant validation on every request
let cachedApiBaseUrl: string | null = null;

/**
 * Get the validated API base URL
 * The URL is validated once and cached for subsequent calls
 */
export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl === null) {
    cachedApiBaseUrl = validateApiBaseUrl();
  }
  return cachedApiBaseUrl;
}
