import { getPayload } from 'payload'
import config from '../src/payload.config'
import { scopeFor } from '../src/components/admin/content-map'
import { analyse, pageSnapshot, postSnapshot } from '../src/lib/seo-analysis'
import { pageTitle } from '../src/lib/site-title'

/**
 * Relatório de SEO no terminal: roda a mesma "Análise de SEO" do painel em todas as páginas e artigos publicados.
 *   npm run seo:report          (mostra o que não está "Bom")
 *   npm run seo:report -- --all (mostra todas as verificações)
 * Sai com erro se alguma verificação estiver em "Precisa de atenção".
 */
process.env.PAYLOAD_SKIP_SEED = '1'
const payload = await getPayload({ config })
const all = process.argv.includes('--all')
const settings = await payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: true })
const pages = await payload.find({ collection: 'pages', limit: 100, depth: 0, overrideAccess: true })
const posts = await payload.find({ collection: 'posts', limit: 200, depth: 0, overrideAccess: true, where: { _status: { equals: 'published' } } })

const keyphrases = new Map<string, string[]>()
const rows: { kind: string; name: string; slug: string; keyphrase: string; checks: ReturnType<typeof analyse>; fullTitle: string }[] = []
for (const page of pages.docs.filter((p) => p.slug !== 'post')) {
  const copy = (page.copy || []).map((item: { key: string; value: string }) => ({ key: item.key, value: item.value }))
  const alts = (page.images || []).map((item: { alt?: string | null }) => item.alt || '')
  const data = pageSnapshot({ slug: page.slug, keyphrase: page.focusKeyphrase || '', title: page.title, description: page.description || '', featured: Boolean(page.featuredImage), copy, alts, scope: scopeFor(page.slug) })
  const fullTitle = pageTitle(data.title, settings.siteName || '', page.slug)
  rows.push({ kind: 'página', name: page.title, slug: page.slug, keyphrase: data.keyphrase, fullTitle, checks: [] })
  ;(keyphrases.get(data.keyphrase) || keyphrases.set(data.keyphrase, []).get(data.keyphrase)!).push(`página ${page.slug}`)
  rows[rows.length - 1].checks = analyse(data, fullTitle, data.description.trim(), Boolean(settings.shareImage), [])
}
for (const post of posts.docs) {
  const data = postSnapshot({ slug: post.slug, keyphrase: post.focusKeyphrase || '', seoTitle: post.seoTitle || '', title: post.title, seoDescription: post.seoDescription || '', excerpt: post.excerpt || '', featured: Boolean(post.featuredImage), content: post.content })
  const fullTitle = pageTitle(data.title, settings.siteName || '', 'post')
  rows.push({ kind: 'artigo', name: post.title, slug: post.slug, keyphrase: data.keyphrase, fullTitle, checks: analyse(data, fullTitle, data.description.trim(), Boolean(settings.shareImage), []) })
  ;(keyphrases.get(data.keyphrase) || keyphrases.set(data.keyphrase, []).get(data.keyphrase)!).push(`artigo ${post.slug}`)
}

let bad = 0
const mark = { good: '✔', ok: '•', bad: '✖' }
for (const row of rows) {
  const duplicated = row.keyphrase && (keyphrases.get(row.keyphrase)?.length || 0) > 1
  const checks = duplicated ? [...row.checks, { status: 'ok' as const, text: `A frase-chave "${row.keyphrase}" se repete em: ${keyphrases.get(row.keyphrase)!.join(', ')}.` }] : row.checks
  const score = checks.some((c) => c.status === 'bad') ? 'PRECISA DE ATENÇÃO' : checks.some((c) => c.status === 'ok') ? 'pode melhorar' : 'BOM'
  if (checks.some((c) => c.status === 'bad')) bad += 1
  console.log(`\n${row.kind} · ${row.slug} · ${score}\n  título: ${row.fullTitle} (${row.fullTitle.length}) · frase-chave: ${row.keyphrase || '—'}`)
  for (const check of checks) if (all || check.status !== 'good') console.log(`  ${mark[check.status]} ${check.text}`)
}
console.log(`\n${rows.length} itens analisados, ${bad} com problema.`)
await payload.destroy()
process.exit(bad ? 1 : 0)
