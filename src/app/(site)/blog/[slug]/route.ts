import { getPost, getPosts, renderArticle } from '@/lib/render'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return new Response('Artigo não encontrado', { status: 404 })
  const post = await getPost(slug)
  if (!post) return new Response('Artigo não encontrado', { status: 404 })
  const related = (await getPosts(4)).filter((item) => item.slug !== slug)
  return new Response(renderArticle(post, related), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } })
}
