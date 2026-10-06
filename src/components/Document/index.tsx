import type { ReactNode } from 'react'

/** Antes da pintura: abre no claro e só usa o escuro se a pessoa escolheu no botão (evita o flash de tema). */
const THEME = `(function(d){var t;try{t=localStorage.getItem('tb-theme')}catch(e){}if(t!=='dark')t='light';d.setAttribute('data-theme',t);d.classList.add('js')})(document.documentElement)`

export function Document({ children, bodyClass }: { children: ReactNode; bodyClass?: string }) {
  return <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
    <head>
      <link rel="preload" href="/fonts/outfit-heading-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <script dangerouslySetInnerHTML={{ __html: THEME }} />
      <link rel="stylesheet" href="/css/styles.css" />
    </head>
    <body className={bodyClass || undefined}>{children}</body>
  </html>
}
