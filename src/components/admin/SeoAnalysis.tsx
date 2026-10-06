'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { pageTitle } from '@/lib/site-title'
import { plainText } from '@/lib/blog'
import { scopeFor } from './content-map'
import './seo-analysis.css'

type Status = 'good' | 'ok' | 'bad'
type Check = { status: Status; text: string }
type Snapshot = {
  post: boolean; keyphrase: string; title: string; description: string; slug: string; featured: boolean
  headings: string[]; opening: string[]; texts: string[]; alts: string[]
}
type SiteSettings = { siteName?: string; defaultDescription?: string | null; shareImage?: unknown }

const STOPWORDS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'um', 'uma', 'ao', 'que'])
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const words = (value: string) => normalize(value).split(' ').filter(Boolean)
/** Mesma palavra ou variação curta de singular/plural ("site" e "sites"). */
const sameWord = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 2)

/** A frase aparece inteira ou com todas as palavras importantes, em qualquer ordem. */
function mentions(text: string, phrase: string) {
  const key = words(phrase).filter((word) => !STOPWORDS.has(word))
  if (!key.length) return false
  if (normalize(text).includes(normalize(phrase))) return true
  const found = words(text)
  return key.every((word) => found.some((candidate) => sameWord(candidate, word)))
}

/**
 * Análise no estilo do Yoast SEO: prévia do resultado no Google e verificações
 * da frase-chave e dos tamanhos. Só orienta; nada aqui impede de salvar.
 */
