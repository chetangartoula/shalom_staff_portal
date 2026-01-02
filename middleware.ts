import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth',
  '/api/v1/auth',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/offline.html',
  '/sw.js',
  '/', // Allow root to be accessible (will redirect client-side if not authenticated)
];

export function middleware(request: NextRequest) {
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For this application, we're using localStorage for authentication tokens
  // Since middleware runs server-side and can't access localStorage,
  // we'll allow the request to proceed and handle authentication on the client-side
  // However, we can check for a session cookie if one exists
  const hasAuthCookie = request.cookies.get('auth_token');
  
  // If you implement server-side sessions, you could redirect here
  // For now, we'll allow the request and let client-side code handle authentication
  
  return NextResponse.next();
}

// Apply middleware to all routes except public ones
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|offline.html|sw.js).*)',
      missing: [
        { type: 'header', key: 'next-action' }, // Skip middleware for server actions
      ],
    },
  ],
};