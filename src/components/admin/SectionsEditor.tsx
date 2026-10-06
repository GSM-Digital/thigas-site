'use client'

import { useMemo, useState } from 'react'
import { Collapsible, FieldPathContext, TextareaField, TextField, UploadField, useFormFields } from '@payloadcms/ui'
import type { TextareaFieldClient, TextFieldClient, UploadFieldClient } from 'payload'
import { validateHref } from '@/lib/href'
import { ADMIN_ROUTE } from '@/lib/routes'
import { listOf, managedFor, scopeFor, type Entry, type List, type Managed } from './content-map'
import './sections-editor.css'

type Item = { key: string; list: List; index: number; entry: Entry; withLink?: boolean }
type Block = { grupo?: Entry['grupo']; items: Item[] }
type Section = { name: string; blocks: Block[]; size: number; posts?: boolean }
type Indexes = Record<List, Map<string, number>>

const LISTS: List[] = ['copy', 'images', 'links']

/**
 * Uma linha por seção da página (Hero, Números…). Ao abrir, aparecem juntos
 * todos os campos daquela seção: títulos, textos, botões com seus links e
 * imagens, na ordem em que estão no layout. Os valores continuam nas listas
 * `copy`, `images` e `links` do documento; aqui só muda a forma de editar.
 */
export default function SectionsEditor() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  // Só as chaves, numa string: o editor não renderiza de novo a cada letra digitada.
  const signature = useFormFields(([fields]) => LISTS.map((list) => {
    const keys: string[] = []
    for (let index = 0; fields[`${list}.${index}.key`]; index += 1) keys.push(String(fields[`${list}.${index}.key`]?.value || ''))
    return keys.join(',')
  }).join('|'))

  const sections = useMemo(() => {
    const indexes = Object.fromEntries(signature.split('|').map((keys, i) =>
      [LISTS[i], new Map(keys ? keys.split(',').map((key, index) => [key, index] as const) : [])])) as Indexes
    return buildSections(scopeFor(slug), managedFor(slug), indexes)
  }, [signature, slug])

  const isModel = slug === 'post'
  if (!sections.length) return null
  return (
    <div className="tb-sections">
      {isModel && (
        <p className="tb-managed">
          Este é o modelo usado por todos os posts. Título, imagem e texto vêm de cada post em <a href={`${ADMIN_ROUTE}/collections/posts`}>Posts</a>;
          aqui você edita só o que se repete em todos: o título e o link da seção &quot;Leia também&quot;, no fim do artigo.
        </p>
      )}
      {sections.map((section, number) => <SectionBlock key={`${number}-${section.name}`} section={section} number={number + 1} />)}
    </div>
  )
}

