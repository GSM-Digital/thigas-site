(function(){'use strict';
var root=document.documentElement,button=document.getElementById('legal-theme');
var theme='light';try{if(localStorage.getItem('tb-theme')==='dark')theme='dark'}catch(e){}
function setTheme(value){root.setAttribute('data-theme',value);if(button){button.textContent=value==='dark'?'Modo claro':'Modo escuro';button.setAttribute('aria-label',value==='dark'?'Ativar modo claro':'Ativar modo escuro')}var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=value==='dark'?'#000000':'#F5F5F7'}
setTheme(theme);
if(button)button.addEventListener('click',function(){theme=root.getAttribute('data-theme')==='dark'?'light':'dark';try{localStorage.setItem('tb-theme',theme)}catch(e){}setTheme(theme)});
var year=document.getElementById('legal-year');if(year)year.textContent=new Date().getFullYear();
})();
