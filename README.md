# Thiago Barreto — site e Payload CMS

Aplicação Next.js com Payload. A página inicial, o blog e as páginas de artigo são servidos pelo mesmo projeto. O Payload administra os artigos, imagens, SEO e os textos principais da página inicial. O restante do layout e das interações está nos templates, CSS e JavaScript em `templates/` e `public/`.

## Desenvolvimento local

Requer Node.js 20.9 ou superior.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Troque `PAYLOAD_SECRET` por um segredo longo antes de iniciar. O SQLite local usa `payload.sqlite`, ignorado pelo Git. Abra `http://localhost:3000/admin` para criar o primeiro administrador e `http://localhost:3000/blog` para conferir o blog. `npm run build` e `npm run typecheck` validam o projeto.

## Publicação na Vercel

Importe este repositório com **Root Directory `.`** e Framework Preset **Next.js**. Configure:

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | PostgreSQL persistente; obrigatório na Vercel |
| `PAYLOAD_SECRET` | Segredo longo e estável entre deploys |
| `BLOB_READ_WRITE_TOKEN` | Armazenamento persistente para imagens |
| `NEXT_PUBLIC_SITE_URL` | URL pública, por exemplo `https://thbarreto.com.br` |

Antes do primeiro acesso em produção, gere e aplique a migração inicial do PostgreSQL com o Payload CLI apontando para o banco configurado. O SQLite e os usuários locais não são enviados para o Git nem transferidos para produção. Crie o administrador no `/admin` da instalação publicada.

Os seis artigos fornecidos estão em `content/articles/`, com capas em `public/img/blog/artigos/`. Após configurar banco, armazenamento e migrações, execute **uma vez** `npm run replace:articles` em um ambiente com acesso ao banco e com `BLOB_READ_WRITE_TOKEN`. Esse comando publica os seis artigos e exclui os artigos existentes no banco de destino. Execute-o somente quando desejar essa substituição.

## Arquivos incluídos

- `src/`: configuração do Payload, coleções, campos editáveis e rotas do Next.js.
- `templates/`: HTML da página inicial, blog e artigo; `scripts/sync-templates.mjs` gera o módulo usado no build.
- `public/`: estilos, scripts, fontes e imagens usados pelo site.
- `content/articles/` e `scripts/import-articles.ts`: material e comando de importação dos artigos.

`node_modules`, `.next`, SQLite, segredos e uploads locais são ignorados. A instalação de dependências e o build acontecem no ambiente de desenvolvimento ou hospedagem; não são versionados.
