import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'

export default withPayload({
  // `standalone` é para o Docker; a Vercel monta o próprio pacote.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // O libsql escolhe o binário nativo do sistema em tempo de execução (@libsql/linux-x64-gnu, darwin-arm64…); o rastreador
  // do Next não vê essa escolha e o build standalone ficaria sem ele. Inclui o que o `npm ci` instalou para esta plataforma.
  outputFileTracingIncludes: { '/**': ['./node_modules/libsql/**/*', './node_modules/@libsql/**/*'] },
  devIndicators: false,
  turbopack: { root: path.resolve('.') },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      // A antiga página fixa de artigo virou o modelo dos posts; cada post tem seu endereço em /blog/…
      { source: '/artigo.html', destination: '/blog', permanent: true },
      { source: '/artigo', destination: '/blog', permanent: true },
      { source: '/:page.html', destination: '/:page', permanent: true },
    ]
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ] }]
  },
}, { devBundleServerPackages: false })
