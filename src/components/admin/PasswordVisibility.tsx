'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './password-visibility.css'

/** Enhances the native login field without replacing Payload's authentication form. */
export default function PasswordVisibility() {
  const [input, setInput] = useState<HTMLInputElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const findInput = () => {
      const field = document.querySelector<HTMLInputElement>('input#field-password')
      setInput((current) => current === field ? current : field)
    }
    findInput()
    const observer = new MutationObserver(findInput)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!input?.parentElement) return
    const wrapper = input.parentElement
    wrapper.classList.add('tb-password-control')
    return () => {
      input.type = 'password'
      wrapper.classList.remove('tb-password-control')
    }
  }, [input])

  useEffect(() => {
    if (input) input.type = visible ? 'text' : 'password'
  }, [input, visible])

  if (!input?.parentElement) return null
  const label = visible ? 'Ocultar senha' : 'Mostrar senha'

  return createPortal(
    <button
      type="button"
      className="tb-password-toggle"
      aria-label={label}
      aria-controls={input.id}
      aria-pressed={visible}
      title={label}
      onClick={() => setVisible((current) => !current)}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {visible && <path d="m3 3 18 18" />}
      </svg>
    </button>,
    input.parentElement,
  )
}
