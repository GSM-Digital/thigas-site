import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const names = ['home', 'blog', 'article']
const source = names.map((name) => `export const ${name}Template = ${JSON.stringify(readFileSync(path.join(root, 'templates', `${name}.html`), 'utf8'))}`).join('\n')
writeFileSync(path.join(root, 'src', 'templates', 'generated.ts'), `${source}\n`)
