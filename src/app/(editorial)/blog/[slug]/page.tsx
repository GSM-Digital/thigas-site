import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArticleContent, Related } from '@/components/Blog/Article'
import { Interactions } from '@/components/Interactions'
import { Template } from '@/components/Template'
import { chrome, getCMS, getPageContent, getPost, getPosts, getSettings, getSiteContent, templates, uploadURL } from '@/lib/content'
import { coverURL, plainText, toCard } from '@/lib/blog'
import { openGraph } from '@/lib/share'
import { DEFAULT_SITE_NAME, pageTitle } from '@/lib/site-title'

export const dynamic = 'force-dynamic'
type Args = { params: Promise<{ slug: string }>; searchParams: Promise<{ previa?: string }> }

/** Com ?previa=1 e login no painel, mostra também o rascunho (botão "Prévia" do post). */
async function load({ params, searchParams }: Args) {
  const { slug } = await params
  const { previa } = await searchParams
  const user = previa ? (await (await getCMS()).auth({ headers: await headers() })).user : null
  return { post: await getPost(decodeURIComponent(slug), user), preview: Boolean(user) }
}

export async function generateMetadata(args: Args) {
  const [{ post, preview }, settings] = await Promise.all([load(args), getSettings()])
  if (!post) return { title: 'Post não encontrado' }
  const title = pageTitle(post.seoTitle || post.title, settings.siteName || '', 'post')
  const description = post.seoDescription || post.excerpt || plainText(post.content).replace(/\s+/g, ' ').trim().slice(0, 156) || settings.defaultDescription || undefined
  const url = `/blog/${post.slug}`
  const image = coverURL(post)
  return {
    title, description, alternates: { canonical: url },
    ...(preview ? { robots: { index: false, follow: false } } : {}),
    openGraph: { ...openGraph(settings, { title, description, url }), type: 'article' as const,
      ...(image ? { images: [image] } : {}), publishedTime: post.publishedAt, modifiedTime: post.updatedAt, authors: post.authorName ? [post.authorName] : undefined },
  }
}

export default async function BlogPost(args: Args) {
  const { post, preview } = await load(args)
  const template = templates.find((item) => item.slug === 'post')
  if (!post || !template) notFound()
  const [page, site, settings, posts] = await Promise.all([getPageContent('post'), getSiteContent(), getSettings(), getPosts()])
  if (!page) notFound()
  // "Leia também": primeiro os da mesma categoria, depois os mais recentes.
  const categoryId = (value: typeof post.category) => typeof value === 'object' && value ? value.id : value
  const related = posts.filter((item) => item.id !== post.id)
    .sort((a, b) => Number(categoryId(b.category) === categoryId(post.category)) - Number(categoryId(a.category) === categoryId(post.category)))
    .slice(0, 6).map(toCard)
  const logoURL = uploadURL(settings.logo)
  const logo = logoURL ? { url: logoURL, alt: settings.siteName?.trim() || DEFAULT_SITE_NAME } : undefined
  const origin = process.env.SERVER_URL || 'http://localhost:3000'
  const cover = coverURL(post)
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.excerpt || undefined,
    image: cover ? new URL(cover, origin).href : undefined, datePublished: post.publishedAt, dateModified: post.updatedAt,
    author: { '@type': 'Person', name: post.authorName }, mainEntityOfPage: `${origin}/blog/${encodeURIComponent(post.slug)}`,
  }).replace(/</g, '\\u003c')
  return <>
    <link rel="stylesheet" href="/css/editorial.css" precedence="default" />
    <Template nodes={chrome.header} content={site} offHome current="/blog" anchors={{ '#blog': '/blog' }} logo={logo} />
    {preview && post._status !== 'published' && <div className="blog-preview-bar">Prévia do rascunho: este post ainda não está publicado.</div>}
    <Template nodes={template.body} content={page} slots={{ article: <ArticleContent post={post} />, related: related.length ? <Related posts={related} /> : null }} emptySlots={related.length ? [] : ['related']} />
    <Template nodes={chrome.footer} content={site} offHome anchors={{ '#blog': '/blog' }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
    <Interactions kind="article" />
  </>
}
