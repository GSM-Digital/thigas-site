import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Post } from '@/payload-types'
import { categoryName, coverAlt, coverURL, formatDate, plainText, type PostCard } from '@/lib/blog'
import { PostCards } from './index'

const safeURL = (value: unknown) => typeof value === 'string' && /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) ? value : '#'
const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
)

type Heading = { id: string; title: string }
/** Endereço de cada título 2 do texto, para o índice "Neste artigo" e as âncoras. */
function headings(content: Post['content']): Heading[] {
  const found: Heading[] = []
  const used = new Set<string>()
  const visit = (node: unknown) => {
    const item = node as { type?: string; tag?: string; children?: unknown[] }
    if (item.type === 'heading' && item.tag === 'h2') {
      const title = plainText(item).replace(/\s+/g, ' ').trim()
      const base = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `secao-${found.length + 1}`
      let id = base
      for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`
      used.add(id)
      found.push({ id, title })
    }
    item.children?.forEach(visit)
  }
  visit((content as { root?: unknown } | null)?.root || {})
  return found
}

/** Topo, índice e texto do post, no layout do artigo do protótipo. */
export function ArticleContent({ post }: { post: Post }) {
  const image = coverURL(post)
  const toc = headings(post.content)
  let nextHeading = 0
  const excerpt = post.excerpt?.trim()
  return (
    <article id="ed-article">
      <header className="ed-article-hero"><div className="wrap">
        <nav className="ed-breadcrumb" aria-label="Caminho"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/blog">Blog</a><span aria-hidden="true">/</span><span aria-current="page">{post.title}</span></nav>
        <p className="ed-eyebrow">{categoryName(post)} · {formatDate(post.publishedAt)}</p>
        <h1>{post.title}</h1>
        {excerpt && <p className="ed-intro">{excerpt}</p>}
        <div className="ed-byline"><img src="/img/sobre/thiago-barreto.webp" alt="" width={44} height={44} /><p><b>{post.authorName}</b><span>Desenvolvimento web</span></p></div>
      </div></header>
      <div className="wrap">
        {image && <figure className="ed-cover"><img src={image} alt={coverAlt(post)} width={1200} height={675} /></figure>}
        <div className="ed-article-layout">
          {toc.length > 0 && (
            <nav className="ed-toc" aria-label="Neste artigo"><h2>Neste artigo</h2><ol>{toc.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ol></nav>
          )}
          <div className="ed-prose">
            {post.content && <RichText data={post.content} converters={({ defaultConverters }) => ({
              ...defaultConverters,
              heading: ({ node, nodesToJSX }) => {
                const Tag = node.tag as 'h2' | 'h3' | 'h4'
                const children = nodesToJSX({ nodes: node.children })
                return Tag === 'h2' ? <Tag id={toc[nextHeading++]?.id}>{children}</Tag> : <Tag>{children}</Tag>
              },
              // Link para outro post ou página do site escolhido no editor.
              link: ({ node, nodesToJSX }) => {
                const doc = node.fields.doc
                const value = doc && typeof doc.value === 'object' ? doc.value as { slug?: string } : undefined
                const internal = value?.slug ? doc?.relationTo === 'posts' ? `/blog/${value.slug}` : doc?.relationTo === 'pages' ? (value.slug === 'index' ? '/' : `/${value.slug}`) : undefined : undefined
                const newTab = Boolean(node.fields.newTab)
                return <a href={safeURL(internal || node.fields.url)} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>{nodesToJSX({ nodes: node.children })}</a>
              },
            })} />}
            <div className="ed-article-actions">
              <a className="text-link" href="/blog">Voltar ao blog<Chevron /></a>
              <button className="sil ed-copy" id="ed-copy" type="button">Copiar link</button>
              <span className="ed-copy-status" id="ed-copy-status" role="status" aria-live="polite" />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

/** Post mais recente em destaque no topo da página do blog. */
export function Featured({ post }: { post: PostCard }) {
  const href = `/blog/${encodeURIComponent(post.slug)}`
  return (
    <section className="wrap" aria-labelledby="ed-feature-title">
      <div className="ed-feature">
        <div className="ed-feature-copy">
          <p className="ed-eyebrow">Em destaque</p>
          <h2 id="ed-feature-title">{post.title}</h2>
          {post.excerpt && <p>{post.excerpt}</p>}
          <a className="text-link" href={href}>Ler artigo<Chevron /></a>
        </div>
        <a className="ed-feature-art" href={href} aria-label={`Ler ${post.title}`}>{post.image && <img src={post.image} alt="" width={800} height={500} />}</a>
      </div>
    </section>
  )
}

/** Carrossel de "Leia também": primeiro os da mesma categoria, depois os mais recentes. */
export function Related({ posts }: { posts: PostCard[] }) {
  return (
    <div className="blog-carousel">
      <ul className="blog-track" id="blog-track" role="list" aria-label="Outros artigos"><PostCards posts={posts} /></ul>
      <div className="blog-controls" id="blog-controls">
        <button className="blog-arrow" id="blog-prev" type="button" aria-label="Artigos anteriores" aria-controls="blog-track" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>
        <button className="blog-arrow" id="blog-next" type="button" aria-label="Próximos artigos" aria-controls="blog-track"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 5 7 7-7 7" /></svg></button>
      </div>
    </div>
  )
}
