import { buildLlms, llmsResponse } from '@/lib/llms'
/** Gerado no build e renovado de hora em hora: responde direto do cache, sem acordar o banco (um timeout aqui reprovava o llms.txt no PageSpeed). */
export const revalidate = 3600
/** /llms-full.txt: o mesmo resumo com o texto completo dos artigos. */
export async function GET() { return llmsResponse(await buildLlms({ full: true })) }
