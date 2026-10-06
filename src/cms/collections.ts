import type { Access, CollectionConfig, GlobalConfig } from 'payload'
import { contentFields } from './fields'

const signedIn: Access = ({ req }) => Boolean(req.user)
const adminOnly: Access = ({ req }) => req.user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users', labels: { singular: 'Usuário', plural: 'Usuários' },
  auth: { maxLoginAttempts: 5, lockTime: 600000 }, admin: { useAsTitle: 'name' },
  access: { create: adminOnly, read: signedIn, update: ({ req }) => req.user?.role === 'admin' ? true : { id: { equals: req.user?.id ?? -1 } }, delete: adminOnly },
  fields: [
    { name: 'name', label: 'Nome', type: 'text', required: true },
    { name: 'role', label: 'Permissão', type: 'select', required: true, defaultValue: 'editor', saveToJWT: true,
      options: [{ label: 'Administrador', value: 'admin' }, { label: 'Editor de conteúdo', value: 'editor' }],
      access: { update: ({ req }) => req.user?.role === 'admin' } },
  ],
  hooks: { beforeChange: [async ({ data, operation, req }) => {
    if (operation === 'create') {
      const count = await req.payload.count({ collection: 'users', overrideAccess: true, req })
      data.role = count.totalDocs === 0 ? 'admin' : (req.user?.role === 'admin' ? data.role : 'editor')
    }
    return data
  }] },
}

export const Media: CollectionConfig = {
  slug: 'media', labels: { singular: 'Imagem', plural: 'Biblioteca de imagens' },
  access: { read: () => true, create: signedIn, update: signedIn, delete: adminOnly },
  upload: { staticDir: 'media', mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'] },
  fields: [{ name: 'alt', label: 'Descrição acessível', type: 'text', required: true }],
}

export const Pages: CollectionConfig = {
  slug: 'pages', labels: { singular: 'Página', plural: 'Páginas do site' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'status', 'updatedAt'], description: 'Cada linha é uma seção da página, na ordem do site. Abra a seção para editar títulos, textos, botões, links e imagens.' },
  access: { read: ({ req }) => req.user ? true : { status: { equals: 'published' } }, create: adminOnly, update: signedIn, delete: adminOnly },
  // Abas sem `name` são apenas visuais: os campos continuam na raiz do documento.
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Conteúdo da página', description: 'O que aparece para quem visita o site.', fields: contentFields },
      { label: 'SEO e publicação', description: 'Como a página aparece na busca e se está visível.', fields: [
        { name: 'focusKeyphrase', label: 'Frase-chave foco', type: 'text',
          admin: { description: 'O termo principal que alguém digitaria no Google para encontrar esta página, como "criação de sites". Não aparece no site: serve para a análise abaixo.' } },
        { name: 'title', label: 'Título SEO', type: 'text', required: true,
          admin: { description: 'Sem o nome do site: ele é acrescentado automaticamente, conforme "Configurações do site".' } },
        { name: 'description', label: 'Descrição SEO', type: 'textarea' },
        { name: 'featuredImage', label: 'Imagem de destaque', type: 'upload', relationTo: 'media',
          admin: { description: 'Prévia desta página ao compartilhar o link no WhatsApp, LinkedIn ou Facebook. Tamanho ideal: 1200 × 630 px. Sem seleção, usa a imagem padrão de "Configurações do site".' } },
        { name: 'seoAnalysis', type: 'ui', admin: { components: { Field: '/components/admin/SeoAnalysis' } } },
        { name: 'status', label: 'Visibilidade', type: 'select', defaultValue: 'published', options: [{ label: 'Publicada', value: 'published' }, { label: 'Rascunho', value: 'draft' }] },
        { name: 'slug', label: 'Identificador da página', type: 'text', required: true, unique: true, admin: { hidden: true, readOnly: true } },
      ] },
    ] },
  ],
}

export const Site: GlobalConfig = {
  slug: 'site', label: 'Cabeçalho e rodapé', access: { read: () => true, update: signedIn }, admin: { group: 'Configurações' },
  fields: [
    ...contentFields,
    { name: 'bootstrapComplete', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { update: () => false } },
    { name: 'blogBootstrapComplete', type: 'checkbox', defaultValue: false, admin: { hidden: true }, access: { update: () => false } },
  ],
}

/** Informações gerais do site, como em Configurações → Geral do WordPress. */
export const Settings: GlobalConfig = {
  slug: 'settings', label: 'Configurações do site', access: { read: () => true, update: signedIn },
  admin: { group: 'Configurações', description: 'Nome, logo, ícone e informações padrão de busca e compartilhamento, válidos para o site inteiro.' },
  fields: [
    { type: 'tabs', tabs: [
      { label: 'Identidade', fields: [
        { name: 'siteName', label: 'Nome do site', type: 'text', required: true, defaultValue: 'Thiago Barreto',
          admin: { description: 'Entra no título de todas as páginas: "Blog | Thiago Barreto". Na página inicial vem primeiro: "Thiago Barreto | …".' } },
        { name: 'logo', label: 'Logo do cabeçalho', type: 'upload', relationTo: 'media',
          admin: { description: 'PNG com fundo transparente. Sem seleção, fica o logo atual (nome e ponto azul). Quando escolhido, substitui o texto do logo no cabeçalho.' } },
        { name: 'favicon', label: 'Ícone do site (favicon)', type: 'upload', relationTo: 'media',
          admin: { description: 'Aparece na aba do navegador e nos favoritos. Use uma imagem quadrada em PNG, de preferência 512 × 512 px. Sem seleção, fica o ícone atual.' } },
      ] },
      { label: 'Busca e compartilhamento', fields: [
        { name: 'defaultDescription', label: 'Descrição padrão', type: 'textarea',
          admin: { description: 'Usada no Google e nas redes quando a página não tem descrição própria. Cada página tem a sua em "SEO e publicação".' } },
        { name: 'shareImage', label: 'Imagem de compartilhamento', type: 'upload', relationTo: 'media',
          admin: { description: 'Prévia que aparece ao enviar um link do site no WhatsApp, LinkedIn ou Facebook. Tamanho ideal: 1200 × 630 px.' } },
      ] },
    ] },
  ],
}
