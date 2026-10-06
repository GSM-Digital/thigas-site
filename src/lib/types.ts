export type TextEntry = { key: string; label: string; value: string }
export type ImageEntry = { key: string; label: string; src: string; alt: string; media?: number | { url?: string | null } | null }
export type LinkEntry = { key: string; label: string; href: string }
export type Content = { copy?: TextEntry[]; images?: ImageEntry[]; links?: LinkEntry[] }
/**
 * `slot`: o elemento fica, mas os filhos vêm dos posts (carrossel de cards da home).
 * `managed`: espaço reservado para um bloco montado a partir dos posts (lista do blog, artigo).
 */
export type TemplateNode = { tag?: string; attrs?: Record<string, string>; children?: TemplateNode[]; text?: string; textKey?: string; imageKey?: string; linkKey?: string; slot?: string; managed?: string }
export type Article = { slug: string; title: string; excerpt: string; author: string; publishedAt: string; category: string; content: unknown }
export type PageTemplate = { slug: string; title: string; description: string; bodyClass: string; chrome: 'site' | 'own'; body: TemplateNode[]; content: Content }
