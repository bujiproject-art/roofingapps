import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_DASHBOARD = /^\/dashboard(\/.*)?$/;
const PROTECTED_ADMIN = /^\/admin(\/.*)?$/;
const AUTH_PAGES = /^\/(login|register)$/;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Gate auth pages: if logged in, bounce to their dashboard
  if (AUTH_PAGES.test(pathname) && user) {
    const { data: profile } = await supabase.from('revo_users').select('role').eq('id', user.id).maybeSingle();
    const destination = profile?.role === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Gate protected pages: if not logged in, bounce to /login
  if ((PROTECTED_DASHBOARD.test(pathname) || PROTECTED_ADMIN.test(pathname)) && !user) {
    return NextResponse.redirect(new URL('/login?next=' + encodeURIComponent(pathname), request.url));
  }

  // Gate /admin to admin-role only
  if (PROTECTED_ADMIN.test(pathname) && user) {
    const { data: profile } = await supabase.from('revo_users').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
