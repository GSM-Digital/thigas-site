import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { buildCSP, cspHeaderName, origins, PORTFOLIO_ORIGINS } from '../src/lib/csp.ts'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const directive = (csp, name) => csp.split('; ').find((part) => part.startsWith(`${name} `)) || ''

test('CSP only lets scripts run with the request nonce and never allows inline or eval in production', () => {
  const csp = buildCSP('abc123', { NODE_ENV: 'production' })
  const script = directive(csp, 'script-src')
  assert.match(script, /'nonce-abc123'/)
  assert.match(script, /'strict-dynamic'/)
  assert.doesNotMatch(script, /'unsafe-inline'|'unsafe-eval'/)
  assert.match(directive(csp, 'object-src'), /'none'/)
  assert.match(directive(csp, 'base-uri'), /'self'/)
  assert.match(directive(csp, 'frame-ancestors'), /'self'/)
  assert.match(csp, /upgrade-insecure-requests/)
})

test('CSP allows the Google, YouTube and Clarity services the site integrates with', () => {
  const csp = buildCSP('n', { NODE_ENV: 'production' })
  for (const host of ['https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://www.googleadservices.com', 'https://googleads.g.doubleclick.net', 'https://www.clarity.ms']) {
    assert.ok(directive(csp, 'script-src').includes(host), `script-src sem ${host}`)
  }
  for (const host of ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com', 'https://*.g.doubleclick.net', 'https://*.clarity.ms']) {
    assert.ok(directive(csp, 'connect-src').includes(host), `connect-src sem ${host}`)
  }
  for (const host of ['https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://www.googletagmanager.com']) {
    assert.ok(directive(csp, 'frame-src').includes(host), `frame-src sem ${host}`)
  }
  assert.ok(directive(csp, 'img-src').includes('https://*.public.blob.vercel-storage.com'), 'imagens do Vercel Blob bloqueadas')
})

test('CSP lets the webhook (WEBHOOK_URL) receive data and nothing else leaves the site', () => {
  const csp = buildCSP('n', { NODE_ENV: 'production', WEBHOOK_URL: 'https://hooks.example.com/lead?token=1, https://n8n.example.org/webhook/x', CSP_EXTRA_CONNECT: 'https://api.example.net/v1' })
  for (const host of ['https://hooks.example.com', 'https://n8n.example.org', 'https://api.example.net']) assert.ok(directive(csp, 'connect-src').includes(host), host)
  assert.ok(directive(csp, 'form-action').includes('https://hooks.example.com'))
  assert.ok(!directive(csp, 'connect-src').includes('/lead'), 'só a origem entra, nunca o caminho nem o token')
  assert.deepEqual(origins('not a url, ftp://x.com, http://ok.test/a'), ['http://ok.test'])
  assert.ok(!directive(buildCSP('n', { NODE_ENV: 'production' }), 'connect-src').includes('hooks.example.com'))
})

test('CSP in development allows what the Next dev server needs, and report-only mode is selectable', () => {
  assert.match(directive(buildCSP('n', { NODE_ENV: 'development' }), 'script-src'), /'unsafe-eval'/)
  assert.equal(cspHeaderName({ CSP_MODE: 'report-only' }), 'Content-Security-Policy-Report-Only')
  assert.equal(cspHeaderName({}), 'Content-Security-Policy')
})

test('every client site opened in the live project window is allowed to be framed by the CSP', () => {
  const hosts = [...read('public/js/projetos.js').matchAll(/url:\s*'(https:\/\/[^']+)'/g)].map((match) => new URL(match[1]).origin)
  assert.ok(hosts.length >= 10)
  for (const host of hosts) assert.ok(PORTFOLIO_ORIGINS.includes(host), `${host} falta em PORTFOLIO_ORIGINS (src/lib/csp.ts)`)
})

test('the SEO defaults fit what Google shows (title up to 65 characters with the name, description up to 160)', () => {
  const source = read('src/cms/seo-defaults.ts')
  const titles = [...source.matchAll(/title: '([^']+)'/g)].map((match) => match[1])
  const descriptions = [...source.matchAll(/description: '([^']+)'/g)].map((match) => match[1])
  assert.ok(titles.length >= 2 && descriptions.length >= 2)
  for (const title of titles) assert.ok(`Thiago Barreto | ${title}`.length <= 65 && title.length >= 20, title)
  for (const description of descriptions) assert.ok(description.length >= 100 && description.length <= 160, `${description.length}: ${description}`)
})

test('the site ships sitemap, robots, llms.txt (and llm.txt) and keeps the hero title server-rendered', () => {
  for (const file of ['src/app/sitemap.ts', 'src/app/robots.ts', 'src/app/llms.txt/route.ts', 'src/app/llms-full.txt/route.ts']) assert.ok(fs.existsSync(path.join(root, file)), file)
  assert.match(read('next.config.mjs'), /source: '\/llm\.txt', destination: '\/llms\.txt'/)
  assert.match(read('src/components/Template/index.tsx'), /data-split/)
  assert.match(read('src/lib/seo.ts'), /ProfessionalService/)
})

test('the global scripts of the measurement tags never reuse an id that becomes window.clarity or window.gtm', () => {
  const source = read('src/components/Analytics/Deferred.tsx') + read('src/components/Analytics/index.tsx')
  assert.doesNotMatch(source, /\bid=["'](clarity|gtm|gtag|dataLayer)["']/)
})

test('every published article has a futuristic 1600x900 cover with a description', async () => {
  const { default: sharp } = await import('sharp')
  const { COVER_ALT, coverFile } = await import('../src/cms/covers.ts')
  const slugs = JSON.parse(read('src/generated/articles.json')).map((article) => article.slug)
  assert.equal(slugs.length, 6)
  for (const slug of slugs) {
    assert.ok(COVER_ALT[slug] && COVER_ALT[slug].length > 40, `${slug} sem descrição da capa`)
    const meta = await sharp(coverFile(slug)).metadata()
    assert.deepEqual([meta.width, meta.height, meta.format], [1600, 900, 'webp'], slug)
    assert.ok(fs.statSync(coverFile(slug)).size < 150 * 1024, `${slug} pesada demais`)
  }
})
