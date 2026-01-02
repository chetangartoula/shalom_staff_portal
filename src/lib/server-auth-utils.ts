import { jwtVerify } from 'jose';

// Server-side authentication utilities
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

// Get access token from request headers (for API routes)
export function getServerAccessTokenFromRequest(request: Request): string | null {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Get refresh token from request headers
export function getServerRefreshTokenFromRequest(request: Request): string | null {
  // For refresh token, we might need to pass it differently, but for now using cookies approach
  // This is a simplified implementation
  return null;
}
// Verify JWT token expiration on the server
export async function isServerAccessTokenExpired(token: string | null): Promise<boolean> {
  if (!token) {
    return true;
  }

  try {
    // Verify the token and check expiration
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'fallback_secret_for_dev'
    );
    const { payload } = await jwtVerify(token, secret);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp < currentTime : true;
  } catch (error) {
    // If token verification fails, consider it expired
    console.error('Token verification failed:', error);
    return true;
  }
}

// Server-side refresh token function
export async function serverRefreshToken(refreshToken: string): Promise<{ access: string } | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      // If refresh token is invalid
      if (response.status === 401) {
        console.error('Refresh token invalid');
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('Token refresh failed:', errorData);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

