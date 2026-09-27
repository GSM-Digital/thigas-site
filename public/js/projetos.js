/* =====================================================================
   PROJETOS · é aqui que você anexa os seus cases.
   Como adicionar um projeto:
   1. Salve a imagem em img/projetos/ (formato .webp, ~1600 px de largura, proporção de tela de computador).
      Opcional: uma imagem do celular (vertical, ~750 px de largura) para o botão “Celular” aparecer no case.
   2. Copie um bloco { ... } abaixo, cole no topo da lista e preencha.
   3. Campos opcionais podem ficar vazios ('' ou []) — eles simplesmente não aparecem no site.

   Campos:
   id          identificador sem espaços nem acentos (ex.: 'minha-empresa')
   nome        nome do cliente/projeto
   tipo        'institucional' | 'landing' | 'contato' | 'ecommerce' | 'plataforma'
   origem      'independente' | '3ads'   (3ads = feito em parceria com a 3ADS)
   segmento    ex.: 'Seguros', 'Imobiliário'                          (opcional)
   ano         ex.: '2025'                                            (opcional)
   url         link do site no ar                                     (opcional)
   capa        imagem do computador, ex.: 'img/projetos/x.webp'
   mobile      imagem do celular                                      (opcional)
   ideia       o desafio/objetivo do projeto, em 1 a 3 frases          (opcional)
   feito       lista do que foi feito, ex.: ['Copy', 'Layout', 'Integração com CRM']   (opcional)
   resultado   o que mudou depois, com números só se forem reais     (opcional)
   depoimento  { texto:'', nome:'', cargo:'', foto:'' } ou null      (opcional; só use depoimentos reais e autorizados)
   destaque    true para aparecer primeiro
   ===================================================================== */
window.PROJETOS = [
  { id:'capadocia-marista', nome:'Capadócia Marista', tipo:'landing', origem:'3ads', segmento:'Imobiliário de alto padrão', ano:'', url:'https://capadociamarista.com.br/', capa:'img/projetos/capadocia-marista.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:true },
  { id:'gb4-seguros', nome:'GB4 Corretora de Seguros', tipo:'institucional', origem:'independente', segmento:'Seguros e consórcios', ano:'', url:'https://gb4.com.br/', capa:'img/projetos/gb4-seguros.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:true },
  { id:'comiva', nome:'Comiva', tipo:'institucional', origem:'3ads', segmento:'', ano:'', url:'https://comiva.com.br/', capa:'img/projetos/comiva.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:true },
  { id:'carlos-costa', nome:'Carlos Costa', tipo:'landing', origem:'independente', segmento:'', ano:'', url:'https://carloscosta.digital/', capa:'img/projetos/carlos-costa.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'residencial-hortensias', nome:'Residencial Hortênsias', tipo:'landing', origem:'independente', segmento:'Imobiliário', ano:'', url:'https://reshortensias.com.br/', capa:'img/projetos/residencial-hortensias.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'eq-seguros', nome:'EQ Seguros', tipo:'landing', origem:'3ads', segmento:'Seguros e crédito', ano:'', url:'https://produtos.eqseguros.com.br/', capa:'img/projetos/eq-seguros.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'arsenal-agentes-ia', nome:'Arsenal de Agentes de IA', tipo:'landing', origem:'independente', segmento:'Inteligência artificial', ano:'', url:'https://jpmelo.com.br/arsenal-de-agentes/', capa:'img/projetos/arsenal-agentes-ia.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'3ads', nome:'3ADS', tipo:'institucional', origem:'independente', segmento:'Marketing digital', ano:'', url:'https://3ads.com.br/', capa:'img/projetos/3ads.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'murilo-budaz-imoveis', nome:'Murilo Budaz Imóveis', tipo:'landing', origem:'independente', segmento:'Imobiliário', ano:'', url:'https://budaz.com.br/imoveis/', capa:'img/projetos/murilo-budaz-imoveis.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'krav-maga-asa-sul', nome:'Krav Maga Asa Sul', tipo:'contato', origem:'independente', segmento:'Defesa pessoal', ano:'', url:'https://www.kravmagaasasul.com.br/contato', capa:'img/projetos/krav-maga-asa-sul.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'avus-motorsports', nome:'Avus Motorsports', tipo:'contato', origem:'3ads', segmento:'Automotivo', ano:'', url:'https://avusmotorsports.com.br/contato/', capa:'img/projetos/avus-motorsports.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false },
  { id:'grupo-cesar', nome:'Grupo Cesar', tipo:'contato', origem:'3ads', segmento:'', ano:'', url:'https://servicos.grupocesar.com.br/contatos', capa:'img/projetos/grupo-cesar.webp', mobile:'', ideia:'', feito:[], resultado:'', depoimento:null, destaque:false }
];
