import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Document } from '@/components/Document'
import { defaultMetadata, viewport as defaultViewport } from '@/lib/metadata'

export const viewport: Viewport = defaultViewport
export async function generateMetadata(): Promise<Metadata> { return defaultMetadata() }
export default function Layout({ children }: { children: ReactNode }) {
  return <Document>{children}</Document>
}
