import readline from 'node:readline'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Cria o primeiro administrador de um banco novo (ou troca a senha de um e-mail já cadastrado).
 * As credenciais chegam por stdin e nunca são gravadas em arquivo nem no log:
 *   echo '{"email":"...","password":"...","name":"..."}' | npm run create-admin
 */
const input = readline.createInterface({ input: process.stdin, terminal: false })
const line = await new Promise<string>((resolve) => input.once('line', resolve))
input.close()
const { email, password, name = 'Administrador' } = JSON.parse(line) as { email: string; password: string; name?: string }
if (!email || !password || password.length < 8) throw new Error('Informe e-mail e senha de pelo menos 8 caracteres.')
const payload = await getPayload({ config })
const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, overrideAccess: true, limit: 1 })
if (found.docs[0]) {
  await payload.update({ collection: 'users', id: found.docs[0].id, data: { password }, overrideAccess: true })
  console.log('Senha atualizada.')
} else {
  const total = await payload.count({ collection: 'users', overrideAccess: true })
  if (total.totalDocs > 0) throw new Error('Já existem usuários. Crie novos acessos pelo painel, com um administrador.')
  await payload.create({ collection: 'users', data: { name, email, password, role: 'admin' }, overrideAccess: true })
  console.log('Administrador criado.')
}
await payload.destroy()
process.exit(0)
