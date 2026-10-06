import { SitePage } from '@/components/SitePage'
import { getPageContent, getSettings } from '@/lib/content'
import { pageTitle } from '@/lib/site-title'
import { openGraph } from '@/lib/share'
export const dynamic = 'force-dynamic'
export async function generateMetadata() {
  const [page, settings] = await Promise.all([getPageContent('blog'), getSettings()])
  const title = pageTitle(page?.title, settings.siteName || '', 'blog')
  const description = page?.description || settings.defaultDescription || undefined
  return { title, description, openGraph: openGraph(settings, { title, description, url: '/blog', image: page?.featuredImage }), alternates: { canonical: '/blog' } }
}
export default function Blog() { return <SitePage slug="blog" /> }
