import path from 'node:path'
import { existsSync } from 'node:fs'
import type { Payload } from 'payload'
import data from '../generated/prototype.json'
import { mentions } from '../lib/seo-analysis'
import { plainText } from '../lib/blog'
import { stripSiteName } from '../lib/site-title'

/**
 * SEO de todas as páginas e artigos: frase-chave foco, título e descrição pensados para busca (Google), respostas de IA
 * (AEO/GEO) e compartilhamento. O nome do site entra sozinho no título (src/lib/site-title.ts), então o título aqui é só a
 * parte própria da página. Limites conferidos por `npm run seo:report` e tests/web.test.mjs: título até 60 caracteres com o
 * nome do site, descrição de 120 a 156, frase-chave de até 4 palavras importantes.
 */
type Seo = { keyphrase: string; title: string; description: string }

export const PAGE_SEO: Record<string, Seo> = {
  index: {
    keyphrase: 'criação de sites',
    title: 'Criação de sites e landing pages B2B',
    description: 'Criação de sites institucionais, e-commerce e landing pages para empresas B2B, com SEO, AEO e GEO e preparados para tráfego pago.',
  },
  blog: {
    keyphrase: 'ideias para sites',
    title: 'Ideias para sites e estratégia digital',
    description: 'Ideias para sites que vendem: artigos sobre SEO, AEO, GEO, criação de sites, landing pages e tráfego pago para empresas crescerem na internet.',
  },
  privacidade: {
    keyphrase: 'política de privacidade',
    title: 'Política de Privacidade e proteção de dados',
    description: 'Política de Privacidade do site de Thiago Barreto: quais dados são tratados ao navegar e ao falar pelo WhatsApp, por quê e como proteger sua privacidade.',
  },
  termos: {
    keyphrase: 'termos de uso',
    title: 'Termos de Uso do site e das demonstrações',
    description: 'Termos de uso do site de Thiago Barreto: regras para navegar, usar as demonstrações de projetos e entrar em contato, de forma clara e transparente.',
  },
  cookies: {
    keyphrase: 'cookies e armazenamento',
    title: 'Cookies e armazenamento local no site',
    description: 'Cookies e armazenamento no site de Thiago Barreto: o que fica guardado no seu navegador, para que serve e como limpar ou bloquear quando quiser.',
  },
}

/** Artigos: título SEO (só quando o título do post é longo demais para o Google) e descrição própria. */
export const POST_SEO: Record<string, Seo> = {
  'por-que-ter-um-site-profissional': {
    keyphrase: 'site profissional', title: 'Por que ter um site profissional?',
    description: 'Por que ter um site profissional? Entenda quando ele faz sentido, o que pode fazer pelo seu negócio e como começar sem escolher a tecnologia sozinho.',
  },
  'como-escolher-web-designer': {
    keyphrase: 'web designer', title: 'Como escolher um web designer para seu site',
    description: 'Como escolher um web designer? Saiba avaliar portfólio, proposta, processo, suporte e domínio antes de contratar quem vai criar o seu site.',
  },
  'quanto-custa-criar-um-site-profissional': {
    keyphrase: 'quanto custa um site', title: 'Quanto custa criar um site profissional?',
    description: 'Quanto custa criar um site? Veja o que influencia o preço de uma landing page ou site institucional e como comparar propostas com segurança.',
  },
  'como-funciona-criacao-de-um-site': {
    keyphrase: 'criação de um site', title: 'Como funciona a criação de um site',
    description: 'Entenda como funciona a criação de um site, do briefing à publicação: etapas, o que o cliente fornece, revisões e o que acontece no lançamento.',
  },
  'erros-ao-contratar-criacao-de-site': {
    keyphrase: 'erros ao contratar criação de site', title: '7 erros ao contratar a criação de um site',
    description: '7 erros ao contratar a criação de um site: escopo confuso, perda do domínio, custos ocultos e promessas irreais. Saiba como evitá-los antes de fechar.',
  },
  'o-que-fazer-depois-de-publicar-site': {
    keyphrase: 'site no ar', title: 'Meu site está no ar: o que fazer agora?',
    description: 'Seu site está no ar? Veja o que fazer agora: conferir a publicação, divulgar as páginas, acompanhar os resultados e manter tudo funcionando.',
  },
}

