# Thiago Barreto — Next.js + Payload

Site de Thiago Barreto com painel de conteúdo, no mesmo padrão do projeto EQ Seguros da 3ADS: **Next.js 16** (App Router, `output: standalone`) e **Payload CMS 3** dentro do mesmo app, banco **SQLite** (no computador e no Coolify) ou **Postgres** (na Vercel), sempre com migrações versionadas, editor Lexical, TypeScript, painel em português e Dockerfile para o Coolify.

**O layout mora no código e só o conteúdo é editável.** O painel não é um construtor de páginas.

- O protótipo HTML (`../NOVO SITE DEFINITIVO`) é a fonte do layout. Um script o converte em uma árvore de elementos (`src/generated/prototype.json`) em que cada texto, imagem e link tem uma chave (`page-t1`, `page-i1`, `page-l1`; `header-…` e `footer-…` para cabeçalho e rodapé).
- Um segundo script (`src/generated/sections.json`) diz, para cada chave, a seção da página, o papel do campo (Título principal, Subtítulo, Botão…), o grupo repetido (Card, Etapa…) e a ligação entre texto e link.
- O conteúdo original entra no banco **uma única vez** (o seed grava uma marca no banco). Atualizar a aplicação nunca redefine o que foi editado.
- O componente `Template` renderiza a árvore no servidor com os valores do banco. Texto vira texto React, nunca HTML; URLs passam por validação; atributos `on*` e `<script>` são descartados na importação.
- Os scripts do site (menu, abas, simulações, carrosséis, tema) são os originais do protótipo e entram depois que a página hidrata (`src/components/Interactions`).

## Rodar no computador

Requer Node.js 22 ou 24.

```sh
npm ci
cp .env.example .env     # troque PAYLOAD_SECRET por uma chave aleatória longa (veja abaixo)
npm run dev
```

Site: http://localhost:3000 · Painel: http://localhost:3000/gestao

Na primeira abertura do `/gestao` em um banco novo, a tela pede o cadastro do primeiro usuário, que vira **Administrador**. Não existe usuário nem senha padrão. O Administrador cria os demais (**Editor de conteúdo**) em Usuários. Também dá para criar o primeiro administrador pelo terminal, sem gravar a senha em arquivo: `echo '{"email":"...","password":"...","name":"..."}' | npm run create-admin`.

Para gerar uma chave: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

## Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `PAYLOAD_SECRET` | Chave privada do ambiente. Obrigatória; trocá-la encerra as sessões abertas. Uma por ambiente, guardada no gerenciador de senhas. |
| `DATABASE_URL` | Define o banco. `postgres://…` usa Postgres (Vercel/Neon); qualquer outro valor usa SQLite: local `file:./.data/thiago-barreto.db`, no Coolify `file:/app/.data/thiago-barreto.db`. |
| `BLOB_READ_WRITE_TOKEN` | Só na Vercel: com ele, as imagens enviadas pelo painel vão para o Vercel Blob. Sem ele, ficam na pasta `media/`. |
| `SERVER_URL` | Endereço público do site, sem barra no fim (canônico, Open Graph, sitemap). |
| `SITE_ENV` | `preview` (padrão): `noindex` nas páginas e no cabeçalho `X-Robots-Tag`, `robots.txt` bloqueado e sitemap vazio. `production` libera a indexação — use só no domínio definitivo. |

`.env`, `.data/`, `media/` e `node_modules/` ficam fora do git.

## Como editar o conteúdo

No painel, tudo em português:

- **Páginas do site** (menu lateral agrupado: Início · Blog · Institucional).
  - Aba **Conteúdo da página**: uma linha recolhível por seção, na ordem do site, com número, nome, título atual e quantidade de campos. Os campos só aparecem quando a seção é aberta. Títulos divididos mostram "parte 1 de 2"; cada botão traz o "Link do botão" logo abaixo; imagens mostram a prévia da atual, trocam pela biblioteca e têm descrição acessível; cards, etapas e itens repetidos ficam em molduras ("Etapa 3 · título"). Botões que não têm destino (abas, janelas, envio do formulário) trazem uma nota explicando por quê.
  - Aba **SEO e publicação**: Frase-chave foco, Título SEO (sem o nome do site), Descrição SEO, Imagem de destaque (vira `og:image`), análise de SEO e Visibilidade (Publicada/Rascunho).
