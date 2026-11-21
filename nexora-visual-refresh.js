/* NEXORA Visual Refresh v1 — additive presentation layer
   Load after nexora-experience.js. Keeps the existing data/auth functions intact. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const style = document.createElement('style');
  style.id = 'nexoraVisualRefreshStyles';
  style.textContent = `
    :root{--nx-accent:#7653e8;--nx-glow:rgba(118,83,232,.22)}
    body{--primary:var(--nx-accent);--primary-soft:color-mix(in srgb,var(--nx-accent) 13%,var(--surface));}
    body.nx-visual{background:var(--bg)}
    body.nx-visual .app{max-width:760px;padding-bottom:104px}
    body.nx-visual .topbar{border-radius:0 0 20px 20px}
    body.nx-visual .brandmark{background:linear-gradient(145deg,#b9a3ff,#7653e8 60%,#43269b);border-radius:13px}
    body.nx-visual .brandmark:after{content:'N';font-weight:950}
    body.nx-visual .brandmark{font-size:0}
    body.nx-visual .hero,body.nx-visual .card{transition:transform .22s ease,box-shadow .22s ease}
    body.nx-visual .card{border-radius:22px}
    .nx-bottom-nav{position:fixed;z-index:1000;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(720px,calc(100% - 22px));display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:8px;border:1px solid var(--line);border-radius:23px;background:color-mix(in srgb,var(--surface) 88%,transparent);backdrop-filter:blur(18px);box-shadow:0 12px 38px rgba(15,10,35,.18)}
    .nx-bottom-nav button{min-width:0;display:grid;place-items:center;gap:2px;padding:7px 3px;border-radius:15px;background:transparent;color:var(--muted);font-size:10px;font-weight:800}
    .nx-bottom-nav button b{font-size:20px;line-height:1.2}.nx-bottom-nav button.active{background:var(--primary-soft);color:var(--primary)}
    .nx-discipline-hero{position:relative;min-height:390px;overflow:hidden;border-radius:26px;margin:8px 0 18px;background:#101b42 url('./nexora-krishna-parth.png') center 36%/cover no-repeat;color:#fff;display:flex;align-items:flex-end;box-shadow:0 18px 42px rgba(30,24,74,.25)}
    .nx-discipline-hero:before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,10,30,.03) 18%,rgba(7,10,30,.22) 48%,rgba(7,10,30,.91) 100%)}
    .nx-discipline-copy{position:relative;z-index:1;padding:22px;width:100%}.nx-discipline-copy .nx-kicker{font-size:10px;letter-spacing:.18em;font-weight:900;color:#f6d99c}.nx-discipline-copy h1{color:#fff;font-size:28px;margin:7px 0}.nx-discipline-copy p{color:#f1e9dc;font-size:13px;line-height:1.55;margin:0 0 14px;max-width:440px}.nx-gita-line{font-family:Georgia,serif;font-size:17px;color:#ffe5ad;margin:0 0 13px}
    .nx-birds{position:relative;height:32px;overflow:hidden;margin:4px 0 10px;pointer-events:none}.nx-birds span{position:absolute;left:-10%;font-size:20px;animation:nxFly 17s linear infinite;filter:drop-shadow(0 2px 4px #0002)}.nx-birds span:nth-child(2){top:8px;animation-duration:23s;animation-delay:-8s;font-size:15px}.nx-birds span:nth-child(3){top:0;animation-duration:20s;animation-delay:-13s;font-size:17px}@keyframes nxFly{to{left:110%;transform:translateY(-7px) rotate(4deg)}}
    .nx-study-scene{position:relative;overflow:hidden;min-height:170px;border-radius:22px;margin:14px 0;padding:20px;background:linear-gradient(135deg,#211a3a,#45316b 55%,#b18a55);color:#fff;box-shadow:0 14px 32px rgba(45,30,70,.2)}.nx-study-scene:after{content:'📚';position:absolute;right:16px;bottom:10px;font-size:68px;opacity:.5}.nx-study-scene h3{color:#fff;font-family:Georgia,serif;font-size:22px}.nx-book{position:relative;z-index:1;width:190px;height:95px;margin:14px auto 0;perspective:600px}.nx-book-page{position:absolute;top:0;width:50%;height:100%;background:linear-gradient(110deg,#fff5d9,#d9c49c);border:1px solid #b9a47d;box-shadow:0 5px 12px #140d2680;transform-origin:right center;border-radius:5px 2px 2px 5px}.nx-book-page.right{left:50%;transform-origin:left center;border-radius:2px 5px 5px 2px}.nx-book-page.turn{animation:nxPageTurn 3.6s ease-in-out infinite}.nx-book-page.right{animation-delay:1.8s}@keyframes nxPageTurn{0%,15%{transform:rotateY(0)}48%,60%{transform:rotateY(-155deg)}85%,100%{transform:rotateY(0)}}
    .nx-lofi{display:flex;align-items:center;gap:12px;padding:13px 15px;border:1px solid var(--line);border-radius:18px;background:var(--surface);color:var(--ink)}.nx-lofi-art{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#9a7be8,#332456);color:#fff;font-size:22px}.nx-lofi small{display:block;color:var(--muted);font-size:10px;margin-top:3px}
    .nx-underwater{position:relative;overflow:hidden;min-height:190px;border-radius:23px;margin:12px 0;background:radial-gradient(ellipse at 50% 0%,#5bc5ef 0%,#12649a 42%,#08213e 100%);color:#fff;padding:18px}.nx-underwater:before,.nx-underwater:after{content:'';position:absolute;inset:auto -10% -45px;height:100px;background:radial-gradient(ellipse,#36c5b3aa,transparent 65%);filter:blur(8px)}.nx-fish{position:absolute;font-size:25px;animation:nxSwim 12s ease-in-out infinite alternate}.nx-fish.f2{top:88px;left:65%;animation-delay:-4s;font-size:19px}.nx-fish.f3{top:130px;left:24%;animation-delay:-7s;font-size:16px}@keyframes nxSwim{from{transform:translateX(-24px) scaleX(1)}to{transform:translateX(65px) scaleX(-1)}}.nx-bubble{position:absolute;bottom:-12px;width:7px;height:7px;border:1px solid #d9f8ff;border-radius:50%;animation:nxBubble 7s linear infinite}.nx-bubble.b2{left:70%;animation-delay:-3s}.nx-bubble.b3{left:42%;animation-delay:-5s}@keyframes nxBubble{to{transform:translateY(-210px);opacity:0}}
    body.dark .nx-study-scene{box-shadow:0 16px 38px rgba(0,0,0,.28)}
    @media(prefers-reduced-motion:reduce){.nx-birds span,.nx-book-page,.nx-fish,.nx-bubble{animation:none!important}}
    @media(max-width:420px){.nx-discipline-hero{min-height:355px;background-position:42% center}.nx-discipline-copy h1{font-size:25px}}
  `;
  document.head.appendChild(style);

  function makeNav(){
    if ($('nxVisualBottomNav')) return;
    const nav=document.createElement('nav');nav.id='nxVisualBottomNav';nav.className='nx-bottom-nav';nav.setAttribute('aria-label','Main navigation');
    const items=[['home','⌂','Home'],['disciplines','✦','Discipline'],['study','▤','Study'],['mind','◌','Mindful']];
    items.forEach(([page,icon,label])=>{const b=document.createElement('button');b.type='button';b.dataset.page=page;b.innerHTML=`<b aria-hidden="true">${icon}</b><span>${label}</span>`;b.addEventListener('click',()=>{if(typeof window.navigate==='function')window.navigate(page);setActive(page)});nav.appendChild(b)});
    document.body.appendChild(nav);setActive('home');
  }
  function setActive(page){document.querySelectorAll('#nxVisualBottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page))}
  function simplifyHub(){document.querySelectorAll('.hub-link').forEach(b=>{const p=b.dataset.page;if(!['home','disciplines','study','mind'].includes(p))b.hidden=true});}
  function addDisciplineScene(){const page=$('disciplinesPage');if(!page||$('nxDisciplineHero'))return;const oldHead=page.querySelector('.page-head');if(oldHead)oldHead.hidden=true;const hero=document.createElement('section');hero.id='nxDisciplineHero';hero.className='nx-discipline-hero';hero.innerHTML=`<div class="nx-discipline-copy"><div class="nx-kicker">DISCIPLINE · DHARMA · DAILY ACTION</div><h1>Utho, Parth.</h1><div class="nx-gita-line">“Karmanye vadhikaraste…”</div><p>Shri Krishna ke margdarshan se prerna lo. Apna kartavya chuno, chhote kadam lo, aur har din apne lakshya ki taraf badho.</p><button class="primary-btn" type="button" onclick="document.getElementById('disciplineList')?.scrollIntoView({behavior:'smooth',block:'start'})">Begin your discipline</button></div>`;page.insertBefore(hero,page.firstChild);}
  function addHomeBirds(){const home=$('homePage');if(!home||$('nxHomeBirds'))return;const birds=document.createElement('div');birds.id='nxHomeBirds';birds.className='nx-birds';birds.innerHTML='<span>🕊️</span><span>🕊️</span><span>🕊️</span>';const head=home.querySelector('.page-head');if(head)head.after(birds);}
  function addStudyScene(){const page=$('studyPage');if(!page||$('nxStudyScene'))return;const scene=document.createElement('section');scene.id='nxStudyScene';scene.className='nx-study-scene';scene.innerHTML='<div class="eyebrow" style="color:#e8d8ff">QUIET STUDY CORNER</div><h3>Turn the page. Begin again.</h3><div class="nx-book" aria-label="Animated open book"><span class="nx-book-page turn"></span><span class="nx-book-page right"></span></div>';const head=page.querySelector('.page-head');if(head)head.after(scene);const lofi=document.createElement('div');lofi.className='nx-lofi';lofi.innerHTML='<div class="nx-lofi-art">♫</div><div style="flex:1;min-width:0"><b>Lo-fi study room</b><small>Ambient music player · audio track can be added in the next pass</small></div><span aria-hidden="true">♪</span>';scene.after(lofi);}
  function addMindScene(){const page=$('mindPage');if(!page||$('nxUnderwater'))return;const water=document.createElement('section');water.id='nxUnderwater';water.className='nx-underwater';water.innerHTML='<div style="position:relative;z-index:2"><div class="eyebrow" style="color:#c9f3ff">A MOMENT UNDERWATER</div><h2 style="color:#fff;margin:7px 0">Slow down. Breathe.</h2><p style="color:#d9f6ff;font-size:12px;margin:0">Let your thoughts drift like water.</p></div><span class="nx-fish">🐠</span><span class="nx-fish f2">🐟</span><span class="nx-fish f3">🐠</span><i class="nx-bubble" style="left:15%"></i><i class="nx-bubble b2"></i><i class="nx-bubble b3"></i>';const head=page.querySelector('.page-head');if(head)head.after(water);}
  function boot(){document.body.classList.add('nx-visual');makeNav();simplifyHub();addDisciplineScene();addHomeBirds();addStudyScene();addMindScene();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  const originalNavigate=window.navigate;
  if(typeof originalNavigate==='function')window.navigate=function(page){const result=originalNavigate.apply(this,arguments);if(result)setActive(page);return result};
})();
