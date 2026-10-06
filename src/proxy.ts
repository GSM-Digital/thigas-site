import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ADMIN_ROUTE } from './lib/routes'
import { buildCSP, cspHeaderName } from './lib/csp'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const internal = path.startsWith(ADMIN_ROUTE) || path.startsWith('/api/')

  // O painel do Payload injeta scripts próprios: só o site público recebe a CSP com nonce.
  let response: NextResponse
  if (internal) {
    response = NextResponse.next()
  } else {
    const nonce = btoa(crypto.randomUUID())
    const csp = buildCSP(nonce)
    const headers = new Headers(request.headers)
    // O Next lê a CSP da requisição para pôr o nonce nos próprios scripts; as páginas leem x-nonce (src/lib/nonce.ts).
    headers.set('x-nonce', nonce)
    headers.set(cspHeaderName(), csp)
    response = NextResponse.next({ request: { headers } })
    response.headers.set(cspHeaderName(), csp)
  }

  if (process.env.SITE_ENV !== 'production' || internal) response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|css/|js/|img/|fonts/|sims/).*)'] }
