/* Thiago Barreto · Header + Hero · JS vanilla, sem dependências.
Módulos: store · movimento · tema · header · menu · revelação · vitrine · scrollspy.
Todo o conteúdo essencial funciona sem JS; este arquivo só acrescenta comportamento. */
(function(){'use strict';
var d=document,root=d.documentElement,$=function(s,c){return(c||d).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
root.classList.add('js');

/* store: localStorage pode falhar (aba privada, bloqueio) */
var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* movimento: prefers-reduced-motion + botão "Pausar animações" (WCAG 2.2.2) */
var mqReduce=matchMedia('(prefers-reduced-motion: reduce)');
var motion={listeners:[],paused:store.get('tb-motion')==='off',allowed:function(){return!mqReduce.matches&&!motion.paused},on:function(fn){motion.listeners.push(fn)},emit:function(){motion.listeners.forEach(function(fn){fn(motion.allowed())})}};
var motionBtn=$('#motion-toggle'),motionLabel=motionBtn&&$('.motion-label',motionBtn);
function applyMotion(){root.classList.toggle('motion-off',motion.paused);if(motionBtn){motionBtn.setAttribute('aria-pressed',String(motion.paused));motionLabel.textContent=motion.paused?'Retomar animações':'Pausar animações'}}
applyMotion();
if(motionBtn)motionBtn.addEventListener('click',function(){motion.paused=!motion.paused;store.set('tb-motion',motion.paused?'off':'on');applyMotion();motion.emit()});
if(mqReduce.addEventListener)mqReduce.addEventListener('change',motion.emit);

/* tema claro/escuro: preferência salva > sistema */
var themeBtn=$('#theme-toggle'),themeMeta=$('meta[name=theme-color]');
function setTheme(t,animate){if(animate&&motion.allowed()){root.classList.add('theme-anim');setTimeout(function(){root.classList.remove('theme-anim')},400)}root.setAttribute('data-theme',t);var dark=t==='dark';if(themeMeta)themeMeta.content=dark?'#000000':'#F5F5F7';themeBtn.setAttribute('aria-pressed',String(!dark))}
setTheme(root.getAttribute('data-theme')==='dark'?'dark':'light');
/* interruptor de silicone "Modo claro": afundado no claro (padrão). Ao apertar ele sobe e só então o site escurece; no escuro, apertar afunda e volta ao claro */
themeBtn.addEventListener('click',function(){var t=root.getAttribute('data-theme')==='dark'?'light':'dark';store.set('tb-theme',t);themeBtn.setAttribute('aria-pressed',String(t==='light'));setTimeout(function(){setTheme(t,true)},motion.allowed()?160:0)});

/* header: estado de rolagem (listener passivo; só toca no DOM quando o estado muda) */
var topbar=$('#topo'),scrolled=null;
function onScroll(){var s=scrollY>8;if(s!==scrolled){scrolled=s;topbar.classList.toggle('is-scrolled',s)}}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* menu mobile: aria-expanded, Esc, clique fora, foco preso no header, conteúdo inerte */
var menuBtn=$('#menu-toggle'),sheet=$('#menu-sheet'),main=$('#conteudo'),menuOpen=false,closeTimer;
function setMenu(open,returnFocus){if(open===menuOpen)return;menuOpen=open;clearTimeout(closeTimer);menuBtn.setAttribute('aria-expanded',String(open));menuBtn.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');root.classList.toggle('menu-open',open);if(main)main.inert=open;
if(open){sheet.hidden=false;sheet.offsetHeight;sheet.classList.add('is-open');var first=$('a',sheet);if(first)first.focus({preventScroll:true})}
else{sheet.classList.remove('is-open');closeTimer=setTimeout(function(){if(!menuOpen)sheet.hidden=true},motion.allowed()?320:0);if(returnFocus)menuBtn.focus()}}
menuBtn.addEventListener('click',function(){setMenu(!menuOpen)});
sheet.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
d.addEventListener('keydown',function(e){if(!menuOpen)return;if(e.key==='Escape'){e.preventDefault();setMenu(false,true)}else if(e.key==='Tab'){var f=$$('a,button',topbar).filter(function(el){return el.offsetParent!==null});var a=f[0],z=f[f.length-1];if(e.shiftKey&&d.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&d.activeElement===z){e.preventDefault();a.focus()}}});
d.addEventListener('pointerdown',function(e){if(menuOpen&&!topbar.contains(e.target))setMenu(false)});
matchMedia('(min-width: 66.8125em)').addEventListener('change',function(e){if(e.matches)setMenu(false)});


/* revelação: título palavra a palavra (leitor de tela recebe o texto íntegro) */
var hero=$('.hero'),title=$('#hero-title');
if(title&&!title.dataset.split){var full=Array.prototype.map.call(title.childNodes,function(n){return n.nodeName==='BR'?' ':n.textContent}).join('').replace(/\s+/g,' ').trim(),visual=d.createElement('span'),i=0;visual.setAttribute('aria-hidden','true');
Array.prototype.forEach.call(title.childNodes,function(node){visual.appendChild(splitNode(node))});
function splitNode(node){if(node.nodeType===3){var frag=d.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(function(part){if(!part)return;if(/^\s+$/.test(part)){frag.appendChild(d.createTextNode(' '));return}var w=d.createElement('span');w.className='w';w.style.setProperty('--i',i++);w.textContent=part;frag.appendChild(w)});return frag}if(node.classList&&node.classList.contains('tone')){var phrase=node.cloneNode(true);phrase.classList.add('w');phrase.style.setProperty('--i',i++);return phrase}var clone=node.cloneNode(false);Array.prototype.forEach.call(node.childNodes,function(c){clone.appendChild(splitNode(c))});return clone}
var sr=d.createElement('span');sr.className='sr-only';sr.textContent=full;title.textContent='';title.appendChild(sr);title.appendChild(visual);title.dataset.split='1'}
/* dois frames garantem que o estado inicial foi pintado; o timeout cobre abas em segundo plano (rAF pausado) */
function heroIn(){hero.classList.add('is-in')}
requestAnimationFrame(function(){requestAnimationFrame(heroIn)});setTimeout(heroIn,120);

/* vitrine: abas com seletor deslizante, teclado (setas/Home/End) e ciclo automático */
var tabs=$('#tabs');
if(tabs){var tabBtns=$$('[role=tab]',tabs),screen=$('#screen'),panel=$('#tab-panel'),captions=$$('.caption',panel),urlText=$('#url-text'),gauge=$('#gauge-val'),gaugeNum=$('#gauge-num'),progress=$('#tabs-progress'),stage=$('.stage');
var current=tabBtns.findIndex(function(b){return b.getAttribute('aria-selected')==='true'}),userTook=false,inView=true,focused=false,countRaf;
captions.forEach(function(c){c.hidden=false;c.setAttribute('aria-hidden',String(!c.classList.contains('is-active')))});
function moveThumb(animate){var b=tabBtns[current];if(!animate)tabs.classList.add('no-anim');tabs.style.setProperty('--tx',b.offsetLeft+'px');tabs.style.setProperty('--tw',b.offsetWidth+'px');if(!animate){tabs.offsetWidth;tabs.classList.remove('no-anim')}}
var gaugeLength=2*Math.PI*16;
function showScore(value){gaugeNum.textContent=Math.round(value);gauge.style.strokeDashoffset=String(gaugeLength*(1-value/100));gauge.style.opacity=value>0?'1':'0'}
function countTo(to){cancelAnimationFrame(countRaf);if(!motion.allowed()){showScore(to);return}showScore(0);var t0=null;function step(t){if(t0===null)t0=t;var p=Math.min(1,(t-t0)/800),e=1-Math.pow(1-p,3);showScore(to*e);if(p<1)countRaf=requestAnimationFrame(step)}countRaf=requestAnimationFrame(step)}
function select(idx,opts){opts=opts||{};idx=(idx+tabBtns.length)%tabBtns.length;var prev=current;current=idx;var b=tabBtns[idx],layout=b.dataset.layout;
tabBtns.forEach(function(t,j){var on=j===idx;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1});
if(opts.focus)b.focus();
panel.setAttribute('aria-labelledby',b.id);
captions.forEach(function(c){var on=c.dataset.caption===layout;c.classList.toggle('is-active',on);c.setAttribute('aria-hidden',String(!on))});
screen.setAttribute('data-layout',layout);
if(urlText.textContent!==b.dataset.url){urlText.classList.add('is-swapping');setTimeout(function(){urlText.textContent=b.dataset.url;urlText.classList.remove('is-swapping')},motion.allowed()?140:0)}
countTo(parseInt(b.dataset.score,10));
b.scrollIntoView&&tabs.scrollWidth>tabs.clientWidth&&b.scrollIntoView({block:'nearest',inline:'nearest',behavior:motion.allowed()?'smooth':'auto'});
moveThumb(prev!==idx);restartCycle()}
/* ciclo automático: dirigido pelo fim da barra de progresso (pausa junto com ela) */
function cycleActive(){return!userTook&&motion.allowed()}
function restartCycle(){tabs.classList.remove('is-cycling');if(!cycleActive())return;progress.offsetWidth;tabs.classList.add('is-cycling');syncPause()}
function syncPause(){tabs.classList.toggle('is-paused',!inView||focused||d.hidden)}
progress.addEventListener('animationend',function(e){if(e.animationName==='tab-progress'&&cycleActive())select(current+1)});
function takeOver(){if(userTook)return;userTook=true;tabs.classList.remove('is-cycling');panel.setAttribute('aria-live','polite')}
tabBtns.forEach(function(b,j){b.addEventListener('click',function(){takeOver();select(j)})});
tabs.addEventListener('keydown',function(e){var k=e.key,n=null;if(k==='ArrowRight'||k==='ArrowDown')n=current+1;else if(k==='ArrowLeft'||k==='ArrowUp')n=current-1;else if(k==='Home')n=0;else if(k==='End')n=tabBtns.length-1;if(n===null)return;e.preventDefault();takeOver();select(n,{focus:true})});
tabs.addEventListener('pointerdown',function(){tabs.classList.add('is-pressing')});
['pointerup','pointercancel','pointerleave'].forEach(function(ev){tabs.addEventListener(ev,function(){tabs.classList.remove('is-pressing')})});
stage.addEventListener('focusin',function(){focused=true;syncPause()});stage.addEventListener('focusout',function(){focused=false;syncPause()});
d.addEventListener('visibilitychange',syncPause);
if('IntersectionObserver'in window){var visibleParts={stage:false,tabs:false},viewObserver=new IntersectionObserver(function(en){en.forEach(function(item){visibleParts[item.target===stage?'stage':'tabs']=item.isIntersecting});inView=visibleParts.stage||visibleParts.tabs;syncPause()},{threshold:0});viewObserver.observe(stage);viewObserver.observe(tabs)}
if('ResizeObserver'in window)new ResizeObserver(function(){moveThumb(false)}).observe(tabs);else addEventListener('resize',function(){moveThumb(false)});
if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){moveThumb(false)});
motion.on(function(ok){if(!ok){cancelAnimationFrame(countRaf);showScore(parseInt(tabBtns[current].dataset.score,10))}restartCycle()});
tabs.classList.add('is-ready');moveThumb(false);
showScore(parseInt(tabBtns[current].dataset.score,10));
setTimeout(restartCycle,1400)}

/* revelação ao rolar (.reveal): só esconde quando há IntersectionObserver e movimento permitido; revela uma vez */
var reveals=$$('.reveal');
if(reveals.length&&'IntersectionObserver'in window&&motion.allowed()){var rio=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('is-visible');rio.unobserve(x.target)}})},{rootMargin:'0px 0px -10% 0px',threshold:.15});
reveals.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight*.9)return;el.classList.add('will-reveal');rio.observe(el)});
motion.on(function(ok){if(!ok)reveals.forEach(function(el){el.classList.add('is-visible')})})}

