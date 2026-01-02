// Client-side authentication utilities
import { User } from '@/lib/auth-client';
import { refreshToken as apiRefreshToken } from '@/lib/api-service';

// Store authentication tokens in localStorage
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';

// Store tokens in localStorage
export function storeAuthTokens(accessToken: string, refreshToken: string, userId: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_ID_KEY, userId.toString());
  }
}

// Function to decode JWT token and get expiration time
function getTokenExpiration(token: string): number | null {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Check if access token is expired
export function isAccessTokenExpired(): boolean {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return true;
    }
    
    const expirationTime = getTokenExpiration(token);
    if (!expirationTime) {
      return true;
    }
    
    return Date.now() >= expirationTime;
  }
  return true;
}

// Get stored access token (with expiration check)
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    // Check if token is expired before returning
    if (isAccessTokenExpired()) {
      // Remove expired token
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

// Get stored refresh token
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

// Get stored user ID
export function getUserId(): number | null {
  if (typeof window !== 'undefined') {
    const userIdStr = localStorage.getItem(USER_ID_KEY);
    return userIdStr ? parseInt(userIdStr, 10) : null;
  }
  return null;
}

// Clear all auth tokens
export function clearAuthTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Get user info from stored data
export function getCurrentUser(): User | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  // Decode JWT to get user info (simplified - in real app, use proper JWT library)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    return {
      name: payload.user?.username || 'User',
      email: payload.user?.email || '',
      role: payload.user?.is_staff ? 'Admin' : 'User',
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// API utility with token handling
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Ensure we have a valid access token before making the request
  if (isAccessTokenExpired()) {
    // If access token is expired, try to refresh it
    try {
      const refreshResult = await apiRefreshToken();
      // If refresh failed due to no refresh token, clear tokens and redirect to login
      if (!refreshResult) {
        clearAuthTokens();
        window.location.href = '/login';
        throw new Error('Authentication required - please log in again');
      }
    } catch (refreshError) {
      // If refresh fails (e.g., refresh token is also expired), clear tokens and redirect to login
      clearAuthTokens();
      window.location.href = '/login';
      throw refreshError;
    }
  }
  
  const accessToken = getAccessToken();
  
  // Start with default headers
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  };
  
  // Add any additional headers from options
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      for (const [key, value] of options.headers) {
        headers[key] = value as string;
      }
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers[key] = String(value);
      });
    }
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1${endpoint}`, {
    ...options,
    headers,
  });

  // If we get a 401, try to refresh the token and retry the request
  if (response.status === 401) {
    try {
      const refreshResult = await apiRefreshToken();
      // If refresh failed due to no refresh token, clear tokens and redirect to login
      if (!refreshResult) {
        clearAuthTokens();
        window.location.href = '/login';
        throw new Error('Authentication required - please log in again');
      }
      // Retry the original request with the new token
      const newAccessToken = getAccessToken();
      const retryHeaders = {
        ...headers,
        'Authorization': `Bearer ${newAccessToken}`,
      };
      response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    } catch (refreshError) {
      // If refresh fails, clear tokens and redirect to login
      clearAuthTokens();
      window.location.href = '/login';
      throw refreshError;
    }
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response;
}