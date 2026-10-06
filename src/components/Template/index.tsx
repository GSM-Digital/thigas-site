import { createElement, Fragment } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { Content, TemplateNode } from '@/lib/types'
import { relativeURL } from '@/lib/url'
import './template.css'

const names: Record<string, string> = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', viewbox: 'viewBox', preserveaspectratio: 'preserveAspectRatio',
  crossorigin: 'crossOrigin', colspan: 'colSpan', rowspan: 'rowSpan', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength',
  srcset: 'srcSet', 'xlink:href': 'xlinkHref', 'xmlns:xlink': 'xmlnsXlink', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen',
  referrerpolicy: 'referrerPolicy', contenteditable: 'contentEditable', autocomplete: 'autoComplete', spellcheck: 'spellCheck',
  inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', fetchpriority: 'fetchPriority', novalidate: 'noValidate', autofocus: 'autoFocus', datetime: 'dateTime',
}
const booleans = ['hidden', 'disabled', 'required', 'checked', 'multiple', 'allowfullscreen', 'novalidate', 'readonly', 'inert', 'autofocus', 'open']
const voids = new Set(['img', 'input', 'br', 'hr', 'source', 'col', 'wbr', 'area', 'embed', 'track'])
const safeURL = (value: string) => /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) ? value : '#'
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char)
const classOf = (node: TemplateNode) => (node.attrs?.class || '').split(' ')

function style(value: string): CSSProperties {
  return Object.fromEntries(value.split(';').filter((part) => part.includes(':')).map((part) => {
    const index = part.indexOf(':')
    const key = part.slice(0, index).trim()
    return [key.startsWith('--') ? key : key.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), part.slice(index + 1).trim()]
  }))
}

export type TemplateProps = {
  nodes: TemplateNode[]
  content: Content
  /** Blocos montados a partir dos posts, pelo nome do espaço reservado no layout. */
  slots?: Record<string, ReactNode>
  /** Espaços sem posts: a seção que os contém some, em vez de ficar um título sem nada embaixo. */
  emptySlots?: string[]
  /** Cabeçalho e rodapé vêm da página inicial; fora dela os atalhos de âncora e as janelas viram links para a inicial. */
  offHome?: boolean
  /** Página atual, para marcar o item do menu (`aria-current`). */
  current?: string
  /** Âncoras que passam a apontar para outro endereço (`#blog` → `/blog` quando a seção do blog não existe na página). */
  anchors?: Record<string, string>
  /** Logo escolhido em "Configurações do site": troca o nome com o ponto azul no cabeçalho. */
  logo?: { url: string; alt: string }
}

/**
 * Renderiza a árvore do protótipo aplicando os valores do banco. Texto vira texto
 * React, nunca HTML; URLs passam por validação; atributos on* nunca chegam aqui.
 */
