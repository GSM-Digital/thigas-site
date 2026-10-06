import fs from 'node:fs'
import path from 'node:path'

/**
 * Descreve, para cada entrada de conteúdo, a que seção da página ela pertence.
 * O painel usa isso para separar a lista de textos por seção em vez de mostrar
 * centenas de linhas seguidas sem contexto.
 *
 * Os nomes saem do próprio layout: o id da seção na página inicial (Soluções,
 * Projetos…) ou o título que o site já exibe. Assim o que o editor lê no
 * painel é o mesmo que ele vê na página.
 */

const root = path.resolve(import.meta.dirname, '..')
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/prototype.json'), 'utf8'))

/** Seções da página inicial pelo id. */
const IDS = {
  inicio: 'Hero', solucoes: 'Soluções', projetos: 'Projetos', processo: 'Processo',
  sobre: 'Sobre', blog: 'Blog', contato: 'Contato', case: 'Janela do projeto',
  'dlg-inst': 'Simulação · Site institucional', 'dlg-shop': 'Simulação · E-commerce',
  'dlg-lp': 'Simulação · Landing page', 'dlg-app': 'Simulação · Plataforma sob medida',
  'sol-gallery': 'Cards de soluções', 'pj-cta': 'Chamada dos projetos',
}

/** Contêineres sem título próprio, mas com nome óbvio para quem edita. */
const NAMED = [
  [/\bfeatures\b/, 'Em todo projeto'],
  [/\bed-hero\b/, 'Topo do blog'],
  [/\bed-shelf\b/, 'Lista de posts'],
  [/\bed-related\b/, 'Leia também'],
  [/\blegal-hero\b/, 'Introdução'],
  [/\blegal-toc\b/, 'Índice da página'],
  [/\bnav-links\b/, 'Menu principal'],
  [/\bnav-actions\b/, 'Botões do topo'],
  [/\bmenu-sheet\b/, 'Menu no celular'],
  [/\bskip\b/, 'Acessibilidade'],
  [/\bft-intro\b/, 'Chamada do rodapé'],
  [/\bft-top\b/, 'Colunas de links'],
  [/\bft-bottom\b/, 'Rodapé inferior'],
  [/\blegal-footer\b/, 'Rodapé'],
]

const FIELDS = ['textKey', 'imageKey', 'linkKey']

const findNode = (node, test) => {
  if (test(node.tag, node.attrs?.class || '', node)) return node
  for (const child of node.children || []) {
    const found = findNode(child, test)
    if (found) return found
  }
}

const textOf = (node, texts, out = []) => {
  if (!node.tag && !node.managed) {
    const value = texts.get(node.textKey) ?? node.text ?? ''
    if (value.trim()) out.push(value.trim())
  }
  for (const child of node.children || []) textOf(child, texts, out)
  return out
}

const trim = (name) => (name.length > 48 ? `${name.slice(0, 47)}…` : name)
const hasClass = (node, name) => (node.attrs?.class || '').split(/\s+/).includes(name)
const is = (node, tag, css) => node.tag === tag && (!css || hasClass(node, css))

/** Nome para uma seção de conteúdo: o título que o site mostra nela. */
function headingName(node, texts) {
  const heading = findNode(node, (tag) => tag === 'h1' || tag === 'h2')
  const value = heading && textOf(heading, texts).join(' ').replace(/\s+/g, ' ').trim()
  return value || null
}

/** Dá nome à seção que começa neste nó, ou devolve null para continuar na atual. */
function nameFor(node, texts, { top, deep }) {
  const className = node.attrs?.class || ''
  const id = node.attrs?.id
  if (id && IDS[id]) return IDS[id]
  const named = NAMED.find(([test]) => test.test(className))?.[1]
  if (named) return named
  if (node.tag === 'footer') return 'Rodapé'
  if (node.tag === 'header') return 'Menu principal'
  if (node.tag === 'dialog') return (id && IDS[id]) || headingName(node, texts) || 'Janela'
  // Seções com título próprio (as cláusulas das páginas legais, por exemplo).
  if (node.tag === 'section' && (top || !deep)) return headingName(node, texts)
  return null
}

/**
 * Percorre na ordem do documento e atribui a cada chave a seção vigente.
 * O divisor nasce onde a seção muda — por lista, já que textos, imagens e
 * links são três listas separadas no painel.
 */
