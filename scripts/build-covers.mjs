import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Gera as capas dos artigos (1600×900, WebP) em public/img/blog/capas/<slug>.webp.
 * São ilustrações futuristas feitas em código (SVG → WebP), na paleta do site: azul #0292F2, grafite e o brilho do ponto da
 * marca. Cada artigo tem uma cena própria ligada ao tema, com o mesmo sistema visual: fundo escuro com grade em perspectiva,
 * vidro translúcido, luz azul e partículas. Sem texto na imagem, então nada precisa ser traduzido nem refeito ao editar o título.
 *   node scripts/build-covers.mjs            (gera todas)
 *   node scripts/build-covers.mjs --svg      (grava também o SVG de cada capa em test-results/, para ajustar o desenho)
 */
const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, 'public/img/blog/capas')
const W = 1600, H = 900
const BLUE = '#0292F2', SKY = '#6CB8F7', ICE = '#B8E2FF', CYAN = '#4FD8FF', VIOLET = '#7659D5', ROSE = '#FF5C7A'

/** Números "aleatórios" repetíveis: a mesma capa sai igual em toda geração. */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }
const f = (n) => +n.toFixed(1)

function defs(tint) {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#050B1A"/><stop offset="0.55" stop-color="#081633"/><stop offset="1" stop-color="#030712"/></linearGradient>
    <radialGradient id="glowA" cx="0.5" cy="0.48" r="0.55"><stop offset="0" stop-color="${BLUE}" stop-opacity="0.55"/><stop offset="0.45" stop-color="${BLUE}" stop-opacity="0.14"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowB" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${tint}" stop-opacity="0.5"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.2"/><stop offset="1" stop-color="#9FD3FF" stop-opacity="0.04"/></linearGradient>
    <linearGradient id="glassSoft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.1"/><stop offset="1" stop-color="#9FD3FF" stop-opacity="0.02"/></linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity="0.95"/><stop offset="0.5" stop-color="${SKY}" stop-opacity="0.35"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0.2"/></linearGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ICE}" stop-opacity="0.9"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${BLUE}" stop-opacity="0.2"/><stop offset="0.6" stop-color="${SKY}"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BLUE}" stop-opacity="0.55"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></linearGradient>
    <linearGradient id="fadeY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF" stop-opacity="0"/><stop offset="0.35" stop-color="#FFF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFF" stop-opacity="1"/></linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.65"/></radialGradient>
    <mask id="floorMask"><rect x="0" y="540" width="${W}" height="${H - 540}" fill="url(#fadeY)"/></mask>
    <filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
    <filter id="b46" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="46"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0"/></filter>
  </defs>`
}

/** Fundo: céu escuro, brilhos, grade de chão em perspectiva e partículas. */
function backdrop(seed, tint, glowAt = [800, 430]) {
  const r = rng(seed)
  const vx = 800, vy = 560
  let grid = ''
  for (let i = -22; i <= 22; i++) grid += `<line x1="${vx}" y1="${vy}" x2="${f(vx + i * 150)}" y2="${H + 60}"/>`
  for (let k = 1; k <= 9; k++) { const y = vy + 360 * (k / 9) ** 2; grid += `<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}"/>` }
  let stars = ''
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H * 0.78, s = 0.8 + r() * 1.8, o = 0.15 + r() * 0.6
    stars += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="#DDF0FF" opacity="${f(o)}"/>`
  }
  let bokeh = ''
  for (let i = 0; i < 9; i++) {
    const x = r() * W, y = r() * H, s = 14 + r() * 38
    bokeh += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${i % 3 === 0 ? tint : SKY}" opacity="${f(0.05 + r() * 0.08)}" filter="url(#b8)"/>`
  }
  return `<rect width="${W}" height="${H}" fill="url(#bg)"/>
    <ellipse cx="${glowAt[0]}" cy="${glowAt[1]}" rx="780" ry="520" fill="url(#glowA)"/>
    <ellipse cx="${W - 130}" cy="120" rx="520" ry="380" fill="url(#glowB)" opacity="0.7"/>
    <ellipse cx="120" cy="${H - 80}" rx="460" ry="300" fill="url(#glowB)" opacity="0.4"/>
    <g mask="url(#floorMask)" stroke="${SKY}" stroke-opacity="0.2" stroke-width="1.2">${grid}</g>
    ${bokeh}${stars}`
}

