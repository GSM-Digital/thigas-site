/**
 * Política de segurança de conteúdo (CSP) do site público.
 *
 * Os scripts são liberados por `nonce` (gerado a cada requisição em `src/proxy.ts`) com `strict-dynamic`: só roda o que o
 * próprio site carrega e o que esses scripts carregam (o GTM puxa GA4, Google Ads e as demais tags). As listas de endereços
 * abaixo valem para navegadores sem `strict-dynamic` e para imagens, conexões e quadros, que não usam nonce.
 * O painel (/gestao) e a API (/api) ficam fora: o painel do Payload injeta scripts próprios.
 */

const GOOGLE_SCRIPTS = [
  'https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://ssl.google-analytics.com',
  'https://www.googleadservices.com', 'https://googleads.g.doubleclick.net', 'https://pagead2.googlesyndication.com',
  'https://www.google.com', 'https://www.gstatic.com',
]
const CLARITY = ['https://www.clarity.ms', 'https://scripts.clarity.ms', 'https://*.clarity.ms', 'https://c.bing.com']
const GOOGLE_CONNECT = [
  'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://analytics.google.com', 'https://*.analytics.google.com',
  'https://*.googletagmanager.com', 'https://www.googleadservices.com', 'https://googleads.g.doubleclick.net', 'https://*.g.doubleclick.net',
  'https://pagead2.googlesyndication.com', 'https://www.google.com', 'https://www.google.com.br',
]
const GOOGLE_IMAGES = [
  'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com',
  'https://*.g.doubleclick.net', 'https://www.google.com', 'https://www.google.com.br', 'https://www.googleadservices.com',
  'https://pagead2.googlesyndication.com',
]
const YOUTUBE_FRAMES = ['https://www.youtube.com', 'https://www.youtube-nocookie.com']
const YOUTUBE_IMAGES = ['https://i.ytimg.com', 'https://*.ytimg.com']

/** Sites de clientes abertos na janela "ao vivo" da seção Projetos (public/js/projetos.js). tests/csp.test.mjs confere a lista. */
export const PORTFOLIO_ORIGINS = [
  'https://3ads.com.br', 'https://avusmotorsports.com.br', 'https://budaz.com.br', 'https://capadociamarista.com.br',
  'https://carloscosta.digital', 'https://comiva.com.br', 'https://gb4.com.br', 'https://jpmelo.com.br',
  'https://produtos.eqseguros.com.br', 'https://reshortensias.com.br', 'https://servicos.grupocesar.com.br', 'https://www.kravmagaasasul.com.br',
]

/** Origens (esquema + host) de uma lista de URLs ou endereços separados por vírgula; ignora o que não for http(s). */
export function origins(value?: string) {
  const result: string[] = []
  for (const item of (value || '').split(',')) {
    try {
      const url = new URL(item.trim())
      if (/^https?:$/.test(url.protocol)) result.push(url.origin)
    } catch { /* ignora entrada inválida */ }
  }
  return [...new Set(result)]
}

/**
 * `WEBHOOK_URL` (um ou mais endereços separados por vírgula) entra em connect-src e form-action.
 * `CSP_EXTRA_CONNECT` e `CSP_EXTRA_FRAME` liberam outros destinos sem mexer no código.
 */
export function buildCSP(nonce: string, env: Record<string, string | undefined> = process.env) {
  const dev = env.NODE_ENV === 'development'
  const webhooks = origins(env.WEBHOOK_URL)
  const unique = (list: string[]) => [...new Set(list)].join(' ')
  const directives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': unique(["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...GOOGLE_SCRIPTS, ...CLARITY, ...(dev ? ["'unsafe-eval'"] : [])]),
    // Estilos em linha: o layout do protótipo usa atributos style, e GTM/Clarity injetam <style>. Scripts continuam só com nonce.
    'style-src': "'self' 'unsafe-inline'",
    'img-src': unique(["'self'", 'data:', 'blob:', 'https://*.public.blob.vercel-storage.com', ...GOOGLE_IMAGES, ...CLARITY, ...YOUTUBE_IMAGES]),
    'font-src': "'self' data:",
    'media-src': "'self' data: blob:",
    'connect-src': unique(["'self'", ...GOOGLE_CONNECT, ...CLARITY, ...webhooks, ...origins(env.CSP_EXTRA_CONNECT), ...(dev ? ['ws:', 'wss:'] : [])]),
    'frame-src': unique(["'self'", 'https://www.googletagmanager.com', 'https://td.doubleclick.net', 'https://bid.g.doubleclick.net', ...YOUTUBE_FRAMES, ...PORTFOLIO_ORIGINS, ...origins(env.CSP_EXTRA_FRAME)]),
    'worker-src': "'self' blob:",
    'manifest-src': "'self'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': unique(["'self'", 'https://wa.me', 'https://api.whatsapp.com', ...webhooks]),
    'frame-ancestors': "'self'",
  }
  if (!dev) directives['upgrade-insecure-requests'] = ''
  return Object.entries(directives).map(([name, value]) => (value ? `${name} ${value}` : name)).join('; ')
}

/** `CSP_MODE=report-only` só registra as violações no console, sem bloquear: útil para testar um novo domínio. */
export const cspHeaderName = (env: Record<string, string | undefined> = process.env) =>
  env.CSP_MODE === 'report-only' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
