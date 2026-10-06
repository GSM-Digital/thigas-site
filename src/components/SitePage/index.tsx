import { notFound } from 'next/navigation'
import { chrome, getPageContent, getSiteContent, getSettings, getPosts, templates, uploadURL } from '@/lib/content'
import { toCard } from '@/lib/blog'
import { DEFAULT_SITE_NAME } from '@/lib/site-title'
import { Template } from '../Template'
import { Interactions } from '../Interactions'
import { BlogListing, PostCards } from '../Blog'
import { Featured } from '../Blog/Article'

/** Cada página carrega o CSS dela; o `styles.css` base vem do layout. */
const STYLES: Record<string, string> = { blog: '/css/editorial.css', privacidade: '/css/legal.css', termos: '/css/legal.css', cookies: '/css/legal.css' }
const KIND: Record<string, 'home' | 'editorial' | 'legal'> = { index: 'home', blog: 'editorial', privacidade: 'legal', termos: 'legal', cookies: 'legal' }

export async function SitePage({ slug }: { slug: string }) {
  const template = templates.find((page) => page.slug === slug)
  if (!template) notFound()
  const withPosts = slug === 'index' || slug === 'blog'
  const [page, site, settings, posts] = await Promise.all([
    getPageContent(slug), template.chrome === 'site' ? getSiteContent() : undefined, getSettings(), withPosts ? getPosts() : Promise.resolve(undefined),
  ])
  if (!page) notFound()
  const own = template.chrome === 'own'
  const logoURL = uploadURL(settings.logo)
  const logo = logoURL ? { url: logoURL, alt: settings.siteName?.trim() || DEFAULT_SITE_NAME } : undefined
  const cards = posts?.map(toCard) || []
  const slots = slug === 'index'
    ? { cards: <PostCards posts={cards.slice(0, 6)} /> }
    : slug === 'blog'
      ? { 'blog-feature': cards[0] ? <Featured post={cards[0]} /> : null, 'blog-listing': <BlogListing posts={cards} /> }
      : {}
  // O item Blog do menu rola até a seção do blog na inicial; fora dela (ou sem posts para mostrar), leva à página do blog.
  const common = { offHome: slug !== 'index', current: slug === 'blog' ? '/blog' : undefined, anchors: slug !== 'index' || !cards.length ? { '#blog': '/blog' } : undefined }
  return <>
    {STYLES[slug] && <link rel="stylesheet" href={STYLES[slug]} precedence="default" />}
    {!own && site && <Template nodes={chrome.header} content={site} logo={logo} {...common} />}
    <Template nodes={template.body} content={page} slots={slots} emptySlots={slug === 'index' && !cards.length ? ['cards'] : []} />
    {!own && site && <Template nodes={chrome.footer} content={site} {...common} />}
    {slug === 'index' && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ProfessionalService', name: `${settings.siteName?.trim() || DEFAULT_SITE_NAME} — Desenvolvimento web`,
      url: process.env.SERVER_URL || 'http://localhost:3000', areaServed: 'BR',
      serviceType: ['Sites institucionais', 'E-commerce', 'Landing pages', 'Plataformas web sob medida com IA'],
    }).replace(/</g, '\\u003c') }} />}
    <Interactions kind={KIND[slug] || 'legal'} />
  </>
}
