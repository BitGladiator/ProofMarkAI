import {
  HealthResponse,
  ReviewRequest,
  ReviewResponse,
  ApiErrorResponse
} from '../types';

/**
 * Determine the API base URL.
 * In development, defaulting to empty string ('') routes requests to the same-origin
 * Vite dev server proxy (/api -> http://127.0.0.1:8000), eliminating CORS and localhost/127.0.0.1
 * origin mismatches across browsers.
 * If VITE_API_BASE_URL is explicitly set (e.g. in production), that value is used.
 */
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }
  // Default to relative path so it uses Vite dev proxy or same-origin deployment
  return '';
}

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    statusCode: number,
    code: string = 'API_ERROR',
    details?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Perform a health check on the backend service.
 */
export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const primaryUrl = `${API_BASE_URL}/api/health`;

  async function tryFetch(targetUrl: string): Promise<HealthResponse> {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: signal ?? AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new ApiError(
        `Health check failed with status ${response.status}`,
        response.status,
        'HEALTH_FAILED'
      );
    }

    const data: HealthResponse = await response.json();
    return data;
  }

  try {
    return await tryFetch(primaryUrl);
  } catch (primaryErr: unknown) {
    // If primary fetch failed and API_BASE_URL was set to an explicit URL, fallback to relative proxy
    if (API_BASE_URL !== '') {
      try {
        return await tryFetch('/api/health');
      } catch {
        // Fall through to throw original error
      }
    }

    if (primaryErr instanceof ApiError) throw primaryErr;
    if (primaryErr instanceof DOMException && primaryErr.name === 'TimeoutError') {
      throw new ApiError('Connection timed out contacting backend service', 504, 'TIMEOUT');
    }
    const message = primaryErr instanceof Error ? primaryErr.message : 'Failed to connect to backend';
    throw new ApiError(message, 0, 'NETWORK_ERROR');
  }
}

/**
 * Submit draft text and optional reference material for brand review.
 */
export async function submitReview(
  payload: ReviewRequest,
  signal?: AbortSignal
): Promise<ReviewResponse> {
  const primaryUrl = `${API_BASE_URL}/api/review`;

  async function tryPost(targetUrl: string): Promise<ReviewResponse> {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: signal ?? AbortSignal.timeout(35000)
    });

    if (!response.ok) {
      let errorBody: ApiErrorResponse | null = null;
      try {
        errorBody = await response.json();
      } catch {
        // Non-JSON response
      }

      if (errorBody && errorBody.error) {
        throw new ApiError(
          errorBody.error.message || `Request failed (${response.status})`,
          response.status,
          errorBody.error.code || 'API_ERROR',
          errorBody.error.details
        );
      }

      throw new ApiError(
        `Review request failed with status ${response.status}`,
        response.status,
        'API_ERROR'
      );
    }

    const data: ReviewResponse = await response.json();
    return data;
  }

  try {
    return await tryPost(primaryUrl);
  } catch (primaryErr: unknown) {
    if (API_BASE_URL !== '') {
      try {
        return await tryPost('/api/review');
      } catch {
        // Fall through to throw original error
      }
    }

    if (primaryErr instanceof ApiError) throw primaryErr;
    if (primaryErr instanceof DOMException && primaryErr.name === 'TimeoutError') {
      throw new ApiError(
        'Review request timed out. The backend or AI provider took too long to respond.',
        504,
        'TIMEOUT'
      );
    }
    const message = primaryErr instanceof Error ? primaryErr.message : 'Unable to connect to backend review service';
    throw new ApiError(message, 0, 'NETWORK_ERROR');
  }
}