/**
 * Uma frase de abertura e uma de fechamento acrescentadas aos artigos, citando a frase-chave de forma natural: o texto foi
 * escrito com palavras variadas, e o Google (e as IAs) pesam o tema pelo que aparece no início e no fim. A abertura só entra se
 * o primeiro parágrafo não citar a expressão; o fechamento, só se menos de dois parágrafos a citarem. Depois de aplicadas, a
 * expressão já está no texto e o artigo não é mais tocado (nem se a equipe editar e tirar: a decisão passa a ser dela).
 */
export const POST_TEXT: Record<string, { intro: string; outro: string }> = {
  'por-que-ter-um-site-profissional': {
    intro: 'Neste guia, você entende por que ter um site profissional faz diferença para o seu negócio.',
    outro: 'Em resumo, um site profissional é o ponto de partida para a sua empresa ser encontrada e escolhida.',
  },
  'como-escolher-web-designer': {
    intro: 'Veja neste guia como escolher um web designer para criar o seu site com segurança.',
    outro: 'Com esses critérios, escolher um web designer fica muito mais simples e seguro.',
  },
  'quanto-custa-criar-um-site-profissional': {
    intro: 'Neste guia, você descobre quanto custa um site profissional e o que pesa no valor final.',
    outro: 'Agora que você sabe quanto custa um site, compare as propostas com critério.',
  },
  'como-funciona-criacao-de-um-site': {
    intro: 'Veja, passo a passo, como funciona a criação de um site.',
    outro: 'Assim, a criação de um site deixa de ser um mistério e vira um processo claro.',
  },
  'erros-ao-contratar-criacao-de-site': {
    intro: 'Conheça os 7 erros ao contratar a criação de um site e saiba como evitá-los.',
    outro: 'Evite esses erros ao contratar a criação de um site e o seu projeto começa muito mais seguro.',
  },
  'o-que-fazer-depois-de-publicar-site': {
    intro: 'Veja o que fazer com o seu site no ar para ele continuar trazendo resultado.',
    outro: 'Com esses cuidados, o seu site no ar continua evoluindo e gerando resultado.',
  },
}

/** Imagens de compartilhamento 1200×630 de cada página (public/img/compartilhar, geradas por scripts/build-covers.mjs). */
export const SHARE_ALT: Record<string, string> = {
  index: 'Janela de navegador de vidro azul flutuando sobre uma grade futurista, com órbitas de luz ao redor',
  blog: 'Documentos de vidro empilhados sobre uma grade futurista azul, representando os artigos do blog',
  privacidade: 'Escudo de vidro azul com uma verificação, cercado por pontos de proteção, representando a privacidade',
  termos: 'Documentos de vidro empilhados com um selo de verificação, representando os termos de uso',
  cookies: 'Biscoito de vidro azul com gotas escuras e uma mordida, representando os cookies',
}
export const shareFile = (slug: string) => path.resolve('public/img/compartilhar', `${slug}.webp`)

/** Títulos e descrições de versões anteriores deste arquivo: ainda podem ser trocados pelos novos. */
const PREVIOUS: Record<string, { title: string[]; description: string[] }> = {
  index: {
    title: ['Criação de sites e landing pages para empresas'],
    description: ['Criação de sites institucionais, e-commerce e landing pages para empresas B2B, com SEO, AEO e GEO, preparados para tráfego pago. Rápidos e sob medida com IA.'],
  },
  blog: { title: ['Blog de SEO, sites e estratégia digital'], description: ['Artigos sobre SEO, AEO, GEO, criação de sites, landing pages e tráfego pago para empresas que querem vender mais na internet.'] },
}

type Doc = { id: number | string; [key: string]: unknown }
const empty = (value: unknown) => !String(value ?? '').trim()

