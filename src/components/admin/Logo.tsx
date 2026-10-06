/** Marca na tela de login do painel: a mesma do cabeçalho do site, o nome com o ponto azul. */
export default function Logo() {
  return (
    <div className="tb-brand">
      <span className="tb-brand__lockup">
        <span className="tb-brand__dot" aria-hidden="true" />
        <span className="tb-brand__word">Thiago Barreto</span>
      </span>
      <span className="tb-brand__caption">Gerenciador de conteúdo do site</span>
    </div>
  )
}
