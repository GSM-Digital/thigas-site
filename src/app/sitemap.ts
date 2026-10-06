import type { MetadataRoute } from 'next'
import { getCMS } from '@/lib/content'
import { siteOrigin } from '@/lib/seo'
/** Gerado no build e renovado de hora em hora: responde direto do cache, sem acordar o banco (um timeout aqui reprovava o llms.txt no PageSpeed). */
export const revalidate = 3600

/** Prioridade e frequência por página: a inicial e o blog mudam mais e valem mais; as páginas legais quase nunca mudam. */
const WEIGHT: Record<string, { priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = {
  index: { priority: 1, changeFrequency: 'weekly' }, blog: { priority: 0.8, changeFrequency: 'weekly' },
}
const LEGAL = { priority: 0.3, changeFrequency: 'yearly' as const }

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (process.env.SITE_ENV !== 'production') return []
  const payload = await getCMS()
  const pages = await payload.find({ collection: 'pages', limit: 100, overrideAccess: false })
  const url = siteOrigin()
  // `post` é só o modelo dos artigos; cada post publicado entra com o próprio endereço.
  const posts = await payload.find({ collection: 'posts', limit: 500, depth: 0, overrideAccess: false, pagination: false })
  return [
    ...pages.docs.filter((p) => p.slug !== 'post').map((p) => ({
      url: `${url}${p.slug === 'index' ? '/' : '/' + p.slug}`, lastModified: new Date(p.updatedAt), ...(WEIGHT[p.slug] || LEGAL),
    })),
    ...posts.docs.map((p) => ({ url: `${url}/blog/${encodeURIComponent(p.slug)}`, lastModified: new Date(p.updatedAt), changeFrequency: 'monthly' as const, priority: 0.7 })),
  ]
}
