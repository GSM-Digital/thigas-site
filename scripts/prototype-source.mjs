import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

/**
 * O protótipo HTML mora ao lado deste projeto, na pasta "NOVO SITE DEFINITIVO".
 * Procura os locais conhecidos e aceita PROTOTYPE_DIR para qualquer outro caminho.
 * O resultado da importação (src/generated e public) é versionado: a pasta do
 * protótipo só é necessária para importar de novo.
 */
const candidates = [
  process.env.PROTOTYPE_DIR,
  path.resolve(root, '../NOVO SITE DEFINITIVO'),
  path.resolve(root, '../prototipo'),
].filter(Boolean)

export const prototypeSource = candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html')))

if (!prototypeSource) {
  throw new Error(
    `Não encontrei a pasta do protótipo. Procurei em:\n${candidates.map((dir) => `  - ${dir}`).join('\n')}\n` +
    'Defina PROTOTYPE_DIR apontando para a pasta que contém index.html.',
  )
}
