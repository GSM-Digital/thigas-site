import type { Access, CollectionConfig, Field, UploadFieldSingleValidation, Where } from 'payload'
import { EXPERIMENTAL_TableFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

const signedIn: Access = ({ req }) => Boolean(req.user)
const adminOnly: Access = ({ req }) => req.user?.role === 'admin'

export const toSlug = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120).replace(/-$/g, '')

const slugField = (description: string): Field => ({
  name: 'slug', label: 'Endereço (slug)', type: 'text', required: true, unique: true, index: true,
  validate: (value: string | null | undefined) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || 'Use letras minúsculas sem acento, números e hífens.',
  admin: { position: 'sidebar', description },
})

/** Rascunho pode ficar sem imagem; para publicar, a imagem de destaque é obrigatória (ela aparece no card). */
const requiredToPublish: UploadFieldSingleValidation = (value, { data }) =>
  Boolean(value || (data as { _status?: string } | undefined)?._status !== 'published') || 'Escolha uma imagem de destaque antes de publicar.'

export const Categories: CollectionConfig = {
  slug: 'categories', labels: { singular: 'Categoria', plural: 'Categorias' },
  admin: { group: 'Blog', useAsTitle: 'name', defaultColumns: ['name', 'slug'], description: 'Assuntos dos posts. Aparecem no filtro da página do blog e na etiqueta de cada post.' },
  access: { read: () => true, create: signedIn, update: signedIn, delete: adminOnly },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    slugField('Gerado pelo nome ao criar.'),
  ],
  hooks: { beforeValidate: [({ data }) => { if (data && !data.slug && data.name) data.slug = toSlug(data.name); return data }] },
}

/**
 * Posts do blog, no molde do WordPress: título, conteúdo, imagem de destaque,
 * categoria e data. "Salvar rascunho" guarda sem publicar; "Publicar" coloca no site.
 */
export const Posts: CollectionConfig = {
  slug: 'posts', labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    group: 'Blog', useAsTitle: 'title', defaultColumns: ['title', 'category', '_status', 'publishedAt'],
    description: 'Crie e edite os artigos do blog. Salvar rascunho guarda sem mudar o site; Publicar coloca o post no ar.',
    preview: (doc) => doc?.slug ? `/blog/${encodeURIComponent(String(doc.slug))}?previa=1` : null,
  },
  versions: { drafts: true, maxPerDoc: 20 },
  defaultSort: '-publishedAt',
  access: {
    // Visitantes só veem o que está publicado e com data já alcançada (agendamento).
    read: ({ req }) => req.user ? true : { and: [
      { _status: { equals: 'published' } },
      { publishedAt: { less_than_equal: new Date().toISOString() } },
    ] as Where[] },
    readVersions: signedIn, create: signedIn, update: signedIn, delete: adminOnly,
  },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Conteúdo', fields: [
        { name: 'title', label: 'Título do post', type: 'text', required: true,
          admin: { description: 'Título de destaque: aparece no card do blog e no topo do artigo.' } },
        { name: 'featuredImage', label: 'Imagem de destaque', type: 'upload', relationTo: 'media', validate: requiredToPublish,
          admin: { description: 'Aparece no card do blog, no topo do artigo e ao compartilhar o link. Use uma imagem horizontal, de preferência 1200 × 675 px.' } },
        { name: 'content', label: 'Conteúdo', type: 'richText', required: true,
          // Tabelas: dois dos artigos publicados usam (comparativos). É o único recurso a mais em relação aos padrões do editor.
          editor: lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature(), EXPERIMENTAL_TableFeature()] }),
          admin: { description: 'Use Título 2 e Título 3 para dividir o texto em partes: os Títulos 2 formam o índice "Neste artigo". Imagens podem ser inseridas pelo botão + ou digitando /.' } },
        { name: 'excerpt', label: 'Resumo', type: 'textarea',
          admin: { description: 'Uma ou duas frases sobre o post. Aparece no card e abaixo do título, e vira a descrição no Google quando a aba SEO está vazia.' } },
      ] },
      { label: 'SEO', description: 'Como o post aparece na busca do Google.', fields: [
        { name: 'focusKeyphrase', label: 'Frase-chave foco', type: 'text',
          admin: { description: 'O termo principal que alguém digitaria no Google para encontrar este post. Não aparece no site: serve para a análise abaixo.' } },
        { name: 'seoTitle', label: 'Título SEO', type: 'text',
          admin: { description: 'Opcional. Sem preencher, usa o título do post. O nome do site é acrescentado automaticamente.' } },
        { name: 'seoDescription', label: 'Descrição SEO', type: 'textarea',
          admin: { description: 'Opcional. Sem preencher, usa o resumo.' } },
        { name: 'seoAnalysis', type: 'ui', admin: { components: { Field: '/components/admin/SeoAnalysis' } } },
      ] },
    ] },
    slugField('Gerado pelo título ao criar. Evite mudar depois de divulgar o link.'),
    { name: 'publishedAt', label: 'Data de publicação', type: 'date', required: true, defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', description: 'Com data futura, o post só aparece no site a partir dela.', date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } } },
    { name: 'category', label: 'Categoria', type: 'relationship', relationTo: 'categories', required: true, admin: { position: 'sidebar' } },
    { name: 'authorName', label: 'Autor', type: 'text', required: true, defaultValue: 'Thiago Barreto', admin: { position: 'sidebar' } },
  ],
  hooks: { beforeValidate: [({ data }) => { if (data && !data.slug && data.title) data.slug = toSlug(data.title); return data }] },
}
