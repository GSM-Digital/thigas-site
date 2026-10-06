import fs from 'node:fs'
import path from 'node:path'
import { load } from 'cheerio'
import { prototypeSource } from './prototype-source.mjs'

/**
 * Compara o HTML que o site serve com o do protótipo, elemento por elemento (atributos, textos e
 * ordem), ignorando espaços e o que o Next acrescenta. As diferenças permitidas são as de propósito:
 * o que vem dos posts, o que o painel substitui e os endereços normalizados (veja `ALLOWED`).
 *   node scripts/verify-html.mjs http://localhost:3000
 */
const base = process.argv[2] || 'http://localhost:3000'
const PAGES = [['index', '/'], ['blog', '/blog'], ['privacidade', '/privacidade'], ['termos', '/termos'], ['cookies', '/cookies']]
const SLUGS = { index: 'index', blog: 'blog', artigo: 'post', privacidade: 'privacidade', termos: 'termos', cookies: 'cookies' }

const url = (value) => {
  if (!value || /^(https?:|mailto:|tel:|#|\/)/i.test(value)) return value
  if (/^(css|js|fonts|img|sims)\//.test(value)) return `/${value}`
  const page = /^([a-z0-9-]+)\.html(#.*)?$/i.exec(value)
  if (!page) return value
  const slug = SLUGS[page[1]] ?? page[1]
  return `/${slug === 'index' ? '' : slug === 'post' ? 'blog' : slug}${page[2] || ''}`
}

/** Uma linha por elemento e por texto, com os atributos em ordem: dá para comparar com `diff`. */
function canonical($, root) {
  const lines = []
  const walk = (node, depth) => {
    if (node.type === 'text') { const text = node.data.replace(/\s+/g, ' ').trim(); if (text) lines.push(`${' '.repeat(depth)}"${text}"`); return }
    if (!node.name || ['script', 'style', 'noscript'].includes(node.name)) return
    if (node.name === 'link' || node.name === 'meta') return
    const attrs = Object.entries(node.attribs || {}).filter(([name]) => !/^on/i.test(name)).sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => `${name}="${['href', 'src'].includes(name) ? url(value) : value.replace(/\s+/g, ' ').trim()}"`)
    lines.push(`${' '.repeat(depth)}<${node.name}${attrs.length ? ' ' + attrs.join(' ') : ''}>`)
    const children = node.name === 'template' && node.children[0] && !node.children[0].name ? node.children[0].children : node.children
    for (const child of children || []) walk(child, depth + 1)
  }
  for (const node of root) walk(node, 0)
  return lines
}

/**
 * O que vem dos posts (cards, destaque, filtros) e os avisos de demonstração do protótipo saem dos dois
 * lados antes de comparar: o resto precisa ser idêntico.
 */
const ZONES = {
  index: ['#blog-track > li', '.blog-status'],
  blog: ['section[aria-labelledby="ed-feature-title"]', '.ed-filter', 'ul.ed-grid', '#ed-empty', 'p.ed-empty', '.ed-endnote', '.ed-demo'],
}
const strip = ($, file) => {
  for (const selector of ZONES[file] || []) $(selector).remove()
  $('div[hidden]').filter((_, el) => !Object.keys(el.attribs).some((name) => name !== 'hidden')).remove()
  if (file === 'index') {
    $('#blog-track').removeAttr('aria-label')
    // Ajustes de propósito (veja scripts/import-prototype.mjs e Template): o título do herói já vem dividido em palavras
    // (o texto é o mesmo), os textos das abas da vitrine não nascem `hidden` e a lista de etapas deixou de ser role="tabpanel".
    const title = $('#hero-title')
    if (!title.find('.sr-only').length) title.find('br').replaceWith(' ')
    title.text(($('#hero-title > .sr-only').text() || title.text()).replace(/\s+/g, ' ').trim()).removeAttr('data-split')
    $('.captions .caption[hidden]').removeAttr('hidden')
    $('ol.steps[role="tabpanel"]').removeAttr('role')
  }
}

const failures = []
for (const [file, route] of PAGES) {
  const proto = load(fs.readFileSync(path.join(prototypeSource, `${file}.html`), 'utf8'))
  const served = load(await (await fetch(base + route)).text())
  strip(proto, file); strip(served, file)
  const a = canonical(proto, proto('body').contents().toArray())
  const b = canonical(served, served('body').contents().toArray())
  const fs2 = (lines, name) => fs.writeFileSync(path.join(import.meta.dirname, '..', 'test-results', `${file}.${name}.txt`), lines.join('\n') + '\n')
  fs.mkdirSync(path.join(import.meta.dirname, '..', 'test-results'), { recursive: true })
  fs2(a, 'prototype'); fs2(b, 'served')
  // Diferença simples por conjunto: o que existe só de um lado.
  const count = (lines) => lines.reduce((map, line) => map.set(line, (map.get(line) || 0) + 1), new Map())
  const left = count(a), right = count(b)
  const onlyProto = [...left].flatMap(([line, n]) => Array(Math.max(0, n - (right.get(line) || 0))).fill(line))
  const onlyServed = [...right].flatMap(([line, n]) => Array(Math.max(0, n - (left.get(line) || 0))).fill(line))
  const unexpected = [...onlyProto.map((line) => `só no protótipo: ${line.trim()}`), ...onlyServed.map((line) => `só no site: ${line.trim()}`)]

  console.log(`${route.padEnd(14)} protótipo ${a.length} linhas · site ${b.length} linhas · só de um lado: ${onlyProto.length + onlyServed.length} · inesperadas: ${unexpected.length}`)
  for (const line of unexpected.slice(0, 12)) console.log('   ' + line.slice(0, 220))
  const sameOrder = a.length === b.length && a.every((line, index) => line === b[index])
  if (!sameOrder && !unexpected.length) console.log('   os elementos são os mesmos, mas a ordem é diferente')
  if (unexpected.length || !sameOrder) failures.push(route)
}
if (failures.length) { console.error(`\nDiferenças inesperadas em: ${failures.join(', ')}`); process.exit(1) }
console.log('\nO HTML servido corresponde ao protótipo (fora dos blocos de posts e dos ajustes documentados).')
