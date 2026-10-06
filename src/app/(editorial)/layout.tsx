import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Document } from '@/components/Document'
import { defaultMetadata, viewport as defaultViewport } from '@/lib/metadata'

export const viewport: Viewport = defaultViewport
export async function generateMetadata(): Promise<Metadata> { return defaultMetadata() }
/** O blog e os artigos usam o fundo e o menu marcado do layout editorial (`body.editorial-page`). */
export default function Layout({ children }: { children: ReactNode }) {
  return <Document bodyClass="editorial-page">{children}</Document>
}
