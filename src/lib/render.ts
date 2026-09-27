import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { getPayload } from 'payload'
import config from '@payload-config'
import { articleTemplate, blogTemplate, homeTemplate } from '../templates/generated'
import { siteDefaults, type SiteContentKey } from './defaults'

type AnyRecord = Record<string, unknown>
export type PublicPost = {
  id: number | string
  title: string
  slug: string
  excerpt: string
  category?: string
  author?: string
  content?: unknown
  featuredImage?: unknown
  publishedAt?: string
  createdAt?: string
  meta?: AnyRecord
}

export const origin = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const escapeHTML = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char)
const safeURL = (value: unknown) => {
  if (typeof value !== 'string') return ''
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '' } catch { return '' }
}
const fill = (template: string, values: Record<string, string>) => template.replace(/\{\{([a-zA-Z][a-zA-Z0-9]*)\}\}/g, (_, key: string) => {
  if (!(key in values)) throw new Error(`Campo não preenchido no template: ${key}`)
  return values[key]
})
const textValue = (data: AnyRecord, key: SiteContentKey) => escapeHTML(typeof data[key] === 'string' && String(data[key]).trim() ? data[key] : siteDefaults[key])
const metaObject = (record: AnyRecord) => record.meta && typeof record.meta === 'object' ? record.meta as AnyRecord : {}
const formatDate = (date?: string) => date && !Number.isNaN(Date.parse(date)) ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(date)) : ''
const categoryLabel = (category?: string) => ({ estrategia: 'Estratégia', design: 'Design', tecnologia: 'Tecnologia' })[category as 'estrategia' | 'design' | 'tecnologia'] || 'Artigo'
const mediaObject = (post: PublicPost): AnyRecord => post.featuredImage && typeof post.featuredImage === 'object' ? post.featuredImage as AnyRecord : {}
const coverURL = (post: PublicPost) => {
  const media = mediaObject(post)
  const sizes = media.sizes && typeof media.sizes === 'object' ? media.sizes as AnyRecord : {}
  const card = sizes.card && typeof sizes.card === 'object' ? sizes.card as AnyRecord : {}
  return safeURL(card.url) || safeURL(media.url) || '/img/blog/preview-estrategia.svg'
}
const socialURL = (post: PublicPost) => {
  const media = mediaObject(post)
  const sizes = media.sizes && typeof media.sizes === 'object' ? media.sizes as AnyRecord : {}
  const social = sizes.social && typeof sizes.social === 'object' ? sizes.social as AnyRecord : {}
  const url = safeURL(social.url) || safeURL(media.url)
  return url.startsWith('/') ? origin + url : url || origin + '/img/blog/preview-estrategia.svg'
}
const card = (post: PublicPost) => `<li class="blog-card" data-topic="${escapeHTML(post.category || '')}"><article><a href="/blog/${encodeURIComponent(post.slug)}"><div class="blog-cover"><img src="${escapeHTML(coverURL(post))}" alt="" width="800" height="500" loading="lazy" decoding="async"></div><div class="blog-card-body"><p class="blog-date">${escapeHTML(formatDate(post.publishedAt || post.createdAt))}</p><h3>${escapeHTML(post.title)}</h3><p class="blog-excerpt">${escapeHTML(post.excerpt)}</p><span class="blog-read">Ler artigo <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></span></div></a></article></li>`
const placeholderCards = ['estrategia', 'performance', 'experiencia'].map((name, index) => `<li class="blog-card"><article class="blog-preview"><div class="blog-cover"><img src="/img/blog/preview-${name}.svg" alt="" width="800" height="500" loading="lazy" decoding="async"></div><div class="blog-card-body"><p class="blog-preview-tag">Conteúdo de exemplo</p><h3>${['Um site que explica o valor da sua marca', 'Design claro em cada etapa da navegação', 'Uma experiência pensada para qualquer tela'][index]}</h3><p class="blog-excerpt">Prévia visual do card. Seus artigos publicados aparecerão aqui.</p><span class="blog-read">Prévia do card</span></div></article></li>`).join('')

