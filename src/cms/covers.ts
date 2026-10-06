import path from 'node:path'
import { existsSync } from 'node:fs'
import type { Payload } from 'payload'

/** Capas futuristas dos artigos (public/img/blog/capas, geradas por scripts/build-covers.mjs) e a descrição de cada uma. */
export const COVER_ALT: Record<string, string> = {
  'por-que-ter-um-site-profissional': 'Janela de navegador de vidro azul flutuando sobre uma grade futurista, com órbitas de luz ao redor',
  'como-escolher-web-designer': 'Curva de design com alças e nós de edição, amostras de cor e uma tela de vidro em um espaço azul e violeta',
  'quanto-custa-criar-um-site-profissional': 'Camadas de vidro empilhadas em níveis, com uma moeda luminosa no topo, representando o investimento em um site',
  'como-funciona-criacao-de-um-site': 'Caminho de luz com cinco etapas, do briefing à publicação, terminando em um globo luminoso',
  'erros-ao-contratar-criacao-de-site': 'Escudo de vidro com uma verificação, cercado por sete pontos de atenção, um deles em alerta',
  'o-que-fazer-depois-de-publicar-site': 'Painel de vidro com gráfico em alta e radar de visitas, representando o site no ar sendo acompanhado',
}

export const coverFile = (slug: string) => path.resolve('public/img/blog/capas', `${slug}.webp`)

/**
 * Define a capa futurista nos artigos que ainda estão com a ilustração original do protótipo (ou sem capa). Uma capa que a equipe
 * escolheu no painel, ou que já é a nova, não é tocada. Se a pasta public/ não estiver junto (servidor da Vercel), não faz nada: o
 * build roda isto no `vercel-build`, onde os arquivos existem. Pode rodar quantas vezes for.
 */
export async function applyArticleCovers(payload: Payload) {
  for (const [slug, alt] of Object.entries(COVER_ALT)) {
    const filePath = coverFile(slug)
    if (!existsSync(filePath)) continue
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: true })
    const post = found.docs[0]
    if (!post) continue
    const current = typeof post.featuredImage === 'object' ? post.featuredImage : undefined
    const original = !post.featuredImage || (current && /^Ilustração do artigo/.test(current.alt || ''))
    if (!original) continue
    const media = await payload.create({ collection: 'media', data: { alt }, filePath, overrideAccess: true })
    await payload.update({ collection: 'posts', id: post.id, data: { featuredImage: media.id }, overrideAccess: true })
    payload.logger.info(`Capa futurista definida no artigo ${slug}.`)
  }
}
