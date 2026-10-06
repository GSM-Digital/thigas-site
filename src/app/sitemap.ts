import type { MetadataRoute } from 'next'
import { getCMS } from '@/lib/content'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_ENV !== 'production') return []
  const payload = await getCMS()
  const pages = await payload.find({ collection: 'pages', limit: 100, overrideAccess: false })
  const url = process.env.SERVER_URL || 'http://localhost:3000'
  // `post` é só o modelo dos artigos; cada post publicado entra com o próprio endereço.
  const posts = await payload.find({ collection: 'posts', limit: 500, depth: 0, overrideAccess: false, pagination: false })
  return [
    ...pages.docs.filter((p) => p.slug !== 'post').map((p) => ({ url: `${url}${p.slug === 'index' ? '/' : '/' + p.slug}`, lastModified: new Date(p.updatedAt) })),
    ...posts.docs.map((p) => ({ url: `${url}/blog/${p.slug}`, lastModified: new Date(p.updatedAt) })),
  ]
}
