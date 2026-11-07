import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAdminAuth = !!request.cookies.get('adminAuth')?.value;
  const isDeliveryAuth = !!request.cookies.get('deliveryAuth')?.value;
  const { pathname } = request.nextUrl;

  // If trying to access admin routes without auth
  if (pathname.startsWith('/admin') && !isAdminAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access delivery routes without auth
  if (pathname.startsWith('/delivery') && !isDeliveryAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access login page while already authenticated
  if (pathname === '/login') {
    if (isAdminAuth) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    if (isDeliveryAuth) return NextResponse.redirect(new URL('/delivery/dashboard', request.url));
  }

  // Redirect root to login or respective dashboard depending on auth
  if (pathname === '/') {
    if (isAdminAuth) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else if (isDeliveryAuth) {
      return NextResponse.redirect(new URL('/delivery/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/delivery/:path*', '/login'],
};
