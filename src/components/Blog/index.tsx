'use client'

import { useMemo, useState } from 'react'
import type { PostCard } from '@/lib/blog'
import './blog.css'

const PAGE = 6

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
)

/** Mesma marcação dos cards do layout (`li.blog-card`), agora com os posts publicados. */
export function PostCards({ posts }: { posts: PostCard[] }) {
  return posts.map((post) => (
    <li className="blog-card" key={post.id}>
      <article>
        <a href={`/blog/${encodeURIComponent(post.slug)}`}>
          <div className="blog-cover">{post.image && <img src={post.image} alt="" width={800} height={500} loading="lazy" decoding="async" />}</div>
          <div className="blog-card-body">
            <p className="blog-date">{post.date}</p>
            <h3>{post.title}</h3>
            {post.excerpt && <p className="blog-excerpt">{post.excerpt}</p>}
            <span className="blog-read">Ler artigo <Arrow /></span>
          </div>
        </a>
      </article>
    </li>
  ))
}

/** Listagem da página do blog: filtro por categoria e "carregar mais". */
export function BlogListing({ posts }: { posts: PostCard[] }) {
  const [category, setCategory] = useState('')
  const [limit, setLimit] = useState(PAGE)
  // Só as categorias que têm posts publicados viram filtro.
  const categories = useMemo(() => [...new Map(posts.filter((post) => post.categorySlug).map((post) => [post.categorySlug, post.category])).entries()], [posts])
  const filtered = category ? posts.filter((post) => post.categorySlug === category) : posts
  const choose = (value: string) => { setCategory(value); setLimit(PAGE) }

  if (!posts.length) return <p className="ed-empty" role="status">Ainda não há artigos publicados. Volte em breve.</p>
  return (
    <>
      {categories.length > 1 && (
        <div className="ed-filter" role="group" aria-label="Filtrar por assunto">
          <button className="sil" type="button" aria-pressed={!category} onClick={() => choose('')}>Todos</button>
          {categories.map(([slug, name]) => (
            <button className="sil" type="button" key={slug} aria-pressed={category === slug} onClick={() => choose(slug)}>{name}</button>
          ))}
        </div>
      )}
      <ul className="ed-grid" role="list"><PostCards posts={filtered.slice(0, limit)} /></ul>
      {filtered.length > limit && (
        <div className="ed-more">
          <button type="button" className="text-link" onClick={() => setLimit((value) => value + PAGE)}>Carregar mais artigos<Arrow /></button>
        </div>
      )}
    </>
  )
}
