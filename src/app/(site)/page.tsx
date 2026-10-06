import { SitePage } from '@/components/SitePage'
import { getPageContent, getSettings } from '@/lib/content'
import { pageTitle } from '@/lib/site-title'
import { openGraph } from '@/lib/share'
export const dynamic = 'force-dynamic'
export async function generateMetadata() {
  const [page, settings] = await Promise.all([getPageContent('index'), getSettings()])
  const title = pageTitle(page?.title, settings.siteName || '', 'index')
  const description = page?.description || settings.defaultDescription || undefined
  return { title, description, openGraph: openGraph(settings, { title, description, url: '/', image: page?.featuredImage }), alternates: { canonical: '/', languages: { 'pt-BR': '/' } } }
}
export default function Home() { return <SitePage slug="index" /> }
