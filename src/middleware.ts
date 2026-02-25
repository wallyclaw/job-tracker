import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'jt-auth';
const AUTH_PASSWORD = process.env.JT_PASSWORD || 'cloudcode2026';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and login API
  if (pathname === '/login' || pathname === '/api/auth') {
    return NextResponse.next();
  }

  // Check auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE);
  if (authCookie?.value === AUTH_PASSWORD) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
