'use client'
import { useEffect } from 'react'

/**
 * Os scripts do site (menu, abas, simulações, carrosséis, tema…) são os originais do
 * protótipo e mexem no DOM. Entram depois que o React termina de hidratar a página,
 * para não competir com ele, e uma vez só por script, na ordem em que o layout os usa.
 * O `?v=` é a versão do build (src/lib/assets.ts): o navegador guarda cada script por um ano.
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
    for (const path of SCRIPTS[kind]) {
      if (loaded.has(path)) continue
      loaded.add(path)
      const script = document.createElement('script')
      script.src = `${path}?v=${process.env.NEXT_PUBLIC_ASSET_VERSION || 'dev'}`
      script.async = false
      document.body.appendChild(script)
    }
  }, [kind])
  return null
}
