/* Simulação · portal do cliente com login por usuário e senha (qualquer valor), garantias/seguro, benefícios, documentos, suporte e assistente de IA.
Todo o estado vive nesta aba (sessionStorage). Nada é enviado; arquivos escolhidos não são lidos. */
(function(Sim,d){'use strict';var $=Sim.$,$$=Sim.$$,esc=Sim.esc,money=Sim.money;
var TODAY=new Date(),fmtD=function(dt){return dt.toLocaleDateString('pt-BR')},num=function(n){return n.toLocaleString('pt-BR')};
var GOLD=1500,END=new Date(2027,2,12);
var REWARDS=[{id:'limpeza',name:'Kit de limpeza e cuidado',cost:300,desc:'Estojo, escova e pastilhas de limpeza.',ic:'i-gift'},{id:'frete',name:'Frete grátis por 3 meses',cost:400,desc:'Em qualquer compra de acessórios.',ic:'i-gift'},{id:'cupom50',name:'R$ 50 em acessórios',cost:500,desc:'Cupom válido por 60 dias.',ic:'i-gift'},{id:'revisao',name:'Revisão gratuita',cost:800,desc:'Limpeza e ajuste completos.',ic:'i-cal'},{id:'seguro1',name:'1 mês de seguro grátis',cost:900,desc:'Aplicado na próxima mensalidade.',ic:'i-shield'},{id:'upgrade',name:'Upgrade para Modelo Pro 3',cost:5000,desc:'Troca pelo modelo mais novo.',ic:'i-star'}];
var PLANS={essencial:{name:'Essencial',price:19.9,cover:['Perda e roubo','Assistência por telefone']},completo:{name:'Completo',price:29.9,cover:['Perda e roubo','Quebra acidental','Substituição em até 48 h','Assistência por telefone']}};
var DEF={auth:false,user:'',points:1280,ins:null,banner:true,revs:[{d:'02/09/2026',s:'Realizada'},{d:'05/03/2026',s:'Realizada'}],redeemed:{},
hist:[{t:'Compra de acessórios',v:120,d:'Hoje'},{t:'Avaliação do atendimento',v:50,d:'15/09/2026'},{t:'Revisão em dia',v:100,d:'02/09/2026'},{t:'Resgate: kit de limpeza',v:-300,d:'10/07/2026'}],
activity:[{ic:'i-gift',t:'+120 pontos creditados',s:'Compra de acessórios',d:'Hoje'},{ic:'i-doc',t:'Nota fiscal disponível',s:'Documentos',d:'Ontem'},{ic:'i-cal',t:'Revisão realizada',s:'Garantias',d:'02/09/2026'}],
docs:[{id:1,n:'Nota fiscal · Modelo Pro 2',t:'Nota fiscal',d:'12/03/2024',size:'184 KB'},{id:2,n:'Certificado de garantia',t:'Garantia',d:'12/03/2024',size:'96 KB'},{id:3,n:'Nota fiscal · acessórios',t:'Nota fiscal',d:'25/09/2026',size:'142 KB'},{id:4,n:'Manual do usuário · Modelo Pro 2',t:'Outros',d:'12/03/2024',size:'2,1 MB'}],
tickets:[{n:318,title:'Dúvida sobre a garantia',cat:'Garantia',status:'Em andamento',d:'22/09/2026',msgs:[{me:true,t:'A garantia cobre a troca da bateria?'},{me:false,t:'Oi, seu-nome! Cobre, sim, se o defeito for de fabricação. Pode trazer o equipamento na próxima revisão ou abrir uma coleta.'}]},{n:312,title:'Troca do filtro',cat:'Funcionamento do equipamento',status:'Resolvido',d:'03/08/2026',msgs:[{me:true,t:'O filtro precisa ser trocado?'},{me:false,t:'Trocamos na revisão de hoje. Está tudo certo.'}]}],chat:[]};
var S;try{S=JSON.parse(sessionStorage.getItem('portal-state'))}catch(e){}if(!S)S=JSON.parse(JSON.stringify(DEF));
function save(){try{sessionStorage.setItem('portal-state',JSON.stringify(S))}catch(e){}}
function log(ic,t,s){S.activity.unshift({ic:ic,t:t,s:s,d:'Agora'});S.activity=S.activity.slice(0,6)}
var app=$('#app');

/* ---------- vínculos de dados (pontos, seguro) ---------- */
function binds(){var left=GOLD-S.points;
$$('[data-bind=points]').forEach(function(e){e.textContent=num(S.points)});
$$('[data-bind="points-left"]').forEach(function(e){e.textContent=left>0?'Faltam '+num(left)+' pontos para o nível Ouro':'Você chegou ao nível Ouro!'});
$$('[data-bind-bar=points]').forEach(function(b){b.setAttribute('aria-valuenow',S.points);$('i',b).style.width=Math.min(100,S.points/GOLD*100)+'%'});
$$('[data-bind="ins-status"]').forEach(function(e){e.textContent=S.ins?'Ativo':'Não contratado'});
$$('[data-bind="ins-sub"]').forEach(function(e){e.textContent=S.ins?'Plano '+S.ins.plan+' · '+money(S.ins.price)+'/mês':'Proteja contra perda, roubo e quebra'});
$$('[data-bind-link=ins]').forEach(function(a){a.textContent=S.ins?'Ver apólice':'Contratar agora'});
$$('[data-bind="ins-tag"]').forEach(function(e){e.className='tag '+(S.ins?'tag-ok':'tag-warn');e.textContent=S.ins?'Seguro ativo':'Sem seguro'});
$('#ai-banner').hidden=!S.banner;
$('#activity').innerHTML=S.activity.map(function(a){return'<li><span class="a-ic"><svg aria-hidden="true"><use href="#'+a.ic+'"/></svg></span><div><b>'+esc(a.t)+'</b><small>'+esc(a.s)+'</small></div><time>'+esc(a.d)+'</time></li>'}).join('')}
$('#banner-x').addEventListener('click',function(){S.banner=false;save();binds();$('.hello h1').focus()});

/* ---------- guarda de rotas e visibilidade do app ---------- */
Sim.onRoute(function(r){var login=r.path==='/entrar';app.hidden=login;d.documentElement.classList.toggle('in-app',!login);
if(!S.auth&&!login){setTimeout(function(){Sim.go('/entrar',{replace:true})});return}
if(S.auth&&login){setTimeout(function(){Sim.go('/',{replace:true})});return}
closeSide();closeNotif();binds()});

/* ---------- login: usuário e senha (qualquer valor entra; nada é enviado nem guardado) ---------- */
var fl=$('#f-login'),pw=$('#lp'),pwt=$('#pw-toggle');
pwt.addEventListener('click',function(){var show=pw.type==='password';pw.type=show?'text':'password';pwt.setAttribute('aria-pressed',String(show));$('.sr-only',pwt).textContent=show?'Ocultar senha':'Mostrar senha';pw.focus()});
$('#forgot').addEventListener('click',function(){Sim.toast('Simulação: nesta demonstração, qualquer senha funciona.')});
Sim.form(fl,function(){var u=$('#lu').value.trim();S.user=u;S.auth=true;pw.type='password';pwt.setAttribute('aria-pressed','false');save();Sim.go('/',{replace:true});Sim.toast('Boas-vindas de volta, seu-nome.')});
$('#logout').addEventListener('click',function(){S.auth=false;save();Sim.go('/entrar',{replace:true});Sim.toast('Você saiu do portal.')});

/* ---------- menu lateral (mobile) ---------- */
var sideOpen=false,side=$('#side'),scrim=$('#scrim'),burger=$('#burger'),mq=matchMedia('(min-width: 60em)');
function setSide(v){sideOpen=v&&!mq.matches;app.classList.toggle('side-open',sideOpen);scrim.hidden=!sideOpen;burger.setAttribute('aria-expanded',String(sideOpen));d.documentElement.classList.toggle('lock',sideOpen);if('inert'in side)side.inert=!mq.matches&&!sideOpen;if(sideOpen)$('.side-nav a').focus()}
function closeSide(){if(sideOpen){setSide(false);burger.focus()}}
burger.addEventListener('click',function(){setSide(!sideOpen)});$('#side-x').addEventListener('click',closeSide);scrim.addEventListener('click',closeSide);
mq.addEventListener('change',function(){setSide(false)});setSide(false);
Sim.onEscape(function(){if(sideOpen){closeSide();return true}return false});

/* ---------- notificações ---------- */
var nb=$('#notif-btn'),np=$('#notif');
function setNotif(v){np.classList.toggle('is-open',v);nb.setAttribute('aria-expanded',String(v))}
function closeNotif(){setNotif(false)}
nb.addEventListener('click',function(e){e.stopPropagation();setNotif(!np.classList.contains('is-open'))});
d.addEventListener('click',function(e){if(!e.target.closest('.notif'))closeNotif()});
Sim.onEscape(function(){if(np.classList.contains('is-open')){closeNotif();nb.focus();return true}return false});
$('#notif-read').addEventListener('click',function(){$$('#notif-list .unread').forEach(function(li){li.classList.remove('unread')});$('#notif-dot').hidden=true;nb.setAttribute('aria-label','Notificações, nenhuma não lida');Sim.toast('Notificações marcadas como lidas.')});

/* busca do topo → documentos */
$('#top-search').addEventListener('submit',function(e){e.preventDefault();var v=$('#ts').value.trim();Sim.go('/documentos'+(v?'?q='+encodeURIComponent(v):''))});

/* ---------- modal ---------- */
var modal=$('#modal'),mBody=$('#modal-body');
function openModal(html,bind){mBody.innerHTML=html;if(bind)bind(mBody);modal.showModal();var f=$('.btn',mBody)||$('#modal-x');f.focus()}
function closeModal(){modal.close()}
$('#modal-x').addEventListener('click',closeModal);modal.addEventListener('click',function(e){if(e.target===modal)closeModal()});
Sim.onEscape(function(){if(modal.open){closeModal();return true}return false});
function docPreview(title,rows){return'<p class="eyebrow">Pré-visualização</p><h2 id="modal-t" class="m-t">'+esc(title)+'</h2><div class="paper"><div class="paper-hd"><i class="mark"></i><span>Sua empresa · Portal do cliente</span></div><dl>'+rows.map(function(r){return'<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>'}).join('')+'</dl><i class="ph" style="--w:90%"></i><i class="ph" style="--w:75%"></i><i class="ph" style="--w:82%"></i></div><div class="m-act"><button class="btn" type="button" data-dl><svg><use href="#i-down"/></svg>Baixar PDF</button></div>'}
function bindDl(root){$$('[data-dl]',root).forEach(function(b){b.addEventListener('click',function(){Sim.toast('Download simulado.')})})}

/* ---------- garantias e seguro ---------- */
$('#cert-btn').addEventListener('click',function(){openModal(docPreview('Certificado de garantia',[['Cliente','seu-nome'],['Equipamento','Modelo Pro 2'],['Nº de série','SN-48213-PRO2'],['Vigência','12/03/2024 a 12/03/2027']]),bindDl)});
function drawIns(){var box=$('#ins-box');
if(S.ins){var p=PLANS[S.ins.key];box.innerHTML='<div class="w-hd"><div><p class="eyebrow">Seguro do equipamento</p><h2>Plano '+esc(p.name)+'</h2></div><span class="tag tag-ok">Ativo</span></div><dl class="policy"><div><dt>Apólice</dt><dd>'+esc(S.ins.n)+'</dd></div><div><dt>Mensalidade</dt><dd>'+money(p.price)+'</dd></div><div><dt>Desde</dt><dd>'+esc(S.ins.since)+'</dd></div></dl><ul class="cover" role="list">'+p.cover.map(function(c){return'<li><svg aria-hidden="true"><use href="#i-check"/></svg>'+esc(c)+'</li>'}).join('')+'</ul><div class="w-act"><button class="btn btn-ghost" type="button" id="pol-btn"><svg><use href="#i-eye"/></svg>Ver apólice</button><button class="link danger" type="button" id="cancel-ins">Cancelar seguro</button></div>';
$('#pol-btn').addEventListener('click',function(){openModal(docPreview('Apólice '+S.ins.n,[['Segurado','seu-nome'],['Plano',p.name],['Mensalidade',money(p.price)],['Início',S.ins.since]]),bindDl)});
$('#cancel-ins').addEventListener('click',function(){openModal('<h2 id="modal-t" class="m-t">Cancelar o seguro?</h2><p class="muted">O equipamento fica sem cobertura para perda, roubo e quebra a partir de hoje.</p><div class="m-act"><button class="btn" type="button" id="keep">Manter seguro</button><button class="btn btn-ghost danger" type="button" id="do-cancel">Cancelar seguro</button></div>',function(m){$('#keep',m).addEventListener('click',closeModal);$('#do-cancel',m).addEventListener('click',function(){S.ins=null;log('i-shield','Seguro cancelado','Garantias e seguro');save();closeModal();drawIns();binds();Sim.toast('Seguro cancelado.')})})});return}
box.innerHTML='<div class="w-hd"><div><p class="eyebrow">Seguro do equipamento</p><h2>Proteja seu Modelo Pro 2</h2></div><span class="tag tag-warn">Sem seguro</span></div><form id="ins-form"><fieldset class="plans"><legend class="sr-only">Escolha o plano</legend>'+Object.keys(PLANS).map(function(k,i){var p=PLANS[k];return'<label class="plan'+(k==='completo'?' rec':'')+'"><input type="radio" name="plan" value="'+k+'"'+(k==='completo'?' checked':'')+' required>'+(k==='completo'?'<span class="rec-tag">Recomendado</span>':'')+'<span class="plan-n">'+p.name+'</span><span class="plan-p"><b>'+money(p.price)+'</b>/mês</span><ul role="list">'+p.cover.map(function(c){return'<li><svg aria-hidden="true"><use href="#i-check"/></svg>'+c+'</li>'}).join('')+'</ul></label>';void i}).join('')+'</fieldset><label class="check"><input type="checkbox" id="ins-terms" required><span>Li e aceito as condições gerais do seguro.</span></label><button class="btn btn-lg" type="submit">Contratar seguro</button></form>';
Sim.form($('#ins-form'),function(f){var k=$('input[name=plan]:checked',f).value,p=PLANS[k];S.ins={key:k,plan:p.name,price:p.price,n:'2026-'+String(40+Math.floor(Math.random()*50)).padStart(4,'0'),since:fmtD(TODAY)};S.points+=100;S.hist.unshift({t:'Contratação do seguro',v:100,d:'Hoje'});log('i-shield','Seguro '+p.name+' contratado','+100 pontos de bônus');save();drawIns();binds();Sim.toast('Seguro '+p.name+' contratado. Você ganhou 100 pontos.');$('#ins-box h2').setAttribute('tabindex','-1');$('#ins-box h2').focus()})}
function drawRevs(){$('#rev-list').innerHTML=S.revs.map(function(r){return'<li><span class="a-ic"><svg aria-hidden="true"><use href="#i-cal"/></svg></span><b>'+esc(r.d)+'</b><span class="tag '+(r.s==='Agendada'?'tag-info':'tag-neutral')+'">'+esc(r.s)+'</span></li>'}).join('')}
var rd=$('#rev-date');var min=new Date(TODAY.getTime()+86400000);rd.min=min.toISOString().slice(0,10);
Sim.form($('#rev-form'),function(f){var p=rd.value.split('-'),dt=p[2]+'/'+p[1]+'/'+p[0];S.revs.unshift({d:dt,s:'Agendada'});log('i-cal','Revisão agendada',dt);save();Sim.reset(f);drawRevs();Sim.toast('Revisão agendada para '+dt+'.')});

/* ---------- benefícios ---------- */
function drawRewards(){$('#rewards').innerHTML=REWARDS.map(function(r){var done=S.redeemed[r.id],can=S.points>=r.cost;return'<li class="reward card'+(done?' done':'')+'"><span class="r-ic"><svg aria-hidden="true"><use href="#'+r.ic+'"/></svg></span><h3>'+esc(r.name)+'</h3><p class="muted">'+esc(r.desc)+'</p><div class="r-foot"><b>'+num(r.cost)+' pts</b>'+(done?'<span class="tag tag-ok">Resgatado</span>':'<button class="btn btn-sm'+(can?'':' btn-ghost')+'" type="button" data-redeem="'+r.id+'"'+(can?'':' aria-disabled="true"')+'>'+(can?'Resgatar':'Faltam '+num(r.cost-S.points))+'</button>')+'</div></li>'}).join('');
$$('[data-redeem]').forEach(function(b){b.addEventListener('click',function(){if(b.getAttribute('aria-disabled')==='true'){Sim.toast('Pontos insuficientes para esta recompensa.');return}var r=REWARDS.filter(function(x){return x.id===b.getAttribute('data-redeem')})[0];
openModal('<h2 id="modal-t" class="m-t">Resgatar '+esc(r.name.toLowerCase())+'?</h2><p class="muted">Serão usados <b>'+num(r.cost)+' pontos</b>. Saldo após o resgate: '+num(S.points-r.cost)+' pontos.</p><div class="m-act"><button class="btn" type="button" id="ok-r">Confirmar resgate</button><button class="btn btn-ghost" type="button" id="no-r">Agora não</button></div>',function(m){$('#no-r',m).addEventListener('click',closeModal);$('#ok-r',m).addEventListener('click',function(){S.points-=r.cost;S.redeemed[r.id]=true;S.hist.unshift({t:'Resgate: '+r.name.toLowerCase(),v:-r.cost,d:'Hoje'});log('i-gift','Recompensa resgatada',r.name);save();closeModal();drawRewards();drawHist();binds();Sim.toast(r.name+' resgatado.')})})})})}
function drawHist(){$('#pts-hist').innerHTML=S.hist.map(function(h){return'<li><div><b>'+esc(h.t)+'</b><small>'+esc(h.d)+'</small></div><span class="'+(h.v>0?'plus':'minus')+'">'+(h.v>0?'+':'−')+num(Math.abs(h.v))+'</span></li>'}).join('')}

/* ---------- documentos ---------- */
var docFilter='Todos';var TYPES=['Todos','Nota fiscal','Garantia','Seguro','Outros','Enviados'];
function allDocs(){var l=S.docs.slice();if(S.ins)l.unshift({id:99,n:'Apólice do seguro '+S.ins.n,t:'Seguro',d:S.ins.since,size:'88 KB'});return l}
function drawDocs(){var q=$('#doc-q').value.trim().toLowerCase(),list=allDocs().filter(function(x){return(docFilter==='Todos'||x.t===docFilter)&&(!q||x.n.toLowerCase().indexOf(q)>-1)});
$('#doc-chips').innerHTML=TYPES.map(function(t){return'<button class="chip" type="button" aria-pressed="'+(t===docFilter)+'" data-type="'+t+'">'+t+'</button>'}).join('');
$$('[data-type]').forEach(function(b){b.addEventListener('click',function(){docFilter=b.getAttribute('data-type');drawDocs();$('[data-type="'+docFilter+'"]').focus()})});
$('#docs').innerHTML=list.map(function(x){return'<li><span class="a-ic"><svg aria-hidden="true"><use href="#i-doc"/></svg></span><div class="doc-main"><b>'+esc(x.n)+'</b><small>'+esc(x.d)+' · '+esc(x.size)+'</small></div><span class="tag tag-neutral">'+esc(x.t)+'</span><div class="doc-act"><button class="icon-btn" type="button" data-view="'+x.id+'" aria-label="Visualizar '+esc(x.n)+'"><svg><use href="#i-eye"/></svg></button><button class="icon-btn" type="button" data-down aria-label="Baixar '+esc(x.n)+'"><svg><use href="#i-down"/></svg></button></div></li>'}).join('');
$('#docs-empty').hidden=!!list.length;
$$('[data-down]').forEach(function(b){b.addEventListener('click',function(){Sim.toast('Download simulado.')})});
$$('[data-view]').forEach(function(b){b.addEventListener('click',function(){var x=allDocs().filter(function(y){return String(y.id)===b.getAttribute('data-view')})[0];openModal(docPreview(x.n,[['Cliente','seu-nome'],['Tipo',x.t],['Data',x.d],['Tamanho',x.size]]),bindDl)})})}
$('#doc-q').addEventListener('input',drawDocs);
$('#upload').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var kb=f.size/1024,size=kb>1024?(kb/1024).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(kb))+' KB';S.docs.unshift({id:Date.now(),n:f.name,t:'Enviados',d:fmtD(TODAY),size:size});log('i-up','Documento enviado',f.name);save();docFilter='Todos';drawDocs();e.target.value='';Sim.toast('Documento adicionado. Ele fica só nesta simulação.')});
$('#upload').parentNode.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#upload').click()}});$('#upload').parentNode.tabIndex=0;

