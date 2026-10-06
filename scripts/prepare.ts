import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Passo do build na Vercel: abrir o Payload em produção aplica as migrações pendentes e roda o seed da
 * primeira vez (conteúdo do protótipo, seis artigos e capas). As capas só podem ser lidas aqui, no build,
 * porque no servidor da Vercel a pasta public/ não está junto da função. Rodar de novo não muda nada:
 * migrações já aplicadas e o seed (que tem marca no banco) são ignorados.
 */
const payload = await getPayload({ config })
console.log('Banco pronto: migrações aplicadas e conteúdo inicial conferido.')
await payload.destroy()
process.exit(0)
