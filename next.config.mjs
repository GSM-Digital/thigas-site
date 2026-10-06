import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'

/** Um ano, para arquivos que nunca mudam no mesmo endereço. */
const FOREVER = 'public, max-age=31536000, immutable'
const IMMUTABLE_NAMES = (source) => ({ source, headers: [{ key: 'Cache-Control', value: FOREVER }] })

const config = withPayload({
  // `standalone` é para o Docker; a Vercel monta o próprio pacote.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // O libsql escolhe o binário nativo do sistema em tempo de execução (@libsql/linux-x64-gnu, darwin-arm64…); o rastreador
  // do Next não vê essa escolha e o build standalone ficaria sem ele. Inclui o que o `npm ci` instalou para esta plataforma.
  outputFileTracingIncludes: { '/**': ['./node_modules/libsql/**/*', './node_modules/@libsql/**/*'] },
  devIndicators: false,
  // CSS do próprio Next (ajustes do site, template) vai dentro do HTML: menos um pedido antes da primeira pintura.
  experimental: { inlineCss: true },
  turbopack: { root: path.resolve('.') },
  // Versão dos arquivos de public/ (veja src/lib/assets.ts): o commit na Vercel, ou a hora do build em outros lugares.
  env: { NEXT_PUBLIC_ASSET_VERSION: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Date.now().toString(36) },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      // A antiga página fixa de artigo virou o modelo dos posts; cada post tem seu endereço em /blog/…
      { source: '/artigo.html', destination: '/blog', permanent: true },
      { source: '/artigo', destination: '/blog', permanent: true },
      { source: '/:page.html', destination: '/:page', permanent: true },
    ]
  },
  async rewrites() {
    // Quem procura "llm.txt" encontra o mesmo arquivo do padrão llms.txt.
    return [{ source: '/llm.txt', destination: '/llms.txt' }]
  },
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
      ] },
      // CSS e JS entram com ?v=<versão do build> (src/lib/assets.ts): cada deploy troca o endereço, então podem ficar um ano em cache.
      ...['/css/:file*', '/js/:file*'].map((source) => ({ source, has: [{ type: 'query', key: 'v' }], headers: [{ key: 'Cache-Control', value: FOREVER }] })),
      IMMUTABLE_NAMES('/fonts/:file*'),
      { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }] },
      { source: '/sims/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=86400' }] },
    ]
  },
}, { devBundleServerPackages: false })

// O Payload acrescenta Accept-CH/Critical-CH (tema do painel) a todas as rotas. O Critical-CH faz o Chrome repetir a primeira
// visita ao site ("evite vários redirecionamentos", ~800 ms no PageSpeed). O site público não usa essa dica, então sai.
const payloadHeaders = config.headers
config.headers = async () => (await payloadHeaders()).map((rule) => ({
  ...rule,
  headers: rule.headers.filter((header) => !/^(accept-ch|critical-ch)$/i.test(header.key) && !(/^vary$/i.test(header.key) && /sec-ch/i.test(header.value))),
})).filter((rule) => rule.headers.length)

export default config