- **Posts** (grupo Blog): título, imagem de destaque (obrigatória para publicar), conteúdo com barra fixa (os Títulos 2 formam o índice "Neste artigo"; há suporte a tabelas), resumo; na lateral, endereço (gerado pelo título), data de publicação (data futura agenda), categoria e autor. **Salvar rascunho** guarda sem publicar; **Publicar** coloca no ar. O botão de prévia mostra o rascunho só para quem está logado, com `noindex`.
- **Categorias**: assuntos dos posts; viram o filtro de `/blog`.
- **Biblioteca de imagens**: JPG, PNG, WebP, AVIF e GIF; a descrição é obrigatória.
- **Configurações do site**: nome (entra no título de todas as páginas: "Página | Nome"; na inicial, "Nome | Título"), logo do cabeçalho, favicon, descrição padrão e imagem de compartilhamento.
- **Cabeçalho e rodapé**: o mesmo editor por seções; vale para a inicial, o blog e os artigos. As páginas legais têm cabeçalho e rodapé próprios, que se editam dentro delas.

Na inicial, o carrossel de artigos mostra os posts publicados mais recentes; se não houver nenhum, a seção some. Em `/blog`, o post mais recente vira destaque e a lista tem filtro por categoria e "carregar mais". Nas páginas de edição os cards de posts não aparecem: há um aviso com o caminho para Posts. A página **Modelo do post** só edita o que se repete em todos os artigos (o título e o link de "Leia também").

Importados no primeiro início: os **seis artigos** de `content/articles` (publicados, com capa) e os **três cards de exemplo** do protótipo (rascunho).

## Como alterar o layout

O layout é o HTML, o CSS e o JS do protótipo. Para mudar a aparência ou a estrutura:

1. Edite os arquivos em `../NOVO SITE DEFINITIVO` (ou aponte `PROTOTYPE_DIR` para outra pasta).
2. `npm run import:prototype` — regrava `src/generated/*` e copia `css/`, `js/`, `fonts/`, `img/` e `sims/` para `public/` sem alterar um byte. Depois da cópia, aplica `overrides/`, as duas únicas diferenças de propósito (veja "Diferenças da referência").
3. Se a mudança criou textos, imagens ou links novos, o banco ainda não os conhece (o site mostra o texto do protótipo, mas o painel não os lista). Gere uma migração que os acrescenta, sem tocar no que já foi editado. **Cada banco tem a sua pasta de migrações** (`src/migrations/sqlite` e `src/migrations/postgres`), então a migração é criada nas duas:

```sh
DATABASE_URL=file:./.data/novo.db npm run payload -- migrate:create novos-conteudos          # SQLite
DATABASE_URL=postgres://usuario:senha@host/banco npm run payload -- migrate:create novos-conteudos   # Postgres (um banco de teste ou de desenvolvimento)
# responda y ao aviso de migração vazia, em cada um
```

```ts
// src/migrations/<banco>/<data>_novos-conteudos.ts (o import muda: '@payloadcms/db-postgres' na pasta postgres)
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite'
import { addMissingContent } from '../cms/sync'

export async function up({ payload }: MigrateUpArgs): Promise<void> { await addMissingContent(payload) }
export async function down(_: MigrateDownArgs): Promise<void> {}
```

Em desenvolvimento, `npm run payload -- migrate` aplica a migração no seu banco local; em produção ela roda sozinha na subida.

## Como adicionar uma página

1. Crie `nome.html` na pasta do protótipo, com o mesmo cabeçalho, rodapé e `<main>` das outras páginas. Páginas legais (cabeçalho e rodapé próprios) devem ser listadas em `OWN_CHROME` no `scripts/import-prototype.mjs`.
2. Acrescente `['nome', 'nome']` em `PAGES` no mesmo script e rode `npm run import:prototype`.
3. Gere a migração que cria o registro da página (acima, com `await addMissingContent(payload, ['nome'])`). Sem ela, a rota devolve 404 porque a página não existe no banco.
4. Inclua a página em `GROUPS` e `NAMES` de `src/components/admin/PagesNav.tsx` (menu lateral do painel).
5. Se a página precisar de CSS ou scripts próprios, registre-os em `STYLES` (`src/components/SitePage`) e em `SCRIPTS` (`src/components/Interactions`).

