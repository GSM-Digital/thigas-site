/**
 * Endereço de um arquivo de public/ com a versão do build: o navegador guarda CSS e JS por um ano (next.config.mjs) e,
 * a cada novo deploy, o `?v=` muda e ele baixa de novo. A versão é definida em next.config.mjs.
 */
export const asset = (path: string) => `${path}?v=${process.env.NEXT_PUBLIC_ASSET_VERSION || 'dev'}`
