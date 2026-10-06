import { buildLlms, llmsResponse } from '@/lib/llms'
export const dynamic = 'force-dynamic'
/** /llms-full.txt: o mesmo resumo com o texto completo dos artigos. */
export async function GET() { return llmsResponse(await buildLlms({ full: true })) }