/* galeria de soluções: botões anterior/próximo, estado nas pontas, teclado nativo pelo scroll */
var gallery=$('#sol-gallery');
if(gallery){var track=$('#sol-track',gallery),prev=$('#sol-prev'),next=$('#sol-next'),gTick=false;
function gState(){var max=track.scrollWidth-track.clientWidth;gallery.classList.toggle('no-overflow',max<=2);prev.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft>=max-2}
function step(dir){var card=$('.sol-card',track),gap=parseFloat(getComputedStyle(track).columnGap)||0;track.scrollBy({left:dir*(card.offsetWidth+gap),behavior:motion.allowed()?'smooth':'auto'});if(!motion.allowed())gState()}
prev.addEventListener('click',function(){step(-1)});next.addEventListener('click',function(){step(1)});
track.addEventListener('scroll',function(){if(gTick)return;gTick=true;requestAnimationFrame(function(){gState();gTick=false})},{passive:true});
track.addEventListener('scrollend',gState);
if('ResizeObserver'in window)new ResizeObserver(gState).observe(track);else addEventListener('resize',gState);
/* foco por Tab em card fora da vista: o navegador rola; o snap ajusta */
gState()}

/* simulações navegáveis: <dialog> nativo (foco preso, Esc, fundo inerte) + mini-site em iframe carregado sob demanda.
Ponte por postMessage (funciona também em file://): o mini-site informa rota/URL; a barra envia voltar/avançar/recarregar. */
var dialogs=$$('.sol-dialog'),opener=null;
function frameOf(dlg){return $('.sim-frame',dlg)}
function simLoad(dlg){var f=frameOf(dlg),body=$('.sim-body',dlg);if(!f||f.getAttribute('src'))return;f.addEventListener('load',function(){body.classList.add('is-ready')},{once:true});f.setAttribute('src',f.getAttribute('data-src'))}
function simOpened(dlg){simLoad(dlg);var body=$('.sim-body',dlg);if(!dlg.dataset.hinted){dlg.dataset.hinted='1';body.classList.add('show-hint')}}
function setGuide(dlg,open){var g=$('.guide',dlg),b=$('.guide-btn',dlg),dismiss=$('.sol-guide-dismiss',dlg);dlg.classList.toggle('guide-open',open);g.inert=!open;g.classList.remove('is-dragging');g.style.removeProperty('transform');dismiss.hidden=!open;b.setAttribute('aria-expanded',String(open));if(open)setTimeout(function(){if(!dlg.classList.contains('guide-open'))return;var h=$('.g-title',g);h.setAttribute('tabindex','-1');h.focus({preventScroll:true})},60);else b.focus({preventScroll:true})}
function openDialog(dlg,from){if(dlg.open)return;opener=from||d.activeElement;dlg.showModal();simOpened(dlg);var c=$('.dlg-close',dlg);if(c)c.focus({preventScroll:true})}
function closeDialog(dlg){if(!dlg.open)return;dlg.close()}
dialogs.forEach(function(dlg){
var guide=$('.guide',dlg),dismiss=d.createElement('button'),grab=d.createElement('div'),guideDrag=null;dismiss.className='sol-guide-dismiss';dismiss.type='button';dismiss.setAttribute('aria-label','Fechar informações da solução');dismiss.hidden=true;guide.before(dismiss);grab.className='sol-guide-grab';grab.setAttribute('aria-hidden','true');guide.prepend(grab);
dlg.addEventListener('close',function(){if(dlg.classList.contains('guide-open')){dlg.classList.remove('guide-open');guide.inert=true;guide.classList.remove('is-dragging');guide.style.removeProperty('transform');dismiss.hidden=true;$('.guide-btn',dlg).setAttribute('aria-expanded','false')}if(opener&&opener.focus)opener.focus({preventScroll:true});opener=null});
/* Esc com a janela do painel aberta fecha primeiro o painel */
dlg.addEventListener('cancel',function(e){if(dlg.classList.contains('guide-open')){e.preventDefault();setGuide(dlg,false)}});
/* toque fora fecha primeiro o painel e mantém a simulação aberta */
dismiss.addEventListener('click',function(){setGuide(dlg,false)});
dlg.addEventListener('click',function(e){if(e.target===dlg){if(dlg.classList.contains('guide-open'))setGuide(dlg,false);else closeDialog(dlg)}else if(dlg.classList.contains('guide-open')&&!guide.contains(e.target)&&!$('.guide-btn',dlg).contains(e.target)&&!e.target.closest('.dlg-close')&&e.target!==dismiss)setGuide(dlg,false)});
guide.addEventListener('touchstart',function(e){if(!dlg.classList.contains('guide-open')||!matchMedia('(max-width:45.9375em)').matches||e.touches.length!==1)return;guideDrag={y:e.touches[0].clientY,time:Date.now(),offset:0,active:false,handle:!!e.target.closest('.sol-guide-grab')}},{passive:true});
guide.addEventListener('touchmove',function(e){if(!guideDrag||e.touches.length!==1)return;var dy=e.touches[0].clientY-guideDrag.y;if(dy<=0||!guideDrag.active&&guide.scrollTop>0&&!guideDrag.handle)return;if(dy<8&&!guideDrag.active)return;e.preventDefault();guideDrag.active=true;guideDrag.offset=dy;guide.classList.add('is-dragging');guide.style.transform='translateY('+dy+'px)'},{passive:false});
function endGuideDrag(){if(!guideDrag)return;var close=guideDrag.active&&(guideDrag.offset>90||guideDrag.offset>35&&Date.now()-guideDrag.time<250);guideDrag=null;if(close)setGuide(dlg,false);else{guide.classList.remove('is-dragging');guide.style.removeProperty('transform')}}
guide.addEventListener('touchend',endGuideDrag);guide.addEventListener('touchcancel',endGuideDrag);
$$('[data-nav]',dlg).forEach(function(b){b.addEventListener('click',function(){var f=frameOf(dlg);if(f&&f.contentWindow)f.contentWindow.postMessage({sim:'nav',action:b.getAttribute('data-nav')},'*');if(b.getAttribute('data-nav')==='reload')$('.sim-body',dlg).classList.remove('is-ready'),f.addEventListener('load',function(){$('.sim-body',dlg).classList.add('is-ready')},{once:true})})});
$('.guide-btn',dlg).addEventListener('click',function(){setGuide(dlg,!dlg.classList.contains('guide-open'))});
$('.g-back',dlg).addEventListener('click',function(){setGuide(dlg,false)})});
addEventListener('message',function(e){var m=e.data;if(!m||typeof m!=='object'||!m.sim)return;
var dlg=dialogs.filter(function(x){var f=frameOf(x);return f&&f.contentWindow===e.source})[0];if(!dlg)return;
if(m.sim==='route'){$('.url-text',dlg).textContent=String(m.url||'').slice(0,120);$('[data-nav=back]',dlg).disabled=!m.canBack;$('[data-nav=forward]',dlg).disabled=!m.canForward}
else if(m.sim==='ready')$('.sim-body',dlg).classList.add('is-ready');
else if(m.sim==='escape')closeDialog(dlg)});
/* “Ver as etapas” no painel: fecha a janela, seleciona o tipo no Processo e rola até lá */
$$('[data-proc]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var dlg=a.closest('dialog'),key=a.getAttribute('data-proc');opener=null;if(dlg)closeDialog(dlg);
setTimeout(function(){if(key&&window.__procPick)window.__procPick(key);var sec=d.getElementById('processo');sec.scrollIntoView({behavior:motion.allowed()?'smooth':'auto'});var t=key?d.getElementById('pt-'+key):d.getElementById('proc-title');if(t){if(!key)t.setAttribute('tabindex','-1');t.focus({preventScroll:true})}},30)})});
/* pré-carrega o mini-site ao passar o mouse no card */
$$('.sol-card').forEach(function(card){var b=$('.sol-open',card),dlg=b&&d.getElementById(b.getAttribute('commandfor'));if(!dlg)return;card.addEventListener('pointerenter',function(){var f=frameOf(dlg),src=f&&f.getAttribute('data-src');if(!src||card.dataset.pf)return;card.dataset.pf='1';var l=d.createElement('link');l.rel='prefetch';l.href=src;d.head.appendChild(l)},{once:true})});
var nativeCommand='command'in HTMLButtonElement.prototype;
$$('[commandfor]').forEach(function(b){var dlg=d.getElementById(b.getAttribute('commandfor'));if(!dlg)return;
if(nativeCommand){if(b.getAttribute('command')==='show-modal')b.addEventListener('click',function(){opener=b;setTimeout(function(){if(!dlg.open)return;simOpened(dlg);var c=$('.dlg-close',dlg);if(c)c.focus({preventScroll:true})})})}
else b.addEventListener('click',function(){if(b.getAttribute('command')==='show-modal')openDialog(dlg,b);else closeDialog(dlg)})});