export function Template({ nodes, content, slots = {}, emptySlots = [], offHome, current, anchors, logo }: TemplateProps) {
  const texts = new Map(content.copy?.map((entry) => [entry.key, entry.value]))
  const images = new Map(content.images?.map((entry) => [entry.key, entry]))
  const links = new Map(content.links?.map((entry) => [entry.key, entry.href]))
  const textOf = (node: TemplateNode) => node.textKey && texts.has(node.textKey) ? texts.get(node.textKey) : node.text

  const hrefOf = (node: TemplateNode) => {
    const value = node.linkKey && links.has(node.linkKey) ? links.get(node.linkKey)! : node.attrs?.href
    if (value === undefined) return undefined
    const href = safeURL(value)
    if (anchors?.[href]) return anchors[href]
    // `#conteudo` é o pulo do menu para o texto da própria página; as demais âncoras são da página inicial.
    return offHome && href.startsWith('#') && href.length > 1 && href !== '#conteudo' ? `/${href}` : href
  }
  const imageOf = (node: TemplateNode) => {
    const image = node.imageKey ? images.get(node.imageKey) : undefined
    return image ? { src: safeURL((typeof image.media === 'object' && relativeURL(image.media?.url)) || image.src), alt: image.alt } : undefined
  }

  function subtree(node: TemplateNode, test: (node: TemplateNode) => boolean): boolean {
    return test(node) || Boolean(node.children?.some((child) => subtree(child, test)))
  }
  /** Sem posts, some a seção inteira que mostraria cards (o título não fica sozinho). */
  const hide = (node: TemplateNode) => emptySlots.length > 0 && node.tag === 'section'
    && subtree(node, (n) => emptySlots.includes(n.slot || n.managed || ''))
  const visible = (list?: TemplateNode[]) => list?.filter((node) => !hide(node))

  /** Atributos do HTML original, já no formato do React. */
  function attributes(node: TemplateNode, tag: string) {
    const attrs: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(node.attrs || {})) {
      if (/^on/i.test(name)) continue
      let prop = names[name] || (name.startsWith('aria-') || name.startsWith('data-') ? name : name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()))
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (name === 'value') prop = 'defaultValue'
        if (name === 'checked') prop = 'defaultChecked'
      }
      attrs[prop] = name === 'style' ? style(value) : booleans.includes(name) ? true : name === 'href' || name === 'src' ? safeURL(value) : value
    }
    return attrs
  }

  /** Conteúdo de <template>: o navegador guarda os filhos num fragmento próprio, então vai como HTML já escapado. */
  function serialize(list?: TemplateNode[]): string {
    return (list || []).map((node) => {
      if (!node.tag) return escape(textOf(node) || '')
      const image = imageOf(node)
      const href = node.tag === 'a' ? hrefOf(node) : undefined
      const attrs = Object.entries(node.attrs || {}).filter(([name]) => !/^on/i.test(name) && !(name === 'href' && href !== undefined) && !(name === 'src' && image) && !(name === 'alt' && image))
      const parts = attrs.map(([name, value]) => ` ${name}="${escape(name === 'href' || name === 'src' ? safeURL(value) : value)}"`)
      if (href !== undefined) parts.push(` href="${escape(href)}"`)
      if (image) parts.push(` src="${escape(image.src)}" alt="${escape(image.alt)}"`)
      const open = `<${node.tag}${parts.join('')}`
      return voids.has(node.tag) ? `${open}>` : `${open}>${serialize(node.children)}</${node.tag}>`
    }).join('')
  }

  function render(node: TemplateNode, key: string): ReactNode {
    if (node.managed) return slots[node.managed] ?? null
    if (!node.tag) return textOf(node)
    let tag = node.tag
    const attrs: Record<string, unknown> = { key, ...attributes(node, tag) }
    if (node.slot) return createElement(tag, attrs, slots[node.slot])

    // Fora da página inicial, os botões que abrem janelas de simulação viram links para a seção de soluções.
    if (offHome && tag === 'button' && node.attrs?.commandfor) {
      tag = 'a'
      for (const name of ['type', 'command', 'commandFor', 'commandfor', 'aria-haspopup']) delete attrs[name]
      attrs.href = '/#solucoes'
    }
    const href = tag === 'a' ? hrefOf(node) ?? (attrs.href as string | undefined) : undefined
    if (href !== undefined) attrs.href = href
    if (tag === 'a' && current && classOf(node).includes('pill') && href === current) attrs['aria-current'] = 'page'

    const image = imageOf(node)
    if (image) { attrs.src = image.src; attrs.alt = image.alt }

    if (tag === 'template') return createElement('template', { ...attrs, dangerouslySetInnerHTML: { __html: serialize(node.children) } })
    if (voids.has(tag)) return createElement(tag, attrs)

    let children: ReactNode
    if (tag === 'textarea') {
      // O React quer o conteúdo de <textarea> em defaultValue, não como filho.
      return createElement(tag, { ...attrs, defaultValue: node.children?.map((child) => textOf(child) || '').join('') })
    } else if (tag === 'option') {
      children = node.children?.map((child) => textOf(child) || '').join('')
    } else if (logo && tag === 'a' && classOf(node).includes('brand')) {
      // Logo enviado pelo painel no lugar do nome com o ponto azul; o resto do conteúdo do link continua.
      const rest = visible(node.children)?.filter((child) => !(child.tag === 'span' && (classOf(child).includes('brand-dot') || classOf(child).includes('brand-word'))))
      children = [<img className="brand-logo" key="logo" src={logo.url} alt={logo.alt} />, ...(rest || []).map((child, i) => <Fragment key={i}>{render(child, `${key}.${i}`)}</Fragment>)]
    } else {
      children = visible(node.children)?.map((child, i) => <Fragment key={i}>{render(child, `${key}.${i}`)}</Fragment>)
    }
    return createElement(tag, attrs, children)
  }
  return visible(nodes)?.map((node, index) => <Fragment key={index}>{render(node, String(index))}</Fragment>)
}
