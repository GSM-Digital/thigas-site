(function(){'use strict';
var root=document.documentElement,button=document.getElementById('theme-toggle'),meta=document.querySelector('meta[name="theme-color"]');
var theme='light';try{if(localStorage.getItem('tb-theme')==='dark')theme='dark'}catch(e){}
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* mesmo botão e mesma lógica da página principal: aria-pressed fica verdadeiro no claro; ao apertar, ele sobe e só então o tema troca */
function setTheme(value,animate){if(animate&&!reduce){root.classList.add('theme-anim');setTimeout(function(){root.classList.remove('theme-anim')},400)}root.setAttribute('data-theme',value);if(meta)meta.content=value==='dark'?'#000000':'#F5F5F7';if(button)button.setAttribute('aria-pressed',String(value!=='dark'))}
setTheme(theme);
if(button)button.addEventListener('click',function(){theme=root.getAttribute('data-theme')==='dark'?'light':'dark';try{localStorage.setItem('tb-theme',theme)}catch(e){}button.setAttribute('aria-pressed',String(theme==='light'));setTimeout(function(){setTheme(theme,true)},reduce?0:160)});
var year=document.getElementById('legal-year');if(year)year.textContent=new Date().getFullYear();
})();
