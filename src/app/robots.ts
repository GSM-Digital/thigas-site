import type { MetadataRoute } from 'next'
import { ADMIN_ROUTE } from '@/lib/routes'
import { siteOrigin } from '@/lib/seo'
/** Gerado no build e renovado de hora em hora: responde direto do cache, sem acordar o banco (um timeout aqui reprovava o llms.txt no PageSpeed). */
export const revalidate = 3600

/** Buscadores e assistentes de IA que o site quer que leiam e citem o conteúdo (GEO). Só valem em produção. */
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot', 'cohere-ai', 'Meta-ExternalAgent', 'DuckAssistBot', 'Amazonbot',
]

export default function robots(): MetadataRoute.Robots {
  const url = siteOrigin()
  if (process.env.SITE_ENV !== 'production') return { rules: { userAgent: '*', disallow: '/' }, sitemap: `${url}/sitemap.xml` }
  const open = { allow: '/', disallow: [ADMIN_ROUTE, '/api'] }
  return { rules: [{ userAgent: '*', ...open }, { userAgent: AI_CRAWLERS, ...open }], sitemap: `${url}/sitemap.xml`, host: url }
}
