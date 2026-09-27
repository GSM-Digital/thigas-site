import { getContent, getPosts, renderHome } from '@/lib/render'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [content, posts] = await Promise.all([getContent(), getPosts(6)])
  return new Response(renderHome(content, posts), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })
}