/* processo: seletor de tipo, cronograma proporcional aos dias e narrativa por rolagem (etapa no centro da tela = etapa ativa) */
var proc=$('#processo');
if(proc){var seg=$('#proc-seg'),segTabs=$$('[role=tab]',seg),lists=$$('.steps',proc),tl=$('#tl'),sceneEls=$$('.scene',proc),cur=-1;
function curList(){return lists.filter(function(l){return!l.hidden})[0]}
function stepsOf(l){return $$(':scope>.step',l)}
function pad(n){return(n<10?'0':'')+n}
function buildTl(){var st=stepsOf(curList());tl.innerHTML=st.map(function(s,i){return'<button class="tl-seg" type="button" data-go-step="'+i+'" style="--d:'+s.getAttribute('data-days')+'" aria-label="Ir para a etapa '+(i+1)+': '+$('.step-t',s).textContent+'"><b></b><small>'+pad(i+1)+'</small></button>'}).join('')}
/* clique na barra: rola até a etapa chegar ao topo da pilha (cartas têm a mesma altura) */
function goStep(i){var list=curList(),st=stepsOf(list),c=st[i];if(!c)return;var gap=parseFloat(getComputedStyle(list).rowGap)||0,top0=list.getBoundingClientRect().top+scrollY,y=top0+i*(st[0].offsetHeight+gap)-(parseFloat(c.style.top)||0)+2;scrollTo({top:y,behavior:motion.allowed()?'smooth':'auto'})}
tl.addEventListener('click',function(e){var b=e.target.closest('[data-go-step]');if(b)goStep(+b.getAttribute('data-go-step'))});
function activate(i){var list=curList(),st=stepsOf(list);if(!st[i])return;cur=i;var s=st[i],total=list.getAttribute('data-total');
st.forEach(function(x,j){x.classList.toggle('is-on',j===i);x.classList.toggle('is-done',j<i)});
$$('.tl-seg',tl).forEach(function(g,j){g.classList.toggle('done',j<i);g.classList.toggle('on',j===i)});
$('#stage-k').textContent='Etapa '+(i+1)+' de '+st.length;$('#stage-name').textContent=$('.step-t',s).textContent;
var a=s.getAttribute('data-from'),b=s.getAttribute('data-to');$('#stage-range').textContent=a===b?'Dia '+a:'Dias '+a+' a '+b;$('#stage-total').textContent='de '+total+' dias úteis';
sceneEls.forEach(function(e){e.classList.toggle('is-on',e.getAttribute('data-scene')===s.getAttribute('data-scene'))})}
/* pilha: calcula o topo fixo de cada cartão (cartões altos só grudam depois de mostrar tudo), a profundidade e a etapa ativa */
var mqDesk=matchMedia('(min-width: 66.8125em)'),stackTick=false,stage=$('.proc-stage',proc),stageShift=0;
function layoutStack(){var st=stepsOf(curList()),hd=$('.topbar').offsetHeight,base=hd+(mqDesk.matches?32:$('.proc-stage').offsetHeight+20);
stage.style.transform='';stageShift=0;
/* todas as cartas do tipo selecionado com a altura da mais alta: a pilha fica alinhada */
st.forEach(function(s){s.style.minHeight=''});var maxH=Math.max.apply(null,st.map(function(s){return s.offsetHeight}));st.forEach(function(s){s.style.minHeight=maxH+'px'});
var step=st.length>1?Math.min(14,Math.max(8,Math.floor((innerHeight-base-maxH-8)/(st.length-1)))):0;
st.forEach(function(s,i){s.style.top=Math.round(base+i*step)+'px';s.style.zIndex=i+1});updStack()}
function updStack(){var list=curList(),st=stepsOf(list),r=st.map(function(s){return s.getBoundingClientRect()}),act=0,calm=!motion.allowed();
/* O painel deixa de grudar ao alcançar a posição natural do último cartão. */
if(!mqDesk.matches&&st.length){var gap=parseFloat(getComputedStyle(list).rowGap)||0,lastTop=list.getBoundingClientRect().top+(st.length-1)*(st[0].offsetHeight+gap),stageBottom=stage.getBoundingClientRect().bottom-stageShift,nextShift=Math.min(0,lastTop-stageBottom-24);if(Math.abs(nextShift-stageShift)>.5){stage.style.transform='translateY('+Math.round(nextShift)+'px)';stageShift=Math.round(nextShift)}}
st.forEach(function(s,i){var depth=0;for(var j=i+1;j<st.length;j++)depth+=Math.min(1,Math.max(0,1-(r[j].top-r[i].top)/Math.max(1,r[i].height)));s.style.setProperty('--depth',calm?0:Math.min(depth,3).toFixed(3));if(r[i].top<innerHeight*.55)act=i});
if(act!==cur)activate(act)}
function observe(){layoutStack()}
addEventListener('scroll',function(){if(stackTick)return;stackTick=true;requestAnimationFrame(function(){stackTick=false;updStack()})},{passive:true});
addEventListener('resize',layoutStack);if(d.fonts&&d.fonts.ready)d.fonts.ready.then(layoutStack);mqDesk.addEventListener('change',layoutStack);motion.on(updStack);
function segThumb(anim){var b=segTabs.filter(function(t){return t.getAttribute('aria-selected')==='true'})[0];if(!anim)seg.style.setProperty('transition','none');seg.style.setProperty('--tx',b.offsetLeft+'px');seg.style.setProperty('--tw',b.offsetWidth+'px');var th=$('.seg-thumb',seg);if(!anim){th.style.transition='none';th.offsetWidth;th.style.transition=''}}
function pick(i,focus){segTabs.forEach(function(t,j){var on=j===i;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;d.getElementById(t.getAttribute('aria-controls')).hidden=!on});if(focus)segTabs[i].focus();segThumb(true);buildTl();activate(0);observe()}
segTabs.forEach(function(t,i){t.addEventListener('click',function(){pick(i)})});
seg.addEventListener('keydown',function(e){var i=segTabs.indexOf(d.activeElement),n=null;if(e.key==='ArrowRight'||e.key==='ArrowDown')n=(i+1)%segTabs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')n=(i-1+segTabs.length)%segTabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=segTabs.length-1;if(n===null)return;e.preventDefault();pick(n,true)});
seg.classList.add('is-ready');segThumb(false);buildTl();activate(0);observe();
/* painel interativo: uma mini-interação por fase */
var scenesBox=$('.scenes',proc),wait=function(ms){return new Promise(function(r){setTimeout(r,motion.allowed()?ms:0)})};
function runChecks(scene,btn){var items=$$('.sc-checks li',scene);if(btn.disabled)return;var done=items.every(function(li){return li.classList.contains('ok')});
if(done){items.forEach(function(li){li.classList.remove('ok')});btn.textContent=btn.getAttribute('data-label');return}
btn.setAttribute('data-label',btn.getAttribute('data-label')||btn.textContent);btn.disabled=true;btn.textContent='Verificando…';
items.reduce(function(pr,li){return pr.then(function(){return wait(380).then(function(){li.classList.add('ok')})})},Promise.resolve()).then(function(){btn.disabled=false;btn.textContent='Tudo certo ✓'})}
scenesBox.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;var scene=t.closest('.scene');
if(t.hasAttribute('data-ref')){t.setAttribute('aria-pressed',String(t.getAttribute('aria-pressed')!=='true'));$('[data-refs-n]',scene).textContent=$$('[data-ref][aria-pressed=true]',scene).length}
else if(t.hasAttribute('data-call')){var on=t.getAttribute('aria-pressed')!=='true';t.setAttribute('aria-pressed',String(on));t.textContent=on?'Reunião agendada':'Agendar reunião'}
else if(t.hasAttribute('data-acc')){$$('[data-acc]',scene).forEach(function(x){x.setAttribute('aria-pressed',String(x===t))});$$('[data-acc-target]',scene).forEach(function(x){x.style.setProperty('--acc',t.getAttribute('data-acc'))})}
else if(t.hasAttribute('data-font')){var sf=t.getAttribute('aria-pressed')!=='true';t.setAttribute('aria-pressed',String(sf));scene.classList.toggle('serif',sf)}
else if(t.hasAttribute('data-pin')){var ex=t.getAttribute('aria-expanded')!=='true';t.setAttribute('aria-expanded',String(ex));d.getElementById(t.getAttribute('aria-controls')).hidden=!ex}
else if(t.hasAttribute('data-approve')){var ap=t.getAttribute('aria-pressed')!=='true';t.setAttribute('aria-pressed',String(ap));t.textContent=ap?'Aprovado':'Aprovar layout';scene.classList.toggle('approved',ap)}
else if(t.hasAttribute('data-page')){var pages=$$('.sc-mini',scene),order=['k1','k2','k3'];if(t.classList.contains('k1'))return;var rank=function(el){return order.findIndex(function(k){return el.classList.contains(k)})},tr=rank(t);
pages.forEach(function(pg){var r=rank(pg),nr=pg===t?0:(r<tr?r+1:r);order.forEach(function(k){pg.classList.remove(k)});pg.classList.add(order[nr]);var nm=$('span',pg).textContent;pg.setAttribute('aria-label',nr===0?'Página '+nm+', em primeiro plano':'Trazer a página '+nm+' para frente')})}
else if(t.hasAttribute('data-add-product')){var g=$('[data-grid]',scene),n=$$('span',g).length;if(n>=9){$$('span',g).slice(3).forEach(function(x){x.remove()});n=3}else{g.appendChild(d.createElement('span'));n++}$('[data-prod-n]',scene).textContent=n}
else if(t.hasAttribute('data-run'))runChecks(scene,t);
else if(t.hasAttribute('data-publish')){var br=t.closest('.sc-browser');if(br.getAttribute('data-live')==='true')return;t.disabled=true;t.textContent='Publicando…';br.classList.add('publishing');wait(1250).then(function(){br.setAttribute('data-live','true');br.classList.remove('publishing');$('.sc-live',scene).hidden=false;$('.sc-bar span',br).textContent='🔒 suaempresa.com.br'})}
else if(t.hasAttribute('data-play')){var v=t.closest('.sc-video'),pl=t.getAttribute('aria-pressed')!=='true';t.setAttribute('aria-pressed',String(pl));t.setAttribute('aria-label',pl?'Pausar o treinamento':'Assistir ao treinamento');
if(pl&&!v.classList.contains('playing')){v.classList.add('playing');$('[data-play-t]',v).textContent='Assistindo…';$('.sc-vbar i',v).addEventListener('animationend',function(){v.classList.remove('playing','paused');t.setAttribute('aria-pressed','false');t.setAttribute('aria-label','Assistir de novo');$('[data-play-t]',v).textContent='Treinamento concluído ✓'},{once:true})}else v.classList.toggle('paused',!pl)}});
window.__procPick=function(key){var i=segTabs.indexOf(d.getElementById('pt-'+key));if(i>-1)pick(i)};
if('ResizeObserver'in window)new ResizeObserver(function(){segThumb(false)}).observe(seg);if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){segThumb(false)})}