/** Fecho comum: marca (ponto azul brilhante), vinheta e grão. */
function finish() {
  return `<g transform="translate(96 ${H - 96})"><circle r="16" fill="${BLUE}" opacity="0.5" filter="url(#b8)"/><circle r="7" fill="${BLUE}"/><circle r="3" fill="#E9F6FF"/><rect x="26" y="-1.5" width="64" height="3" rx="1.5" fill="${ICE}" opacity="0.35"/></g>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)"/>`
}

const glassRect = (x, y, w, h, rx, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#glass)" stroke="url(#edge)" stroke-width="1.6" ${extra}/>`
const glow = (shape) => `<g filter="url(#b20)" opacity="0.7">${shape}</g>`
const node = (x, y, r, color = BLUE) =>
  `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="${color}" opacity="0.35" filter="url(#b8)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${x}" cy="${y}" r="${f(r * 0.38)}" fill="#F2FAFF"/>`

/* ───────────────────────── cenas ───────────────────────── */

/** Por que ter um site profissional: uma janela de navegador de vidro flutuando, com órbitas de presença ao redor. */
function sceneSite() {
  const x = 460, y = 230, w = 680, h = 420
  return `${glow(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="${BLUE}"/>`)}
    <g transform="rotate(-14 800 440)"><ellipse cx="800" cy="440" rx="560" ry="150" fill="none" stroke="${SKY}" stroke-opacity="0.45" stroke-width="1.4" stroke-dasharray="2 9"/>${node(1352, 400, 7)}${node(290, 476, 5, CYAN)}</g>
    <g transform="rotate(16 800 440)"><ellipse cx="800" cy="440" rx="620" ry="190" fill="none" stroke="${ICE}" stroke-opacity="0.22" stroke-width="1.2"/>${node(210, 330, 6)}${node(1420, 560, 5, VIOLET)}</g>
    ${glassRect(x, y, w, h, 30)}
    <path d="M${x} ${y + 62}H${x + w}" stroke="${ICE}" stroke-opacity="0.2"/>
    <circle cx="${x + 36}" cy="${y + 31}" r="7" fill="${ICE}" opacity="0.55"/><circle cx="${x + 62}" cy="${y + 31}" r="7" fill="${ICE}" opacity="0.35"/><circle cx="${x + 88}" cy="${y + 31}" r="7" fill="${ICE}" opacity="0.2"/>
    <rect x="${x + 190}" y="${y + 19}" width="300" height="24" rx="12" fill="#fff" opacity="0.1"/>
    <circle cx="${x + 228}" cy="${y + 31}" r="4" fill="${BLUE}"/><rect x="${x + 244}" y="${y + 28}" width="120" height="6" rx="3" fill="#fff" opacity="0.35"/>
    <rect x="${x + 48}" y="${y + 112}" width="250" height="16" rx="8" fill="#fff" opacity="0.85"/>
    <rect x="${x + 48}" y="${y + 148}" width="190" height="16" rx="8" fill="url(#line)"/>
    <rect x="${x + 48}" y="${y + 196}" width="300" height="9" rx="4.5" fill="#fff" opacity="0.28"/><rect x="${x + 48}" y="${y + 218}" width="250" height="9" rx="4.5" fill="#fff" opacity="0.2"/>
    <rect x="${x + 48}" y="${y + 268}" width="132" height="44" rx="22" fill="${BLUE}"/><rect x="${x + 48}" y="${y + 268}" width="132" height="44" rx="22" fill="none" stroke="#fff" stroke-opacity="0.35"/>
    <circle cx="${x + 500}" cy="${y + 220}" r="120" fill="${BLUE}" opacity="0.35" filter="url(#b20)"/>
    <circle cx="${x + 500}" cy="${y + 220}" r="92" fill="url(#glass)" stroke="url(#edge)" stroke-width="1.6"/>
    <circle cx="${x + 500}" cy="${y + 220}" r="52" fill="none" stroke="${ICE}" stroke-opacity="0.7" stroke-width="1.4"/>
    <ellipse cx="${x + 500}" cy="${y + 220}" rx="22" ry="52" fill="none" stroke="${ICE}" stroke-opacity="0.55" stroke-width="1.4"/><path d="M${x + 448} ${y + 220}H${x + 552}" stroke="${ICE}" stroke-opacity="0.55" stroke-width="1.4"/>
    ${node(x + 500, y + 168, 5)}
    <path d="M${x + 60} ${h + y + 20}L${x - 40} ${H}M${x + w - 60} ${h + y + 20}L${x + w + 40} ${H}" stroke="url(#beam)" stroke-width="2" opacity="0.5"/>`
}

/** Como escolher um web designer: curva de Bézier com alças, nós e amostras de cor, como numa ferramenta de design. */
function sceneDesign() {
  return `${glow(`<path d="M300 640C520 160 900 780 1300 270" fill="none" stroke="${BLUE}" stroke-width="26"/>`)}
    <path d="M300 640C520 160 900 780 1300 270" fill="none" stroke="url(#line)" stroke-width="5" stroke-linecap="round"/>
    <g stroke="${ICE}" stroke-opacity="0.55" stroke-width="1.4"><path d="M300 640L520 160M1300 270L900 780"/></g>
    <g fill="${VIOLET}">${[[520, 160], [900, 780]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="${VIOLET}" opacity="0.35" filter="url(#b8)"/><circle cx="${x}" cy="${y}" r="9" fill="${VIOLET}"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/>`).join('')}</g>
    ${[[300, 640], [1300, 270]].map(([x, y]) => `<rect x="${x - 15}" y="${y - 15}" width="30" height="30" rx="6" fill="#06142E" stroke="${ICE}" stroke-width="2.4"/><rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="${BLUE}"/>`).join('')}
    <g transform="translate(610 340) rotate(-8)"><rect width="380" height="250" rx="26" fill="url(#glassSoft)" stroke="${SKY}" stroke-opacity="0.8" stroke-width="1.4" stroke-dasharray="7 7"/>
      ${[[0, 0], [380, 0], [0, 250], [380, 250]].map(([x, y]) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="3" fill="#06142E" stroke="${ICE}" stroke-width="2"/>`).join('')}
      <rect x="44" y="52" width="170" height="14" rx="7" fill="#fff" opacity="0.8"/><rect x="44" y="84" width="250" height="9" rx="4.5" fill="#fff" opacity="0.25"/><rect x="44" y="106" width="200" height="9" rx="4.5" fill="#fff" opacity="0.18"/>
      <rect x="44" y="160" width="120" height="40" rx="20" fill="${BLUE}"/></g>
    <g>${[[330, 250, 34, BLUE], [412, 205, 24, SKY], [470, 270, 30, VIOLET], [1190, 640, 36, ICE], [1280, 560, 24, BLUE], [1120, 720, 20, VIOLET]].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="${c}" opacity="0.28" filter="url(#b20)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.32}" r="${f(r * 0.42)}" fill="#fff" opacity="0.5"/>`).join('')}</g>`
}

