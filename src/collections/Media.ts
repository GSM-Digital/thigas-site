import type { CollectionConfig } from 'payload'

const isEditor = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagem', plural: 'Imagens' },
  admin: { useAsTitle: 'alt', group: 'Blog' },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
  upload: { staticDir: 'media', imageSizes: [{ name: 'card', width: 800, height: 500, position: 'centre' }, { name: 'social', width: 1200, height: 630, position: 'centre' }], mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] },
  fields: [{ name: 'alt', label: 'Texto alternativo', type: 'text', required: true }],
}
