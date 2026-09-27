import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { EXPERIMENTAL_TableFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { pt } from '@payloadcms/translations/languages/pt'
import { buildConfig } from 'payload'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { SiteContent } from './globals/SiteContent'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const databaseURL = process.env.DATABASE_URL || 'file:./payload.sqlite'
const isPostgres = /^postgres(?:ql)?:\/\//.test(databaseURL)
if (process.env.VERCEL && (!isPostgres || !process.env.PAYLOAD_SECRET || !process.env.BLOB_READ_WRITE_TOKEN)) {
  throw new Error('Configure DATABASE_URL (Postgres), PAYLOAD_SECRET e BLOB_READ_WRITE_TOKEN na Vercel.')
}

export default buildConfig({
  admin: { user: 'users', importMap: { baseDir: dirname }, meta: { titleSuffix: ' | Thiago Barreto' } },
  i18n: { supportedLanguages: { pt }, fallbackLanguage: 'pt' },
  collections: [Users, Media, Posts],
  globals: [SiteContent],
  editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, EXPERIMENTAL_TableFeature()] }),
  secret: process.env.PAYLOAD_SECRET || 'development-only-change-this-secret',
  db: isPostgres ? postgresAdapter({ pool: { connectionString: databaseURL } }) : sqliteAdapter({ client: { url: databaseURL } }),
  sharp,
  typescript: { outputFile: path.join(dirname, 'payload-types.ts') },
  plugins: [
    seoPlugin({ collections: ['posts'], globals: ['site-content'], uploadsCollection: 'media', generateTitle: ({ doc }) => `${doc?.title || 'Thiago Barreto'} — Thiago Barreto`, generateDescription: ({ doc }) => String(doc?.excerpt || '') }),
    vercelBlobStorage({ enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN), collections: { media: true }, token: process.env.BLOB_READ_WRITE_TOKEN, clientUploads: true }),
  ],
})