/** Quanto custa: camadas de vidro em losango (níveis de investimento) com uma moeda luminosa sobre a mais alta. */
function sceneCost() {
  const plate = (cy, scale, op) => `<g transform="translate(800 ${cy}) scale(1 0.5) rotate(45)"><rect x="${-210 * scale}" y="${-210 * scale}" width="${420 * scale}" height="${420 * scale}" rx="${46 * scale}" fill="url(#glass)" fill-opacity="${op}" stroke="url(#edge)" stroke-width="${f(2.2 / scale)}"/></g>`
  return `<g transform="translate(800 470) scale(1.28) translate(-800 -470)">${glow(`<ellipse cx="800" cy="600" rx="330" ry="120" fill="${BLUE}" opacity="0.7"/>`)}
    ${plate(640, 1.12, 0.7)}${plate(540, 0.96, 0.85)}${plate(440, 0.8, 1)}
    <path d="M800 400V120" stroke="url(#beam)" stroke-width="3"/><path d="M800 400V120" stroke="${CYAN}" stroke-opacity="0.4" stroke-width="14" filter="url(#b8)"/>
    <g transform="translate(800 330)"><ellipse cx="0" cy="26" rx="112" ry="40" fill="${BLUE}" opacity="0.45" filter="url(#b20)"/>
      <ellipse cx="0" cy="22" rx="96" ry="34" fill="#0A5FA8"/><rect x="-96" y="-14" width="192" height="36" fill="#0A7BD0"/><ellipse cx="0" cy="-14" rx="96" ry="34" fill="url(#line)"/>
      <ellipse cx="0" cy="-14" rx="72" ry="24" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="2.2"/><path d="M-12 -22h24M0 -30v32" stroke="#fff" stroke-opacity="0.9" stroke-width="3" stroke-linecap="round"/></g>
    ${[[470, 300, 5], [1180, 360, 6], [540, 590, 4], [1100, 620, 5, VIOLET], [330, 450, 6, CYAN], [1290, 500, 4]].map(([x, y, r, c]) => node(x, y, r, c)).join('')}
    <g stroke="${ICE}" stroke-opacity="0.4" stroke-width="1.6" stroke-linecap="round"><path d="M1228 250v36M1210 268h36"/><path d="M382 330v28M368 344h28"/></g></g>`
}

