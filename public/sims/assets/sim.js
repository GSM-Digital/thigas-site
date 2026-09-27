/* Simulações · núcleo compartilhado (script clássico: funciona em http e em file://)
- Roteador SPA com histórico em memória: não polui o histórico do navegador de quem visita o site principal.
- Ponte com a janela principal via postMessage: URL, voltar/avançar/recarregar, Esc para fechar.
- Formulários: validação em português com aria-invalid + mensagens; máscaras de telefone/CEP.
- Nada é enviado a servidor algum: tudo acontece no navegador. */
(function(w,d){'use strict';
var $=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
var Sim={$:$,$$:$$,reduce:reduce,host:'',stack:[],idx:-1,routes:[],hooks:[],guards:[]};

/* ---------- ponte com a janela principal ---------- */
function post(msg){if(w.parent&&w.parent!==w){msg.sim=msg.sim||'route';w.parent.postMessage(msg,'*')}}
w.addEventListener('message',function(e){var m=e.data;if(!m||m.sim!=='nav'||e.source!==w.parent)return;
if(m.action==='back')Sim.back();else if(m.action==='forward')Sim.forward();else if(m.action==='reload')w.location.reload();else if(m.action==='home')Sim.go(Sim.home)});
d.addEventListener('keydown',function(e){if(e.key!=='Escape'||e.defaultPrevented)return;for(var i=0;i<Sim.guards.length;i++){if(Sim.guards[i]()){e.preventDefault();return}}post({sim:'escape'})});

/* ---------- roteador ---------- */
function compile(p){var keys=[];var re=new RegExp('^'+p.replace(/\//g,'\\/').replace(/:(\w+)/g,function(_,k){keys.push(k);return'([^/]+)'})+'$');return{re:re,keys:keys}}
function parse(path){var q={},i=path.indexOf('?'),base=i>-1?path.slice(0,i):path;if(i>-1)path.slice(i+1).split('&').forEach(function(kv){var p=kv.split('=');if(p[0])q[decodeURIComponent(p[0])]=decodeURIComponent(p[1]||'')});return{path:base||'/',query:q}}
function match(path){for(var i=0;i<Sim.routes.length;i++){var r=Sim.routes[i],m=r.c.re.exec(path);if(m){var params={};r.c.keys.forEach(function(k,j){params[k]=decodeURIComponent(m[j+1])});return{el:r.el,params:params,pattern:r.pattern}}}return null}
function render(full,opts){opts=opts||{};var p=parse(full),m=match(p.path)||{el:Sim.notFound,params:{},pattern:'*'};
Sim.pages.forEach(function(el){el.hidden=el!==m.el});
Sim.current={full:full,path:p.path,query:p.query,params:m.params,pattern:m.pattern,el:m.el};
$$('[data-nav]').forEach(function(a){var t=a.getAttribute('data-nav'),on=t==='/'?p.path==='/':p.path===t||p.path.indexOf(t+'/')===0;if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
var t=m.el.getAttribute('data-title');d.title=(t?t+' · ':'')+Sim.name;
Sim.hooks.forEach(function(fn){fn(Sim.current)});
if(!opts.keepScroll)w.scrollTo(0,0);
if(opts.focus){var h=$('h1,h2',m.el);if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}}
post({url:Sim.host+(full==='/'?'':full),title:d.title,canBack:Sim.idx>0,canForward:Sim.idx<Sim.stack.length-1})}
Sim.go=function(full,opts){opts=opts||{};if(full.charAt(0)==='#')full=full.slice(1);
if(opts.replace&&Sim.idx>-1)Sim.stack[Sim.idx]=full;else{Sim.stack=Sim.stack.slice(0,Sim.idx+1);Sim.stack.push(full);Sim.idx++}
render(full,{focus:opts.focus!==false&&Sim.started,keepScroll:opts.keepScroll})};
Sim.back=function(){if(Sim.idx>0){Sim.idx--;render(Sim.stack[Sim.idx],{focus:true})}};
Sim.forward=function(){if(Sim.idx<Sim.stack.length-1){Sim.idx++;render(Sim.stack[Sim.idx],{focus:true})}};
Sim.onRoute=function(fn){Sim.hooks.push(fn)};
Sim.onEscape=function(fn){Sim.guards.push(fn)};
Sim.start=function(o){Sim.host=o.host;Sim.name=o.name;Sim.home=o.home||'/';
Sim.pages=$$('[data-route]');Sim.pages.forEach(function(el){var p=el.getAttribute('data-route');if(p==='*')Sim.notFound=el;else Sim.routes.push({pattern:p,el:el,c:compile(p)})});
if(!Sim.notFound)Sim.notFound=$('[data-route="/"]');
d.addEventListener('click',function(e){var a=e.target.closest('a[href^="#/"],[data-go]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey)return;
var to=(a.getAttribute('data-go')||a.getAttribute('href')).replace(/^#/,'');e.preventDefault();var hash=to.indexOf('#');
if(hash>0){var anchor=to.slice(hash+1);to=to.slice(0,hash);if(to!==Sim.current.full)Sim.go(to);var el=d.getElementById(anchor);if(el)el.scrollIntoView({behavior:reduce?'auto':'smooth'});return}
if(to===Sim.current.full){w.scrollTo({top:0,behavior:reduce?'auto':'smooth'});return}Sim.go(to)});
var initial=w.location.hash.length>1?w.location.hash.slice(1):Sim.home;
Sim.go(initial,{focus:false});Sim.started=true;post({sim:'ready'})};

/* ---------- utilidades ---------- */
var fmt=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
Sim.money=function(v){return fmt.format(v)};
Sim.esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5.5 12.5 4 4 9-9"/></svg>';
Sim.toast=function(text){var box=$('.toasts');if(!box){box=d.createElement('div');box.className='toasts';box.setAttribute('role','status');box.setAttribute('aria-live','polite');d.body.appendChild(box)}
var t=d.createElement('div');t.className='toast';t.innerHTML=CHECK+'<span></span>';t.lastChild.textContent=text;box.appendChild(t);
setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},260)},2800)};

/* máscaras */
Sim.mask=function(input,type){input.addEventListener('input',function(){var v=input.value.replace(/\D/g,'');
if(type==='phone'){v=v.slice(0,11);input.value=v.length>10?v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/,'($1) $2-$3'):v.length>6?v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/,'($1) $2-$3'):v.length>2?v.replace(/^(\d{2})(\d{0,5})/,'($1) $2'):v.length?'('+v:''}
else if(type==='cep'){v=v.slice(0,8);input.value=v.length>5?v.slice(0,5)+'-'+v.slice(5):v}
else if(type==='code'){input.value=v.slice(0,1)}})};

/* validação: mensagens em português, aria-invalid e aria-describedby; foco no primeiro erro */
var MSG={valueMissing:'Preencha este campo.',typeMismatch:'Confira o formato. Ex.: nome@empresa.com.br',patternMismatch:'Confira o formato.',tooShort:'Muito curto.'};
function fieldMsg(el){var id=el.id+'-msg',m=d.getElementById(id);if(!m){m=d.createElement('p');m.className='field-msg';m.id=id;(el.closest('.field,.check')||el.parentNode).appendChild(m)}var ids=(el.getAttribute('aria-describedby')||'').split(' ').filter(Boolean);if(ids.indexOf(id)<0){ids.push(id);el.setAttribute('aria-describedby',ids.join(' '))}return m}
function check(el){var v=el.validity,msg='';if(!v.valid){if(v.valueMissing)msg=el.type==='checkbox'?'Marque para continuar.':MSG.valueMissing;else if(v.typeMismatch)msg=MSG.typeMismatch;else if(v.patternMismatch)msg=el.getAttribute('data-msg')||MSG.patternMismatch;else if(v.tooShort)msg=MSG.tooShort;else msg=el.validationMessage}
fieldMsg(el).textContent=msg;if(msg)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');return!msg}
Sim.form=function(form,onValid){form.setAttribute('novalidate','');
$$('input,select,textarea',form).forEach(function(el){el.addEventListener('blur',function(){if(el.value||el.getAttribute('aria-invalid'))check(el)});el.addEventListener('input',function(){if(el.getAttribute('aria-invalid'))check(el)});el.addEventListener('change',function(){if(el.getAttribute('aria-invalid'))check(el)})});
form.addEventListener('submit',function(e){e.preventDefault();var bad=$$('input,select,textarea',form).filter(function(el){return!el.disabled&&!check(el)});
if(bad.length){bad[0].focus();return}var btn=$('[type=submit]',form);if(btn){btn.setAttribute('aria-busy','true');btn.disabled=true}
setTimeout(function(){if(btn){btn.removeAttribute('aria-busy');btn.disabled=false}onValid(form,new FormData(form))},reduce?0:700)})};
Sim.reset=function(form){form.reset();$$('[aria-invalid]',form).forEach(function(el){el.removeAttribute('aria-invalid')});$$('.field-msg',form).forEach(function(m){m.textContent=''})};

/* diálogos internos (gaveta do carrinho, menu mobile): foco, Esc, clique fora */
Sim.panel=function(panel,opener,opts){opts=opts||{};var open=false,last=null;
function set(v){if(v===open)return;open=v;panel.classList.toggle('is-open',v);panel.setAttribute('aria-hidden',String(!v));if('inert'in panel)panel.inert=!v;if(opener)opener.setAttribute('aria-expanded',String(v));d.documentElement.classList.toggle('lock',v&&!!opts.lock);
if(v){last=d.activeElement;var f=$(opts.focus||'button,a,input',panel);if(f)setTimeout(function(){f.focus({preventScroll:true})},30)}else if(last&&last.focus)last.focus({preventScroll:true});if(opts.onToggle)opts.onToggle(v)}
panel.setAttribute('aria-hidden','true');if('inert'in panel)panel.inert=true;
Sim.onEscape(function(){if(open){set(false);return true}return false});
Sim.onRoute(function(){set(false)});
return{open:function(){set(true)},close:function(){set(false)},toggle:function(){set(!open)},get isOpen(){return open}}};

w.Sim=Sim})(window,document);
