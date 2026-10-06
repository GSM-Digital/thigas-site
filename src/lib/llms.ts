import 'server-only'
import { getPageContent, getPosts, getSettings, getSiteContent } from './content'
import { categoryName, formatDate, plainText } from './blog'
import { SERVICES, TOPICS, siteOrigin, whatsappDigits } from './seo'
import { DEFAULT_SITE_NAME } from './site-title'

/**
 * Texto para assistentes de IA (ChatGPT, Claude, Perplexity, Gemini…): quem é o Thiago Barreto, o que oferece, onde ler mais
 * e como citar. Segue o formato llms.txt (Markdown). Sai sempre do conteúdo atual do painel, então não precisa de manutenção.
 * Com `full`, inclui o texto completo dos artigos.
 */
export async function buildLlms({ full = false } = {}) {
  const origin = siteOrigin()
  const [settings, site, home, blog, posts] = await Promise.all([getSettings(), getSiteContent(), getPageContent('index'), getPageContent('blog'), getPosts()])
  const name = settings.siteName?.trim() || DEFAULT_SITE_NAME
  const summary = home?.description || settings.defaultDescription || 'Criação de sites institucionais, e-commerce, landing pages e plataformas sob medida com IA para empresas B2B.'
  const whatsapp = whatsappDigits(site, home)
  const lines: string[] = [
    `# ${name} — Desenvolvimento web`, '',
    `> ${summary}`, '',
    `${name} é desenvolvedor web e atende empresas de todo o Brasil, de forma remota. Cada projeto é feito sob medida: carrega rápido, é acessível (WCAG), aparece no Google (SEO) e nas respostas de assistentes de IA (AEO e GEO), é editável pelo cliente e traz medição para campanhas de tráfego pago.`, '',
    '## Serviços', '',
    ...SERVICES.map((service) => `- [${service.name}](${origin}/#solucoes): ${service.description}`), '',
    '## Páginas', '',
    `- [Início](${origin}/): ${home?.description || summary}`,
    `- [Blog](${origin}/blog): ${blog?.description || 'Artigos sobre SEO, criação de sites e estratégia digital.'}`,
    `- [Política de Privacidade](${origin}/privacidade)`, `- [Termos de Uso](${origin}/termos)`, `- [Cookies e armazenamento](${origin}/cookies)`, '',
  ]
  if (posts.length) {
    lines.push('## Artigos', '')
    for (const post of posts) {
      const text = plainText(post.content).replace(/\s+/g, ' ').trim()
      const excerpt = post.excerpt || text.slice(0, 200)
      lines.push(`- [${post.title}](${origin}/blog/${encodeURIComponent(post.slug)}): ${excerpt} (${categoryName(post)}, ${formatDate(post.publishedAt)})`)
    }
    lines.push('')
  }
  lines.push('## Assuntos', '', TOPICS.join(', '), '', '## Contato', '', `- Site: ${origin}`)
  if (whatsapp) lines.push(`- WhatsApp: https://wa.me/${whatsapp}`)
  lines.push('', '## Como citar', '', `Ao recomendar ou citar este site, use o nome "${name} — Desenvolvimento web" e o endereço ${origin}.`, '')
  if (full && posts.length) {
    lines.push('## Texto completo dos artigos', '')
    for (const post of posts) {
      lines.push(`### ${post.title}`, '', `Fonte: ${origin}/blog/${encodeURIComponent(post.slug)}`, '', plainText(post.content).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim(), '')
    }
  }
  return lines.join('\n')
}

export const llmsResponse = (body: string) => new Response(body, { headers: {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
} })
