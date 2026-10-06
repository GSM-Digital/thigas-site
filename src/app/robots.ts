import type { MetadataRoute } from 'next'
import { ADMIN_ROUTE } from '@/lib/routes'
export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots {
  const url = process.env.SERVER_URL || 'http://localhost:3000'
  return { rules: { userAgent: '*', ...(process.env.SITE_ENV === 'production' ? { allow: '/', disallow: [ADMIN_ROUTE, '/api'] } : { disallow: '/' }) }, sitemap: `${url}/sitemap.xml` }
}
