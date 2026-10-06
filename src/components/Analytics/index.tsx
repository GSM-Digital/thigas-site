import { Deferred, type DeferredScript } from './Deferred'

/**
 * Medição e monitoramento, carregados pelo componente Deferred (depois da primeira interação ou de uma pausa depois do
 * carregamento) e com o nonce da CSP (src/lib/csp.ts).
 *
 *  - Microsoft Clarity: `CLARITY_ID` (padrão: o projeto do site).
 *  - Google Tag Manager: `GTM_ID` (GTM-XXXXXXX). As tags de GA4 e Google Ads ficam dentro do GTM.
 *  - Sem GTM, `GA_ID` (G-XXXXXXXXXX) e `GOOGLE_ADS_ID` (AW-XXXXXXXXX) carregam o gtag.js direto.
 *
 * Os `id` dos scripts não podem ser o nome de uma variável global (clarity, gtm…): o navegador expõe elementos com id
 * em `window`, e isso quebrava `window.clarity`. Por isso o id fica só em `data-measure`, sem virar global.
 *
 * Só roda em produção (`SITE_ENV=production`): prévia e testes não sujam os números. Os IDs são lidos no servidor, a cada
 * requisição, então trocar a variável na Vercel e fazer redeploy basta.
 */
const DEFAULT_CLARITY_ID = 'yt9tl6z48z'
const ID = { gtm: /^GTM-[A-Z0-9]{4,12}$/, ga: /^G-[A-Z0-9]{6,14}$/, ads: /^AW-\d{6,14}$/, clarity: /^[a-z0-9]{6,16}$/i }

export function analyticsIds(env: Record<string, string | undefined> = process.env) {
  const pick = (value: string | undefined, rule: RegExp) => (value && rule.test(value.trim()) ? value.trim() : undefined)
  const live = env.SITE_ENV === 'production'
  return {
    live,
    gtm: live ? pick(env.GTM_ID, ID.gtm) : undefined,
    ga: live ? pick(env.GA_ID, ID.ga) : undefined,
    ads: live ? pick(env.GOOGLE_ADS_ID, ID.ads) : undefined,
    clarity: live ? pick(env.CLARITY_ID || DEFAULT_CLARITY_ID, ID.clarity) : undefined,
  }
}

/** Os scripts de medição, na ordem em que entram. GTM e gtag (conversões e visitas) antes do Clarity (gravações e mapas de calor). */
export function measurementScripts(ids = analyticsIds()): DeferredScript[] {
  const { gtm, ga, ads, clarity } = ids
  const list: DeferredScript[] = []
  if (gtm) {
    list.push({ id: 'gtm', after: 3500, code:
      `window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});(function(w,d,s,i){var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f)})(window,document,'script',${JSON.stringify(gtm)});` })
  } else if (ga || ads) {
    list.push({ id: 'gtag-src', after: 3500, src: `https://www.googletagmanager.com/gtag/js?id=${ga || ads}` })
    list.push({ id: 'gtag', after: 3500, code:
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());${[ga, ads].filter(Boolean).map((id) => `gtag('config',${JSON.stringify(id)});`).join('')}` })
  }
  if (clarity) {
    list.push({ id: 'clarity', after: 6000, code:
      `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",${JSON.stringify(clarity)});` })
  }
  return list
}

export function Analytics({ nonce }: { nonce?: string }) {
  const scripts = measurementScripts()
  return scripts.length ? <Deferred scripts={scripts} nonce={nonce} /> : null
}

/** Parte do GTM para quem navega sem JavaScript; vai logo depois de abrir o <body>. */
export function AnalyticsNoscript() {
  const { gtm } = analyticsIds()
  if (!gtm) return null
  return <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} title="Google Tag Manager" /></noscript>
}
