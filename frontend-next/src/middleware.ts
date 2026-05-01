import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  const protectedPaths = ['/dashboard', '/practice', '/report', '/roadmap', '/profile', '/settings'];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/practice/:path*',
    '/report/:path*',
    '/roadmap/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/mission/:path*',
  ],
};