/** Como funciona a criação: um fio de luz passando por cinco etapas, do briefing à publicação. */
function sceneProcess() {
  const pts = [[260, 640], [490, 470], [720, 560], [950, 360], [1250, 250]]
  const icons = [
    (x, y) => `<rect x="${x - 17}" y="${y - 21}" width="34" height="42" rx="6" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M${x - 8} ${y - 8}h16M${x - 8} ${y + 1}h16M${x - 8} ${y + 10}h9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
    (x, y) => `<path d="M${x - 18} ${y + 18}L${x - 14} ${y + 4}L${x + 10} ${y - 20}L${x + 20} ${y - 10}L${x - 4} ${y + 14}Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x + 4} ${y - 14}l10 10" stroke="#fff" stroke-width="2.4"/>`,
    (x, y) => `<path d="M${x - 20} ${y + 2}L${x - 6} ${y + 16}L${x + 22} ${y - 14}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    (x, y) => `<path d="M${x - 8} ${y - 18}L${x - 24} ${y}L${x - 8} ${y + 18}M${x + 8} ${y - 18}L${x + 24} ${y}L${x + 8} ${y + 18}M${x + 4} ${y - 22}L${x - 4} ${y + 22}" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    (x, y) => `<circle cx="${x}" cy="${y}" r="26" fill="none" stroke="#fff" stroke-width="2.6"/><ellipse cx="${x}" cy="${y}" rx="10" ry="26" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M${x - 26} ${y}H${x + 26}" stroke="#fff" stroke-width="2.2"/>`,
  ]
  const radius = [56, 56, 56, 56, 84]
  const path = 'M170 700C340 700 330 490 490 470S600 600 720 560 840 340 950 360 1100 250 1250 250'
  return `${glow(`<path d="${path}" fill="none" stroke="${BLUE}" stroke-width="22"/>`)}
    <path d="${path}" fill="none" stroke="${ICE}" stroke-opacity="0.18" stroke-width="3" stroke-dasharray="3 12"/>
    <path d="M170 700C340 700 330 490 490 470S600 600 720 560 840 340 950 360" fill="none" stroke="url(#line)" stroke-width="5" stroke-linecap="round"/>
    ${pts.map(([x, y], i) => {
      const r = radius[i]
      return `<circle cx="${x}" cy="${y}" r="${r * 1.9}" fill="${BLUE}" opacity="${i === 4 ? 0.55 : 0.28}" filter="url(#b20)"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="url(#glass)" stroke="url(#edge)" stroke-width="2"/>
        ${i === 4 ? `<circle cx="${x}" cy="${y}" r="${r + 22}" fill="none" stroke="${SKY}" stroke-opacity="0.45" stroke-width="1.4" stroke-dasharray="3 8"/><circle cx="${x}" cy="${y}" r="${r - 14}" fill="${BLUE}" opacity="0.6"/>` : `<circle cx="${x}" cy="${y}" r="${r - 14}" fill="${BLUE}" opacity="0.3"/>`}
        <g opacity="${i === 4 ? 1 : 0.95}">${icons[i](x, y)}</g>
        <text x="${x}" y="${y + r + 44}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4" fill="${ICE}" opacity="0.55">0${i + 1}</text>`
    }).join('')}
    ${[[380, 330, 4], [640, 300, 5, CYAN], [1100, 520, 5], [1380, 420, 4, VIOLET], [860, 700, 4]].map(([x, y, r, c]) => node(x, y, r, c)).join('')}`
}

