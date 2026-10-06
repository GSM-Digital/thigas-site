import { getPayload } from 'payload'
import config from '@payload-config'
import { ADMIN_ROUTE } from '@/lib/routes'
import './pages-nav.css'

/**
 * "Páginas do site" lista 26 documentos em ordem alfabética, o que obriga a
 * procurar pelo título para achar uma página. Aqui elas aparecem agrupadas na
 * mesma ordem do menu do site, que é o mapa que a equipe já tem na cabeça.
 */
const GROUPS: { titulo: string; slugs: string[] }[] = [
  { titulo: 'Início', slugs: ['index'] },
  { titulo: 'Blog', slugs: ['blog', 'post'] },
  { titulo: 'Institucional', slugs: ['privacidade', 'termos', 'cookies'] },
]

/** Nomes curtos: o título do documento é o título de SEO, longo demais para o menu. */
const NAMES: Record<string, string> = {
  index: 'Home', blog: 'Blog (página)', post: 'Modelo do post',
  privacidade: 'Política de Privacidade', termos: 'Termos de Uso', cookies: 'Cookies e armazenamento',
}

export default async function PagesNav() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'pages', limit: 100, depth: 0, overrideAccess: true, pagination: false })
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))
  const grouped = new Set(GROUPS.flatMap((group) => group.slugs))
  const leftovers = docs.filter((doc) => !grouped.has(doc.slug)).map((doc) => doc.slug)
  const groups = leftovers.length ? [...GROUPS, { titulo: 'Outras', slugs: leftovers }] : GROUPS

  return (
    <div className="tb-nav">
      <div className="tb-nav__title">Páginas por seção do site</div>
      {groups.map((group) => {
        const items = group.slugs.map((slug) => bySlug.get(slug)).filter(Boolean)
        if (!items.length) return null
        return (
          <div className="tb-nav__group" key={group.titulo}>
            <div className="tb-nav__group-title">{group.titulo}</div>
            <ul className="tb-nav__list">
              {items.map((doc) => (
                <li key={doc!.id}>
                  <a className="tb-nav__link" href={`${ADMIN_ROUTE}/collections/pages/${doc!.id}`}>
                    <span>{NAMES[doc!.slug] || doc!.slug}</span>
                    {doc!.status === 'draft' && <span className="tb-nav__badge">rascunho</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