export const getCMS = async () => getPayload({ config })
export const getContent = async () => {
  const payload = await getCMS()
  return await payload.findGlobal({ slug: 'site-content', depth: 1 }) as unknown as AnyRecord
}
export const getPosts = async (limit?: number): Promise<PublicPost[]> => {
  const payload = await getCMS()
  const query = { collection: 'posts' as const, where: { _status: { equals: 'published' } }, sort: '-publishedAt', depth: 2, overrideAccess: false }
  if (limit) {
    const result = await payload.find({ ...query, limit })
    return result.docs as unknown as PublicPost[]
  }
  const posts: PublicPost[] = []
  let page = 1
  do {
    const result = await payload.find({ ...query, limit: 100, page })
    posts.push(...result.docs as unknown as PublicPost[])
    if (!result.hasNextPage) break
    page += 1
  } while (true)
  return posts
}
export const getPost = async (slug: string): Promise<PublicPost | null> => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'posts', where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] }, limit: 1, depth: 2, overrideAccess: false })
  return result.docs[0] as unknown as PublicPost || null
}

export const renderHome = (content: AnyRecord, posts: PublicPost[]) => {
  const meta = metaObject(content)
  const title = escapeHTML(meta.title || 'Thiago Barreto — Desenvolvimento web para empresas')
  const description = escapeHTML(meta.description || 'Sites institucionais, e-commerce, landing pages e plataformas sob medida com IA. Rápidos, acessíveis e prontos para crescer.')
  const fields = Object.fromEntries((Object.keys(siteDefaults) as SiteContentKey[]).map((key) => [key, textValue(content, key)])) as Record<string, string>
  const recent = posts.slice(0, 6)
  return fill(homeTemplate, {
    ...fields, seoTitle: title, seoDescription: description, siteOrigin: escapeHTML(origin),
    blogCards: recent.length ? recent.map(card).join('') : placeholderCards,
    blogStatusBlock: recent.length ? '' : '<p class="blog-status" id="blog-status" role="status">Prévia de layout: publique um artigo no Payload para substituir estes cards.</p>',
  })
}

const headerFooter = (template: string, main: string, data: { title: string; description: string; canonical: string; type: string; image?: string }) => fill(template, {
  seoTitle: escapeHTML(data.title), seoDescription: escapeHTML(data.description), canonicalURL: escapeHTML(data.canonical), ogType: data.type, ogImage: escapeHTML(data.image || origin + '/img/blog/preview-estrategia.svg'), blogMain: main, articleMain: main,
})

export const renderBlog = (posts: PublicPost[]) => {
  const featured = posts[0]
  const feature = featured ? `<section class="wrap" aria-labelledby="ed-feature-title"><div class="ed-feature"><div class="ed-feature-copy"><p class="ed-eyebrow">Em destaque</p><h2 id="ed-feature-title">${escapeHTML(featured.title)}</h2><p>${escapeHTML(featured.excerpt)}</p><a class="text-link" href="/blog/${encodeURIComponent(featured.slug)}">Ler artigo ↗</a></div><a class="ed-feature-art" href="/blog/${encodeURIComponent(featured.slug)}" aria-label="Ler ${escapeHTML(featured.title)}"><img src="${escapeHTML(coverURL(featured))}" alt="" width="800" height="500"></a></div></section>` : ''
  const filter = posts.length ? '<div class="ed-filter" role="group" aria-label="Filtrar por assunto"><button class="sil" type="button" data-filter="todos" aria-pressed="true">Todos</button><button class="sil" type="button" data-filter="estrategia" aria-pressed="false">Estratégia</button><button class="sil" type="button" data-filter="design" aria-pressed="false">Design</button><button class="sil" type="button" data-filter="tecnologia" aria-pressed="false">Tecnologia</button></div>' : ''
  const listing = posts.length ? `<ul class="ed-grid" role="list">${posts.map(card).join('')}</ul><p class="ed-empty" id="ed-empty" hidden>Nenhum artigo nesta categoria.</p>` : '<p class="ed-empty">Ainda não há artigos publicados. Volte em breve.</p>'
  const main = `<main class="editorial-main" id="conteudo" tabindex="-1"><section class="ed-hero"><div class="wrap"><p class="ed-eyebrow">Blog · Thiago Barreto</p><h1>Ideias para sites<br><span class="ed-gradient">que fazem sentido.</span></h1><p class="ed-intro">Estratégia, design e tecnologia explicados com clareza. Um espaço para pensar melhor o seu próximo projeto digital.</p></div></section>${feature}<section class="ed-shelf" aria-labelledby="ed-latest-title"><div class="wrap"><div class="ed-shelf-head"><div><p class="ed-eyebrow">Explorar</p><h2 id="ed-latest-title">Leituras para o próximo passo.</h2></div></div>${filter}${listing}</div></section></main>`
  return headerFooter(blogTemplate, main, { title: 'Blog — Thiago Barreto', description: 'Artigos sobre estratégia, design e tecnologia para sites que fazem sentido.', canonical: origin + '/blog', type: 'website' })
}

