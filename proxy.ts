import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const session = request.cookies.get('app-session')?.value ?? request.cookies.get('supabase-auth-token')?.value
  const pathname = request.nextUrl.pathname

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === '/auth/login' || pathname === '/auth/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
