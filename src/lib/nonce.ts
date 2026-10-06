import 'server-only'
import { headers } from 'next/headers'

/** Nonce da requisição (criado em src/proxy.ts); scripts em linha precisam dele para a CSP deixar rodar. */
export async function getNonce() {
  return (await headers()).get('x-nonce') || undefined
}