export const renderArticle = (post: PublicPost, related: PublicPost[]) => {
  const meta = metaObject(post)
  const title = String(meta.title || `${post.title} — Thiago Barreto`)
  const description = String(meta.description || post.excerpt)
  const rich = post.content && typeof post.content === 'object' ? convertLexicalToHTML({ data: post.content as SerializedEditorState }) : ''
  const toc: { id: string; title: string }[] = []
  const content = rich.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, attributes: string, inside: string) => {
    const plain = inside.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim()
    const id = plain.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `secao-${toc.length + 1}`
    toc.push({ id, title: plain })
    return `<h2${attributes} id="${id}">${inside}</h2>`
  })
  const tocMarkup = toc.length ? `<nav class="ed-toc" aria-label="Neste artigo"><h2>Neste artigo</h2><ol>${toc.map((item) => `<li><a href="#${item.id}">${escapeHTML(item.title)}</a></li>`).join('')}</ol></nav>` : ''
  const relatedMarkup = related.length ? `<section class="ed-related" aria-labelledby="ed-related-title"><div class="wrap"><p class="ed-eyebrow">Continue explorando</p><h2 id="ed-related-title">Mais ideias para você.</h2><ul class="ed-grid" role="list">${related.slice(0, 3).map(card).join('')}</ul></div></section>` : ''
  const main = `<div class="ed-reading-progress" id="ed-reading-progress" aria-hidden="true"></div><main class="editorial-main" id="conteudo" tabindex="-1"><article id="ed-article"><header class="ed-article-hero"><div class="wrap"><nav class="ed-breadcrumb" aria-label="Caminho"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/blog">Blog</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHTML(post.title)}</span></nav><p class="ed-eyebrow">${escapeHTML(categoryLabel(post.category))} · ${escapeHTML(formatDate(post.publishedAt || post.createdAt))}</p><h1>${escapeHTML(post.title)}</h1><p class="ed-intro">${escapeHTML(post.excerpt)}</p><div class="ed-byline"><img src="/img/sobre/thiago-barreto.webp" alt="" width="44" height="44"><p><b>${escapeHTML(post.author || 'Thiago Barreto')}</b><span>Desenvolvimento web</span></p></div></div></header><div class="wrap"><figure class="ed-cover"><img src="${escapeHTML(coverURL(post))}" alt="${escapeHTML(mediaObject(post).alt || '')}" width="1200" height="675"></figure><div class="ed-article-layout">${tocMarkup}<div class="ed-prose">${content}<div class="ed-article-actions"><a class="text-link" href="/blog">Voltar ao blog ↗</a><button class="sil ed-copy" id="ed-copy" type="button">Copiar link</button><span class="ed-copy-status" id="ed-copy-status" role="status" aria-live="polite"></span></div></div></div></div></article>${relatedMarkup}</main>`
  let html = headerFooter(articleTemplate, main, { title, description, canonical: `${origin}/blog/${encodeURIComponent(post.slug)}`, type: 'article', image: socialURL(post) })
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description, image: socialURL(post), datePublished: post.publishedAt || post.createdAt, author: { '@type': 'Person', name: post.author || 'Thiago Barreto' }, mainEntityOfPage: `${origin}/blog/${encodeURIComponent(post.slug)}` }).replace(/</g, '\\u003c')
  html = html.replace('</head>', `<script type="application/ld+json">${schema}</script></head>`)
  return html
}
