import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Administrador', plural: 'Administradores' },
  admin: { useAsTitle: 'username', group: 'Configurações' },
  auth: { loginWithUsername: { allowEmailLogin: false, requireEmail: false } },
  access: { read: ({ req }) => Boolean(req.user), create: async ({ req }) => Boolean(req.user) || (await req.payload.count({ collection: 'users', overrideAccess: true })).totalDocs === 0, update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
  fields: [],
}