A rota `/nome` e o sitemap passam a existir automaticamente (`src/app/(site)/[slug]`).

## Publicar na Vercel

A Vercel não guarda arquivos entre uma visita e outra, por isso aqui o banco é **Postgres** e as imagens vão para o **Vercel Blob** (o código escolhe sozinho pelo `DATABASE_URL`).

1. Importe o repositório em **Add New → Project**. Framework **Next.js**, Root Directory `./`. O build usa o script `vercel-build`: ele aplica as migrações e importa o conteúdo inicial **antes** de montar o site.
2. No projeto, abra **Storage**: crie um **Postgres** (Neon, pelo Marketplace) e um **Blob**, e ligue os dois ao projeto. A Vercel preenche `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN` sozinha. Use o endereço com pool (`DATABASE_URL`); se a migração do build reclamar do pool, troque por `DATABASE_URL_UNPOOLED`.
3. Acrescente em **Settings → Environment Variables**: `PAYLOAD_SECRET` (chave longa e privada), `SERVER_URL=https://thbarreto.com.br` e `SITE_ENV=preview`.
4. **Deploy**. Teste no endereço `.vercel.app` e, quando estiver aprovado, troque `SITE_ENV` para `production` e faça um novo deploy.
5. Crie o administrador: abra `https://<endereço>/gestao` (a primeira tela é o cadastro) ou, do seu computador, `echo '{"email":"…","password":"…","name":"…"}' | DATABASE_URL=<url de produção> npm run create-admin`.
6. Domínio: em **Settings → Domains**, adicione `thbarreto.com.br` e `www.thbarreto.com.br`, e ajuste a zona de DNS conforme os valores que a Vercel mostrar.

Cuidados: as variáveis do banco valem para os três ambientes (Production, Preview, Development); se não quiser que os deploys de prévia usem o banco de produção, restrinja o Storage a Production. O plano Hobby é só para uso não comercial. Toda mudança de schema precisa de migração **nas duas pastas** (SQLite e Postgres); o teste `npm test` falha se uma faltar.

## Publicar no Coolify

1. Envie esta pasta a um repositório da agência.
2. Crie a aplicação no Coolify a partir do repositório, usando o `Dockerfile` desta pasta e a porta interna **3000**.
3. Variáveis de execução: `PAYLOAD_SECRET` novo e privado, `DATABASE_URL=file:/app/.data/thiago-barreto.db`, `SERVER_URL=https://<domínio>`, `SITE_ENV=preview`.
4. Volumes persistentes em **`/app/.data`** (banco) e **`/app/media`** (uploads); confirme que o usuário do container (`node`) escreve neles. Uma única instância: o SQLite não aceita réplicas gravando ao mesmo tempo.
5. Aponte o domínio com HTTPS e não exponha a porta 3000 diretamente.
6. Configure e teste **backups externos** do banco e dos uploads (volume persistente não é backup). Para o SQLite, use a API de backup ou pare a aplicação; não copie o arquivo durante gravações.
7. Na primeira subida as migrações rodam e o conteúdo original é importado. Abra `/gestao` e crie o administrador.
8. Quando o site estiver aprovado, troque `SITE_ENV` para `production`.

O Payload executa as migrações incluídas antes da importação inicial. Para qualquer mudança de schema: `npm run payload -- migrate:create nome`, leia o arquivo gerado, teste em um banco criado pela versão anterior e só então publique.

## Verificação

```sh
npm run typecheck
npm test                                   # estrutura do protótipo, chaves, mapa de seções, migrações
npm run build
# Com o site rodando (banco de teste, sem usuários):
npm run test:html -- http://localhost:3000   # HTML servido × protótipo, elemento por elemento
npm run test:cms  -- http://localhost:3000   # painel de ponta a ponta; cria e remove uma conta temporária
```