/* ---------- suporte ---------- */
function drawTickets(openN){$('#tickets').innerHTML=S.tickets.map(function(t){var cls=t.status==='Resolvido'?'tag-neutral':t.status==='Aberto'?'tag-info':'tag-warn';return'<li><details class="ticket card"'+(t.n===openN?' open':'')+'><summary><span class="t-n">#'+t.n+'</span><span class="t-main"><b>'+esc(t.title)+'</b><small>'+esc(t.cat)+' · '+esc(t.d)+'</small></span><span class="tag '+cls+'">'+esc(t.status)+'</span></summary><div class="t-body"><ul class="msgs" role="list">'+t.msgs.map(function(m){return'<li class="'+(m.me?'me':'them')+'"><small>'+(m.me?'Você':'Suporte')+'</small><p>'+esc(m.t)+'</p></li>'}).join('')+'</ul>'+(t.status!=='Resolvido'?'<form class="reply" data-reply="'+t.n+'"><label class="sr-only" for="rp-'+t.n+'">Responder ao chamado '+t.n+'</label><input class="input" id="rp-'+t.n+'" required placeholder="Escreva uma resposta"><button class="btn" type="submit">Enviar</button></form>':'')+'</div></details></li>'}).join('');
$$('[data-reply]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var inp=$('input',f),v=inp.value.trim();if(!v){inp.setAttribute('aria-invalid','true');inp.focus();return}var t=S.tickets.filter(function(x){return String(x.n)===f.getAttribute('data-reply')})[0];t.msgs.push({me:true,t:v});save();drawTickets(t.n);$('#rp-'+t.n).focus();
setTimeout(function(){t.msgs.push({me:false,t:'Recebemos sua mensagem, seu-nome. Um especialista responde em instantes.'});if(t.status==='Aberto')t.status='Em andamento';save();var had=d.activeElement&&d.activeElement.id;drawTickets(t.n);if(had&&d.getElementById(had))d.getElementById(had).focus()},Sim.reduce?0:1200)})})}
var tBox=$('#ticket-box');function openTicket(){tBox.hidden=false;$('#tf-t').focus()}
$('#new-ticket').addEventListener('click',openTicket);$('#tk-cancel').addEventListener('click',function(){Sim.reset($('#ticket-form'));tBox.hidden=true;$('#new-ticket').focus()});
Sim.form($('#ticket-form'),function(f){var n=Math.max.apply(null,S.tickets.map(function(t){return t.n}))+1;S.tickets.unshift({n:n,title:$('#tk-title').value,cat:$('#tk-cat').value,status:'Aberto',d:fmtD(TODAY),msgs:[{me:true,t:$('#tk-desc').value}]});log('i-help','Chamado #'+n+' aberto',$('#tk-title').value);save();Sim.reset(f);tBox.hidden=true;drawTickets(n);Sim.toast('Chamado #'+n+' aberto. Acompanhe por aqui.');var s=$('#tickets summary');if(s)s.focus()});

