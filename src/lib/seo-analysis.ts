import type { Entry } from '@/components/admin/content-map'
import { plainText } from './blog'

/**
 * Regras da "Análise de SEO" do painel, em funções puras: o painel (SeoAnalysis.tsx) e o relatório de terminal
 * (scripts/seo-report.ts) usam exatamente as mesmas, então o que o relatório aprova o painel mostra como "Bom".
 */
export type Status = 'good' | 'ok' | 'bad'
export type Check = { status: Status; text: string }
export type Snapshot = {
  post: boolean; keyphrase: string; title: string; description: string; slug: string; featured: boolean
  headings: string[]; opening: string[]; texts: string[]; alts: string[]
}

const STOPWORDS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'um', 'uma', 'ao', 'que'])
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const words = (value: string) => normalize(value).split(' ').filter(Boolean)
/** Mesma palavra ou variação curta de singular/plural ("site" e "sites"). */
const sameWord = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 2)

/** A frase aparece inteira ou com todas as palavras importantes, em qualquer ordem. */
export function mentions(text: string, phrase: string) {
  const key = words(phrase).filter((word) => !STOPWORDS.has(word))
  if (!key.length) return false
  if (normalize(text).includes(normalize(phrase))) return true
  const found = words(text)
  return key.every((word) => found.some((candidate) => sameWord(candidate, word)))
}


/** Retrato de um post: título e resumo valem quando os campos de SEO estão vazios; o texto vem dos blocos do editor. */
export function postSnapshot(v: { slug: string; keyphrase: string; seoTitle?: string; title: string; seoDescription?: string; excerpt?: string; featured: boolean; content: unknown }): Snapshot {
  const blocks = ((v.content as { root?: { children?: unknown[] } } | undefined)?.root?.children || []).map(plainText).filter((text) => text.trim())
  return {
    post: true, keyphrase: v.keyphrase.trim(), title: v.seoTitle || v.title, description: v.seoDescription || v.excerpt || '', slug: v.slug,
    featured: v.featured, headings: [v.title], opening: blocks.slice(0, 1), texts: blocks, alts: [],
  }
}

/** Retrato de uma página: títulos, primeira seção e textos vêm do mapa do layout (`scope`). */
export function pageSnapshot(v: { slug: string; keyphrase: string; title: string; description: string; featured: boolean; copy: { key: string; value: string }[]; alts: string[]; scope: Record<string, Entry> }): Snapshot {
  const firstSection = v.copy.length ? v.scope[v.copy[0].key]?.secao : undefined
  return {
    post: false, keyphrase: v.keyphrase.trim(), title: v.title, description: v.description, slug: v.slug, featured: v.featured,
    headings: v.copy.filter((item) => v.scope[item.key]?.papel === 'Título principal').map((item) => item.value),
    opening: v.copy.filter((item) => v.scope[item.key]?.secao === firstSection).map((item) => item.value),
    texts: v.copy.map((item) => item.value), alts: v.alts,
  }
}

export function analyse(data: Snapshot, fullTitle: string, description: string, hasDefaultImage: boolean, usedIn: string[]): Check[] {
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
