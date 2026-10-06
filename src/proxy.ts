import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_ROUTE } from './lib/routes'
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  if (process.env.SITE_ENV !== 'production' || request.nextUrl.pathname.startsWith(ADMIN_ROUTE) || request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|css/|js/|img/|fonts/|sims/).*)'] }
