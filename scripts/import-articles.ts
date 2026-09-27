import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const source = process.argv[2]
if (!source || !process.argv.some((arg) => arg === '--check' || arg === '--replace-posts')) throw new Error('Uso: node --import tsx scripts/import-articles.ts <pasta> --check|--replace-posts')

const categories = ['estrategia', 'design', 'estrategia', 'tecnologia', 'estrategia', 'tecnologia'] as const
const parseArticle = (raw: string) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n\s*([\s\S]*)$/)
  if (!match) throw new Error('Frontmatter inválido')
  const meta = Object.fromEntries(match[1].split(/\r?\n/).filter(Boolean).map((line) => {
    const field = line.match(/^([a-z]+):\s*(".*")$/)
    if (!field) throw new Error(`Metadado inválido: ${line}`)
    return [field[1], JSON.parse(field[2])]
  })) as Record<string, string>
  for (const key of ['title', 'description', 'slug', 'author', 'updated']) if (!meta[key]) throw new Error(`Falta ${key}`)
  const body = match[2].replace(/^# ([^\n]+)\r?\n+/, (_, heading: string) => {
    if (heading.trim() !== meta.title) throw new Error(`Título H1 divergente: ${meta.slug}`)
    return ''
  })
  if (body.startsWith('# ')) throw new Error(`H1 duplicado: ${meta.slug}`)
  return { meta, body }
}

const files = (await readdir(source)).filter((name) => /^0[1-6]-.*\.md$/.test(name)).sort()
if (files.length !== 6) throw new Error(`Esperados 6 artigos; encontrados ${files.length}`)
const payload = await getPayload({ config })
const postField = payload.config.collections.find((collection) => collection.slug === 'posts')?.fields.find((field) => 'name' in field && field.name === 'content')
if (!postField || postField.type !== 'richText') throw new Error('Campo rich text não encontrado')
const editorConfig = editorConfigFactory.fromField({ field: postField })
const prepared = await Promise.all(files.map(async (name, index) => {
  const { meta, body } = parseArticle(await readFile(path.join(source, name), 'utf8'))
  const content = convertMarkdownToLexical({ editorConfig, markdown: body })
  const html = convertLexicalToHTML({ data: content })
  if (!html.includes('<h2>') || html.includes('| --- |')) throw new Error(`Conversão incompleta: ${name}`)
  if (index < 2 && !html.includes('<table')) throw new Error(`Tabela não convertida: ${name}`)
  const cover = path.resolve(`public/img/blog/artigos/${meta.slug}.webp`)
  await readFile(cover)
  return { meta, content, cover, category: categories[index], publishedAt: `${meta.updated}T${String(12 - index).padStart(2, '0')}:00:00-03:00` }
}))
if (new Set(prepared.map(({ meta }) => meta.slug)).size !== 6) throw new Error('Slugs duplicados')
if (process.argv.includes('--check')) {
  console.log(`Validados: ${prepared.map(({ meta }) => meta.slug).join(', ')}`)
  process.exit(0)
}

const before = await payload.find({ collection: 'posts', limit: 1000, depth: 0, overrideAccess: true })
const newPosts: Array<number | string> = []
const newMedia: Array<number | string> = []
try {
  for (const item of prepared) {
    const media = await payload.create({ collection: 'media', data: { alt: `Ilustração do artigo ${item.meta.title}` }, filePath: item.cover })
    newMedia.push(media.id)
    const post = await payload.create({ collection: 'posts', data: {
      title: item.meta.title, slug: item.meta.slug, excerpt: item.meta.description, author: item.meta.author,
      category: item.category, featuredImage: media.id, content: item.content, publishedAt: item.publishedAt,
      _status: 'published', meta: { title: item.meta.title, description: item.meta.description, image: media.id },
    } })
    newPosts.push(post.id)
    console.log(`Publicado: ${post.slug}`)
  }
} catch (error) {
  for (const id of newPosts.reverse()) await payload.delete({ collection: 'posts', id }).catch(() => {})
  for (const id of newMedia.reverse()) await payload.delete({ collection: 'media', id }).catch(() => {})
  throw error
}
for (const old of before.docs) {
  await payload.delete({ collection: 'posts', id: old.id })
  console.log(`Excluído: ${old.slug}`)
}
console.log(`Concluído: ${newPosts.length} artigos publicados e ${before.docs.length} antigos excluídos.`)
process.exit(0)