/**
 * Preenche o SEO de todas as páginas e artigos. Um campo só é trocado quando está vazio ou ainda com o texto original do
 * protótipo / de uma versão anterior daqui: o que foi escrito no painel nunca é sobrescrito. Pode rodar quantas vezes for.
 */
export async function applySeoDefaults(payload: Payload) {
  for (const [slug, next] of Object.entries(PAGE_SEO)) {
    const original = data.pages.find((page) => page.slug === slug)
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
    const saved = found.docs[0] as unknown as Doc | undefined
    if (!saved || !original) continue
    const old = PREVIOUS[slug]
    const change: Record<string, unknown> = {}
    if (empty(saved.focusKeyphrase)) change.focusKeyphrase = next.keyphrase
    if (saved.title === stripSiteName(original.title, slug) || old?.title.includes(String(saved.title))) change.title = next.title
    if (empty(saved.description) || saved.description === original.description || old?.description.includes(String(saved.description))) change.description = next.description
    if (empty(saved.featuredImage)) {
      const filePath = shareFile(slug)
      if (existsSync(filePath)) change.featuredImage = (await payload.create({ collection: 'media', data: { alt: SHARE_ALT[slug] }, filePath, overrideAccess: true })).id
    }
    if (Object.keys(change).length) {
      await payload.update({ collection: 'pages', id: saved.id, overrideAccess: true, data: change })
      payload.logger.info(`SEO da página ${slug}: ${Object.keys(change).join(', ')}.`)
    }
  }

  for (const [slug, next] of Object.entries(POST_SEO)) {
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
    const saved = found.docs[0] as unknown as Doc | undefined
    if (!saved) continue
    const change: Record<string, unknown> = {}
    if (empty(saved.focusKeyphrase)) change.focusKeyphrase = next.keyphrase
    if (empty(saved.seoTitle)) change.seoTitle = next.title
    if (empty(saved.seoDescription)) change.seoDescription = next.description
    const text = POST_TEXT[slug]
    type Block = { type?: string; children?: unknown[] }
    const root = (saved.content as { root?: { children?: Block[] } } | undefined)?.root
    const blocks = root?.children || []
    if (text && blocks.length) {
      const add = (block: Block, sentence: string) => (block.children as unknown[]).push({ type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: ` ${sentence}` })
      const paragraph = (block?: Block): block is Block => block?.type === 'paragraph' && Array.isArray(block.children) && plainText(block).trim().length > 40
      let edited = false
      if (paragraph(blocks[0]) && !mentions(plainText(blocks[0]), next.keyphrase)) { add(blocks[0], text.intro); edited = true }
      const last = [...blocks].reverse().find((block) => paragraph(block))
      if (last && blocks.filter((block) => mentions(plainText(block), next.keyphrase)).length < 2) { add(last, text.outro); edited = true }
      if (edited) change.content = saved.content
    }
    if (Object.keys(change).length) {
      await payload.update({ collection: 'posts', id: saved.id, overrideAccess: true, data: change })
      payload.logger.info(`SEO do artigo ${slug}: ${Object.keys(change).join(', ')}.`)
    }
  }

  // Configurações do site: descrição padrão acompanha a da inicial e a imagem de compartilhamento padrão é a da inicial.
  const home = data.pages.find((page) => page.slug === 'index')
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0, overrideAccess: true }) as unknown as Doc
  const change: Record<string, unknown> = {}
  if (home && (settings.defaultDescription === home.description || PREVIOUS.index.description.includes(String(settings.defaultDescription)))) change.defaultDescription = PAGE_SEO.index.description
  if (empty(settings.shareImage)) {
    const page = (await payload.find({ collection: 'pages', where: { slug: { equals: 'index' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as unknown as Doc | undefined
    if (page && !empty(page.featuredImage)) change.shareImage = page.featuredImage
  }
  if (Object.keys(change).length) await payload.updateGlobal({ slug: 'settings', overrideAccess: true, data: change })
}
