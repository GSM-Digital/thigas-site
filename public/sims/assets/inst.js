/* Simulação · site institucional (empresa fictícia de engenharia) */
(function(Sim,d){'use strict';var $=Sim.$,$$=Sim.$$,esc=Sim.esc;
var ARROW='<svg><use href="#i-arrow"/></svg>',SECTOR_IC={'Indústria':'i-gear','Logística':'i-truck','Energia':'i-bolt'};
function art(c,cls,label){return'<div class="art '+c.art+' '+cls+' has-ic" '+(label?'role="img" aria-label="'+label+'"':'aria-hidden="true"')+'><svg class="art-ic" aria-hidden="true"><use href="#'+SECTOR_IC[c.sector]+'"/></svg></div>'}
var CASES=[
{id:'linha-embalagens',sector:'Indústria',art:'',title:'Nova linha de embalagens em 90 dias',client:'Indústria de alimentos · SP',metric:'+38%',metricLabel:'de capacidade',
 challenge:'A demanda cresceu mais rápido que a linha. A fábrica recusava pedidos no pico do ano.',solution:'Projeto executivo de uma segunda linha, com montagem em etapas para não parar a produção atual.',result:'Linha entregue em 90 dias, sem nenhuma hora de parada na operação existente.',
 stats:[['+38%','capacidade'],['0 h','de parada'],['90 dias','do projeto à entrega']],quote:'Ampliamos a fábrica sem desligar a fábrica.',role:'Gerente industrial'},
{id:'cd-automacao',sector:'Logística',art:'a-warm',title:'Centro de distribuição automatizado',client:'Operador logístico · MG',metric:'−42%',metricLabel:'no tempo de separação',
 challenge:'Separação manual, erros de expedição e horas extras constantes.',solution:'Esteiras com leitura automática e supervisório com indicadores por turno.',result:'Separação 42% mais rápida e erros de expedição quase zerados.',
 stats:[['−42%','tempo de separação'],['99,7%','acurácia'],['−60%','horas extras']],quote:'O supervisório virou a reunião diária da operação.',role:'Diretor de operações'},
{id:'subestacao',sector:'Energia',art:'a-green',title:'Retrofit de subestação industrial',client:'Metalúrgica · PR',metric:'−18%',metricLabel:'no consumo de energia',
 challenge:'Equipamentos antigos, quedas de energia e multas por fator de potência.',solution:'Retrofit dos painéis, correção do fator de potência e monitoramento remoto.',result:'Consumo 18% menor e nenhuma multa desde a entrega.',
 stats:[['−18%','consumo'],['0','multas'],['24/7','monitoramento']],quote:'A conta de energia caiu no primeiro mês.',role:'Gerente de manutenção'},
{id:'manutencao-preditiva',sector:'Indústria',art:'a-violet',title:'Manutenção preditiva em 40 máquinas',client:'Indústria têxtil · SC',metric:'+21%',metricLabel:'de disponibilidade',
 challenge:'Paradas não programadas a cada semana, sempre nas máquinas críticas.',solution:'Análise de vibração e termografia com plano de manutenção por criticidade.',result:'Disponibilidade 21% maior e paradas não programadas reduzidas a uma por trimestre.',
 stats:[['+21%','disponibilidade'],['−80%','paradas não programadas'],['40','máquinas monitoradas']],quote:'Paramos de apagar incêndio.',role:'Coordenadora de produção'},
{id:'armazem-frio',sector:'Logística',art:'a-ink',title:'Câmara fria com rastreabilidade total',client:'Distribuidora de alimentos · GO',metric:'100%',metricLabel:'dos lotes rastreados',
 challenge:'Perdas por variação de temperatura sem registro confiável.',solution:'Sensores por zona, alarmes automáticos e histórico por lote.',result:'Todos os lotes rastreados e perdas por temperatura praticamente zeradas.',
 stats:[['100%','lotes rastreados'],['−95%','perdas'],['5 min','tempo de alerta']],quote:'Hoje a auditoria dura uma manhã.',role:'Gerente de qualidade'},
{id:'solar',sector:'Energia',art:'a-warm',title:'Usina solar para autoconsumo',client:'Indústria plástica · SP',metric:'32%',metricLabel:'da energia gerada no local',
 challenge:'Custo de energia pressionando a margem de produtos de baixo valor.',solution:'Projeto e implantação de usina solar no telhado, integrada ao quadro geral.',result:'32% da energia passou a ser gerada no local, com retorno previsto em 4 anos.',
 stats:[['32%','energia própria'],['4 anos','retorno previsto'],['1.200 m²','de telhado']],quote:'Transformamos o telhado em ativo.',role:'Diretor financeiro'}];

function card(c){return'<li class="case-card" data-sector="'+esc(c.sector)+'"><a href="#/cases/'+c.id+'"><div class="art '+c.art+' case-art" aria-hidden="true"></div><div class="case-body"><span class="tag tag-neutral">'+esc(c.sector)+'</span><h3>'+esc(c.title)+'</h3><p class="case-metric"><b>'+esc(c.metric)+'</b> '+esc(c.metricLabel)+'</p><span class="link">Ver case'+ARROW+'</span></div></a></li>'}
$$('[data-cases]').forEach(function(ul){var n=ul.getAttribute('data-cases');ul.innerHTML=(n==='all'?CASES:CASES.slice(0,+n)).map(card).join('')});

/* filtro de cases */
var chips=$$('[data-filter]'),count=$('#case-count');
function filter(f){chips.forEach(function(c){c.setAttribute('aria-pressed',String(c.getAttribute('data-filter')===f))});var n=0;
$$('.cases-page .case-card').forEach(function(li){var on=f==='todos'||li.getAttribute('data-sector')===f;li.hidden=!on;if(on)n++});count.textContent=n+(n===1?' case':' cases')}
chips.forEach(function(c){c.addEventListener('click',function(){filter(c.getAttribute('data-filter'))})});filter('todos');

/* detalhe do case */
Sim.onRoute(function(r){if(r.pattern!=='/cases/:id')return;var i=CASES.findIndex(function(c){return c.id===r.params.id}),box=$('#case-detail');
if(i<0){box.innerHTML='<section class="phero"><h1 class="display h1">Case não encontrado.</h1><div class="actions"><a class="btn" href="#/cases">Ver todos os cases</a></div></section>';return}
var c=CASES[i],next=CASES[(i+1)%CASES.length];d.title=c.title+' · Sua empresa';
box.innerHTML='<nav class="crumbs" aria-label="Você está em"><a href="#/cases">Cases</a><span aria-hidden="true">/</span><span aria-current="page">'+esc(c.title)+'</span></nav>'+
'<header class="case-hd"><span class="tag tag-neutral">'+esc(c.sector)+'</span><h1 class="display h1">'+esc(c.title)+'</h1><p class="lead">'+esc(c.client)+'</p></header>'+
art(c,'case-cover','Ilustração do case')+
'<ul class="case-stats" role="list">'+c.stats.map(function(s){return'<li><b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></li>'}).join('')+'</ul>'+
'<div class="case-cols"><section><h2>Desafio</h2><p>'+esc(c.challenge)+'</p></section><section><h2>Solução</h2><p>'+esc(c.solution)+'</p></section><section><h2>Resultado</h2><p>'+esc(c.result)+'</p></section></div>'+
'<blockquote class="case-quote"><p>“'+esc(c.quote)+'”</p><footer>'+esc(c.role)+', '+esc(c.client.split(' · ')[0].toLowerCase())+'</footer></blockquote>'+
'<div class="case-next"><a class="next-card card" href="#/cases/'+next.id+'"><span class="eyebrow">Próximo case</span><strong>'+esc(next.title)+'</strong>'+ARROW+'</a><a class="btn btn-lg" href="#/contato">Quero um resultado assim</a></div>'});

/* contato: pré-seleção do assunto vinda dos serviços, máscara, validação, sucesso */
var form=$('#contact-form'),ok=$('#contact-ok');Sim.mask($('#c-tel'),'phone');
Sim.onRoute(function(r){if(r.path!=='/contato')return;if(r.query.assunto)$('#c-assunto').value=r.query.assunto});
Sim.form(form,function(f,data){var nome=String(data.get('nome')).trim().split(' ')[0];$('#contact-ok-t').textContent='Obrigado, '+nome+'. Retornamos no e-mail '+data.get('email')+' em até 1 dia útil.';form.hidden=true;ok.hidden=false;ok.focus()});
$('#contact-again').addEventListener('click',function(){Sim.reset(form);ok.hidden=true;form.hidden=false;$('#c-nome').focus()});

/* newsletter */
Sim.form($('#news'),function(f){Sim.reset(f);Sim.toast('Inscrição confirmada. Até a próxima novidade!')});

/* menu mobile */
var menu=Sim.panel($('#mnav'),$('#burger'),{focus:'a',onToggle:function(v){var b=$('#burger');$('use',b).setAttribute('href',v?'#i-x':'#i-menu');b.setAttribute('aria-label',v?'Fechar menu':'Menu')}});$('#burger').addEventListener('click',menu.toggle);

/* cabeçalho: sombra ao rolar */
var hd=$('.hd');addEventListener('scroll',function(){hd.classList.toggle('is-scrolled',scrollY>4)},{passive:true});

/* banner de cookies (LGPD): escolha guardada só nesta sessão */
var ck=$('#cookie'),opts=$('#cookie-opts'),cfg=$('#cookie-cfg'),saved=null;try{saved=sessionStorage.getItem('sim-cookie')}catch(e){}
function closeCookie(msg){ck.hidden=true;try{sessionStorage.setItem('sim-cookie','1')}catch(e){}if(msg)Sim.toast(msg)}
if(!saved)setTimeout(function(){ck.hidden=false},900);
cfg.addEventListener('click',function(){var open=opts.hidden;opts.hidden=!open;cfg.setAttribute('aria-expanded',String(open));cfg.textContent=open?'Salvar escolhas':'Configurar';if(!open)closeCookie('Preferências de cookies salvas.')});
$('#cookie-yes').addEventListener('click',function(){closeCookie('Cookies aceitos.')});
$('#cookie-no').addEventListener('click',function(){closeCookie('Somente cookies essenciais.')});
$$('[data-cookie-open]').forEach(function(b){b.addEventListener('click',function(){ck.hidden=false;opts.hidden=false;cfg.setAttribute('aria-expanded','true');cfg.textContent='Salvar escolhas';$('#ck-analytics').focus()})});

Sim.start({host:'suaempresa.com.br',name:'Sua empresa'});
})(Sim,document);
