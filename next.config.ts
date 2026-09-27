import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(process.cwd()) },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
}

export default withPayload(nextConfig)