export default function SeoAnalysis() {
  const { id, collectionSlug } = useDocumentInfo()
  const post = collectionSlug === 'posts'
  const raw = useFormFields(([fields]) => {
    const value = (path: string) => String(fields[path]?.value ?? '')
    const slug = value('slug')
    if (post) {
      // Post: título e resumo valem quando os campos de SEO estão vazios; o texto vem do editor.
      const blocks = ((fields.content?.value as { root?: { children?: unknown[] } } | undefined)?.root?.children || []).map(plainText).filter((text) => text.trim())
      const snapshot: Snapshot = {
        post, keyphrase: value('focusKeyphrase').trim(), title: value('seoTitle') || value('title'), description: value('seoDescription') || value('excerpt'), slug,
        featured: Boolean(fields.featuredImage?.value), headings: [value('title')], opening: blocks.slice(0, 1), texts: blocks, alts: [],
      }
      return JSON.stringify(snapshot)
    }
    const scope = scopeFor(slug)
    const copy: { key: string; value: string }[] = []
    for (let i = 0; fields[`copy.${i}.key`]; i += 1) copy.push({ key: value(`copy.${i}.key`), value: value(`copy.${i}.value`) })
    const alts: string[] = []
    for (let i = 0; fields[`images.${i}.key`]; i += 1) alts.push(value(`images.${i}.alt`))
    const firstSection = copy.length ? scope[copy[0].key]?.secao : undefined
    const snapshot: Snapshot = {
      post, keyphrase: value('focusKeyphrase').trim(), title: value('title'), description: value('description'), slug,
      featured: Boolean(fields.featuredImage?.value),
      headings: copy.filter((item) => scope[item.key]?.papel === 'Título principal').map((item) => item.value),
      opening: copy.filter((item) => scope[item.key]?.secao === firstSection).map((item) => item.value),
      texts: copy.map((item) => item.value), alts,
    }
    // Texto único: a análise só recalcula quando algo que ela usa muda.
    return JSON.stringify(snapshot)
  })
  const data = useMemo(() => JSON.parse(raw) as Snapshot, [raw])

  const [settings, setSettings] = useState<SiteSettings>({})
  useEffect(() => {
    fetch('/api/globals/settings?depth=0', { credentials: 'include' }).then((r) => r.json()).then(setSettings).catch(() => {})
  }, [])

  // Frase-chave repetida em outra página: as duas disputam a mesma busca.
  const [usedIn, setUsedIn] = useState<string[]>([])
  useEffect(() => {
    if (!data.keyphrase) return setUsedIn([])
    const timer = setTimeout(() => {
      const query = new URLSearchParams({ 'where[focusKeyphrase][equals]': data.keyphrase, depth: '0', limit: '5' })
      if (id) query.set('where[id][not_equals]', String(id))
      fetch(`/api/${post ? 'posts' : 'pages'}?${query}`, { credentials: 'include' }).then((r) => r.json())
        .then((result) => setUsedIn((result.docs || []).map((doc: { title: string }) => doc.title))).catch(() => {})
    }, 600)
    return () => clearTimeout(timer)
  }, [data.keyphrase, id, post])

  const fullTitle = pageTitle(data.title, settings.siteName || '', post ? 'post' : data.slug)
  const description = data.description.trim()
  const checks = analyse(data, fullTitle, description, Boolean(settings.shareImage), usedIn)
  const score: Status = checks.some((check) => check.status === 'bad') ? 'bad' : checks.some((check) => check.status === 'ok') ? 'ok' : 'good'
  const shownDescription = description || settings.defaultDescription || ''
  const host = typeof window === 'undefined' ? '' : window.location.host

  return (
    <div className="tb-seo field-type">
      <div className="tb-seo__heading">
        <span className="field-label">Análise de SEO</span>
        <span className={`tb-seo__score tb-seo__score--${score}`}>{{ good: 'Bom', ok: 'Pode melhorar', bad: 'Precisa de atenção' }[score]}</span>
      </div>

      <div className="tb-seo__snippet" aria-label="Prévia no Google">
        <span className="tb-seo__snippet-url">{host} {post ? `› blog › ${data.slug}` : data.slug && data.slug !== 'index' ? `› ${data.slug}` : ''}</span>
        <span className="tb-seo__snippet-title">{fullTitle.length > 60 ? `${fullTitle.slice(0, 59)}…` : fullTitle}</span>
        <span className="tb-seo__snippet-description">
          {shownDescription ? (shownDescription.length > 156 ? `${shownDescription.slice(0, 155)}…` : shownDescription) : 'Sem descrição: o Google escolhe um trecho da página.'}
        </span>
      </div>

      <ul className="tb-seo__checks">
        {checks.map((check) => (
          <li key={check.text} className={`tb-seo__check tb-seo__check--${check.status}`}>
            <span className="tb-seo__dot" aria-label={{ good: 'Bom', ok: 'Pode melhorar', bad: 'Problema' }[check.status]} />
            {check.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function analyse(data: Snapshot, fullTitle: string, description: string, hasDefaultImage: boolean, usedIn: string[]): Check[] {
  const checks: Check[] = []
  const phrase = data.keyphrase
  const check = (ok: boolean, good: string, bad: string, fallback: Status = 'bad') => checks.push(ok ? { status: 'good', text: good } : { status: fallback, text: bad })

  if (!phrase) {
    checks.push({ status: 'bad', text: 'Defina uma frase-chave foco para analisar título, descrição e conteúdo.' })
  } else {
    const size = words(phrase).filter((word) => !STOPWORDS.has(word)).length
    if (size > 4) checks.push({ status: 'ok', text: `A frase-chave tem ${size} palavras importantes. Frases curtas, de até 4, são mais buscadas.` })
    check(mentions(data.title, phrase), 'A frase-chave aparece no título SEO.', 'Inclua a frase-chave no título SEO.')
    check(Boolean(description) && mentions(description, phrase), 'A frase-chave aparece na descrição SEO.', 'Inclua a frase-chave na descrição SEO.')
    if (data.post) {
      check(mentions(data.headings.join(' '), phrase), 'A frase-chave aparece no título do post.', 'O título do post não cita a frase-chave.', 'ok')
      check(mentions(data.opening.join(' '), phrase), 'A frase-chave aparece no primeiro parágrafo.', 'O primeiro parágrafo do post não cita a frase-chave.', 'ok')
    } else {
      check(mentions(data.headings.join(' '), phrase), 'A frase-chave aparece no título principal da página.', 'O título principal da página (aba Conteúdo) não cita a frase-chave.', 'ok')
      check(mentions(data.opening.join(' '), phrase), 'A frase-chave aparece logo na primeira seção da página.', 'A primeira seção da página não cita a frase-chave.', 'ok')
    }
    const count = data.texts.filter((text) => mentions(text, phrase)).length
    const where = data.post ? 'parágrafos do post' : 'textos da página'
    checks.push(count >= 2
      ? { status: 'good', text: `A frase-chave aparece em ${count} ${where}.` }
      : count === 1
        ? { status: 'ok', text: `A frase-chave aparece em só 1 dos ${where}. Use-a mais vezes, de forma natural.` }
        : { status: 'bad', text: `A frase-chave não aparece nos ${where}.` })
    if (data.alts.length) check(data.alts.some((alt) => mentions(alt, phrase)), 'Uma imagem cita a frase-chave na descrição.', 'Nenhuma imagem cita a frase-chave na descrição da imagem.', 'ok')
    check(!usedIn.length, `A frase-chave não é usada em outro${data.post ? ' post' : 'a página'}.`, `A mesma frase-chave já é usada em: ${usedIn.join(', ')}. Os dois vão disputar a mesma busca.`, 'ok')
  }

  const length = fullTitle.length
  checks.push(length < 30
    ? { status: 'ok', text: `O título tem ${length} caracteres. Aproveite até 60 para descrever melhor a página.` }
    : length <= 60
      ? { status: 'good', text: `O título tem ${length} caracteres, dentro do ideal (até 60).` }
      : { status: 'ok', text: `O título tem ${length} caracteres e pode ser cortado no Google (ideal: até 60).` })
  checks.push(!description
    ? { status: 'bad', text: data.post ? 'Escreva um resumo ou uma descrição SEO: sem eles, o Google escolhe um trecho qualquer do post.' : 'Escreva uma descrição SEO: sem ela, o Google escolhe um trecho qualquer da página.' }
    : description.length < 120
      ? { status: 'ok', text: `A descrição tem ${description.length} caracteres. O ideal é entre 120 e 156.` }
      : description.length <= 156
        ? { status: 'good', text: `A descrição tem ${description.length} caracteres, dentro do ideal.` }
        : { status: 'ok', text: `A descrição tem ${description.length} caracteres e será cortada no Google (ideal: até 156).` })
  checks.push(data.featured
    ? { status: 'good', text: `${data.post ? 'O post' : 'A página'} tem imagem de destaque para compartilhamento.` }
    : hasDefaultImage
      ? { status: 'ok', text: 'Sem imagem de destaque: ao compartilhar, aparece a imagem padrão do site.' }
      : { status: 'bad', text: 'Sem imagem de destaque: o link compartilhado aparece sem imagem.' })

  // Problemas primeiro, depois o que pode melhorar, por fim o que já está bom.
  const order: Record<Status, number> = { bad: 0, ok: 1, good: 2 }
  return checks.sort((a, b) => order[a.status] - order[b.status])
}