/* projetos: cards a partir de js/projetos.js, filtros, "ver todos" e janela de case com anterior/próximo */
var pjGrid=$('#pj-grid');
if(pjGrid&&window.PROJETOS){var PJ=window.PROJETOS.slice().sort(function(a,b){return(b.destaque?1:0)-(a.destaque?1:0)}),TIPO={institucional:'Site institucional',landing:'Landing page',contato:'Página de contato',ecommerce:'E-commerce',plataforma:'Plataforma'},
filt={tipo:'todos',origem:'todos'},expanded=false,INITIAL=5,visibleList=[],caseIdx=0,caseOpener=null,caseDlg=$('#case'),ESC=function(t){return String(t||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var ARW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',EXT='<svg class="ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
function host(u){try{return new URL(u).host.replace(/^www\./,'')}catch(e){return''}}
function shot(p,cls){return'<div class="'+cls+'"><div class="pj-bar" aria-hidden="true"><i></i><i></i><i></i><span>'+ESC(host(p.url))+'</span></div><img src="'+ESC(p.capa)+'" alt="Página do projeto '+ESC(p.nome)+'" loading="lazy" decoding="async" width="1024" height="553"></div>'}
function card(p,k){return'<li class="pj-card" style="--k:'+k+'"><article aria-labelledby="pj-'+p.id+'-t">'+shot(p,'pj-shot')+'<div class="pj-body"><p class="pj-tags"><span class="pj-type">'+(TIPO[p.tipo]||'Projeto')+'</span>'+(p.segmento?'<span>'+ESC(p.segmento)+'</span>':'')+'</p><h3 id="pj-'+p.id+'-t">'+ESC(p.nome)+'</h3><div class="pj-foot">'+(p.origem==='3ads'?'<span class="pj-partner">Parceria 3ADS</span>':'<span></span>')+'<button class="pj-open" type="button" aria-haspopup="dialog" data-case="'+p.id+'" aria-label="Ver projeto: '+ESC(p.nome)+'">'+ARW+'</button></div></div></article></li>'}
function drawPj(){visibleList=PJ.filter(function(p){return(filt.tipo==='todos'||p.tipo===filt.tipo)&&(filt.origem==='todos'||p.origem===filt.origem)});
var shown=expanded?visibleList:visibleList.slice(0,INITIAL);pjGrid.innerHTML=shown.map(card).join('');
var cta=$('#pj-cta');if(cta&&(expanded||visibleList.length<=INITIAL))pjGrid.appendChild(cta.content.cloneNode(true));fitGrid();
$('#pj-count').textContent=visibleList.length+(visibleList.length===1?' projeto':' projetos');
var more=$('#pj-more');more.hidden=expanded||visibleList.length<=INITIAL;more.textContent='Ver todos os projetos ('+visibleList.length+')';
if(!visibleList.length)pjGrid.innerHTML='<li class="pj-count">Nenhum projeto com esses filtros ainda.</li>'}
/* ritmo editorial: no desktop (6 colunas) as linhas alternam 2 destaques e 3 cards; a última linha incompleta estica os cards.
   Card sozinho numa linha (desktop ou tablet) vira "largo": imagem à esquerda, texto à direita. */
function fitGrid(){var items=$$('.pj-card',pjGrid),cols=getComputedStyle(pjGrid).gridTemplateColumns.split(' ').length;
items.forEach(function(li){li.removeAttribute('data-span');li.classList.remove('is-big','is-wide')});if(cols<2)return;
if(cols===2){if(items.length%2)items[items.length-1].classList.add('is-wide');items.forEach(function(li){li.style.gridColumn=li.classList.contains('is-wide')?'1 / -1':''});return}
items.forEach(function(li){li.style.gridColumn=''});
for(var i=0,row=0;i<items.length;row++){var cap=row%2?3:2,n=Math.min(cap,items.length-i),span=6/n;
for(var j=0;j<n;j++){var li=items[i+j];li.setAttribute('data-span',String(span));if(span===3)li.classList.add('is-big');if(span===6)li.classList.add('is-wide')}i+=n}}
/* destaque deslizante do filtro (mesmo comportamento do seletor do Processo) */
var pjSeg=$('#pj-tipo');function pjThumb(anim){var b=$('[aria-pressed=true]',pjSeg),th=$('.seg-thumb',pjSeg);if(!b||!th)return;if(!anim)th.style.transition='none';pjSeg.style.setProperty('--tx',b.offsetLeft+'px');pjSeg.style.setProperty('--tw',b.offsetWidth+'px');if(!anim){th.offsetWidth;th.style.transition=''}}
if(pjSeg){pjSeg.classList.add('is-ready');pjThumb(false);if('ResizeObserver'in window)new ResizeObserver(function(){pjThumb(false)}).observe(pjSeg);if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){pjThumb(false)})}
$$('.pj-group').forEach(function(g){var key=g.id==='pj-tipo'?'tipo':'origem';$$('.pj-chip',g).forEach(function(b){b.addEventListener('click',function(){filt[key]=b.getAttribute('data-v');$$('.pj-chip',g).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});pjThumb(motion.allowed());expanded=false;drawPj()})})});
$('#pj-more').addEventListener('click',function(){var n=$$('.pj-card:not(.pj-cta)',pjGrid).length;expanded=true;drawPj();var next=$$('.pj-open',pjGrid)[n];if(next)next.focus()});
addEventListener('resize',fitGrid);
/* janela do case */
/* janela do case: o site real do cliente em um iframe (sandbox sem allow-top-navigation: o site não consegue tirar o visitante daqui).
   "Computador" renderiza a 1280 px e reduz para caber; "Celular" renderiza a 390 px numa moldura. O print fica atrás enquanto carrega. */
