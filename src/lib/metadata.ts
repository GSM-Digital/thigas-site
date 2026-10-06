import type { Metadata, Viewport } from 'next'
import { getSettings, uploadURL } from './content'
import { DEFAULT_SITE_NAME } from './site-title'
import { openGraph } from './share'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', colorScheme: 'light dark', themeColor: '#F5F5F7' }

/** Padrões do site inteiro; cada página sobrescreve título e descrição. */
export async function defaultMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const favicon = uploadURL(settings.favicon)
  return {
    metadataBase: new URL(process.env.SERVER_URL || 'http://localhost:3000'),
    robots: process.env.SITE_ENV === 'production' ? { index: true, follow: true } : { index: false, follow: false },
    title: settings.siteName?.trim() || DEFAULT_SITE_NAME,
    description: settings.defaultDescription || undefined,
    icons: favicon ? { icon: favicon } : { icon: [{ url: '/img/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/img/favicon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/img/apple-touch-icon.png' },
    openGraph: openGraph(settings),
    twitter: { card: 'summary_large_image' },
  }
}
