(function(){'use strict';
var Audio=window.AudioContext||window.webkitAudioContext,context,noise,lastTarget,lastAt=0;
if(!Audio)return;
function audio(){if(context)return context;context=new Audio();var size=Math.ceil(context.sampleRate*.035),data;noise=context.createBuffer(1,size,context.sampleRate);data=noise.getChannelData(0);var seed=314159;for(var i=0;i<size;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741823-1)*.6}return context}
function play(){if(document.hidden)return;try{var c=audio(),t=c.currentTime;if(c.state==='suspended')c.resume().catch(function(){});
var tap=c.createBufferSource(),filter=c.createBiquadFilter(),tapGain=c.createGain();tap.buffer=noise;filter.type='lowpass';filter.frequency.setValueAtTime(850,t);tapGain.gain.setValueAtTime(.0001,t);tapGain.gain.linearRampToValueAtTime(.15,t+.002);tapGain.gain.exponentialRampToValueAtTime(.0001,t+.031);tap.connect(filter).connect(tapGain).connect(c.destination);tap.start(t);tap.stop(t+.034);
var thud=c.createOscillator(),thudGain=c.createGain();thud.type='sine';thud.frequency.setValueAtTime(190,t);thud.frequency.exponentialRampToValueAtTime(125,t+.055);thudGain.gain.setValueAtTime(.0001,t);thudGain.gain.linearRampToValueAtTime(.11,t+.004);thudGain.gain.exponentialRampToValueAtTime(.0001,t+.06);thud.connect(thudGain).connect(c.destination);thud.start(t);thud.stop(t+.062)
}catch(e){}}
function control(target){return target&&target.closest&&target.closest('.sil,.ct-chip')}
function press(target){var el=control(target),now=performance.now();if(!el||el.closest('[disabled],[aria-disabled="true"],[inert]')||el.matches('.ct-chip')&&el.querySelector('input:disabled'))return;if(lastTarget===el&&now-lastAt<220)return;lastTarget=el;lastAt=now;play()}
document.addEventListener('pointerdown',function(e){if(e.button===0)press(e.target)},{passive:true});
document.addEventListener('keydown',function(e){if(e.repeat||e.key!=='Enter'&&e.key!==' '&&e.key!=='Spacebar')return;var el=control(e.target);if(el&&el.matches('a')&&e.key!=='Enter')return;press(e.target)});
document.addEventListener('click',function(e){if(e.isTrusted&&e.detail===0)press(e.target)})
})();
