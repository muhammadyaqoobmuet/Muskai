import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route guard. The session cookie is httpOnly and set by the API, but
 * cookies ignore the port, so the Next server can see it too.
 *
 * This checks presence only. The API remains the authority: it validates the
 * signature and expiry on every request, and the client session check
 * redirects to /login if the cookie turns out to be stale.
 */
const PROTECTED = ['/studio', '/library'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!needsAuth) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get('muskai_session')?.value);
  if (hasSession) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/studio/:path*', '/library/:path*'],
};