var ldBar=$('#ld-bar'),ldStep=$('#ld-step'),ldTick=0,live=$('#case-live'),cView=$('#case-view'),cScreen=$('#case-screen'),cInfoBtn=$('#case-info-btn'),cInfo=$('#case-info'),cInfoDismiss=$('#case-info-dismiss'),cFail=$('#case-fail'),liveTimer=0,DEV_W={desktop:1280,mobile:390};
function caseDev(){return cView.getAttribute('data-dev')}
function fitScreen(){var st=$('#case-stage'),W=st.clientWidth,H=st.clientHeight;if(!W||!H)return;var dev=caseDev(),vw=DEV_W[dev],sc,w,h,x=0,y=0;
cView.classList.toggle('is-native',dev==='mobile'&&W<500);
if(dev==='mobile'&&W<500){sc=1;w=W;h=H}  /* já é um celular: o site ocupa a área toda, sem moldura */
else if(dev==='mobile'){var ph=Math.min(844,H-48);sc=Math.min(1,ph/844,(W-48)/vw);w=vw;h=Math.round(Math.min(844,(H-48)/sc));x=Math.round((W-w*sc)/2);y=Math.round((H-h*sc)/2)}
else{sc=W<vw?W/vw:1;w=sc<1?vw:W;h=Math.round(H/sc)}
cScreen.style.width=w+'px';cScreen.style.height=h+'px';cScreen.style.transform='translate('+x+'px,'+y+'px) scale('+sc+')'}
/* progresso "percebido": anda rápido no começo e desacelera sem parar; completa quando o site termina de carregar */
function progress(h){clearInterval(ldTick);var v=0,last=-1,steps=['Conectando a '+h+'…','Montando o layout…','Buscando imagens e fontes…','Quase lá…'];
function set(i){if(i===last)return;last=i;ldStep.classList.add('is-swap');setTimeout(function(){ldStep.textContent=steps[i];ldStep.classList.remove('is-swap')},180)}
ldBar.style.setProperty('--p',0);ldStep.textContent=steps[0];last=0;
ldTick=setInterval(function(){v+=(.94-v)*.045;ldBar.style.setProperty('--p',v.toFixed(3));set(v<.3?0:v<.55?1:v<.8?2:3)},120)}
function loadLive(p){clearTimeout(liveTimer);clearInterval(ldTick);cView.classList.remove('is-ready','show-hint','is-slow');cFail.hidden=true;live.onload=null;live.src='about:blank';if(!p.url)return;
var h=host(p.url);$('#ld-url').textContent=h;$('#ld-host').textContent=h;$('#case-status').textContent='Carregando '+h+'…';progress(h);
var go=function(){live.onload=function(){if(live.getAttribute('src')==='about:blank')return;clearTimeout(liveTimer);clearInterval(ldTick);ldBar.style.setProperty('--p',1);cFail.hidden=true;cView.classList.remove('is-slow');$('#case-status').textContent=h+' carregado.';
setTimeout(function(){cView.classList.add('is-ready');void cView.offsetWidth;cView.classList.add('show-hint')},motion.allowed()?380:0)};live.src=p.url};
requestAnimationFrame(go);liveTimer=setTimeout(function(){if(!cView.classList.contains('is-ready')){cFail.hidden=false;cView.classList.add('is-slow')}},12000)}
function setInfo(open){cInfo.classList.remove('is-dragging');cInfo.style.removeProperty('transform');cInfoBtn.setAttribute('aria-expanded',String(open));cView.classList.toggle('guide-open',open);cInfo.inert=!open;cInfoDismiss.hidden=!open;cScreen.inert=open}
function drawCase(){var p=visibleList[caseIdx];if(!p)return;var wa='https://wa.me/5562982108841?text='+encodeURIComponent('Olá, Thiago! Vi o projeto '+p.nome+' no seu site e quero um projeto parecido para a minha empresa.');
var meta=[TIPO[p.tipo],p.segmento,p.ano].filter(Boolean).join(' · ');
var det=(p.ideia?'<div><h4>A ideia</h4><p>'+ESC(p.ideia)+'</p></div>':'')+(p.feito&&p.feito.length?'<div><h4>O que foi feito</h4><ul role="list">'+p.feito.map(function(x){return'<li>'+ESC(x)+'</li>'}).join('')+'</ul></div>':'')+(p.resultado?'<div><h4>Resultado</h4><p>'+ESC(p.resultado)+'</p></div>':'');
var dep=p.depoimento&&p.depoimento.texto?'<figure class="case-quote"><blockquote>“'+ESC(p.depoimento.texto)+'”</blockquote><figcaption class="quote-who">'+(p.depoimento.foto?'<img src="'+ESC(p.depoimento.foto)+'" alt="">':'<span class="quote-av" aria-hidden="true">'+ESC((p.depoimento.nome||'?').split(' ').map(function(x){return x[0]}).slice(0,2).join(''))+'</span>')+'<span><b>'+ESC(p.depoimento.nome)+'</b><small>'+ESC(p.depoimento.cargo)+'</small></span></figcaption></figure>':'';
$('#case-body').innerHTML='<p class="pj-tags"><span class="pj-type">'+(TIPO[p.tipo]||'Projeto')+'</span>'+(p.origem==='3ads'?'<span>Parceria 3ADS</span>':'<span>Projeto independente</span>')+'</p><h3 class="g-title">'+ESC(p.nome)+'</h3>'+(meta?'<p class="g-lead">'+ESC(meta)+'</p>':'')+
(det?'<div class="case-grid">'+det+'</div>':'')+dep+
'<div class="case-act">'+(p.url?'<a class="btn" href="'+ESC(p.url)+'" target="_blank" rel="noopener">Ver site no ar'+EXT+'</a>':'')+'<a class="text-link" href="'+wa+'" target="_blank" rel="noopener">Quero um projeto assim<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></a></div>';
$('#case-t').textContent=p.nome;$('#case-host').textContent=host(p.url)||p.nome;$('#case-url').href=p.url||'#';$('#case-fail-a').href=p.url||'#';
live.title='Site '+host(p.url)+' ao vivo (projeto '+p.nome+')';
$('#case-pos').textContent=(caseIdx+1)+' de '+visibleList.length;$('#case-prev').disabled=caseIdx===0;$('#case-next').disabled=caseIdx===visibleList.length-1;
fitScreen();loadLive(p)}
$$('[data-dev]',caseDlg).forEach(function(b){b.addEventListener('click',function(){var dev=b.getAttribute('data-dev');if(dev===caseDev())return;$$('[data-dev]',caseDlg).forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});cView.setAttribute('data-dev',dev);fitScreen()})});
cInfoBtn.addEventListener('click',function(){setInfo(cInfoBtn.getAttribute('aria-expanded')!=='true')});
cInfoDismiss.addEventListener('click',function(){setInfo(false);cInfoBtn.focus({preventScroll:true})});
caseDlg.addEventListener('click',function(e){if(cInfoBtn.getAttribute('aria-expanded')==='true'&&!cInfo.contains(e.target)&&!cInfoBtn.contains(e.target))setInfo(false)});
var infoDrag=null;
cInfo.addEventListener('touchstart',function(e){if(cInfoBtn.getAttribute('aria-expanded')!=='true'||!matchMedia('(max-width:45.9375em)').matches||e.touches.length!==1)return;infoDrag={y:e.touches[0].clientY,time:Date.now(),offset:0,active:false,handle:!!e.target.closest('.case-info-grab')}},{passive:true});
cInfo.addEventListener('touchmove',function(e){if(!infoDrag||e.touches.length!==1)return;var dy=e.touches[0].clientY-infoDrag.y;if(dy<=0||!infoDrag.active&&cInfo.scrollTop>0&&!infoDrag.handle)return;if(dy<8&&!infoDrag.active)return;e.preventDefault();infoDrag.active=true;infoDrag.offset=dy;cInfo.classList.add('is-dragging');cInfo.style.transform='translateY('+dy+'px)'},{passive:false});
function endInfoDrag(){if(!infoDrag)return;var close=infoDrag.active&&(infoDrag.offset>90||infoDrag.offset>35&&Date.now()-infoDrag.time<250);infoDrag=null;if(close){setInfo(false);cInfoBtn.focus({preventScroll:true})}else{cInfo.classList.remove('is-dragging');cInfo.style.removeProperty('transform')}}
cInfo.addEventListener('touchend',endInfoDrag);cInfo.addEventListener('touchcancel',endInfoDrag);
if('ResizeObserver'in window)new ResizeObserver(fitScreen).observe($('#case-stage'));else addEventListener('resize',fitScreen);
function openCase(id,from){caseIdx=Math.max(0,visibleList.findIndex(function(p){return p.id===id}));caseOpener=from;setInfo(false);var small=matchMedia('(max-width:45.9375em)').matches;cView.setAttribute('data-dev',small?'mobile':'desktop');$$('[data-dev]',caseDlg).forEach(function(x){x.setAttribute('aria-pressed',String(x.getAttribute('data-dev')===caseDev()))});caseDlg.showModal();drawCase();$('#case-x').focus({preventScroll:true})}
function stepCase(dir){var n=caseIdx+dir;if(n<0||n>=visibleList.length)return;caseIdx=n;drawCase()}
pjGrid.addEventListener('click',function(e){var b=e.target.closest('[data-case]');if(b)openCase(b.getAttribute('data-case'),b)});
$('#case-prev').addEventListener('click',function(){stepCase(-1)});$('#case-next').addEventListener('click',function(){stepCase(1)});
$('#case-x').addEventListener('click',function(){caseDlg.close()});
caseDlg.addEventListener('click',function(e){if(e.target===caseDlg)caseDlg.close()});
caseDlg.addEventListener('keydown',function(e){if(e.target.closest('input,textarea,select'))return;if(e.key==='ArrowRight'){e.preventDefault();stepCase(1)}else if(e.key==='ArrowLeft'){e.preventDefault();stepCase(-1)}});
caseDlg.addEventListener('close',function(){clearTimeout(liveTimer);clearInterval(ldTick);live.onload=null;live.src='about:blank';cView.classList.remove('is-ready','show-hint');var p=visibleList[caseIdx],b=p&&pjGrid.querySelector('[data-case="'+p.id+'"]');(b||caseOpener||pjGrid).focus&&(b||caseOpener).focus({preventScroll:true})});
/* depoimentos: só aparecem se algum projeto tiver */
var withQ=PJ.filter(function(p){return p.depoimento&&p.depoimento.texto});if(withQ.length){$('#pj-quotes').hidden=false;$('#pj-quotes-l').innerHTML=withQ.map(function(p){var q=p.depoimento;return'<li><figure class="quote-card"><blockquote>“'+ESC(q.texto)+'”</blockquote><figcaption class="quote-who">'+(q.foto?'<img src="'+ESC(q.foto)+'" alt="">':'<span class="quote-av" aria-hidden="true">'+ESC((q.nome||'?').split(' ').map(function(x){return x[0]}).slice(0,2).join(''))+'</span>')+'<span><b>'+ESC(q.nome)+'</b><small>'+ESC(q.cargo)+(q.cargo?' · ':'')+ESC(p.nome)+'</small></span></figcaption><button class="text-link" type="button" data-case-q="'+p.id+'">Ver o projeto</button></figure></li>'}).join('');
$$('[data-case-q]').forEach(function(b){b.addEventListener('click',function(){filt={tipo:'todos',origem:'todos'};expanded=true;drawPj();openCase(b.getAttribute('data-case-q'),b)})})}
drawPj()}