/* ---------- assistente de IA (respostas a partir do estado da sessão) ---------- */
var logEl=$('#chat-log');
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function act(href,label){return'<a class="chat-act" href="'+href+'">'+label+'<svg aria-hidden="true"><use href="#i-arrow"/></svg></a>'}
function answer(q){var t=norm(q),months=Math.max(0,Math.round((END-TODAY)/(30.4*86400000))),left=GOLD-S.points;
if(/garant|valid|certificad/.test(t))return'Sim. A garantia do seu <b>Modelo Pro 2</b> está ativa até <b>12/03/2027</b>, cerca de '+months+' meses. Ela cobre defeitos de fabricação.'+act('#/garantias','Ver garantia e certificado');
if(/segur|apolice|roub|perd|quebr/.test(t))return S.ins?'Seu seguro <b>'+esc(S.ins.plan)+'</b> está ativo (apólice '+esc(S.ins.n)+'), por '+money(S.ins.price)+' por mês. Cobre '+PLANS[S.ins.key].cover.slice(0,3).join(', ').toLowerCase()+'.'+act('#/garantias#seguro','Ver apólice'):'Você ainda não tem seguro. O plano <b>Completo</b> cobre perda, roubo e quebra acidental por '+money(PLANS.completo.price)+' por mês, e a contratação rende 100 pontos.'+act('#/garantias#seguro','Contratar seguro');
if(/pont|bonus|benefic|resgat|recompens|ouro/.test(t)){var ok=REWARDS.filter(function(r){return!S.redeemed[r.id]&&r.cost<=S.points});return'Você tem <b>'+num(S.points)+' pontos</b>. '+(left>0?'Faltam '+num(left)+' para o nível Ouro. ':'Você já é nível Ouro! ')+(ok.length?'Dá para resgatar: '+ok.slice(0,3).map(function(r){return/^[A-ZÀ-Ú][a-zà-ú]/.test(r.name)?r.name.charAt(0).toLowerCase()+r.name.slice(1):r.name}).join(', ')+'.':'Ainda não há recompensas disponíveis para esse saldo.')+act('#/beneficios','Ver recompensas')}
if(/nota|fiscal|document|nf\b|manual/.test(t))return'Sua <b>nota fiscal</b> do Modelo Pro 2 (12/03/2024) e o manual estão em Documentos. Você pode visualizar ou baixar por lá.'+act('#/documentos?q=nota','Abrir documentos');
if(/revis|manuten|agend|limpez/.test(t))return'Sua última revisão foi em <b>'+esc((S.revs.filter(function(r){return r.s==='Realizada'})[0]||{d:'—'}).d)+'</b>. O ideal é uma a cada seis meses.'+act('#/garantias','Agendar revisão');
if(/chamad|suport|defeit|problem|nao funcion|quebrou|ajuda|atendent/.test(t)){var open=S.tickets.filter(function(x){return x.status!=='Resolvido'});return'Sinto muito pelo problema. '+(open.length?'Você tem '+open.length+' chamado'+(open.length>1?'s':'')+' em andamento (#'+open.map(function(x){return x.n}).join(', #')+'). ':'')+'Posso abrir um novo agora.'+act('#/suporte?novo=1','Abrir chamado')}
if(/^(oi|ola|bom dia|boa tarde|boa noite|e ai)/.test(t))return'Olá, seu-nome! Posso consultar sua garantia, seguro, pontos, documentos e chamados. O que você precisa?';
if(/obrigad|valeu|brigad/.test(t))return'Por nada! Se precisar, é só chamar.';
return'Ainda estou aprendendo sobre isso. Por enquanto, posso ajudar com <b>garantia</b>, <b>seguro</b>, <b>pontos</b>, <b>documentos</b>, <b>revisões</b> ou <b>chamados</b>.'}
function bubble(m){return'<div class="msg '+(m.me?'me':'ai')+'">'+(m.me?'':'<span class="m-av" aria-hidden="true"><svg><use href="#i-spark"/></svg></span>')+'<div class="m-b">'+(m.me?esc(m.t):m.t)+'</div></div>'}
function drawChat(){if(!S.chat.length)S.chat.push({me:false,t:'Olá, seu-nome! Sou o assistente do portal. Posso consultar sua <b>garantia</b>, <b>seguro</b>, <b>pontos</b>, <b>documentos</b> e <b>chamados</b>.'});logEl.innerHTML=S.chat.map(bubble).join('');logEl.scrollTop=logEl.scrollHeight}
function send(q){q=q.trim();if(!q)return;S.chat.push({me:true,t:q});save();drawChat();var typing=d.createElement('div');typing.className='msg ai typing';typing.innerHTML='<span class="m-av" aria-hidden="true"><svg><use href="#i-spark"/></svg></span><div class="m-b"><i></i><i></i><i></i><span class="sr-only">Digitando</span></div>';logEl.appendChild(typing);logEl.scrollTop=logEl.scrollHeight;
setTimeout(function(){S.chat.push({me:false,t:answer(q)});save();drawChat()},Sim.reduce?0:750)}
$('#chat-form').addEventListener('submit',function(e){e.preventDefault();var i=$('#chat-q');send(i.value);i.value='';i.focus()});
$$('#chat-sugg .chip').forEach(function(c){c.addEventListener('click',function(){send(c.textContent);$('#chat-q').focus()})});

/* ---------- desenho por rota ---------- */
Sim.onRoute(function(r){if(!S.auth)return;
if(r.path==='/garantias'){drawIns();drawRevs()}
if(r.path==='/beneficios'){drawRewards();drawHist()}
if(r.path==='/documentos'){$('#doc-q').value=r.query.q||'';if(r.query.q)docFilter='Todos';drawDocs()}
if(r.path==='/suporte'){drawTickets();tBox.hidden=!r.query.novo;if(r.query.novo)setTimeout(function(){$('#tf-t').focus()},50)}
if(r.path==='/assistente'){drawChat();setTimeout(function(){$('#chat-q').focus({preventScroll:true})},60)}});

Sim.start({host:'portal.suaempresa.com.br',name:'Portal do cliente',home:S.auth?'/':'/entrar'});
})(Sim,document);