/** 7 erros ao contratar: um escudo de vidro com a verificação, cercado por sete pontos de atenção (um deles em alerta). */
function sceneErrors() {
  const cx = 800, cy = 440
  const shield = `M${cx} ${cy - 210}C${cx + 70} ${cy - 160} ${cx + 150} ${cy - 150} ${cx + 190} ${cy - 150}V${cy + 10}C${cx + 190} ${cy + 130} ${cx + 100} ${cy + 200} ${cx} ${cy + 240}C${cx - 100} ${cy + 200} ${cx - 190} ${cy + 130} ${cx - 190} ${cy + 10}V${cy - 150}C${cx - 150} ${cy - 150} ${cx - 70} ${cy - 160} ${cx} ${cy - 210}Z`
  const ring = Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 7; return [cx + Math.cos(a) * 340, cy + Math.sin(a) * 240] })
  return `${glow(`<path d="${shield}" fill="${BLUE}"/>`)}
    <ellipse cx="${cx}" cy="${cy}" rx="340" ry="240" fill="none" stroke="${SKY}" stroke-opacity="0.4" stroke-width="1.4" stroke-dasharray="3 10"/>
    <ellipse cx="${cx}" cy="${cy}" rx="440" ry="316" fill="none" stroke="${ICE}" stroke-opacity="0.14" stroke-width="1.2"/>
    <path d="${shield}" fill="url(#glass)" stroke="url(#edge)" stroke-width="2.4"/>
    <path d="M${cx} ${cy - 160}C${cx + 56} ${cy - 124} ${cx + 118} ${cy - 118} ${cx + 144} ${cy - 118}V${cy + 6}C${cx + 144} ${cy + 100} ${cx + 76} ${cy + 156} ${cx} ${cy + 186}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1.6"/>
    <path d="M${cx - 80} ${cy + 6}L${cx - 22} ${cy + 66}L${cx + 88} ${cy - 62}" fill="none" stroke="${BLUE}" stroke-opacity="0.55" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" filter="url(#b8)"/>
    <path d="M${cx - 80} ${cy + 6}L${cx - 22} ${cy + 66}L${cx + 88} ${cy - 62}" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    ${ring.map(([x, y], i) => i === 1
      ? `<circle cx="${f(x)}" cy="${f(y)}" r="46" fill="${ROSE}" opacity="0.4" filter="url(#b20)"/><circle cx="${f(x)}" cy="${f(y)}" r="22" fill="#2A0A18" stroke="${ROSE}" stroke-width="2.6"/><path d="M${f(x - 8)} ${f(y - 8)}L${f(x + 8)} ${f(y + 8)}M${f(x + 8)} ${f(y - 8)}L${f(x - 8)} ${f(y + 8)}" stroke="${ROSE}" stroke-width="3.4" stroke-linecap="round"/>`
      : `<circle cx="${f(x)}" cy="${f(y)}" r="40" fill="${BLUE}" opacity="0.22" filter="url(#b20)"/><circle cx="${f(x)}" cy="${f(y)}" r="19" fill="url(#glass)" stroke="url(#edge)" stroke-width="2"/><circle cx="${f(x)}" cy="${f(y)}" r="6" fill="${ICE}"/>`).join('')}`
}

