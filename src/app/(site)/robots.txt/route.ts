import { origin } from '@/lib/render'

export function GET() {
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
