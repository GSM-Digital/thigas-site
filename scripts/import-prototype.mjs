import fs from 'node:fs'
import path from 'node:path'
import { load } from 'cheerio'
import { prototypeSource } from './prototype-source.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = prototypeSource
const output = path.join(root, 'src/generated/prototype.json')

/** [arquivo do protótipo, endereço no site]. A página de artigo vira o modelo dos posts. */
const PAGES = [['index', 'index'], ['blog', 'blog'], ['artigo', 'post'], ['privacidade', 'privacidade'], ['termos', 'termos'], ['cookies', 'cookies']]
/** Páginas legais têm cabeçalho e rodapé próprios (diferentes dos do site): ficam dentro do conteúdo da página. */
const OWN_CHROME = new Set(['privacidade', 'termos', 'cookies'])
const ASSET_DIRS = ['css', 'js', 'fonts', 'img', 'sims']
const slugOf = Object.fromEntries(PAGES)

/** `index.html#x` → `/#x`, `blog.html` → `/blog`, `img/a.png` → `/img/a.png`. O resto passa como está. */
const linkURL = (value) => {
  if (!value || /^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value
  if (/^(css|js|fonts|img|sims)\//.test(value)) return `/${value}`
  const page = /^([a-z0-9-]+)\.html(#.*)?$/i.exec(value)
  if (!page) return value
  const slug = slugOf[page[1]] ?? page[1]
  return `/${slug === 'index' ? '' : slug === 'post' ? 'blog' : slug}${page[2] || ''}`
}

/** Elementos cujos filhos são só espaço em branco insignificante (React reclama de texto solto neles). */
const NO_TEXT_PARENTS = new Set(['ul', 'ol', 'select', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'dl', 'optgroup'])
const clean = (value) => value.replace(/\s+/g, ' ')

/**
 * Converte um pedaço do DOM em árvore. Cada texto, imagem e link ganha uma chave
 * (`page-t1`, `page-i1`, `page-l1`…) que liga a posição no layout ao valor do banco.
 * Elementos marcados com data-cms-managed viram um espaço reservado; os marcados
 * com data-cms-slot mantêm a tag e perdem os filhos: o conteúdo vem dos posts.
 */
function convert(nodes, scope, $) {
  const content = { copy: [], images: [], links: [] }
  let textIndex = 0, imageIndex = 0, linkIndex = 0
  function visit(node, trail = '', parentTag = '') {
    if (node.type === 'text') {
      if (!node.data.trim()) return NO_TEXT_PARENTS.has(parentTag) || !node.data ? null : { text: ' ' }
      const key = `${scope}-t${++textIndex}`
      const value = clean(node.data)
      content.copy.push({ key, label: `${trail} · ${value.trim().slice(0, 90)}`, value })
      return { text: value, textKey: key }
    }
    if (!node.name || ['script', 'style'].includes(node.name)) return null
    const attrs = { ...node.attribs }
    for (const key of Object.keys(attrs)) if (/^on/i.test(key)) delete attrs[key]
    if (attrs['data-cms-managed']) return { managed: attrs['data-cms-managed'] }
    const slot = attrs['data-cms-slot']
    delete attrs['data-cms-slot']
    for (const name of ['href', 'src']) if (attrs[name]) attrs[name] = linkURL(attrs[name])
    const result = { tag: node.name, attrs }
    if (slot) result.slot = slot
    if (node.name === 'img' && attrs.src) {
      const key = `${scope}-i${++imageIndex}`
      content.images.push({ key, label: attrs.alt || attrs.src, src: attrs.src, alt: attrs.alt || '' })
      result.imageKey = key
    }
    if (node.name === 'a' && attrs.href) {
      const key = `${scope}-l${++linkIndex}`
      content.links.push({ key, label: $(node).text().replace(/\s+/g, ' ').trim().slice(0, 90) || attrs['aria-label'] || attrs.href, href: attrs.href })
      result.linkKey = key
    }
    const nextTrail = [trail, attrs.id || `${node.name}${attrs.class ? '.' + attrs.class.split(' ')[0] : ''}`].filter(Boolean).slice(-3).join(' > ')
    // O conteúdo de <template> fica num fragmento próprio dentro do nó.
    const kids = node.name === 'template' && node.children?.[0] && !node.children[0].name ? node.children[0].children : node.children
    if (!slot) result.children = (kids || []).map((child) => visit(child, nextTrail, node.name)).filter(Boolean)
    return result
  }
  return { nodes: nodes.map((node) => visit(node)).filter(Boolean), content }
}

/** Troca o texto de um elemento sem mexer nos filhos que não são texto (um ícone SVG dentro de um link, por exemplo). */
const setText = ($el, value) => { const first = $el.contents().filter((_, n) => n.type === 'text' && n.data.trim()).first(); first.length ? first.replaceWith(value) : $el.prepend(value) }

/**
 * Ajustes do protótipo para virar site de verdade. O protótipo mostra cards de
 * exemplo e avisos de "layout de demonstração": aqui os cards viram espaços para
 * os posts do painel e os avisos saem. O resto do HTML entra como está.
 */
const adapt = {
  index($) {
    $('.blog-status').remove()
    $('#blog-track').empty().attr({ 'data-cms-slot': 'cards', 'aria-label': 'Artigos recentes' })
    // Uma lista (<ol>) não pode ser role="tabpanel": os <li> deixavam de ser itens de lista para os leitores de tela e o
    // Lighthouse reprovava. A lista segue ligada à aba por id e aria-labelledby; o main.js continua alternando o `hidden`.
    $('ol.steps[role="tabpanel"]').removeAttr('role')
    // Os textos das abas da vitrine chegavam `hidden` e o main.js os mostrava no carregamento: o bloco crescia até a altura do
    // maior texto e empurrava o resto da página (CLS 0,2 no celular). Sem `hidden` o espaço já nasce no tamanho final; os
    // inativos continuam invisíveis pelo CSS (`.caption:not(.is-active)`), como o main.js deixa depois.
    $('.captions .caption[hidden]').removeAttr('hidden')
  },
  blog($) {
    $('.ed-demo, .ed-endnote').remove()
    $('section[aria-labelledby="ed-feature-title"]').replaceWith('<div data-cms-managed="blog-feature"></div>')
    $('.ed-shelf .ed-filter, .ed-shelf ul.ed-grid, .ed-shelf #ed-empty').remove()
    $('.ed-shelf > .wrap').append('<div data-cms-managed="blog-listing"></div>')
  },
  artigo($) {
    // Título, imagem e texto são de cada post; o painel do modelo só edita o que se repete em todos.
    $('article#ed-article').replaceWith('<div data-cms-managed="article"></div>')
    const related = $('section.ed-related > .wrap')
    const eyebrow = related.children('.ed-eyebrow').first()
    const heading = related.children('h2').first()
    const link = related.children('a.text-link').first()
    related.children('.ed-intro').remove()
    setText(heading, 'Mais ideias para você.')
    setText(link, 'Conhecer o blog')
    link.addClass('blog-all')
    const head = $('<div class="blog-heading"><div class="section-head"></div></div>')
    head.children('.section-head').append(eyebrow, heading)
    head.append(link)
    related.empty().append(head, '<div data-cms-managed="related"></div>')
  },
}

const files = {}
const pages = PAGES.map(([file, slug]) => {
  const $ = load(fs.readFileSync(path.join(source, `${file}.html`), 'utf8'))
  files[slug] = $
  return { file, slug, title: $('title').text().trim(), description: $('meta[name="description"]').attr('content') || '' }
})

/**
 * Os cards e o artigo de demonstração do protótipo, lidos antes de virarem espaços
 * para os posts. O seed usa isso uma única vez (veja src/cms/seed-blog.ts).
 */
const text = ($el) => $el.text().replace(/\s+/g, ' ').trim()
const demo = (() => {
  const blog = files.blog
  const article = files.post
  const cards = blog('ul.ed-grid > li.blog-card').toArray().map((item) => {
    const $item = blog(item)
    return { title: text($item.find('h3').first()), topic: $item.attr('data-topic') || '', excerpt: text($item.find('.blog-excerpt').first()), image: $item.find('img').first().attr('src') || '', complete: $item.find('a[href]').length > 0 }
  })
  const blocks = article('article#ed-article .ed-prose').first().children().toArray().flatMap((el) => {
    const $el = article(el)
    if ($el.hasClass('ed-article-actions')) return []
    if (el.name === 'ul') return [{ type: 'ul', items: $el.children('li').toArray().map((li) => text(article(li))) }]
    if (['h2', 'h3'].includes(el.name)) return [{ type: el.name, text: text($el) }]
    return [{ type: 'p', text: text($el) }]
  })
  return { cards, article: { title: text(article('article#ed-article h1').first()), excerpt: text(article('article#ed-article .ed-intro').first()), blocks } }
})()

const chromeNodes = (selector, $) => $(selector).toArray()
const isChrome = (node) => node.name === 'script' || (node.name === 'a' && /\bskip\b/.test(node.attribs?.class || '')) || (node.name === 'header' && /\btopbar\b/.test(node.attribs?.class || '')) || (node.name === 'footer' && /\bsite-footer\b/.test(node.attribs?.class || ''))

const result = pages.map((page) => {
  const $ = files[page.slug]
  adapt[page.file]?.($)
  const own = OWN_CHROME.has(page.slug)
  const bodyNodes = $('body').contents().toArray().filter((node) => own ? node.name !== 'script' && (node.type !== 'text' || node.data.trim()) : !isChrome(node) && (node.type !== 'text' || node.data.trim()))
  const body = convert(bodyNodes, 'page', $)
  return { slug: page.slug, title: page.title, description: page.description, bodyClass: $('body').attr('class') || '', chrome: own ? 'own' : 'site', body: body.nodes, content: body.content }
})

// Cabeçalho e rodapé do site vêm da página inicial; as outras páginas usam os mesmos.
const home = files.index
const header = convert([...chromeNodes('body > a.skip', home), ...chromeNodes('body > header.topbar', home)], 'header', home)
const footer = convert(chromeNodes('body > footer.site-footer', home), 'footer', home)
const site = {
  header: header.nodes, footer: footer.nodes,
  content: { copy: [...header.content.copy, ...footer.content.copy], images: [...header.content.images, ...footer.content.images], links: [...header.content.links, ...footer.content.links] },
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify({ pages: result, site, demo }, null, 2) + '\n')

// CSS, JS, fontes, imagens e simulações originais, byte a byte. `overrides/` guarda as poucas diferenças de propósito (veja README).
const keep = (src) => path.basename(src) !== '.DS_Store'
for (const dir of ASSET_DIRS) fs.cpSync(path.join(source, dir), path.join(root, 'public', dir), { recursive: true, force: true, filter: keep })
fs.cpSync(path.join(root, 'overrides'), path.join(root, 'public'), { recursive: true, force: true, filter: keep })

const total = result.reduce((sum, page) => sum + page.content.copy.length, 0)
console.log(`Importadas ${result.length} páginas (${total} textos) e ${site.content.copy.length} textos do cabeçalho e rodapé. CSS, JS e imagens originais preservados.`)
