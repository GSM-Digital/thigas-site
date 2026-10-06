/**
 * O nome do site vem de "Configurações do site" e entra no título de todas as
 * páginas, como no WordPress. Na página inicial ele vem primeiro.
 */
export const DEFAULT_SITE_NAME = 'Thiago Barreto'

export function pageTitle(title: string | undefined, siteName: string, slug: string) {
  const name = siteName.trim() || DEFAULT_SITE_NAME
  const own = (title || '').trim()
  if (!own) return name
  return slug === 'index' ? `${name} | ${own}` : `${own} | ${name}`
}

/**
 * Os títulos importados do protótipo já traziam o nome escrito à mão
 * ("Blog — Thiago Barreto"). Remove essa parte para o nome não sair duplicado.
 */
export function stripSiteName(title: string, slug: string, siteName = DEFAULT_SITE_NAME) {
  const separators = [' — ', ' – ', ' | ', ' - ']
  for (const separator of separators) {
    if (slug === 'index' && title.startsWith(`${siteName}${separator}`)) return title.slice(siteName.length + separator.length).trim()
    if (title.endsWith(`${separator}${siteName}`)) return title.slice(0, -(siteName.length + separator.length)).trim()
  }
  return title
}
