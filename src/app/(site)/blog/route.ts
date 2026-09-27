import { getPosts, renderBlog } from '@/lib/render'

export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await getPosts()
  return new Response(renderBlog(posts), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })
}
