import type { ReactNode } from 'react'
import { asset } from '@/lib/assets'
import { getNonce } from '@/lib/nonce'
import { Analytics, AnalyticsNoscript } from '../Analytics'
import './enhance.css'

/** Antes da pintura: abre no claro e só usa o escuro se a pessoa escolheu no botão (evita o flash de tema). */
const THEME = `(function(d){var t;try{t=localStorage.getItem('tb-theme')}catch(e){}if(t!=='dark')t='light';d.setAttribute('data-theme',t);d.classList.add('js')})(document.documentElement)`

export async function Document({ children, bodyClass }: { children: ReactNode; bodyClass?: string }) {
  const nonce = await getNonce()
  return <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
    <head>
      <link rel="preload" href="/fonts/outfit-heading-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME }} />
      <link rel="stylesheet" href={asset('/css/styles.css')} fetchPriority="high" />
      <link rel="alternate" type="text/plain" href="/llms.txt" title="Resumo do site para assistentes de IA (llms.txt)" />
    </head>
    <body className={bodyClass || undefined}>
      <AnalyticsNoscript />
      {children}
      <Analytics nonce={nonce} />
    </body>
  </html>
}
