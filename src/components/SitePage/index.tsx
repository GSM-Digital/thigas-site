import { notFound } from 'next/navigation'
import { chrome, getPageContent, getSiteContent, getSettings, getPosts, templates, uploadURL } from '@/lib/content'
import { toCard } from '@/lib/blog'
import { asset } from '@/lib/assets'
import { getNonce } from '@/lib/nonce'
import { jsonLd, structuredData, whatsappDigits } from '@/lib/seo'
import { DEFAULT_SITE_NAME } from '@/lib/site-title'
import { Template } from '../Template'
import { Interactions } from '../Interactions'
import { BlogListing, PostCards } from '../Blog'
import { Featured } from '../Blog/Article'

/** Cada página carrega o CSS dela; o `styles.css` base vem do layout. */
const STYLES: Record<string, string> = { blog: '/css/editorial.css', privacidade: '/css/legal.css', termos: '/css/legal.css', cookies: '/css/legal.css' }
/**
 * O revelar do herói só espera o navegador pintar o primeiro quadro (dois quadros, como o main.js). Sem isso o título ficava
 * invisível até o JavaScript do site carregar, depois da hidratação, e o LCP no celular passava de 3 s. O main.js continua
 * fazendo o mesmo depois; adicionar a classe de novo não muda nada.
 */
const HERO_REVEAL = `(function(d){function go(){var h=d.querySelector('.hero');if(h)h.classList.add('is-in')}requestAnimationFrame(function(){requestAnimationFrame(go)});setTimeout(go,120)})(document)`
const KIND: Record<string, 'home' | 'editorial' | 'legal'> = { index: 'home', blog: 'editorial', privacidade: 'legal', termos: 'legal', cookies: 'legal' }

export async function SitePage({ slug }: { slug: string }) {
  const template = templates.find((page) => page.slug === slug)
  if (!template) notFound()
  const withPosts = slug === 'index' || slug === 'blog'
  const [page, site, settings, posts, nonce] = await Promise.all([
    getPageContent(slug), template.chrome === 'site' ? getSiteContent() : undefined, getSettings(), withPosts ? getPosts() : Promise.resolve(undefined), getNonce(),
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
    {STYLES[slug] && <link rel="stylesheet" href={asset(STYLES[slug])} precedence="default" />}
    {!own && site && <Template nodes={chrome.header} content={site} logo={logo} {...common} />}
    <Template nodes={template.body} content={page} slots={slots} emptySlots={slug === 'index' && !cards.length ? ['cards'] : []} />
    {!own && site && <Template nodes={chrome.footer} content={site} {...common} />}
    {slug === 'index' && <script nonce={nonce} dangerouslySetInnerHTML={{ __html: HERO_REVEAL }} />}
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData({
      siteName: settings.siteName, logo: logoURL, whatsapp: whatsappDigits(site, page), page: {
        path: slug === 'index' ? '/' : `/${slug}`, name: page.title || settings.siteName || DEFAULT_SITE_NAME, description: page.description || settings.defaultDescription || undefined,
        type: slug === 'blog' ? 'CollectionPage' : 'WebPage', image: uploadURL(page.featuredImage) || uploadURL(settings.shareImage),
        crumbs: [{ name: page.title, path: `/${slug}` }],
      },
    })) }} />
    <Interactions kind={KIND[slug] || 'legal'} />
  </>
}