function buildSections(scope: Record<string, Entry>, managed: Managed[], indexes: Indexes): Section[] {
  const sections: Section[] = []
  const byName = new Map<string, Section>()
  const used = new Set<string>()
  const sectionFor = (name: string) => {
    // Os menus suspensos ficam no meio do menu principal no layout; aqui ele continua um bloco só.
    let section = byName.get(name)
    if (!section) {
      sections.push(section = { name, blocks: [], size: 0 })
      byName.set(name, section)
    }
    return section
  }
  const add = (name: string, item: Item) => {
    const section = sectionFor(name)
    let block = section.blocks.at(-1)
    if (!block || block.grupo?.id !== item.entry.grupo?.id) section.blocks.push(block = { grupo: item.entry.grupo, items: [] })
    // Texto que fecha um link (botão, card) traz o campo do destino junto.
    item.withLink = item.list === 'copy' && Boolean(item.entry.link && scope[item.entry.link]?.textos?.at(-1) === item.key && indexes.links.has(item.entry.link))
    block.items.push(item)
    section.size += item.withLink ? 2 : 1
    used.add(`${item.list}:${item.key}`)
  }
  const linkOfImage = new Map(Object.entries(scope).filter(([key, entry]) => entry.imagem && indexes.links.has(key)).map(([key, entry]) => [entry.imagem!, key]))
  for (const [key, entry] of Object.entries(scope)) {
    const list = listOf(key)
    const index = list ? indexes[list].get(key) : undefined
    if (!list || index === undefined) continue
    // Link com texto aparece junto do texto, não como campo solto; link de imagem vem depois dela.
    if (list === 'links' && entry.textos?.some((text) => indexes.copy.has(text))) continue
    if (list === 'links' && entry.imagem && indexes.images.has(entry.imagem)) continue
    add(entry.secao, { key, list, index, entry })
    const imageLink = list === 'images' ? linkOfImage.get(key) : undefined
    if (imageLink) add(entry.secao, { key: imageLink, list: 'links', index: indexes.links.get(imageLink)!, entry: scope[imageLink] })
  }
  // Seções com cards de posts (carrossel da home, lista do blog, "Leia também") ganham o aviso com o caminho para Posts.
  for (const item of managed) {
    const section = byName.get(item.secao)
    if (section && item.tipo !== 'article') section.posts = true
  }
  // Conteúdo salvo que o layout não descreve (não deveria acontecer), para nada ficar inacessível.
  for (const list of LISTS) {
    for (const [key, index] of indexes[list]) {
      if (!used.has(`${list}:${key}`) && !(list === 'links' && scope[key]?.textos?.length)) {
        add('Outros conteúdos', { key, list, index, entry: scope[key] || { secao: 'Outros conteúdos', inicio: false } })
      }
    }
  }
  return sections
}

function SectionBlock({ section, number }: { section: Section; number: number }) {
  // Campos só existem na tela depois de abrir a seção: páginas longas continuam leves.
  const [open, setOpen] = useState(false)
  const counters: Record<string, number> = {}
  return (
    <Collapsible
      className="tb-section"
      initCollapsed
      onToggle={(collapsed) => { if (!collapsed) setOpen(true) }}
      header={
        <span className="tb-section__header">
          <span className="tb-section__number">{String(number).padStart(2, '0')}</span>
          <span className="tb-section__name">{section.name}</span>
          <SectionPreview section={section} />
          <span className="tb-section__count">{section.size ? `${section.size} ${section.size === 1 ? 'campo' : 'campos'}` : 'posts do blog'}</span>
        </span>
      }
    >
      {open && (
        <div className="tb-section__body">
          {section.posts && (
            <p className="tb-managed">
              Os cards desta seção mostram os posts publicados, do mais recente para o mais antigo.
              Para criar ou editar um post, vá em <a href={`${ADMIN_ROUTE}/collections/posts`}>Posts</a>.
            </p>
          )}
          {section.blocks.map((block, index) => {
            const fields = block.items.map((item) => <ItemFields key={`${item.list}:${item.key}`} item={item} />)
            if (!block.grupo) return fields
            const tipo = block.grupo.tipo
            counters[tipo] = (counters[tipo] || 0) + 1
            return (
              <fieldset className="tb-group" key={block.grupo.id || index}>
                <legend><GroupLegend label={`${tipo} ${counters[tipo]}`} items={block.items} /></legend>
                {fields}
              </fieldset>
            )
          })}
        </div>
      )}
    </Collapsible>
  )
}

/** Título atual da seção ao lado do nome, para reconhecer a seção sem abrir. */
function SectionPreview({ section }: { section: Section }) {
  const items = section.blocks.flatMap((block) => block.grupo ? [] : block.items)
  const start = items.findIndex((item) => item.list === 'copy' && item.entry.papel?.startsWith('Título'))
  // As partes de um título dividido vêm sempre em sequência.
  const run = start < 0 ? [] : items.slice(start, start + (items[start].entry.partes || 1))
  const text = useFormFields(([fields]) => run.map((item) => String(fields[`copy.${item.index}.value`]?.value || '')).join(' '))
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean || clean === section.name) return null
  return <span className="tb-section__preview">{clean.length > 70 ? `${clean.slice(0, 70)}…` : clean}</span>
}

