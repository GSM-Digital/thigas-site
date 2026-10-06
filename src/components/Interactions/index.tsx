'use client'
import { useEffect } from 'react'

/**
 * Os scripts do site (menu, abas, simulações, carrosséis, tema…) são os originais do
 * protótipo e mexem no DOM. Entram depois que o React termina de hidratar a página,
 * para não competir com ele, e uma vez só por script, na ordem em que o layout os usa.
 */
const SCRIPTS: Record<string, string[]> = {
  home: ['/js/projetos.js', '/js/main.js', '/js/blog.js', '/js/press-sound.js'],
  editorial: ['/js/editorial.js', '/js/press-sound.js'],
  article: ['/js/editorial.js', '/js/blog.js', '/js/press-sound.js'],
  legal: ['/js/legal.js', '/js/press-sound.js'],
}

declare global { interface Window { __siteScripts?: Set<string> } }

export function Interactions({ kind }: { kind: keyof typeof SCRIPTS }) {
  useEffect(() => {
    const loaded = (window.__siteScripts ??= new Set())
    for (const src of SCRIPTS[kind]) {
      if (loaded.has(src)) continue
      loaded.add(src)
      const script = document.createElement('script')
      script.src = src
      script.async = false
      document.body.appendChild(script)
    }
  }, [kind])
  return null
}
