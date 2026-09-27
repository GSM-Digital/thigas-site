import { getPosts, origin } from '@/lib/render'

export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await getPosts()
  const locations = [origin + '/', origin + '/blog', ...posts.map((post) => `${origin}/blog/${encodeURIComponent(post.slug)}`)]
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations.map((url) => `<url><loc>${url.replace(/&/g, '&amp;')}</loc></url>`).join('')}</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'no-store' } })
}
