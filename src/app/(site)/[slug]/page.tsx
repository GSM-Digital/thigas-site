import { redirect } from 'next/navigation'
import { SitePage } from '@/components/SitePage'
import { getPageContent, getSettings } from '@/lib/content'
import { pageTitle } from '@/lib/site-title'
import { openGraph } from '@/lib/share'
export const dynamic = 'force-dynamic'
type Args = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Args) {
  const { slug } = await params
  const [page, settings] = await Promise.all([getPageContent(slug), getSettings()])
  const title = pageTitle(page?.title, settings.siteName || '', slug)
  const description = page?.description || settings.defaultDescription || undefined
  return { title, description, openGraph: openGraph(settings, { title, description, url: `/${slug}`, image: page?.featuredImage }), alternates: { canonical: `/${slug}` } }
}
export default async function Page({ params }: Args) {
  const { slug } = await params
  // `post` é só o modelo dos artigos (cada post tem seu endereço em /blog/…) e `index` é a página inicial.
  if (slug === 'post') redirect('/blog')
  if (slug === 'index') redirect('/')
  return <SitePage slug={slug} />
}