function GroupLegend({ label, items }: { label: string; items: Item[] }) {
  const first = items.find((item) => item.list === 'copy' && item.entry.papel?.startsWith('Título')) || items.find((item) => item.list === 'copy')
  const text = useFormFields(([fields]) => first ? String(fields[`copy.${first.index}.value`]?.value || '').trim() : '')
  return <>{label}{text && <span className="tb-group__preview"> · {text.length > 60 ? `${text.slice(0, 60)}…` : text}</span>}</>
}

function ItemFields({ item }: { item: Item }) {
  if (item.list === 'images') return <ImageFields item={item} />
  if (item.list === 'links') return <LinkField index={item.index} label={item.entry.papel || 'Link'} />
  if (!item.withLink) return <TextFields item={item} />
  return (
    <div className="tb-pair">
      <TextFields item={item} />
      <TextLink item={item} />
    </div>
  )
}

function TextFields({ item }: { item: Item }) {
  const { papel = 'Texto', parte, partes } = item.entry
  const path = `copy.${item.index}.value`
  const field: TextareaFieldClient = {
    name: 'value', type: 'textarea', required: true,
    label: parte && partes ? `${papel} (parte ${parte} de ${partes})` : papel,
    admin: {
      rows: 1,
      description: parte === 1 ? 'O título é dividido em partes para manter o trecho colorido do layout. Edite cada parte no seu campo.' : item.entry.nota,
    },
  }
  return <FieldPathContext value={path}><TextareaField path={path} field={field} /></FieldPathContext>
}

/** Destino do link logo depois do último texto dele (um card inteiro tem um link só). */
function TextLink({ item }: { item: Item }) {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined)
  const linkKey = item.entry.link
  const link = linkKey ? scopeFor(slug)[linkKey] : undefined
  const index = useFormFields(([fields]) => {
    if (!linkKey) return -1
    for (let i = 0; fields[`links.${i}.key`]; i += 1) if (fields[`links.${i}.key`]?.value === linkKey) return i
    return -1
  })
  if (!link || index < 0 || link.textos?.at(-1) !== item.key) return null
  return <LinkField index={index} label={link.papel || 'Link'} />
}

function LinkField({ index, label }: { index: number; label: string }) {
  const path = `links.${index}.href`
  const field: TextFieldClient = {
    name: 'href', type: 'text', label, required: true,
    admin: { description: 'Página do site, como /contato, ou endereço completo com https://.' },
  }
  return <FieldPathContext value={path}><TextField path={path} field={field} validate={validateHref} /></FieldPathContext>
}

function ImageFields({ item }: { item: Item }) {
  const base = `images.${item.index}`
  const current = useFormFields(([fields]) => fields[`${base}.media`]?.value ? '' : String(fields[`${base}.src`]?.value || ''))
  const upload = {
    name: 'media', type: 'upload', relationTo: 'media', label: current ? 'Substituir imagem' : 'Imagem',
    admin: {
      description: current ? 'Escolha uma imagem da biblioteca para substituir a atual.' : undefined,
    },
  } as UploadFieldClient
  const alt: TextFieldClient = {
    name: 'alt', type: 'text', label: 'Descrição da imagem',
    admin: { description: 'Descreva a imagem para quem usa leitor de tela.' },
  }
  return (
    <div className="tb-image">
      {current && (
        <figure className="tb-image__current">
          <figcaption className="field-label">Imagem atual</figcaption>
          <img src={current} alt="" />
        </figure>
      )}
      <FieldPathContext value={`${base}.media`}><UploadField path={`${base}.media`} field={upload} /></FieldPathContext>
      <FieldPathContext value={`${base}.alt`}><TextField path={`${base}.alt`} field={alt} /></FieldPathContext>
    </div>
  )
}
