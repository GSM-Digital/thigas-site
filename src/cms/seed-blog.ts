import path from 'node:path'
import { existsSync } from 'node:fs'
import type { Payload } from 'payload'
import prototype from '../generated/prototype.json'
import articlesData from '../generated/articles.json'
import type { Article } from '../lib/types'
import type { Post } from '../payload-types'
import { toSlug } from './blog'

const articles = articlesData as unknown as Article[]
type Lexical = Post['content']
const base = { direction: null, format: '', indent: 0, version: 1 }
const text = (value: string) => ({ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: value })
const paragraph = (value?: string) => ({ ...base, type: 'paragraph', textFormat: 0, textStyle: '', children: value ? [text(value)] : [] })

const CATEGORIES: Record<string, string> = { estrategia: 'Estratégia', design: 'Design', tecnologia: 'Tecnologia' }

/** Texto do artigo de demonstração do protótipo, convertido para o editor do Payload. */
function demoContent(): Lexical {
  const blocks = prototype.demo.article.blocks.map((block) => {
    if (block.type === 'ul') return { ...base, type: 'list', listType: 'bullet', tag: 'ul', start: 1,
      children: (block.items || []).map((item, i) => ({ ...base, type: 'listitem', value: i + 1, children: [text(item)] })) }
    if (block.type === 'h2' || block.type === 'h3') return { ...base, type: 'heading', tag: block.type, children: [text(block.text || '')] }
    return paragraph(block.text)
  })
  return { root: { ...base, type: 'root', children: blocks } } as unknown as Lexical
}

/**
 * Importa uma única vez os posts do blog. Os seis artigos reais (texto completo
 * e capa) entram publicados. O protótipo também mostrava três cards de exemplo:
 * o único com texto completo (um artigo de demonstração) e os dois sem texto
 * entram como rascunho, com título e categoria, para a equipe decidir o que fazer.
 * Nada existente é sobrescrito.
 */
export async function seedBlog(payload: Payload) {
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true })
  if (site.blogBootstrapComplete) return

  const categories = new Map<string, number>()
  for (const name of Object.values(CATEGORIES)) {
    const found = await payload.find({ collection: 'categories', where: { slug: { equals: toSlug(name) } }, limit: 1, overrideAccess: true })
    categories.set(name, (found.docs[0] || await payload.create({ collection: 'categories', data: { name, slug: toSlug(name) }, overrideAccess: true })).id)
  }

  // As capas vão para a biblioteca de imagens, como qualquer imagem enviada pelo painel.
  const cover = async (file: string, alt: string) => {
    const filePath = path.resolve('public', file.replace(/^\//, ''))
    if (!existsSync(filePath)) return undefined
    return (await payload.create({ collection: 'media', data: { alt }, filePath, overrideAccess: true })).id
  }

  for (const article of articles) {
    const exists = await payload.count({ collection: 'posts', where: { slug: { equals: article.slug } }, overrideAccess: true })
    if (exists.totalDocs) continue
    await payload.create({
      collection: 'posts', overrideAccess: true,
      data: {
        title: article.title, slug: article.slug, excerpt: article.excerpt, authorName: article.author,
        category: categories.get(article.category)!, publishedAt: article.publishedAt,
        featuredImage: await cover(`img/blog/artigos/${article.slug}.webp`, `Ilustração do artigo ${article.title}`),
        content: article.content as unknown as Lexical, _status: 'published',
      },
    })
  }

  for (const [index, card] of prototype.demo.cards.entries()) {
    const slug = toSlug(card.title)
    const exists = await payload.count({ collection: 'posts', where: { slug: { equals: slug } }, overrideAccess: true })
    if (exists.totalDocs) continue
    await payload.create({
      collection: 'posts', overrideAccess: true, draft: true,
      data: {
        title: card.title, slug, excerpt: card.excerpt, authorName: 'Thiago Barreto',
        category: categories.get(CATEGORIES[card.topic] || 'Estratégia')!,
        // Os cards de exemplo usam ilustrações SVG, que a biblioteca de imagens não aceita: a capa fica para a equipe escolher.
        publishedAt: new Date(Date.now() - (index + 1) * 86_400_000 * 30).toISOString(),
        content: card.complete ? demoContent() : { root: { ...base, type: 'root', children: [paragraph()] } } as unknown as Lexical,
        _status: 'draft',
      },
    })
  }
  await payload.updateGlobal({ slug: 'site', overrideAccess: true, data: { blogBootstrapComplete: true } })
  payload.logger.info(`Blog importado: ${articles.length} artigos publicados e ${prototype.demo.cards.length} cards de exemplo como rascunho.`)
}
