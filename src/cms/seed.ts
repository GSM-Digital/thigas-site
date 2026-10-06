import type { Payload } from 'payload'
import data from '../generated/prototype.json'
import { stripSiteName } from '../lib/site-title'

export async function seedPrototype(payload: Payload) {
  // One-time import of source content, never a reset of an existing client's data.
  const site = await payload.findGlobal({ slug: 'site', overrideAccess: true })
  if (site.bootstrapComplete) return
  for (const page of data.pages) {
    const found = await payload.count({ collection: 'pages', where: { slug: { equals: page.slug } }, overrideAccess: true })
    if (found.totalDocs) continue
    await payload.create({ collection: 'pages', overrideAccess: true, data: {
      slug: page.slug, title: stripSiteName(page.title, page.slug), description: page.description,
      status: 'published', ...page.content,
    } })
  }
  if (!site.copy?.length) {
    await payload.updateGlobal({ slug: 'site', overrideAccess: true, data: data.site.content })
  }
  const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: true })
  if (!settings.defaultDescription) {
    const home = data.pages.find((page) => page.slug === 'index')
    await payload.updateGlobal({ slug: 'settings', overrideAccess: true, data: { siteName: settings.siteName || 'Thiago Barreto', defaultDescription: home?.description } })
  }
  await payload.updateGlobal({ slug: 'site', overrideAccess: true, data: { bootstrapComplete: true } })
  payload.logger.info('Conteúdo original do site importado. Nenhum usuário ou senha padrão foi criado.')
}
