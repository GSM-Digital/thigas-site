/* O servidor renderiza os artigos publicados pelo Payload; este arquivo só controla o carrossel. */
(function(){'use strict';
var track=document.getElementById('blog-track'),controls=document.getElementById('blog-controls');
if(!track||!controls)return;
var prev=document.getElementById('blog-prev'),next=document.getElementById('blog-next');
function update(){var max=track.scrollWidth-track.clientWidth;controls.hidden=max<=2;prev.disabled=track.scrollLeft<=2;next.disabled=track.scrollLeft>=max-2}
function move(direction){var card=track.querySelector('.blog-card');if(!card)return;var gap=parseFloat(getComputedStyle(track).columnGap)||0;var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('motion-off');track.scrollBy({left:direction*(card.getBoundingClientRect().width+gap),behavior:reduced?'instant':'smooth'})}
prev.addEventListener('click',function(){move(-1)});next.addEventListener('click',function(){move(1)});
track.addEventListener('scroll',function(){requestAnimationFrame(update)},{passive:true});
if('ResizeObserver'in window)new ResizeObserver(update).observe(track);else addEventListener('resize',update);
update();
})();
