const origin = (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

/**
 * O Payload devolve o endereço dos uploads com o domínio de `SERVER_URL`. Dentro do site, o caminho
 * sozinho basta (e funciona em qualquer domínio, inclusive o da prévia).
 */
export const relativeURL = (url?: string | null) => (url && url.startsWith(`${origin}/`) ? url.slice(origin.length) : url) || undefined
