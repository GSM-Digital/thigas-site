import type { Payload } from 'payload'
import data from '../generated/prototype.json'
import { stripSiteName } from '../lib/site-title'

/**
 * Títulos e descrições pensados para busca (Google), respostas de IA (AEO/GEO) e compartilhamento: cada um traz a
 * necessidade da pessoa que busca (criar site, landing page, loja virtual, SEO, tráfego pago) e o que o site entrega.
 * O nome do site entra sozinho no título (veja src/lib/site-title.ts), então aqui só vai a parte própria da página.
 * Limites: título até ~60 caracteres com o nome; descrição até 160 (tests/seo.test.mjs confere).
 */
export const SEO_DEFAULTS: Record<string, { title: string; description: string }> = {
  index: {
    title: 'Criação de sites e landing pages para empresas',
    description: 'Criação de sites institucionais, e-commerce e landing pages para empresas B2B, com SEO, AEO e GEO, preparados para tráfego pago. Rápidos e sob medida com IA.',
  },
  blog: {
    title: 'Blog de SEO, sites e estratégia digital',
    description: 'Artigos sobre SEO, AEO, GEO, criação de sites, landing pages e tráfego pago para empresas que querem vender mais na internet.',
  },
}

/**
 * Troca o título e a descrição que vieram do protótipo pelos de SEO acima, e só eles: uma página que já foi editada
 * no painel (ou que já está com o texto novo) não é tocada. Pode rodar quantas vezes for.
 */
export async function applySeoDefaults(payload: Payload) {
  for (const [slug, next] of Object.entries(SEO_DEFAULTS)) {
    const original = data.pages.find((page) => page.slug === slug)
    if (!original) continue
    const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
    const saved = found.docs[0]
    if (!saved) continue
    const change: Record<string, string> = {}
    if (saved.title === stripSiteName(original.title, slug)) change.title = next.title
    if (saved.description === original.description) change.description = next.description
    if (Object.keys(change).length) {
      await payload.update({ collection: 'pages', id: saved.id, overrideAccess: true, data: change })
      payload.logger.info(`SEO da página ${slug}: ${Object.keys(change).join(' e ')} atualizado.`)
    }
  }
  // A descrição padrão do site (usada onde a página não tem a própria) acompanha a da página inicial.
  const home = data.pages.find((page) => page.slug === 'index')
  const settings = await payload.findGlobal({ slug: 'settings', overrideAccess: true })
  if (home && settings.defaultDescription === home.description) {
    await payload.updateGlobal({ slug: 'settings', overrideAccess: true, data: { defaultDescription: SEO_DEFAULTS.index.description } })
  }
}
