import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Converte os artigos em Markdown (content/articles) para o formato do editor do Payload e grava
 * src/generated/articles.json, que o seed usa uma única vez. Rode de novo só se os textos mudarem:
 *   PAYLOAD_SKIP_SEED=1 DATABASE_URL=file:./.data/build.db npm run build:articles
 */
const source = path.resolve('content/articles')
const categories = ['Estratégia', 'Design', 'Estratégia', 'Tecnologia', 'Estratégia', 'Tecnologia']

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
const postField = payload.config.collections.find((collection) => collection.slug === 'posts')?.fields
  .flatMap((field) => field.type === 'tabs' ? field.tabs.flatMap((tab) => tab.fields) : [field])
  .find((field) => 'name' in field && field.name === 'content')
if (!postField || postField.type !== 'richText') throw new Error('Campo rich text não encontrado')
const editorConfig = editorConfigFactory.fromField({ field: postField })

const articles = await Promise.all(files.map(async (name, index) => {
  const { meta, body } = parseArticle(await readFile(path.join(source, name), 'utf8'))
  const content = convertMarkdownToLexical({ editorConfig, markdown: body })
  const html = convertLexicalToHTML({ data: content })
  if (!html.includes("<h2") || html.includes("| --- |")) throw new Error(`Conversão incompleta: ${name}`)
  if (index < 2 && !html.includes('<table')) throw new Error(`Tabela não convertida: ${name}`)
  await readFile(path.resolve(`public/img/blog/artigos/${meta.slug}.webp`))
  return { slug: meta.slug, title: meta.title, excerpt: meta.description, author: meta.author, category: categories[index], publishedAt: new Date(`${meta.updated}T${String(12 - index).padStart(2, '0')}:00:00-03:00`).toISOString(), content }
}))
if (new Set(articles.map((article) => article.slug)).size !== 6) throw new Error('Slugs duplicados')
await writeFile(path.resolve('src/generated/articles.json'), `${JSON.stringify(articles, null, 2)}\n`)
console.log(`Gerados ${articles.length} artigos: ${articles.map((article) => article.slug).join(', ')}`)
await payload.destroy()
process.exit(0)
