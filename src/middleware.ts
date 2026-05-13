import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_DASHBOARD = /^\/dashboard(\/.*)?$/;
const PROTECTED_ADMIN = /^\/admin(\/.*)?$/;
const PROTECTED_ESTIMATOR = /^\/estimator(\/.*)?$/;
const AUTH_PAGES = /^\/(login|register)$/;

function destForRole(role: string | null | undefined): string {
  if (role === 'admin') return '/admin';
  if (role === 'estimator') return '/estimator';
  return '/dashboard';
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>) =>
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Gate auth pages: if logged in, bounce to their dashboard
  if (AUTH_PAGES.test(pathname) && user) {
    const { data: profile } = await supabase
      .from('revo_users').select('role').eq('id', user.id).maybeSingle();
    return NextResponse.redirect(new URL(destForRole(profile?.role), request.url));
  }

  // Gate protected pages: if not logged in, bounce to /login
  if (
    (PROTECTED_DASHBOARD.test(pathname) ||
      PROTECTED_ADMIN.test(pathname) ||
      PROTECTED_ESTIMATOR.test(pathname)) &&
    !user
  ) {
    return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(pathname), request.url));
  }

  // Role-based gating for /admin and /estimator
  if ((PROTECTED_ADMIN.test(pathname) || PROTECTED_ESTIMATOR.test(pathname)) && user) {
    const { data: profile } = await supabase
      .from('revo_users').select('role').eq('id', user.id).maybeSingle();
    const role = profile?.role;
    if (PROTECTED_ADMIN.test(pathname) && role !== 'admin') {
      return NextResponse.redirect(new URL(destForRole(role), request.url));
    }
    if (PROTECTED_ESTIMATOR.test(pathname) && role !== 'estimator' && role !== 'admin') {
      return NextResponse.redirect(new URL(destForRole(role), request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
