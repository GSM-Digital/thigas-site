import { buildLlms, llmsResponse } from '@/lib/llms'
export const dynamic = 'force-dynamic'
/** /llms.txt (e /llm.txt, por redirecionamento interno): resumo do site para assistentes de IA. */
export async function GET() { return llmsResponse(await buildLlms()) }
