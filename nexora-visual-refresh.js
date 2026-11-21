/* NEXORA cinematic visual layer. Preserves existing app/data logic. */
(()=>{'use strict';if(window.__NX_VISUAL_V1__)return;window.__NX_VISUAL_V1__=true;
const $=id=>document.getElementById(id);
const paths={
home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
discipline:'<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>',
study:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 5.5v17M8 7h8M8 11h8"/>',
mindful:'<path d="M2 8c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 7 0M2 14c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 7 0M2 20c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 7 0"/>',
timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>',
moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'};
const svg=(n)=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[n]}</svg>`;
function styles(){if($('nxVisualStyles'))return;let s=document.createElement('style');s.id='nxVisualStyles';s.textContent=`
:root{--nx-violet:#8b5cf6}
body{padding-bottom:calc(100px + env(safe-area-inset-bottom))!important}
.app{padding-bottom:calc(110px + env(safe-area-inset-bottom))!important}
.topbar{grid-template-columns:44px minmax(0,1fr) auto!important;min-height:76px!important}
.topbar .brandmark{width:38px;height:38px;border-radius:12px;background:linear-gradient(145deg,#d6a5ff,#853cff 55%,#4d24a8);box-shadow:0 0 22px #8b5cf688;font-size:0;animation:none}
.topbar .brandmark svg{width:28px;height:28px}
.topbar .brand-title{font-size:17px;letter-spacing:.14em}
#nxBottomNav{position:fixed!important;left:10px!important;right:10px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;width:auto!important;z-index:60!important;display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:4px!important;padding:8px!important;min-height:70px!important;border-radius:25px!important;background:color-mix(in srgb,var(--surface) 90%,transparent)!important;border:1px solid var(--line)!important;box-shadow:0 12px 38px #0003!important;backdrop-filter:blur(22px)!important}
#nxBottomNav .nx-nav-item{min-width:0!important;min-height:54px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;border:0!important;border-radius:17px!important;background:transparent!important;color:var(--muted)!important;padding:5px 2px!important;font-size:10px!important;font-weight:800!important}
#nxBottomNav .nx-nav-item b{font-size:0!important;display:grid!important;place-items:center!important}
#nxBottomNav .nx-nav-item.active{background:linear-gradient(145deg,#8b5cf6,#5b35ca)!important;color:#fff!important}
.nova-fab{bottom:calc(96px + env(safe-area-inset-bottom))!important;z-index:55!important}
.nova-panel{bottom:calc(164px + env(safe-area-inset-bottom))!important;z-index:56!important}
.mind-fab{display:none!important}
.nx-scene{position:relative;isolation:isolate;overflow:hidden;min-height:225px;margin:12px 0 18px;border-radius:27px;background-size:cover;background-position:center;box-shadow:0 18px 42px #1c144133;display:flex;align-items:flex-end;padding:22px;color:white}
.nx-scene:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,#08091dc9,transparent 80%)}
.nx-scene:after{content:"";position:absolute;inset:-30%;z-index:-1;background:radial-gradient(circle at 78% 22%,#ffffff40,transparent 18%);animation:nxGlow 9s ease-in-out infinite alternate}
.nx-scene-copy{max-width:92%;text-shadow:0 2px 12px #0008}
.nx-scene-kicker{font-size:10px;letter-spacing:.18em;font-weight:900;margin-bottom:8px}
.nx-scene h2{color:white!important;font-size:clamp(23px,5vw,32px);line-height:1.06;margin:0 0 7px!important}
.nx-scene p{color:#ffffffdf!important;font-size:13px;margin:0!important}
.nx-scene-home{background-image:url('./nexora-home-scene.png')}
.nx-scene-discipline{background-image:url('./nexora-discipline-scene.png');min-height:280px;background-position:center 38%}
.nx-scene-study{background-image:url('./nexora-study-scene.png');min-height:240px}
.nx-scene-mindful{background-image:url('./nexora-mindful-scene.png');min-height:250px}
body.dark .nx-scene{filter:brightness(.84) saturate(.95)}
.nx-bird{position:absolute;top:25%;left:-10%;width:22px;height:9px;border-top:2px solid white;border-radius:50%;animation:nxBird 18s linear infinite}
.nx-bird:after{content:"";position:absolute;left:10px;top:-2px;width:15px;height:8px;border-top:2px solid white;border-radius:50%;transform:rotate(-25deg)}
.nx-bird.b2{top:38%;animation-delay:-8s}
@keyframes nxGlow{to{transform:translate(5%,3%)}}
@keyframes nxBird{to{left:110%;top:12%}}
@media(prefers-reduced-motion:reduce){.nx-scene:after,.nx-bird{animation:none!important}}
`;document.head.append(s)}
function header(){let b=document.querySelector('.topbar .brand');if(b){let m=b.querySelector('.brandmark');if(!m){m=document.createElement('span');m.className='brandmark';b.prepend(m)}if(!m.querySelector('svg'))m.innerHTML='<svg viewBox="0 0 32 32" fill="none"><path d="M5 25V7l22 18V7" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'}document.querySelectorAll('.topbar .icon-btn').forEach(x=>{let t=(x.title||x.getAttribute('aria-label')||'').toLowerCase();if(x.id==='themeBtn'){let wanted=document.body.classList.contains('dark')?'sun':'moon';if(x.dataset.nxIcon!==wanted){x.innerHTML=svg(wanted);x.dataset.nxIcon=wanted}}else if(t.includes('stopwatch')||t.includes('timer')){if(x.dataset.nxIcon!=='timer'){x.innerHTML=svg('timer');x.dataset.nxIcon='timer'}}else if(t.includes('hub')||t.includes('menu')){if(x.dataset.nxIcon!=='menu'){x.innerHTML=svg('menu');x.dataset.nxIcon='menu'}}})}
function footer(){let n=$('nxBottomNav');if(!n)return;let current=[...n.querySelectorAll('.nx-nav-item')].map(x=>x.dataset.nxPage).join(',');if(current!=='home,disciplines,study,mind')n.innerHTML=[['home','home','Home'],['disciplines','discipline','Discipline'],['study','study','Study'],['mind','mindful','Mindful']].map(([p,i,l])=>`<button type="button" class="nx-nav-item" data-nx-page="${p}" onclick="window.nxVisualNavigate('${p}')"><b>${svg(i)}</b><span>${l}</span></button>`).join('');sync()}
window.nxVisualNavigate=p=>window.navigate?.(p==='mind'?'mind':p);
function sync(){let p=document.querySelector('.page.active')?.id?.replace(/Page$/,'')||'home';document.querySelectorAll('#nxBottomNav .nx-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nxPage===p))}
function scenes(){[['homePage','home','YOUR SPACE TO GROW','Your day. Your goals. Your next small win.'],['disciplinesPage','discipline','THE PATH OF DISCIPLINE','Arise, O Parth. Do your duty with focus.'],['studyPage','study','QUIET STUDY CORNER','Turn the page. Begin again.'],['mindPage','mindful','A MOMENT UNDERWATER','Slow down. Breathe. Let your thoughts drift like water.']].forEach(([id,k,t,d])=>{let p=$(id);if(!p||p.querySelector('.nx-scene'))return;let e=document.createElement('section');e.className='nx-scene nx-scene-'+k;e.innerHTML=(k==='home'?'<i class="nx-bird"></i><i class="nx-bird b2"></i>':'')+`<div class="nx-scene-copy"><div class="nx-scene-kicker">${t}</div><h2>${k==='discipline'?'Arise, O Parth.':k==='study'?'Turn the page. Begin again.':k==='mindful'?'Slow down. Breathe.':'NEXORA'}</h2><p>${d}</p></div>`;let h=p.querySelector('.page-head');h?h.insertAdjacentElement('afterend',e):p.prepend(e)})}
function run(){styles();header();footer();scenes();sync()}
function boot(){run();new MutationObserver(()=>run()).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('click',e=>{if(e.target.closest('#themeBtn'))setTimeout(run,80);if(e.target.closest('#nxBottomNav'))setTimeout(sync,100)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();