function mapSections(nodes, texts, { deep = false, slug } = {}) {
  const result = {}
  const managed = []
  const last = {}
  let groups = 0
  const partOf = {}

  function walk(node, current, top, link, ancestors, group) {
    if (node.managed) {
      managed.push({ secao: trim(MANAGED_NAMES[node.managed] || current || 'Conteúdo'), tipo: node.managed })
      return
    }
    // <main> é só o contêiner: as seções são os filhos dele.
    if (top && node.tag === 'main') {
      for (const child of node.children || []) walk(child, current, true, null, [node, ...ancestors], undefined)
      return
    }
    let name = current
    const own = nameFor(node, texts, { top, deep })
    if (own) name = own
    else if (!current) name = (top && headingName(node, texts)) || 'Conteúdo'
    // Uma seção nova começa sem grupo aberto.
    if (name !== current) group = undefined
    if (node.slot) managed.push({ secao: trim(name || 'Conteúdo'), tipo: node.slot })

    for (const field of FIELDS) {
      const key = node[field]
      if (!key || result[key]) continue
      result[key] = { secao: trim(name || 'Conteúdo'), inicio: last[field] !== name }
      if (group) result[key].grupo = group
      last[field] = name
    }
    if (node.linkKey && result[node.linkKey]) {
      result[node.linkKey].papel = linkRole(node)
      // Link que só envolve uma imagem (logo, banner): o painel mostra o destino logo depois dela.
      const image = keysOf(node, 'textKey').length ? undefined : keysOf(node, 'imageKey')[0]
      if (image) result[node.linkKey].imagem = image
    }
    if (node.textKey) {
      result[node.textKey].papel = textRole(ancestors)
      const nota = noteFor(ancestors)
      if (nota) result[node.textKey].nota = nota
    }
    // Liga o texto ao link que o envolve, para o painel editar os dois juntos.
    if (node.textKey && link && result[link]) {
      result[node.textKey].link ??= link
      result[link].textos ??= []
      if (!result[link].textos.includes(node.textKey)) result[link].textos.push(node.textKey)
    }
    // Títulos com trecho colorido são quebrados em partes: numera cada uma.
    if (/^h[1-6]$/.test(node.tag || '')) {
      const parts = keysOf(node, 'textKey')
      if (parts.length > 1) parts.forEach((key, index) => { partOf[key] = { parte: index + 1, partes: parts.length } })
    }

    const children = node.children || []
    const signature = (child) => child.tag ? `${child.tag}.${(child.attrs?.class || '').split(/\s+/)[0]}` : ''
    const counts = new Map()
    for (const child of children) counts.set(signature(child), (counts.get(signature(child)) || 0) + 1)
    for (const child of children) {
      let childGroup = group
      // Blocos repetidos lado a lado (cards, etapas, campos…) viram um grupo, se tiverem mais de um conteúdo.
      if (!group && child.tag && counts.get(signature(child)) > 1 && editable(child) > 1) {
        childGroup = { id: `g${(groups += 1)}`, tipo: groupType(child) }
      }
      walk(child, name, false, node.linkKey || link, [node, ...ancestors], childGroup)
    }
  }

  for (const node of nodes || []) walk(node, null, true, null, [], undefined)
  for (const [key, part] of Object.entries(partOf)) Object.assign(result[key], part)
  return { entries: result, managed }
}

const MANAGED_NAMES = { 'blog-feature': 'Post em destaque', 'blog-listing': 'Lista de posts', article: 'Artigo', related: 'Leia também' }

const keysOf = (node, field, out = []) => {
  if (node[field]) out.push(node[field])
  for (const child of node.children || []) keysOf(child, field, out)
  return out
}
/** Quantos campos o bloco teria no painel: textos, imagens e links sem texto próprio. */
function editable(node) {
  const texts = keysOf(node, 'textKey').length
  const images = keysOf(node, 'imageKey').length
  const bare = (function count(n) {
    let total = n.linkKey && !keysOf(n, 'textKey').length ? 1 : 0
    for (const child of n.children || []) total += count(child)
    return total
  })(node)
  return texts + images + bare
}

function groupType(node) {
  const css = node.attrs?.class || ''
  if (node.tag === 'details' || /\b(faq|fa)\b/.test(css)) return 'Pergunta'
  if (/\bfield\b/.test(css)) return 'Campo'
  if (/\bct-chip\b/.test(css)) return 'Opção'
  if (/\bab-stat\b/.test(css)) return 'Número'
  if (/\b(step|etapa)\b/.test(css)) return 'Etapa'
  if (/card/.test(css)) return 'Card'
  return 'Item'
}