`test:cms` é exclusivo de um ambiente local de teste **sem usuários**; não execute em ambiente de cliente. Ele restaura o conteúdo e falha se alguma página não voltar idêntica ao que era.

Comandos do Payload: `npm run generate:types`, `npm run generate:importmap` (rode depois de mudar campos ou componentes do painel).

## Diferenças da referência (EQ Seguros)

- **Dois bancos**: a referência usa só SQLite. Aqui `DATABASE_URL=postgres://…` troca para Postgres (Vercel), com `src/migrations/postgres` ao lado de `src/migrations/sqlite`, e o plugin do Vercel Blob guarda as imagens quando `BLOB_READ_WRITE_TOKEN` existe. O `importMap` do painel foi gerado com o Blob ativo (`BLOB_READ_WRITE_TOKEN=vercel_blob_rw_x_y npm run generate:importmap`) para incluir o envio direto do navegador; refaça assim se mudar componentes do painel.
- **Sem Cases**: o site não tem a área, então não há coleção, rota, seção nem `CASES_VISIBLE`. O portfólio "Projetos" da inicial vem de `public/js/projetos.js` (12 projetos em JavaScript) e **não é editável pelo painel**.
- **Páginas e cabeçalho/rodapé**: seis páginas (inicial, blog, modelo do post, privacidade, termos, cookies). Cabeçalho e rodapé vêm da inicial e valem para inicial, blog e artigos; fora da inicial, os atalhos de âncora e os botões que abrem janelas viram links para a inicial. As páginas legais têm cabeçalho e rodapé próprios dentro do conteúdo.
- **Rotas**: o site e o blog usam grupos de rotas diferentes (`(site)` e `(editorial)`) porque a página do blog e os artigos usam `body.editorial-page`; a EQ tem um grupo só.
- **Interações**: as da EQ foram reescritas em React; aqui os scripts originais do protótipo rodam depois da hidratação.
- **`overrides/`**: dois arquivos diferem do protótipo de propósito — `js/blog.js` (só o carrossel; a versão do protótipo busca posts em um WordPress) e `css/editorial.css` (estilo de tabelas nos artigos).
- **Demonstrações do protótipo**: `blog.html` e `artigo.html` trazem cards e avisos de "layout de demonstração"; o importador os troca pelos posts reais e descarta os avisos. O título e o link da seção "Leia também" do modelo do post vêm do protótipo com dois textos ajustados (`scripts/import-prototype.mjs`, função `artigo`).
- **Editor de posts**: acrescenta tabelas (`EXPERIMENTAL_TableFeature`), usadas por dois dos artigos.
- **Seed do blog**: publica os seis artigos reais e importa os três cards do protótipo como rascunho (o único com texto completo é um artigo de demonstração). Os cards de exemplo usam ilustrações SVG, que a biblioteca de imagens não aceita, então ficam sem capa.
- **Imagens `/api/media/…`**: o site converte o endereço dos uploads para caminho relativo, então funciona em qualquer domínio.
- **Painel em `/gestao`** (na referência é `/admin`): a constante está em `src/lib/routes.ts` e a pasta `src/app/(payload)/gestao` precisa ter o mesmo nome. Para mudar, altere os dois e rode `npm run generate:importmap`.
- **Não incluído**: os testes visuais por captura de tela da referência.

## Pendências

- Formulário de contato: continua abrindo o WhatsApp no navegador, sem servidor, e-mail ou CRM.
- SMTP (recuperação de senha) e backups não estão configurados.
- **Vercel**: o build real (`vercel-build`), o Neon e o Vercel Blob não foram testados; o Postgres foi validado com um Postgres 18 local (migração, seed, `test:html` e `test:cms` passam iguais ao SQLite) e o build foi feito com as variáveis da Vercel definidas. As imagens enviadas ao Blob só serão testadas no primeiro deploy.
- O build do Docker não foi executado neste computador (sem Docker); a imagem foi validada apenas pelo equivalente: `output: standalone` montado como no `Dockerfile` e executado no macOS. O binário nativo do `libsql` é incluído por `outputFileTracingIncludes`; confirme no primeiro build Linux.
- Dependências: reavalie `npm audit` antes de publicar.
- Fontes: o protótipo usa Outfit (arquivos em `public/fonts`).
