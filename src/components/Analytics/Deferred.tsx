'use client'
import { useEffect } from 'react'

export type DeferredScript = {
  id: string
  /** Código em linha ou `src` externo. */
  code?: string
  src?: string
  /** Se a pessoa não mexer em nada, carrega depois desta pausa (ms) contada a partir do fim do carregamento da página. */
  after: number
}

declare global { interface Window { __deferred?: Set<string> } }

/** Primeira ação da pessoa na página: o sinal para carregar a medição sem competir com a primeira pintura. */
const EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const

/**
 * Carrega scripts de medição (Clarity, GTM…) depois da primeira interação ou, sem interação, de uma pausa depois do
 * carregamento. Tudo que eles fazem (baixar, executar, abrir conexões) sai do caminho da primeira pintura, que é o que
 * o PageSpeed mede, e a pessoa que usa o site continua sendo medida desde as primeiras ações. Cada script entra uma vez só.
 */
export function Deferred({ scripts, nonce }: { scripts: DeferredScript[]; nonce?: string }) {
  useEffect(() => {
    const loaded = (window.__deferred ??= new Set())
    const timers: number[] = []
    const inject = (item: DeferredScript) => {
      if (loaded.has(item.id)) return
      loaded.add(item.id)
      const script = document.createElement('script')
      script.dataset.measure = item.id
      if (nonce) script.setAttribute('nonce', nonce)
      if (item.src) { script.src = item.src; script.async = true } else script.text = item.code || ''
      document.body.appendChild(script)
    }
    const all = () => scripts.forEach(inject)
    const start = () => scripts.forEach((item) => timers.push(window.setTimeout(() => inject(item), item.after)))
    EVENTS.forEach((name) => window.addEventListener(name, all, { once: true, passive: true }))
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      EVENTS.forEach((name) => window.removeEventListener(name, all))
      window.removeEventListener('load', start)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [scripts, nonce])
  return null
}