/** Nome do campo para quem edita, lido dos elementos em volta do texto (do mais próximo ao mais distante). */
function textRole(ancestors) {
  const find = (test) => ancestors.find(test)
  if (find((n) => hasClass(n, 'pill'))) return 'Item do menu'
  const heading = find((n) => /^h[1-6]$/.test(n.tag || ''))
  if (heading) return heading.tag === 'h1' ? 'Título principal' : 'Título'
  if (find((n) => n.tag === 'summary')) return 'Pergunta'
  if (find((n) => n.tag === 'details')) return 'Resposta'
  if (find((n) => is(n, 'a', 'btn') || is(n, 'a', 'ft-cta') || n.tag === 'button')) return 'Botão'
  if (find((n) => n.tag === 'a')) return 'Texto do link'
  if (find((n) => ['section-intro', 'hero-lead', 'ed-intro', 'legal-lead', 'g-lead'].some((name) => hasClass(n, name)))) return 'Subtítulo'
  if (find((n) => ['eyebrow', 'hero-eyebrow', 'ed-eyebrow', 'g-eyebrow', 'legal-kicker', 'sol-eyebrow'].some((name) => hasClass(n, name)))) return 'Etiqueta'
  if (find((n) => hasClass(n, 'badge-new') || hasClass(n, 'tag'))) return 'Tag'
  if (find((n) => n.tag === 'label' || n.tag === 'option' || n.tag === 'select' || n.tag === 'legend')) return 'Campo do formulário'
  if (find((n) => n.tag === 'li')) return 'Item da lista'
  return 'Texto'
}

/** Elementos sem destino não têm campo de link: o painel explica por quê. */
function noteFor(ancestors) {
  const inLink = ancestors.some((n) => n.tag === 'a')
  const button = ancestors.find((n) => n.tag === 'button')
  if (inLink || !button) return undefined
  if (button.attrs?.role === 'tab') return 'Esta é uma aba: ela troca o conteúdo mostrado na página, por isso não tem link.'
  if (button.attrs?.type === 'submit') return 'Botão de envio do formulário: ele abre o WhatsApp com a mensagem pronta, por isso não tem link.'
  if (button.attrs?.commandfor) return 'Este botão abre uma janela da própria página, por isso não tem link.'
  return 'Este botão executa uma ação do site (filtrar, trocar, abrir), por isso não tem link.'
}

function linkRole(node) {
  if (!keysOf(node, 'textKey').length) return node.attrs?.['aria-label'] ? `Link do ícone (${node.attrs['aria-label']})` : 'Link ao clicar na imagem'
  return is(node, 'a', 'btn') || is(node, 'a', 'ft-cta') ? 'Link do botão' : 'Link'
}

const output = { pages: {}, managed: {}, site: {} }
for (const page of data.pages) {
  const texts = new Map((page.content.copy || []).map((entry) => [entry.key, entry.value]))
  const { entries, managed } = mapSections(page.body, texts, { slug: page.slug })
  output.pages[page.slug] = entries
  if (managed.length) output.managed[page.slug] = managed
}
{
  const texts = new Map((data.site.content.copy || []).map((entry) => [entry.key, entry.value]))
  output.site = {
    ...mapSections(data.site.header, texts, { deep: true }).entries,
    ...mapSections(data.site.footer, texts, { deep: true }).entries,
  }
}

fs.writeFileSync(path.join(root, 'src/generated/sections.json'), `${JSON.stringify(output, null, 2)}\n`)

const totalPages = Object.values(output.pages).reduce((sum, page) => sum + Object.keys(page).length, 0)
const names = new Set(Object.values(output.pages).flatMap((page) => Object.values(page).map((v) => v.secao)))
const siteNames = new Set(Object.values(output.site).map((v) => v.secao))
console.log(`Mapeadas ${totalPages} entradas em ${Object.keys(output.pages).length} páginas e ${Object.keys(output.site).length} no cabeçalho/rodapé.`)
console.log(`Seções nas páginas: ${names.size} nomes.`)
console.log(`Seções no cabeçalho/rodapé: ${[...siteNames].join(' · ')}`)
