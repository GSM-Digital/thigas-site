'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { pageTitle } from '@/lib/site-title'
import { analyse, pageSnapshot, postSnapshot, type Snapshot, type Status } from '@/lib/seo-analysis'
import { scopeFor } from './content-map'
import './seo-analysis.css'

type SiteSettings = { siteName?: string; defaultDescription?: string | null; shareImage?: unknown }

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
      return JSON.stringify(postSnapshot({
        slug, keyphrase: value('focusKeyphrase'), seoTitle: value('seoTitle'), title: value('title'), seoDescription: value('seoDescription'),
        excerpt: value('excerpt'), featured: Boolean(fields.featuredImage?.value), content: fields.content?.value,
      }))
    }
    const copy: { key: string; value: string }[] = []
    for (let i = 0; fields[`copy.${i}.key`]; i += 1) copy.push({ key: value(`copy.${i}.key`), value: value(`copy.${i}.value`) })
    const alts: string[] = []
    for (let i = 0; fields[`images.${i}.key`]; i += 1) alts.push(value(`images.${i}.alt`))
    // Texto único: a análise só recalcula quando algo que ela usa muda.
    return JSON.stringify(pageSnapshot({
      slug, keyphrase: value('focusKeyphrase'), title: value('title'), description: value('description'),
      featured: Boolean(fields.featuredImage?.value), copy, alts, scope: scopeFor(slug),
    }))
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

