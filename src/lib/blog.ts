import type { Category, Media, Post } from '@/payload-types'
import { relativeURL } from './url'

/** Só o que os cards precisam: vai para o navegador na listagem com filtro. */
export type PostCard = { id: number; slug: string; title: string; excerpt: string; date: string; image?: string; imageAlt: string; category: string; categorySlug: string }

const media = (value: Post['featuredImage']) => typeof value === 'object' && value ? value as Media : undefined
const category = (value: Post['category']) => typeof value === 'object' && value ? value as Category : undefined

export const categoryName = (post: Post) => category(post.category)?.name || 'Artigo'
export const coverURL = (post: Post) => relativeURL(media(post.featuredImage)?.url)
export const coverAlt = (post: Post) => media(post.featuredImage)?.alt || post.title

/** Texto corrido do conteúdo, para o resumo, o tempo de leitura e a análise de SEO. */
export function plainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const node = content as { text?: string; root?: unknown; children?: unknown[] }
  if (typeof node.text === 'string') return node.text
  if (node.root) return plainText(node.root)
  return (node.children || []).map(plainText).join(' ')
}

export const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(value))
  : ''

export const toCard = (post: Post): PostCard => ({
  id: post.id, slug: post.slug, title: post.title, image: coverURL(post), imageAlt: coverAlt(post),
  excerpt: post.excerpt || plainText(post.content).replace(/\s+/g, ' ').trim().slice(0, 160),
  date: formatDate(post.publishedAt),
  category: categoryName(post), categorySlug: category(post.category)?.slug || '',
})
