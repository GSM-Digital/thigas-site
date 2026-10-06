import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { buildConfig } from 'payload'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { pt } from '@payloadcms/translations/languages/pt'
import sharp from 'sharp'
import { Users, Media, Pages, Site, Settings } from './cms/collections'
import { Categories, Posts } from './cms/blog'
import { seedPrototype } from './cms/seed'
import { seedBlog } from './cms/seed-blog'
import { applySeoDefaults } from './cms/seo-defaults'
import { applyArticleCovers } from './cms/covers'
import { ADMIN_ROUTE } from './lib/routes'
import { db, usingPostgres } from './db'

// Só o SQLite grava em disco (a Vercel não deixa); com Postgres não há pasta de dados.
if (!usingPostgres) mkdirSync(path.resolve('.data'), { recursive: true })
if (!process.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET.startsWith('SUBSTITUA')) {
  throw new Error('Defina PAYLOAD_SECRET privado no arquivo .env antes de iniciar.')
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET,
  serverURL: process.env.SERVER_URL || 'http://localhost:3000',
  // O painel fica em /gestao (a pasta src/app/(payload)/gestao precisa ter o mesmo nome).
  routes: { admin: ADMIN_ROUTE },
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve('src') },
    components: {
      beforeLogin: ['/components/admin/PasswordVisibility'],
      beforeNavLinks: ['/components/admin/PagesNav'],
      graphics: { Logo: '/components/admin/Logo', Icon: '/components/admin/Icon' },
    },
    meta: { titleSuffix: ' | Thiago Barreto' },
  },
  collections: [Pages, Posts, Categories, Media, Users], globals: [Settings, Site],
  editor: lexicalEditor(), sharp,
  db,
  // Na Vercel o disco não é permanente: com BLOB_READ_WRITE_TOKEN, os uploads vão para o Vercel Blob (endereço público direto, envio
  // do navegador para o Blob, sem o limite de 4,5 MB da função). Sem o token, ficam em ./media, como sempre.
  plugins: [vercelBlobStorage({ enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN), collections: { media: { disablePayloadAccessControl: true } }, token: process.env.BLOB_READ_WRITE_TOKEN || '', clientUploads: true })],
  i18n: { supportedLanguages: { pt }, fallbackLanguage: 'pt' },
  typescript: { outputFile: path.resolve('src/payload-types.ts') },
  onInit: async (payload) => {
    // Os scripts de importação e de geração de artigos abrem o Payload só para ler a configuração.
    if (process.env.PAYLOAD_SKIP_SEED === '1') return
    await seedPrototype(payload)
    await seedBlog(payload)
    await applySeoDefaults(payload)
    await applyArticleCovers(payload)
  },
})
