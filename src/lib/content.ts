import 'server-only'
import { cache } from 'react'
import { getPayload, type TypedUser } from 'payload'
import config from '@payload-config'
import prototype from '../generated/prototype.json'
import type { Content, PageTemplate, TemplateNode } from './types'
import type { Category, Post } from '../payload-types'
import { relativeURL } from './url'

export const getCMS = cache(() => getPayload({ config }))
export const templates = prototype.pages as unknown as PageTemplate[]
/** Cabeçalho e rodapé do site, vindos da página inicial do protótipo. */
export const chrome = prototype.site as unknown as { header: TemplateNode[]; footer: TemplateNode[]; content: Content }

export const getPageContent = cache(async (slug: string) => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: false })
  return result.docs[0] as unknown as (Content & { title: string; description?: string; featuredImage?: Upload }) | undefined
})
export const getSiteContent = cache(async () => {
  const payload = await getCMS()
  return await payload.findGlobal({ slug: 'site', depth: 1, overrideAccess: false }) as unknown as Content
})
export type Upload = number | { url?: string | null; alt?: string | null } | null | undefined
export type Settings = { siteName?: string; logo?: Upload; favicon?: Upload; defaultDescription?: string | null; shareImage?: Upload }
export const uploadURL = (upload: Upload) => relativeURL(typeof upload === 'object' ? upload?.url : undefined)
export const getSettings = cache(async () => {
  const payload = await getCMS()
  return await payload.findGlobal({ slug: 'settings', depth: 1, overrideAccess: false }) as unknown as Settings
})
/** Posts publicados, do mais recente para o mais antigo. */
export const getPosts = cache(async () => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'posts', depth: 1, limit: 200, sort: '-publishedAt', overrideAccess: false, pagination: false })
  return result.docs as Post[]
})
/** Um post pelo endereço. Com `user` (prévia do painel), traz também o rascunho. */
export const getPost = cache(async (slug: string, user?: TypedUser | null) => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, depth: 1, limit: 1, overrideAccess: false, draft: Boolean(user), user: user || undefined })
  return result.docs[0] as Post | undefined
})
export const getCategories = cache(async () => {
  const payload = await getCMS()
  const result = await payload.find({ collection: 'categories', depth: 0, limit: 100, sort: 'name', overrideAccess: false, pagination: false })
  return result.docs as Category[]
})
