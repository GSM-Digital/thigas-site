import type { Payload } from 'payload'
import data from '../generated/prototype.json'
import { stripSiteName } from '../lib/site-title'

type Entries = { key: string }[]
type Content = { copy?: Entries; images?: Entries; links?: Entries }

/** As entradas do layout que o banco ainda não tem; as que já existem (e foram editadas) ficam como estão. */
function missing(saved: Content, layout: Content) {
  const result: Record<string, unknown[]> = {}
  for (const list of ['copy', 'images', 'links'] as const) {
    const have = new Set((saved[list] || []).map((entry) => entry.key))
    const extra = (layout[list] || []).filter((entry) => !have.has(entry.key))
    if (extra.length) result[list] = [...(saved[list] || []), ...extra]
  }
  return result
}

/**
 * Para usar dentro de uma migração depois de `npm run import:prototype`: cria as páginas do layout que ainda não
 * existem no banco e acrescenta às existentes os textos, imagens e links novos. Nunca sobrescreve conteúdo editado.
 * Sem `slugs`, olha todas as páginas e o cabeçalho e rodapé.
 */
export async function addMissingContent(payload: Payload, slugs?: string[]) {
  for (const page of data.pages) {
    if (slugs && !slugs.includes(page.slug)) continue
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1, depth: 0, overrideAccess: true })
    const saved = found.docs[0]
    if (!saved) {
      await payload.create({ collection: 'pages', overrideAccess: true, data: {
        slug: page.slug, title: stripSiteName(page.title, page.slug), description: page.description, status: 'published', ...page.content,
      } })
      payload.logger.info(`Página criada: ${page.slug}`)
      continue
    }
    const extra = missing(saved as unknown as Content, page.content)
    if (Object.keys(extra).length) {
      await payload.update({ collection: 'pages', id: saved.id, overrideAccess: true, data: extra })
      payload.logger.info(`Página ${page.slug}: conteúdo novo acrescentado (${Object.keys(extra).join(', ')})`)
    }
  }
  if (!slugs) {
    const site = await payload.findGlobal({ slug: 'site', depth: 0, overrideAccess: true })
    const extra = missing(site as unknown as Content, data.site.content)
    if (Object.keys(extra).length) await payload.updateGlobal({ slug: 'site', overrideAccess: true, data: extra })
  }
}
