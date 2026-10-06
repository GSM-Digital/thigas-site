import sections from '@/generated/sections.json'

/**
 * O que o layout diz sobre cada chave: seção, papel no layout ("Título",
 * "Botão"…), grupo repetido (card, etapa) e o link que envolve o texto.
 */
export type Entry = {
  secao: string; inicio: boolean; papel?: string; parte?: number; partes?: number
  grupo?: { id: string; tipo: string }; link?: string; textos?: string[]; imagem?: string
  /** Por que um elemento não tem campo de link (aba, botão que abre uma janela…). */
  nota?: string
}
export type Scope = Record<string, Entry>
/** Blocos montados a partir dos posts: o painel só avisa onde editá-los. */
export type Managed = { secao: string; tipo: 'cards' | 'blog-feature' | 'blog-listing' | 'article' | 'related' }

const pages = sections.pages as Record<string, Scope>
const managed = sections.managed as Record<string, Managed[]>
const site = sections.site as Scope

/** O documento diz de que página é; o global de cabeçalho/rodapé não tem slug e usa o mapa próprio. */
export const scopeFor = (slug?: string): Scope => (slug ? pages[slug] : site) || {}
export const managedFor = (slug?: string): Managed[] => (slug ? managed[slug] : undefined) || []

export type List = 'copy' | 'images' | 'links'
/** `page-t12` é texto, `page-i3` imagem e `header-l2` link. */
export const listOf = (key: string): List | undefined =>
  ({ t: 'copy', i: 'images', l: 'links' } as const)[/-([til])\d+$/.exec(key)?.[1] as 't' | 'i' | 'l']
