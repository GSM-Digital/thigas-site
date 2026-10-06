import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { prototypeSource } from '../scripts/prototype-source.mjs'

const root = path.resolve(import.meta.dirname, '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json')))
const sections = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/sections.json')))
const source = prototypeSource
const ASSET_DIRS = ['css', 'js', 'fonts', 'img', 'sims']
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const walk = (folder, prefix = '') => fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) =>
  entry.name === '.DS_Store' ? [] : entry.isDirectory() ? walk(path.join(folder, entry.name), `${prefix}${entry.name}/`) : [`${prefix}${entry.name}`])
const visit = (nodes, fn) => nodes.forEach((node) => { fn(node); if (node.children) visit(node.children, fn) })
const everyNode = (fn) => {
  for (const page of data.pages) visit(page.body, fn)
  visit(data.site.header, fn); visit(data.site.footer, fn)
}

test('should preserve all prototype pages', () => {
  const slugs = fs.readdirSync(source).filter((x) => x.endsWith('.html')).map((x) => x.replace('.html', '')).map((x) => x === 'artigo' ? 'post' : x).sort()
  assert.deepEqual(data.pages.map((p) => p.slug).sort(), slugs)
})

test('should copy every original asset without changes, except the documented overrides', () => {
  const overrides = new Set(walk(path.join(root, 'overrides')))
  for (const dir of ASSET_DIRS) {
    for (const file of walk(path.join(source, dir), `${dir}/`)) {
      if (overrides.has(file)) continue
      assert.equal(hash(path.join(root, 'public', file)), hash(path.join(source, file)), file)
    }
  }
  for (const file of overrides) assert.equal(hash(path.join(root, 'public', file)), hash(path.join(root, 'overrides', file)), `override ${file}`)
})

test('should have editable content keys that match the rendered templates', () => {
  const scopes = [...data.pages.map((page) => ({ nodes: page.body, content: page.content })),
    { nodes: [...data.site.header, ...data.site.footer], content: data.site.content }]
  for (const { nodes, content } of scopes) {
    for (const list of ['copy', 'images', 'links']) {
      const keys = content[list].map((entry) => entry.key)
      assert.equal(keys.length, new Set(keys).size, `chaves duplicadas em ${list}`)
    }
    const copy = new Set(content.copy.map((t) => t.key)), images = new Set(content.images.map((t) => t.key)), links = new Set(content.links.map((t) => t.key))
    const used = { copy: new Set(), images: new Set(), links: new Set() }
    visit(nodes, (node) => {
      if (node.textKey) { assert.ok(copy.has(node.textKey), node.textKey); used.copy.add(node.textKey) }
      if (node.imageKey) { assert.ok(images.has(node.imageKey), node.imageKey); used.images.add(node.imageKey) }
      if (node.linkKey) { assert.ok(links.has(node.linkKey), node.linkKey); used.links.add(node.linkKey) }
    })
    assert.equal(used.copy.size, copy.size, 'texto salvo sem lugar no layout')
    assert.equal(used.images.size, images.size)
    assert.equal(used.links.size, links.size)
  }
})

test('should not embed executable HTML handlers or scripts in React templates', () => {
  everyNode((node) => {
    assert.notEqual(node.tag, 'script')
    assert.notEqual(node.tag, 'style')
    assert.ok(!Object.keys(node.attrs || {}).some((key) => /^on/i.test(key)), `atributo on* em <${node.tag}>`)
  })
})

test('should describe every editable key in the section map', () => {
  for (const page of data.pages) {
    for (const entry of [...page.content.copy, ...page.content.images, ...page.content.links]) assert.ok(sections.pages[page.slug][entry.key], `${page.slug}: ${entry.key}`)
  }
  for (const entry of [...data.site.content.copy, ...data.site.content.images, ...data.site.content.links]) assert.ok(sections.site[entry.key], entry.key)
})

test('should keep technical names out of the editor labels', () => {
  const names = new Set(Object.values(sections.pages).flatMap((page) => Object.values(page).map((entry) => entry.secao)))
  for (const name of names) assert.ok(!/^(page|header|footer)-[til]\d+$/.test(name) && !/^Seção \d+$/.test(name), name)
})

test('should point every local URL of the layout to a file served from public/', () => {
  const missing = []
  everyNode((node) => {
    for (const attr of ['src', 'href']) {
      const value = node.attrs?.[attr]
      if (value && /^\/(css|js|fonts|img|sims)\//.test(value) && !fs.existsSync(path.join(root, 'public', value.split(/[?#]/)[0]))) missing.push(value)
    }
  })
  assert.deepEqual(missing, [])
})

test('should list every migration file in the migrations index, for both databases', () => {
  for (const database of ['sqlite', 'postgres']) {
    const dir = path.join(root, 'src/migrations', database)
    const files = fs.readdirSync(dir).filter((name) => /^\d{8}_\d{6}_.+\.ts$/.test(name)).map((name) => name.replace(/\.ts$/, ''))
    const index = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')
    for (const file of files) assert.ok(index.includes(`'${file}'`), `${database}: migração fora do índice: ${file}`)
    assert.ok(files.length > 0, `${database}: sem migrações`)
  }
  // Uma mudança de schema precisa existir nas duas pastas, com o mesmo nome depois da data.
  const names = (database) => fs.readdirSync(path.join(root, 'src/migrations', database)).filter((name) => name.endsWith('.ts') && name !== 'index.ts').map((name) => name.replace(/^\d{8}_\d{6}_/, '')).sort()
  assert.deepEqual(names('postgres'), names('sqlite'), 'as pastas de migração do SQLite e do Postgres precisam ter as mesmas mudanças')
})

test('should ship the six published articles with a cover and a heading', () => {
  const articles = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/articles.json')))
  assert.equal(articles.length, 6)
  for (const article of articles) {
    assert.ok(fs.existsSync(path.join(root, `public/img/blog/artigos/${article.slug}.webp`)), article.slug)
    assert.ok(JSON.stringify(article.content).includes('"tag":"h2"'), `${article.slug} sem título 2`)
  }
})
