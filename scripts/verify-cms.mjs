import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { load } from 'cheerio'

/**
 * Teste do painel de ponta a ponta contra um servidor rodando, sem navegador:
 * cadastro do primeiro usuário, edição de texto, link, imagem, configurações do site, cabeçalho e
 * post (rascunho, prévia, publicação, agendamento), permissões e restauração do conteúdo.
 *
 * EXCLUSIVO de um ambiente local de teste SEM usuários: cria e remove uma conta temporária.
 * Não execute em ambiente de cliente.   node scripts/verify-cms.mjs http://localhost:3000
 */
const base = process.argv[2] || 'http://localhost:3000'
const root = path.resolve(import.meta.dirname, '..')
const email = `teste-${Date.now()}@example.invalid`
const password = randomBytes(24).toString('base64url')
let cookie = ''

const call = async (method, url, body, { headers = {}, form } = {}) => {
  const response = await fetch(base + url, {
    method, redirect: 'manual',
    headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...(body && !form ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: form || (body ? JSON.stringify(body) : undefined),
  })
  const set = response.headers.getSetCookie?.() || []
  const token = set.map((item) => item.split(';')[0]).find((item) => item.startsWith('payload-token='))
  if (token) cookie = token
  return response
}
const json = async (method, url, body, options) => {
  const response = await call(method, url, body, options)
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}
const anonymous = async (url, options = {}) => fetch(base + url, { redirect: 'manual', headers: { Origin: base }, ...options })

/** Uma linha por elemento e por texto: dá para ver exatamente o que mudou entre duas versões da página. */
function lines(html) {
  const $ = load(html)
  $('script, style, noscript, link, meta, title').remove()
  $('div[hidden]').filter((_, el) => !Object.keys(el.attribs).some((name) => name !== 'hidden')).remove()
  const out = []
  const walk = (node) => {
    if (node.type === 'text') { const text = node.data.replace(/\s+/g, ' ').trim(); if (text) out.push(`"${text}"`); return }
    if (!node.name) return
    out.push(`<${node.name} ${Object.entries(node.attribs || {}).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}="${v}"`).join(' ')}>`)
    const kids = node.name === 'template' && node.children[0] && !node.children[0].name ? node.children[0].children : node.children
    ;(kids || []).forEach(walk)
  }
  $('body').contents().toArray().forEach(walk)
  return out
}
const page = async (url) => lines(await (await anonymous(url)).text())
const changed = (before, after) => {
  const count = (list) => list.reduce((map, line) => map.set(line, (map.get(line) || 0) + 1), new Map())
  const a = count(before), b = count(after)
  return {
    removed: [...a].flatMap(([line, n]) => Array(Math.max(0, n - (b.get(line) || 0))).fill(line)),
    added: [...b].flatMap(([line, n]) => Array(Math.max(0, n - (a.get(line) || 0))).fill(line)),
  }
}
const titleOf = async (url) => load(await (await anonymous(url)).text())('title').text()
const paragraph = (text) => ({ root: { type: 'root', direction: null, format: '', indent: 0, version: 1, children: [{ type: 'paragraph', direction: null, format: '', indent: 0, version: 1, textFormat: 0, textStyle: '', children: [{ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text }] }] } })

const PAGES = ['/', '/blog', '/privacidade', '/termos', '/cookies']
const baseline = Object.fromEntries(await Promise.all(PAGES.map(async (url) => [url, await page(url)])))
const baselineTitles = { home: await titleOf('/'), blog: await titleOf('/blog') }
const cleanup = []
let userId
try {
  // 1. Primeiro usuário: vira administrador; sem ele, nenhuma edição é aceita.
  const denied = await anonymous('/api/pages/1', { method: 'PATCH', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Não autorizado' }) })
  assert.ok([401, 403].includes(denied.status), `edição anônima deveria ser recusada (${denied.status})`)
  const first = await json('POST', '/api/users/first-register', { name: 'Teste temporário', email, password })
  assert.equal(first.status, 200, JSON.stringify(first.data))
  userId = first.data.user.id
  assert.equal(first.data.user.role, 'admin', 'o primeiro usuário precisa ser administrador')
  const again = await anonymous('/api/users/first-register', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Intruso', email: 'x@example.invalid', password: 'x'.repeat(16) }) })
  assert.ok(again.status >= 400, 'não pode haver segundo cadastro aberto')
  const login = await json('POST', '/api/users/login', { email, password })
  assert.equal(login.status, 200)

  // 2. Texto: muda uma frase da página inicial e confere que só ela mudou.
  const home = (await json('GET', '/api/pages?where[slug][equals]=index&limit=1&depth=0')).data.docs[0]
  const hero = home.copy.find((entry) => entry.value.includes('Construídos'))
  assert.ok(hero, 'texto do hero não encontrado')
  const copy = structuredClone(home.copy)
  copy.find((entry) => entry.key === hero.key).value = 'Texto editado pelo painel'
  assert.equal((await json('PATCH', `/api/pages/${home.id}`, { copy })).status, 200)
  cleanup.push(() => json('PATCH', `/api/pages/${home.id}`, { copy: home.copy, links: home.links, images: home.images }))
  let diff = changed(baseline['/'], await page('/'))
  assert.deepEqual(diff.added, ['"Texto editado pelo painel"'])
  assert.equal(diff.removed.length, 1)
  for (const url of PAGES.slice(1)) assert.deepEqual(changed(baseline[url], await page(url)), { removed: [], added: [] }, `${url} não deveria mudar`)

  // 3. Link: o destino de um botão muda, o texto dele continua.
  const link = home.links.find((entry) => entry.href === '#projetos')
  assert.ok(link, 'link do hero não encontrado')
  const links = structuredClone(home.links)
  links.find((entry) => entry.key === link.key).href = '/blog'
  assert.equal((await json('PATCH', `/api/pages/${home.id}`, { links })).status, 200)
  diff = changed(baseline['/'], await page('/'))
  assert.ok(diff.added.some((line) => line.includes('href="/blog"')), 'link novo não apareceu')
  const bad = await json('PATCH', `/api/pages/${home.id}`, { links: links.map((entry) => ({ ...entry, href: entry.key === link.key ? 'javascript:alert(1)' : entry.href })) })
  assert.equal(bad.status, 400, 'link perigoso deveria ser recusado')

  // 4. Imagem: sobe uma da biblioteca e troca a foto da seção Sobre; a descrição é obrigatória.
  const cover = path.join(root, 'public/img/blog/artigos/como-escolher-web-designer.webp')
  const noAlt = new FormData(); noAlt.append('file', new Blob([fs.readFileSync(cover)], { type: 'image/webp' }), 'teste.webp'); noAlt.append('_payload', JSON.stringify({}))
  assert.equal((await json('POST', '/api/media', undefined, { form: noAlt })).status, 400, 'upload sem descrição deveria ser recusado')
  const form = new FormData(); form.append('file', new Blob([fs.readFileSync(cover)], { type: 'image/webp' }), 'teste-painel.webp'); form.append('_payload', JSON.stringify({ alt: 'Imagem de teste' }))
  const upload = await json('POST', '/api/media', undefined, { form })
  assert.equal(upload.status, 201, JSON.stringify(upload.data))
  const media = upload.data.doc
  cleanup.push(() => json('DELETE', `/api/media/${media.id}`))
  const about = home.images.find((entry) => entry.src.includes('thiago-barreto.webp'))
  assert.ok(about, 'foto do Sobre não encontrada')
  const images = structuredClone(home.images)
  Object.assign(images.find((entry) => entry.key === about.key), { media: media.id, alt: 'Nova descrição da foto' })
  assert.equal((await json('PATCH', `/api/pages/${home.id}`, { images })).status, 200)
  diff = changed(baseline['/'], await page('/'))
  assert.ok(diff.added.some((line) => line.includes('/api/media/file/teste-painel') && line.includes('Nova descrição da foto')), 'imagem trocada não apareceu')

  // 5. Configurações do site: o nome entra no título de todas as páginas, sem repetir nos títulos salvos.
  const settings = (await json('GET', '/api/globals/settings')).data
  assert.equal((await json('POST', '/api/globals/settings', { siteName: 'Nome de Teste', defaultDescription: 'Descrição de teste', favicon: media.id, shareImage: media.id })).status, 200)
  cleanup.push(() => json('POST', '/api/globals/settings', { siteName: settings.siteName, defaultDescription: settings.defaultDescription ?? null, favicon: null, shareImage: null, logo: null }))
  assert.match(await titleOf('/'), /^Nome de Teste \| /)
  assert.match(await titleOf('/blog'), /^Blog \| Nome de Teste$/)
  const html = load(await (await anonymous('/blog')).text())
  assert.equal(html('meta[property="og:site_name"]').attr('content'), 'Nome de Teste')
  assert.equal(html('meta[property="og:locale"]').attr('content'), 'pt_BR')
  assert.ok(html('meta[property="og:image"]').attr('content')?.includes('teste-painel'), 'imagem de compartilhamento ausente')
  assert.equal(html('meta[name="twitter:card"]').attr('content'), 'summary_large_image')
  assert.ok(html('link[rel~="icon"]').attr('href')?.includes('teste-painel'), 'favicon do painel ausente')
  assert.equal((await json('POST', '/api/globals/settings', { logo: media.id })).status, 200)
  assert.ok((await page('/')).some((line) => line.includes('class="brand-logo"')), 'logo do painel ausente no cabeçalho')
  await json('POST', '/api/globals/settings', { logo: null })

  // 6. Cabeçalho e rodapé: uma edição vale para a inicial e para as outras páginas.
  const site = (await json('GET', '/api/globals/site?depth=0')).data
  const menu = site.copy.find((entry) => entry.value.trim() === 'Soluções')
  assert.ok(menu, 'item de menu não encontrado')
  const siteCopy = structuredClone(site.copy)
  siteCopy.find((entry) => entry.key === menu.key).value = 'Serviços'
  assert.equal((await json('POST', '/api/globals/site', { copy: siteCopy })).status, 200)
  cleanup.push(() => json('POST', '/api/globals/site', { copy: site.copy }))
  for (const url of ['/', '/blog']) assert.ok((await page(url)).includes('"Serviços"'), `menu novo não apareceu em ${url}`)
  assert.deepEqual((await page('/privacidade')).includes('"Serviços"'), false, 'a página legal tem cabeçalho próprio')

  // 7. Posts: rascunho invisível, prévia só logado, publicação, agendamento e remoção.
  const categories = (await json('GET', '/api/categories?limit=5')).data.docs
  const post = { title: 'Post de teste do painel', category: categories[0].id, authorName: 'Teste', excerpt: 'Resumo do post de teste.', content: paragraph('Texto do post de teste.'), featuredImage: media.id }
  const draft = await json('POST', '/api/posts?draft=true', { ...post, _status: 'draft' })
  assert.equal(draft.status, 201, JSON.stringify(draft.data))
  const created = draft.data.doc
  cleanup.push(() => json('DELETE', `/api/posts/${created.id}`))
  assert.equal(created.slug, 'post-de-teste-do-painel', 'o endereço sai do título')
  assert.equal((await anonymous('/blog/post-de-teste-do-painel')).status, 404, 'rascunho não pode ser público')
  const preview = await call('GET', '/blog/post-de-teste-do-painel?previa=1')
  assert.equal(preview.status, 200, 'prévia logada deveria abrir')
  const previewPage = load(await preview.text())
  assert.match(previewPage('meta[name=robots]').attr('content') || '', /noindex/)
  assert.ok(previewPage('.blog-preview-bar').length, 'aviso de prévia ausente')
  assert.equal((await anonymous('/blog/post-de-teste-do-painel?previa=1')).status, 404, 'prévia sem login não pode abrir o rascunho')
  const withoutCover = await json('POST', '/api/posts', { ...post, title: 'Sem capa', slug: 'sem-capa', featuredImage: null, _status: 'published' })
  assert.equal(withoutCover.status, 400, 'publicar sem imagem de destaque deveria ser recusado')
  assert.equal((await json('PATCH', `/api/posts/${created.id}`, { _status: 'published', publishedAt: new Date(Date.now() + 86_400_000).toISOString() })).status, 200)
  assert.equal((await anonymous('/blog/post-de-teste-do-painel')).status, 404, 'post agendado para o futuro não pode aparecer')
  assert.equal((await json('PATCH', `/api/posts/${created.id}`, { _status: 'published', publishedAt: new Date(Date.now() - 60_000).toISOString() })).status, 200)
  assert.equal((await anonymous('/blog/post-de-teste-do-painel')).status, 200)
  assert.ok((await page('/blog')).includes('"Post de teste do painel"'), 'post novo fora da listagem do blog')
  assert.ok((await page('/')).includes('"Post de teste do painel"'), 'post novo fora do carrossel da inicial')

  // 8. Permissões: editor não cria usuários nem promove a si mesmo; administrador sim.
  const editorPassword = randomBytes(24).toString('base64url')
  const editor = await json('POST', '/api/users', { name: 'Editor de teste', email: `editor-${Date.now()}@example.invalid`, password: editorPassword, role: 'editor' })
  assert.equal(editor.status, 201, JSON.stringify(editor.data))
  assert.equal(editor.data.doc.role, 'editor')
  cleanup.push(() => json('DELETE', `/api/users/${editor.data.doc.id}`))
  const adminCookie = cookie
  assert.equal((await json('POST', '/api/users/login', { email: editor.data.doc.email, password: editorPassword })).status, 200)
  assert.equal((await json('POST', '/api/users', { name: 'Outro', email: `outro-${Date.now()}@example.invalid`, password: editorPassword, role: 'admin' })).status, 403, 'editor não cria usuário')
  await json('PATCH', `/api/users/${editor.data.doc.id}`, { role: 'admin' })
  assert.equal((await json('GET', `/api/users/${editor.data.doc.id}`)).data.role, 'editor', 'editor não promove a si mesmo')
  assert.equal((await json('DELETE', `/api/posts/${created.id}`)).status, 403, 'editor não apaga posts')
  cookie = adminCookie

  console.log('PASS: cadastro inicial e papéis, texto, link, imagem, configurações, cabeçalho, post (rascunho, prévia, agendamento, publicação) e permissões.')
} finally {
  for (const undo of cleanup.reverse()) await undo().catch(() => {})
  const after = Object.fromEntries(await Promise.all(PAGES.map(async (url) => [url, await page(url)])))
  const leftovers = PAGES.filter((url) => JSON.stringify(after[url]) !== JSON.stringify(baseline[url]))
  const titles = { home: await titleOf('/'), blog: await titleOf('/blog') }
  if (userId) {
    const removed = await json('DELETE', `/api/users/${userId}`)
    assert.equal(removed.status, 200, 'A conta temporária precisa ser removida.')
  }
  assert.deepEqual(leftovers, [], `O conteúdo não voltou ao original em: ${leftovers.join(', ')}`)
  assert.deepEqual(titles, baselineTitles, 'Os títulos não voltaram ao original.')
  console.log('Conteúdo restaurado: todas as páginas voltaram idênticas ao que eram antes do teste; conta temporária removida.')
}
