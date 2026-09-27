import type { Field, GlobalConfig } from 'payload'
import { siteDefaults, type SiteContentKey } from '../lib/defaults'

const line = (name: SiteContentKey, label: string): Field => ({ name, label, type: 'text', required: true, defaultValue: siteDefaults[name] })
const paragraph = (name: SiteContentKey, label: string): Field => ({ name, label, type: 'textarea', required: true, defaultValue: siteDefaults[name] })

export const SiteContent: GlobalConfig = {
  slug: 'site-content',
  label: 'Textos do site',
  admin: { group: 'Página principal' },
  access: { read: () => true, update: ({ req }) => Boolean(req.user) },
  versions: { max: 20 },
  fields: [{ type: 'tabs', tabs: [
    { label: 'Abertura', fields: [line('heroEyebrow', 'Sobretítulo'), line('heroTitleFirst', 'H1 · primeira linha'), line('heroTitleSecond', 'H1 · frase em destaque'), paragraph('heroLead', 'Texto de apoio')] },
    { label: 'Soluções', fields: [line('solutionsTitleFirst', 'H2 · primeira linha'), line('solutionsTitleSecond', 'H2 · segunda linha'), paragraph('solutionsIntro', 'Subtítulo')] },
    { label: 'Projetos', fields: [line('projectsTitle', 'H2'), paragraph('projectsIntro', 'Subtítulo')] },
    { label: 'Processo', fields: [line('processTitleFirst', 'H2 · primeira linha'), line('processTitleSecond', 'H2 · segunda linha'), paragraph('processIntro', 'Subtítulo')] },
    { label: 'Sobre', fields: [line('aboutTitleFirst', 'H2 · primeira linha'), line('aboutTitleSecond', 'H2 · segunda linha'), paragraph('aboutIntro', 'Subtítulo'), paragraph('aboutBody', 'Texto principal'), line('pillarOneTitle', 'Pilar 1 · título'), paragraph('pillarOneText', 'Pilar 1 · texto'), line('pillarTwoTitle', 'Pilar 2 · título'), paragraph('pillarTwoText', 'Pilar 2 · texto'), line('pillarThreeTitle', 'Pilar 3 · título'), paragraph('pillarThreeText', 'Pilar 3 · texto')] },
    { label: 'Blog', fields: [line('blogTitleFirst', 'H2 · primeira linha'), line('blogTitleSecond', 'H2 · segunda linha'), paragraph('blogIntro', 'Subtítulo')] },
    { label: 'Contato e rodapé', fields: [line('contactTitleFirst', 'H2 · primeira linha'), line('contactTitleSecond', 'H2 · segunda linha'), paragraph('contactIntro', 'Subtítulo'), line('footerTitleFirst', 'Chamada final · primeira linha'), line('footerTitleSecond', 'Chamada final · segunda linha'), paragraph('footerBio', 'Descrição do rodapé')] },
  ] }],
}
