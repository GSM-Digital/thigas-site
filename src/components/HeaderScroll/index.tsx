'use client'
import { useEffect } from 'react'

/**
 * Cabeçalho que some ao rolar para baixo e volta ao rolar para cima (a transição fica em Document/enhance.css, `.is-hidden`).
 * Fica sempre visível: perto do topo da página, com o menu do celular aberto, com o foco ou o mouse dentro dele (teclado e
 * leitor de tela nunca perdem o menu) e quando a página chega ao fim. Pequenos tremores de rolagem (< 6 px) são ignorados.
 */
const NEAR_TOP = 80
const STEP = 6

export function HeaderScroll() {
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.topbar')
    if (!bar) return
    let last = window.scrollY
    let frame = 0

    const keepVisible = () => bar.matches(':focus-within, :hover') || document.documentElement.classList.contains('menu-open')
    const update = () => {
      frame = 0
      const y = Math.max(0, window.scrollY)
      const delta = y - last
      if (y <= NEAR_TOP || keepVisible()) bar.classList.remove('is-hidden')
      else if (delta > STEP) bar.classList.add('is-hidden')
      else if (delta < -STEP) bar.classList.remove('is-hidden')
      if (Math.abs(delta) > STEP || y <= NEAR_TOP) last = y
    }
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    // Ao tocar no cabeçalho ou abrir o menu ele volta na hora.
    const show = () => bar.classList.remove('is-hidden')

    window.addEventListener('scroll', onScroll, { passive: true })
    bar.addEventListener('focusin', show)
    bar.addEventListener('pointerenter', show)
    return () => {
      window.removeEventListener('scroll', onScroll)
      bar.removeEventListener('focusin', show)
      bar.removeEventListener('pointerenter', show)
      if (frame) window.cancelAnimationFrame(frame)
      bar.classList.remove('is-hidden')
    }
  }, [])
  return null
}
