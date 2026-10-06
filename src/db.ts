import path from 'node:path'
import type { DatabaseAdapterObj } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { migrations as sqliteMigrations } from './migrations/sqlite'
import { migrations as postgresMigrations } from './migrations/postgres'

/**
 * Dois bancos, o mesmo schema:
 * - `DATABASE_URL=postgres://…` (Vercel, Neon): Postgres. Cada banco tem a sua pasta de migrações porque o SQL gerado é diferente.
 * - qualquer outro valor (`file:./.data/…`): SQLite, para o computador e para o Coolify.
 * Qualquer mudança de schema precisa de uma migração nas DUAS pastas (veja o README).
 */
export const usingPostgres = /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL || '')

export const db = (usingPostgres
  ? postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL, max: 5 },
    migrationDir: path.resolve('src/migrations/postgres'), prodMigrations: postgresMigrations,
  })
  : sqliteAdapter({
    client: { url: process.env.DATABASE_URL || 'file:./.data/thiago-barreto.db' },
    migrationDir: path.resolve('src/migrations/sqlite'), prodMigrations: sqliteMigrations,
  })) as DatabaseAdapterObj