/* sobre: total do portfólio vem de js/projetos.js; números contam ao entrar na tela (só com movimento permitido) */
(function(){var box=$('#sobre');if(!box)return;var n=window.PROJETOS&&window.PROJETOS.length;
if(n){var el=$('[data-pj-total]',box);el.setAttribute('data-count',n);el.textContent=n;$('[data-pj-total-sr]',box).textContent=n}
var nums=$$('[data-count]',box);if(!('IntersectionObserver'in window))return;
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(!x.isIntersecting)return;io.unobserve(x.target);if(!motion.allowed())return;var el=x.target,to=+el.getAttribute('data-count'),pre=el.getAttribute('data-pre')||'',t0=null,dur=to>20?1100:600;
function step(t){if(t0===null)t0=t;var k=Math.min((t-t0)/dur,1),e=1-Math.pow(1-k,3);el.textContent=pre+Math.round(to*e);if(k<1)requestAnimationFrame(step)}el.textContent=pre+'0';requestAnimationFrame(step)})},{threshold:.6});
nums.forEach(function(el){io.observe(el)})})();
/* ano do rodapé: atualiza na meia-noite local e ao voltar para a aba */
(function(){var y=$('#ft-year');if(!y)return;var timer;
function syncYear(){clearTimeout(timer);var now=new Date();y.textContent=now.getFullYear();var next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);timer=setTimeout(syncYear,Math.max(1000,next-now+50))}
syncYear();d.addEventListener('visibilitychange',function(){if(!d.hidden)syncYear()});addEventListener('focus',syncYear)})();
/* contato: cinco dados obrigatórios, prévia ao vivo e envio só após confirmação no WhatsApp */
(function(){var f=$('#ct-form');if(!f)return;var WA='https://wa.me/5562982108841?text=',bubble=$('#ct-bubble'),st=$('#ct-status'),stTxt=st.innerHTML,
tipo=$('.ct-types',f),tipoHelp=$('#ct-tipo-h'),nome=$('#ct-nome'),tel=$('#ct-telefone'),telHelp=$('#ct-telefone-h').textContent,origem=$('#ct-origem'),msg=$('#ct-msg'),msgHelp=$('#ct-msg-h').textContent,
TIPO={site:'um site institucional',shop:'um e-commerce',lp:'uma landing page',app:'uma plataforma sob medida','?':'um projeto web (tipo ainda não definido)'},
ORIGEM={indicacao:'por indicação',google:'pelo Google',instagram:'pelo Instagram',linkedin:'pelo LinkedIn',outro:'de outra forma'},preferUS=/(?:^|[-_])(US|CA)$/i.test(navigator.language||'');
if(preferUS)tel.placeholder='(000) 000-0000';
function esc(t){return t.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function brArea(v){return/^(?:1[1-9]|2[12478]|3[1-578]|4[1-9]|5[135]|6[1-9]|7[134579]|8[1-9]|9[1-9])$/.test(v)}
function phoneInfo(raw){var v=raw.trim(),n=v.replace(/\D/g,'');if(/^\+1/.test(v)||/^1[\s.-]+\d{3}/.test(v))return{country:'us',digits:n.slice(1,11),prefix:true};if(/^\+55/.test(v))return{country:'br',digits:n.slice(2,13)};if(v.charAt(0)==='+')return{country:'other',digits:n};if(n.length>11&&n.slice(0,2)==='55')return{country:'br',digits:n.slice(2,13)};if(n.length===11&&brArea(n.slice(0,2))&&n.charAt(2)==='9')return{country:'br',digits:n};if(n.length===11&&n.charAt(0)==='1')return{country:'us',digits:n.slice(1),prefix:true};if(n.length>=11)return{country:'br',digits:n.slice(0,11)};if(n.length===10)return{country:'us',digits:n,prefix:false};if(/^\(\d{3}\)/.test(v))return{country:'us',digits:n.slice(0,10),prefix:false};if(/^\(\d{2}\)/.test(v))return{country:'br',digits:n.slice(0,11)};if(preferUS||n.length>=2&&!brArea(n.slice(0,2)))return{country:'us',digits:n.slice(0,10),prefix:false};return{country:'br',digits:n.slice(0,11)}}
function phone(){var raw=tel.value.trim(),p=phoneInfo(raw),v=p.digits;if(p.country==='other'||raw==='+'||raw==='+5')return raw;if(p.country==='us')return(p.prefix?'+1 ':'')+(v?'('+v.slice(0,3)+(v.length>=3?') ':'')+(v.length>3?v.slice(3,6):'')+(v.length>6?'-'+v.slice(6,10):''):'');if(!v)return /^\+55/.test(raw)?'+55 ':'';var a='('+v.slice(0,2)+(v.length>=2?') ':'');if(v.length<=2)return a;var r=v.slice(2),mobile=r.charAt(0)==='9'||v.length>10;return a+(mobile?r.slice(0,1)+(r.length>1?' '+r.slice(1,5):'')+(r.length>5?'-'+r.slice(5,9):''):r.slice(0,4)+(r.length>4?'-'+r.slice(4,8):''))}
function validPhone(){var p=phoneInfo(tel.value),v=p.digits;return p.country==='us'?/^[2-9]\d{2}[2-9]\d{6}$/.test(v):p.country==='br'&&/^[1-9]{2}\d{8,9}$/.test(v)}
function maskPhone(){var raw=tel.value,caret=tel.selectionStart==null?raw.length:tel.selectionStart,formatted=phone();if(raw===formatted)return;var before=raw.slice(0,caret).replace(/\D/g,'').length,p=phoneInfo(raw);if(p.country==='us'&&p.prefix)before=Math.max(0,before-1);if(p.country==='br'&&/^\+55/.test(raw))before=Math.max(0,before-2);tel.value=formatted;var pos=formatted.length;if(caret<raw.length){var start=p.country==='us'&&p.prefix?3:0,count=0;pos=start;for(var i=start;i<formatted.length&&count<before;i++)if(/\d/.test(formatted.charAt(i))){count++;pos=i+1}}tel.setSelectionRange(pos,pos)}
function parts(){var r=$('input[name=tipo]:checked',f);return{n:nome.value.trim(),f:phone(),t:r?TIPO[r.value]:'',o:ORIGEM[origem.value]||'',m:msg.value.trim()}}
function text(p){return'Olá, Thiago! Sou '+p.n+'. Quero conversar sobre '+p.t+'. Conheci o seu trabalho '+p.o+'.\n\nSobre o projeto: '+p.m}
function draw(){var p=parts(),ph=function(t){return'<span class="ph">'+t+'</span>'};
bubble.innerHTML='Olá, Thiago! Sou '+(p.n?esc(p.n):ph('seu nome'))+'. Quero conversar sobre '+(p.t?esc(p.t):ph('o projeto desejado'))+'. Conheci o seu trabalho '+(p.o?esc(p.o):ph('pelo canal que vou selecionar'))+'.\n\nSobre o projeto: '+(p.m?esc(p.m):ph('conte um pouco sobre o projeto…'))}
var now=new Date();bubble.setAttribute('data-time',('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2));
function setErr(el,help,msgTxt,orig){var bad=!!msgTxt;el.setAttribute('aria-invalid',String(bad));help.textContent=bad?msgTxt:orig;help.classList.toggle('is-error',bad);return bad}
function checkType(){var bad=!$('input[name=tipo]:checked',f);tipo.classList.toggle('is-error',bad);tipo.setAttribute('aria-invalid',String(bad));tipoHelp.textContent=bad?'Selecione o projeto desejado.':'';tipoHelp.classList.toggle('is-error',bad);return bad}
function check(el){if(el===nome)return setErr(nome,$('#ct-nome-h'),nome.value.trim().length<2?'Informe seu nome.':'','');
if(el===tel)return setErr(tel,$('#ct-telefone-h'),!validPhone()?'Informe um telefone válido com código de área.':'',telHelp);
if(el===origem)return setErr(origem,$('#ct-origem-h'),!ORIGEM[origem.value]?'Selecione como me conheceu.':'','');
return setErr(msg,$('#ct-msg-h'),msg.value.trim().length<10?'Conte um pouco sobre o projeto (pelo menos 10 caracteres).':'',msgHelp)}
f.addEventListener('input',function(e){if(e.target===tel)maskPhone();draw();if(e.target.getAttribute('aria-invalid')==='true')check(e.target)});
f.addEventListener('change',function(e){draw();if(e.target.name==='tipo'&&tipo.getAttribute('aria-invalid')==='true')checkType();if(e.target===origem)check(origem)});
[nome,tel,msg].forEach(function(el){el.addEventListener('blur',function(){if(el.value.trim()){if(el===tel)tel.value=phone();check(el);draw()}})});
f.addEventListener('submit',function(e){e.preventDefault();var badType=checkType(),badName=check(nome),badTel=check(tel),badOrigin=check(origem),badMsg=check(msg);
if(badType||badName||badTel||badOrigin||badMsg){(badType?$('input[name=tipo]',f):badName?nome:badTel?tel:badOrigin?origem:msg).focus();st.textContent='Revise os campos destacados.';return}
tel.value=phone();draw();var url=WA+encodeURIComponent(text(parts()));window.open(url,'_blank','noopener');
st.innerHTML='Abrindo o WhatsApp… Se não abriu, <a href="'+esc(url)+'" target="_blank" rel="noopener">toque aqui</a>.';setTimeout(function(){st.innerHTML=stTxt},12000)});
window.__ctText=function(){return text(parts())};draw()})();
/* scrollspy: marca a pílula da seção visível com aria-current (ativa quando as seções existirem) */
var links=$$('.nav-links a[href^="#"]'),targets=links.map(function(a){return d.getElementById(a.getAttribute('href').slice(1))});
/* destaque deslizante do menu: vai até a seção atual; no hero (nenhuma seção) some */
var navUl=$('.nav-links');function navThumb(anim){if(!navUl)return;var c=$('.pill[aria-current]',navUl);if(!c){navUl.style.setProperty('--to',0);return}var wasHidden=navUl.style.getPropertyValue('--to')!=='1';
if(!anim||wasHidden)navUl.classList.add('no-anim');navUl.style.setProperty('--tx',c.offsetLeft+'px');navUl.style.setProperty('--tw',c.offsetWidth+'px');navUl.offsetWidth;navUl.classList.remove('no-anim');navUl.style.setProperty('--to',1)}
/* reflexo do vidro acompanha o cursor (sutil; desligado com movimento reduzido/pausado) */
if(navUl)navUl.addEventListener('pointermove',function(e){if(!motion.allowed()||e.pointerType!=='mouse')return;var r=navUl.getBoundingClientRect();navUl.style.setProperty('--mx',Math.round(e.clientX-r.left)+'px')});
if(navUl)navUl.addEventListener('pointerleave',function(){navUl.style.removeProperty('--mx')});
if(navUl){navUl.classList.add('is-ready');if('ResizeObserver'in window)new ResizeObserver(function(){navThumb(false)}).observe(navUl);if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){navThumb(false)})}
function mark(id){links.forEach(function(a){if(id&&a.getAttribute('href')==='#'+id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});navThumb(motion.allowed())}
/* clique no menu: o botão afunda na hora e fica; o spy pausa até a rolagem parar, para as seções do caminho não piscarem */
var spyLock=false,spyT=0;function hereNow(){var y=innerHeight*.5,hit=null;targets.forEach(function(t){if(!t)return;var r=t.getBoundingClientRect();if(r.top<=y&&r.bottom>y)hit=t.id});return hit}
function release(){clearTimeout(spyT);spyT=setTimeout(function(){spyLock=false;removeEventListener('scroll',release);mark(hereNow())},180)}
links.forEach(function(a){a.addEventListener('click',function(){mark(a.getAttribute('href').slice(1));spyLock=true;addEventListener('scroll',release,{passive:true});release()})});
if('IntersectionObserver'in window&&targets.some(Boolean)){var spy=new IntersectionObserver(function(en){if(spyLock)return;en.forEach(function(x){if(x.isIntersecting)mark(x.target.id)})},{rootMargin:'-45% 0px -50% 0px'});targets.forEach(function(t){if(t)spy.observe(t)});
if(hero)new IntersectionObserver(function(en){if(!spyLock&&en[0].isIntersecting)mark(null)},{rootMargin:'-45% 0px -50% 0px'}).observe(hero)}
/* rodapé: a assinatura ocupa o fundo e a luz acompanha o ponteiro na seção */
var ftDisplay=$('.ft-display'),ftSection=$('.site-footer'),ftRaf=0;
function resetFt(){cancelAnimationFrame(ftRaf);ftRaf=0;ftDisplay.style.setProperty('--fx','50%');ftDisplay.style.setProperty('--fy','50%')}
if(ftDisplay){ftSection.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse'||!motion.allowed())return;var r=ftDisplay.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(ftRaf)cancelAnimationFrame(ftRaf);ftRaf=requestAnimationFrame(function(){ftDisplay.style.setProperty('--fx',x+'px');ftDisplay.style.setProperty('--fy',y+'px');ftRaf=0})});ftSection.addEventListener('pointerleave',resetFt);motion.on(function(ok){if(!ok)resetFt()})}
})();
