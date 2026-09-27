/* Simulação · landing page de conversão */
(function(Sim,d){'use strict';var $=Sim.$,$$=Sim.$$,esc=Sim.esc;
var form=$('#lead');Sim.mask($('#l-tel'),'phone');
function focusForm(){var el=$('#form');el.scrollIntoView({behavior:Sim.reduce?'auto':'smooth',block:'center'});setTimeout(function(){$('#l-nome').focus({preventScroll:true})},Sim.reduce?0:450)}
$$('[data-focus-form]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(Sim.current.path!=='/'){Sim.go('/');setTimeout(focusForm,60)}else focusForm()},true)});
Sim.form(form,function(f,data){var nome=String(data.get('nome')).trim().split(' ')[0];$('#thanks-t').textContent='Obrigado, '+nome+'.';$('#thanks-p').textContent='Recebemos seus dados. Um especialista vai falar com você pelo WhatsApp '+data.get('tel')+'.';Sim.reset(f);Sim.go('/obrigado')});
$('#agenda').addEventListener('click',function(){Sim.toast('Lembrete adicionado à sua agenda (simulação).')});
/* CTA fixo no mobile: aparece depois do hero e some quando o formulário está visível */
var sticky=$('#sticky'),hero=$('.hero'),formCard=$('#form'),heroOut=false,formIn=false;
function upd(){var on=heroOut&&!formIn&&Sim.current&&Sim.current.path==='/';sticky.classList.toggle('is-on',on);sticky.setAttribute('aria-hidden',String(!on));$('a',sticky).tabIndex=on?0:-1}
if('IntersectionObserver'in window){new IntersectionObserver(function(e){heroOut=!e[0].isIntersecting;upd()},{threshold:0}).observe($('.hero-copy'));new IntersectionObserver(function(e){formIn=e[0].isIntersecting;upd()},{threshold:.2}).observe(formCard)}
Sim.onRoute(upd);
var hd=$('.hd');addEventListener('scroll',function(){hd.classList.toggle('is-scrolled',scrollY>8)},{passive:true});void hero;void esc;
Sim.start({host:'campanha.suaempresa.com.br',name:'Sua marca'});
})(Sim,document);
