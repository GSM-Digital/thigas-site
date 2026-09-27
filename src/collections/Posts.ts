import type { CollectionConfig } from 'payload'

const isEditor = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Artigo', plural: 'Artigos' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', '_status', 'publishedAt'], group: 'Blog', preview: ({ slug }) => `/blog/${slug}` },
  access: {
    read: ({ req }) => req.user ? true : { _status: { equals: 'published' } },
    create: isEditor, update: isEditor, delete: isEditor,
  },
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: { beforeChange: [({ data }) => { if (data?._status === 'published' && !data.publishedAt) data.publishedAt = new Date().toISOString(); return data }] },
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    { name: 'slug', label: 'Endereço do artigo', type: 'text', required: true, unique: true, index: true, admin: { description: 'Ex.: como-planejar-um-site. Evite mudar depois da publicação.' }, hooks: { beforeValidate: [({ value, siblingData }) => value || slugify(String(siblingData?.title || ''))] } },
    { name: 'excerpt', label: 'Resumo', type: 'textarea', required: true, maxLength: 320 },
    { name: 'category', label: 'Assunto', type: 'select', required: true, options: [{ label: 'Estratégia', value: 'estrategia' }, { label: 'Design', value: 'design' }, { label: 'Tecnologia', value: 'tecnologia' }] },
    { name: 'featuredImage', label: 'Imagem de capa', type: 'upload', relationTo: 'media', required: true },
    { name: 'content', label: 'Conteúdo do artigo', type: 'richText', required: true },
    { name: 'author', label: 'Autor', type: 'text', defaultValue: 'Thiago Barreto', required: true },
    { name: 'publishedAt', label: 'Publicado em', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
  ],
}