/** Meu site está no ar: painel de vidro com gráfico em alta, indicador "ao vivo" e radar de visitas. */
function sceneLive() {
  const x = 430, y = 230, w = 740, h = 430
  const pts = [[0, 330], [90, 300], [170, 320], [260, 250], [350, 270], [440, 190], [530, 210], [620, 120], [700, 70]]
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${x + 20 + px} ${y + py}`).join('')
  const smooth = `M${x + 20} ${y + 330}C${x + 120} ${y + 330} ${x + 150} ${y + 300} ${x + 210} ${y + 270}S${x + 330} ${y + 280} ${x + 400} ${y + 215}S${x + 520} ${y + 215} ${x + 590} ${y + 140}S${x + 660} ${y + 80} ${x + 720} ${y + 70}`
  void d
  return `${glow(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="${BLUE}"/>`)}
    <g transform="translate(1240 220)"><circle r="150" fill="none" stroke="${SKY}" stroke-opacity="0.16" stroke-width="1.2"/><circle r="105" fill="none" stroke="${SKY}" stroke-opacity="0.24" stroke-width="1.2"/><circle r="62" fill="none" stroke="${SKY}" stroke-opacity="0.34" stroke-width="1.2"/>
      <path d="M0 0L150 0A150 150 0 0 0 106 -106Z" fill="${CYAN}" opacity="0.18"/>${node(0, 0, 8, CYAN)}${node(78, -62, 5)}${node(-96, 40, 4, VIOLET)}${node(34, 112, 4)}</g>
    ${glassRect(x, y, w, h, 30)}
    <path d="M${x} ${y + 64}H${x + w}" stroke="${ICE}" stroke-opacity="0.18"/>
    <circle cx="${x + 38}" cy="${y + 32}" r="6" fill="${ICE}" opacity="0.5"/><circle cx="${x + 62}" cy="${y + 32}" r="6" fill="${ICE}" opacity="0.3"/>
    <g transform="translate(${x + w - 120} ${y + 32})"><circle r="16" fill="#3DE08A" opacity="0.4" filter="url(#b8)"/><circle r="6" fill="#3DE08A"/><rect x="16" y="-4" width="64" height="8" rx="4" fill="#fff" opacity="0.7"/></g>
    <g>${[0, 1, 2].map((i) => `<rect x="${x + 40 + i * 226}" y="${y + 92}" width="206" height="74" rx="16" fill="#fff" fill-opacity="0.06" stroke="${ICE}" stroke-opacity="0.2"/><rect x="${x + 58 + i * 226}" y="${y + 112}" width="${[84, 110, 70][i]}" height="12" rx="6" fill="#fff" opacity="0.75"/><rect x="${x + 58 + i * 226}" y="${y + 138}" width="56" height="8" rx="4" fill="${i === 1 ? CYAN : SKY}" opacity="0.8"/>`).join('')}</g>
    <g stroke="${ICE}" stroke-opacity="0.1">${[0, 1, 2, 3].map((i) => `<path d="M${x + 40} ${y + 220 + i * 52}H${x + w - 40}"/>`).join('')}</g>
    <path d="${smooth}L${x + 720} ${y + 400}H${x + 20}Z" fill="url(#area)" opacity="0.9"/>
    <path d="${smooth}" fill="none" stroke="${BLUE}" stroke-opacity="0.55" stroke-width="14" stroke-linecap="round" filter="url(#b8)"/>
    <path d="${smooth}" fill="none" stroke="url(#line)" stroke-width="4.5" stroke-linecap="round"/>
    ${node(x + 720, y + 70, 9)}
    <g transform="translate(${x + 720} ${y + 70})"><circle r="26" fill="none" stroke="${ICE}" stroke-opacity="0.6" stroke-width="1.6"/><circle r="44" fill="none" stroke="${ICE}" stroke-opacity="0.25" stroke-width="1.4"/></g>`
}

const COVERS = [
  { slug: 'por-que-ter-um-site-profissional', seed: 11, tint: BLUE, scene: sceneSite },
  { slug: 'como-escolher-web-designer', seed: 23, tint: VIOLET, scene: sceneDesign },
  { slug: 'quanto-custa-criar-um-site-profissional', seed: 37, tint: CYAN, scene: sceneCost },
  { slug: 'como-funciona-criacao-de-um-site', seed: 41, tint: BLUE, scene: sceneProcess },
  { slug: 'erros-ao-contratar-criacao-de-site', seed: 53, tint: VIOLET, scene: sceneErrors },
  { slug: 'o-que-fazer-depois-de-publicar-site', seed: 67, tint: CYAN, scene: sceneLive },
]

export const svgOf = (cover) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(cover.tint)}${backdrop(cover.seed, cover.tint)}${cover.scene()}${finish()}</svg>`

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('build-covers.mjs')) {
  const only = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  fs.mkdirSync(out, { recursive: true })
  const debug = process.argv.includes('--svg')
  if (debug) fs.mkdirSync(path.join(root, 'test-results'), { recursive: true })
  for (const cover of COVERS) {
    if (only.length && !only.includes(cover.slug)) continue
    const svg = svgOf(cover)
    if (debug) fs.writeFileSync(path.join(root, 'test-results', `${cover.slug}.svg`), svg)
    const info = await sharp(Buffer.from(svg), { density: 72 }).webp({ quality: 84, effort: 6 }).toFile(path.join(out, `${cover.slug}.webp`))
    console.log(`${cover.slug}.webp  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
  }
}
