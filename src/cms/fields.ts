import type { Field } from 'payload'
import { validateHref } from '../lib/href'

/**
 * `key` liga cada entrada à posição dela no layout: se mudar, o conteúdo some da página.
 * Fica oculto no painel, mas continua no formulário e é salvo junto com a linha.
 */
const reference: Field[] = [
  { name: 'key', label: 'Chave', type: 'text', required: true, admin: { hidden: true, readOnly: true } },
  { name: 'label', label: 'Onde aparece no site', type: 'text', admin: { hidden: true, readOnly: true } },
]

/**
 * O painel mostra uma linha por seção da página (SectionsEditor). As três
 * listas abaixo guardam os valores e ficam fora da tela: o editor aponta para elas.
 */
const sections: Field = { name: 'sections', type: 'ui', admin: { components: { Field: '/components/admin/SectionsEditor' } } }
const stored = { hidden: true, initCollapsed: true }

export const contentFields: Field[] = [
  sections,
  { name: 'copy', label: 'Textos', type: 'array', admin: stored,
    fields: [
      ...reference,
      { name: 'value', label: 'Texto', type: 'textarea', required: true },
    ] },
  { name: 'images', label: 'Imagens', type: 'array', admin: stored,
    fields: [
      ...reference,
      { name: 'src', label: 'Imagem original (endereço)', type: 'text', required: true },
      { name: 'alt', label: 'Descrição da imagem', type: 'text' },
      { name: 'media', label: 'Substituir por imagem da biblioteca', type: 'upload', relationTo: 'media' },
    ] },
  { name: 'links', label: 'Links e botões', type: 'array', admin: stored,
    fields: [
      ...reference,
      { name: 'href', label: 'Link (destino)', type: 'text', required: true, validate: validateHref },
    ] },
]
