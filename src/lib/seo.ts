import { DEFAULT_SITE_NAME } from './site-title'
import type { Content } from './types'

/** Endereço público do site, sem barra no fim. */
export const siteOrigin = () => (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** O que o site oferece. Os mesmos nomes da seção Soluções; serve ao JSON-LD, ao llms.txt e à descrição do site. */
export const SERVICES = [
  { name: 'Sites institucionais', description: 'Sites institucionais rápidos, acessíveis e editáveis, com SEO técnico, AEO e GEO para a empresa ser encontrada no Google e citada por assistentes de IA.' },
  { name: 'E-commerce', description: 'Lojas virtuais com catálogo organizado, checkout sem atrito e medição de vendas, prontas para tráfego pago.' },
  { name: 'Landing pages', description: 'Landing pages de uma oferta e uma ação, feitas para campanhas de tráfego pago, com carregamento rápido e conversão medida.' },
  { name: 'Plataformas sob medida com IA', description: 'Portais, painéis e sistemas web sob medida, com inteligência artificial, que transformam um gargalo da operação em sistema.' },
]

/** Assuntos em que o site quer ser encontrado e citado. */
export const TOPICS = [
  'criação de sites', 'desenvolvimento web', 'site institucional', 'landing page', 'e-commerce', 'loja virtual', 'SEO', 'AEO', 'GEO',
  'tráfego pago', 'Core Web Vitals', 'acessibilidade web WCAG', 'plataformas web com IA', 'sites para empresas B2B',
]

/** Número do WhatsApp (só dígitos) a partir do primeiro link wa.me do conteúdo, para o contato sempre acompanhar o painel. */
export function whatsappDigits(...contents: (Content | undefined)[]) {
  for (const content of contents) {
    for (const link of content?.links || []) {
      const found = /wa\.me\/(\d{10,15})/.exec(link.href || '')
      if (found) return found[1]
    }
  }
  return undefined
}

type Crumb = { name: string; path: string }
type Page = { path: string; name: string; description?: string; image?: string; type?: string; published?: string; modified?: string; crumbs?: Crumb[] }

const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${siteOrigin()}${path}`)

/**
 * Grafo schema.org da página: empresa (ProfessionalService) com o catálogo de serviços, a pessoa, o site e a página, com
 * trilha de navegação fora da inicial. As entidades têm @id fixo para o Google e as IAs reconhecerem que é tudo a mesma coisa.
 */
export function structuredData({ siteName, logo, whatsapp, page }: { siteName?: string; logo?: string; whatsapp?: string; page: Page }) {
  const name = siteName?.trim() || DEFAULT_SITE_NAME
  const origin = siteOrigin()
  const org = `${origin}/#organization`
  const person = `${origin}/#thiago-barreto`
  const site = `${origin}/#website`
  const home = page.path === '/'
  const logoURL = abs(logo || '/img/favicon-192.png')
  const phone = whatsapp ? `+${whatsapp}` : undefined
  const graph: Record<string, unknown>[] = [
    {
      '@type': ['ProfessionalService', 'Organization'], '@id': org, name: `${name} — Desenvolvimento web`, alternateName: name, url: origin,
      logo: { '@type': 'ImageObject', url: logoURL, width: 192, height: 192 }, image: logoURL,
      description: 'Criação de sites institucionais, e-commerce, landing pages e plataformas sob medida com IA para empresas B2B, com SEO, AEO e GEO.',
      areaServed: { '@type': 'Country', name: 'Brasil' }, availableLanguage: 'pt-BR', founder: { '@id': person },
      knowsAbout: TOPICS, serviceType: SERVICES.map((service) => service.name),
      ...(phone ? { telephone: phone, contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: phone, availableLanguage: ['pt-BR'], url: `https://wa.me/${whatsapp}` } } : {}),
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'Serviços de desenvolvimento web',
        itemListElement: SERVICES.map((service) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: service.name, description: service.description, provider: { '@id': org }, areaServed: 'BR' } })),
      },
    },
    {
      '@type': 'Person', '@id': person, name: 'Thiago Barreto', jobTitle: 'Desenvolvedor web', url: `${origin}/#sobre`,
      image: abs('/img/sobre/thiago-barreto.webp'), worksFor: { '@id': org }, knowsAbout: TOPICS,
    },
    { '@type': 'WebSite', '@id': site, url: origin, name, inLanguage: 'pt-BR', publisher: { '@id': org } },
    {
      '@type': page.type || 'WebPage', '@id': `${abs(page.path)}#webpage`, url: abs(page.path), name: page.name, inLanguage: 'pt-BR',
      isPartOf: { '@id': site }, about: { '@id': org },
      ...(page.description ? { description: page.description } : {}),
      ...(page.image ? { primaryImageOfPage: { '@type': 'ImageObject', url: abs(page.image) } } : {}),
      ...(page.published ? { datePublished: page.published } : {}), ...(page.modified ? { dateModified: page.modified } : {}),
      ...(!home && page.crumbs?.length ? { breadcrumb: { '@id': `${abs(page.path)}#breadcrumb` } } : {}),
    },
  ]
  if (!home && page.crumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList', '@id': `${abs(page.path)}#breadcrumb`,
      itemListElement: [{ name, path: '/' }, ...page.crumbs].map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: abs(crumb.path) })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

/** JSON-LD pronto para o <script>: o `<` é escapado para o conteúdo nunca fechar a tag. */
export const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c')
