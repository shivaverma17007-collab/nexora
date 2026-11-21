/* NEXORA cinematic UI refresh — visual layer only.
   Preserves the existing app's navigation, auth, Supabase and data logic. */
(() => {
  'use strict';
  if (window.__NEXORA_CINEMATIC_UI__) return;
  window.__NEXORA_CINEMATIC_UI__ = true;

  const $ = (id) => document.getElementById(id);
  const pageMap = [
    ['home', 'homePage', 'Home', 'home'],
    ['disciplines', 'disciplinesPage', 'Discipline', 'discipline'],
    ['study', 'studyPage', 'Study', 'study'],
    ['mind', 'mindPage', 'Mindful', 'mindful']
  ];

  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    discipline: '<path d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
    study: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 5.5v17M8 7h8M8 11h8"/>',
    mindful: '<path d="M12 21c-4.5-2.4-7-5.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 12c0 3.8-2.5 6.6-7 9z"/><path d="M12 9v8m-4-4h8"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.home}</svg>`;

  function addStyles() {
    if ($('nxCinematicStyles')) return;
    const style = document.createElement('style');
    style.id = 'nxCinematicStyles';
    style.textContent = `
      :root{
        --nx-violet:#8b5cf6;--nx-violet-2:#6d3be8;--nx-lilac:#c4a7ff;
        --nx-ink:#19152b;--nx-muted:#77728b;--nx-line:rgba(103,83,155,.15);
        --nx-panel:rgba(255,255,255,.82);--nx-page:#f5f2fc;
        --nx-shadow:0 14px 40px rgba(49,31,91,.10);
      }
      body{background:var(--nx-page)!important;color:var(--nx-ink)!important}
      body.dark{
        --nx-ink:#f4efff;--nx-muted:#b3aacb;--nx-line:rgba(191,163,255,.16);
        --nx-panel:rgba(24,19,43,.88);--nx-page:#090817;
        --nx-shadow:0 18px 48px rgba(0,0,0,.32);
        background:radial-gradient(ellipse at 15% 0%,#27184a 0,transparent 34%),#090817!important;
      }
      .app,main{padding-bottom:calc(105px + env(safe-area-inset-bottom))!important}
      .topbar{
        position:sticky!important;top:0!important;z-index:100!important;
        display:grid!important;grid-template-columns:42px minmax(0,1fr) auto!important;
        align-items:center!important;gap:8px!important;padding:10px 13px!important;
        background:color-mix(in srgb,var(--nx-page) 86%,transparent)!important;
        border-bottom:1px solid var(--nx-line)!important;backdrop-filter:blur(20px)!important;
      }
      .topbar .brand{justify-self:center!important;gap:8px!important}
      .topbar .brandmark{
        width:34px!important;height:34px!important;display:grid!important;place-items:center!important;
        border-radius:0!important;background:transparent!important;box-shadow:none!important;
        color:var(--nx-violet)!important;font-size:0!important;animation:none!important;
      }
      .topbar .brandmark svg{width:32px;height:32px}
      .topbar .brand-title{font-size:16px!important;letter-spacing:.19em!important;color:var(--nx-ink)!important;font-weight:950!important}
      .topbar .top-actions{display:flex!important;align-items:center!important;gap:5px!important}
      .topbar .icon-btn,.nx-menu-left{
        width:39px!important;height:39px!important;min-width:39px!important;
        display:grid!important;place-items:center!important;border-radius:14px!important;
        background:var(--nx-panel)!important;border:1px solid var(--nx-line)!important;
        color:var(--nx-ink)!important;box-shadow:var(--nx-shadow)!important;font-size:0!important;
      }
      .topbar .icon-btn svg,.nx-menu-left svg{width:19px;height:19px}
      .topbar #headerProfileBtn{width:39px!important;height:39px!important;min-width:39px!important;
        max-width:39px!important;display:grid!important;place-items:center!important;padding:0!important;
        border-radius:50%!important;overflow:hidden!important;margin:0!important}
      .topbar #headerProfileBtn .profile-pill-text{display:none!important}
      .topbar #headerProfileBtn .avatar-ring{width:35px!important;height:35px!important}
      .topbar #headerProfileBtn.hide{display:none!important}
      .page{padding:12px 14px 22px!important;max-width:900px!important;margin:0 auto!important}
      .page-head{display:none!important}
      .nx-cine-hero{
        position:relative;isolation:isolate;overflow:hidden;min-height:285px;
        display:flex;align-items:flex-end;padding:22px 20px;margin:4px 0 19px;
        border-radius:28px;background-size:cover;background-position:center 42%;
        color:#fff;box-shadow:0 22px 55px rgba(20,12,49,.24);
      }
      .nx-cine-hero:before{content:"";position:absolute;inset:0;z-index:-1;
        background:linear-gradient(0deg,rgba(7,6,20,.94),rgba(7,6,20,.08) 78%),
                   linear-gradient(90deg,rgba(10,7,28,.28),transparent)}
      .nx-cine-hero:after{content:"";position:absolute;inset:0;z-index:-1;
        background:radial-gradient(circle at 80% 15%,rgba(255,255,255,.22),transparent 22%)}
      .nx-cine-copy{max-width:95%;text-shadow:0 2px 18px #0009}
      .nx-cine-kicker{font-size:10px;letter-spacing:.2em;font-weight:900;color:#e5d7ff;margin-bottom:8px}
      .nx-cine-title{font-size:clamp(27px,6vw,38px);line-height:1.04;font-weight:950;letter-spacing:-.045em;margin:0 0 9px;color:#fff}
      .nx-cine-sub{font-size:13px;line-height:1.5;color:#f4edff;margin:0;max-width:310px}
      .nx-cine-cta{display:inline-flex;align-items:center;gap:9px;margin-top:15px;padding:12px 17px;
        border-radius:99px;background:linear-gradient(120deg,#a56cff,#6b35e9);color:white;
        font-size:12px;font-weight:900;box-shadow:0 8px 28px #793cf477}
      .nx-cine-hero.home{background-image:url('./nexora-home-scene.jpg')}
      .nx-cine-hero.discipline{background-image:url('./nexora-discipline-scene.jpg');min-height:300px}
      .nx-cine-hero.study{background-image:url('./nexora-study-scene.jpg');min-height:255px}
      .nx-cine-hero.mindful{background-image:url('./nexora-mindful-scene.jpg');min-height:265px}
      body:not(.dark) .nx-cine-hero{box-shadow:0 18px 42px rgba(46,26,87,.17)}
      .nx-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:17px 2px 10px}
      .nx-section-title h2{font-size:17px;font-weight:950;letter-spacing:-.03em;margin:0;color:var(--nx-ink)}
      .nx-section-title span{font-size:10px;font-weight:800;color:var(--nx-violet)}
      .card,.hero,.smart-ticker,.nx-social-card,.nx-form-card,.nx-life-card,.nx-phase{
        background:var(--nx-panel)!important;border:1px solid var(--nx-line)!important;
        border-radius:21px!important;box-shadow:var(--nx-shadow)!important;color:var(--nx-ink)!important;
        backdrop-filter:blur(16px);
      }
      .card{padding:15px!important}
      .card h2,.card h3,.page h1,.page h2,.page h3{color:var(--nx-ink)}
      .sub,.item-meta,.nx-muted{color:var(--nx-muted)!important}
      .primary-btn,.nx-life-create,.nx-life-log{
        background:linear-gradient(120deg,#9b69ff,#6635df)!important;color:#fff!important;
        border:0!important;border-radius:14px!important;box-shadow:0 8px 22px #7541dc38!important;
      }
      .small-btn,.text-btn,.secondary-btn{border-radius:12px!important}
      input,textarea,select{
        background:color-mix(in srgb,var(--nx-panel) 82%,var(--nx-page))!important;
        color:var(--nx-ink)!important;border:1px solid var(--nx-line)!important;border-radius:13px!important;
      }
      #nxBottomNav{
        position:fixed!important;left:10px!important;right:10px!important;bottom:max(8px,env(safe-area-inset-bottom))!important;
        width:auto!important;max-width:620px!important;margin:auto!important;z-index:99990!important;
        display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;
        padding:7px!important;min-height:68px!important;border:1px solid var(--nx-line)!important;
        border-radius:23px!important;background:color-mix(in srgb,var(--nx-panel) 92%,transparent)!important;
        box-shadow:0 12px 40px rgba(8,5,25,.2)!important;backdrop-filter:blur(24px)!important;
      }
      #nxBottomNav .nx-nav-item{
        display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;
        gap:4px!important;min-width:0!important;min-height:53px!important;max-width:none!important;flex:1 1 0!important;
        border:0!important;border-radius:16px!important;background:transparent!important;color:var(--nx-muted)!important;
        padding:5px 2px!important;font-size:10px!important;font-weight:850!important;
      }
      #nxBottomNav .nx-nav-item b{display:grid!important;place-items:center!important;font-size:0!important;line-height:1}
      #nxBottomNav .nx-nav-item b svg{width:21px;height:21px}
      #nxBottomNav .nx-nav-item span{font-size:10px!important}
      #nxBottomNav .nx-nav-item.active{background:linear-gradient(135deg,#8e5af4,#6131d8)!important;color:#fff!important}
      .nova-fab{bottom:calc(95px + env(safe-area-inset-bottom))!important}
      .nova-panel{bottom:calc(160px + env(safe-area-inset-bottom))!important}
      .mind-fab{display:none!important}
      .nx-life-welcome{border-radius:24px!important}
      .nx-life-actions{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .nx-life-action{border-radius:18px!important;background:var(--nx-panel)!important;border:1px solid var(--nx-line)!important;color:var(--nx-ink)!important}
      .nx-life-icon{border-radius:13px!important}
      .nx-scene-hidden{display:none!important}
      @media(min-width:650px){
        .page{padding:20px 22px 28px!important}
        .nx-cine-hero{min-height:360px;padding:28px}
        .nx-cine-hero.discipline{min-height:390px}
      }
      @media(max-width:390px){
        .topbar{gap:5px!important;padding:8px 9px!important}
        .topbar .brand-title{font-size:14px!important}
        .nx-cine-hero{min-height:260px;padding:18px}
        .nx-cine-hero.discipline{min-height:270px}
        #nxBottomNav{left:7px!important;right:7px!important;padding:5px!important}
      }
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function makeBrand() {
    const mark = document.querySelector('.topbar .brandmark');
    if (mark && !mark.querySelector('svg')) mark.innerHTML = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 33C5 28 5 15 12 11c4-2 7 1 8 5 1-4 4-7 8-5 7 4 7 17-8 22Z"/><path d="M20 33V17M12 22l8 5 8-5M8 16l-4-4m28 4 4-4"/></svg>`;
    const header = document.querySelector('.topbar');
    const actions = document.querySelector('.topbar .top-actions');
    if (!header || !actions) return;
    let menu = actions.querySelector('[aria-label="Open NEXORA Hub"]');
    if (menu && !menu.classList.contains('nx-menu-left')) {
      menu.classList.add('nx-menu-left');
      header.insertBefore(menu, header.firstChild);
      if (!menu.querySelector('svg')) menu.innerHTML = svg('menu');
    }
    const profile = $('headerProfileBtn');
    if (profile && profile.parentElement !== actions) actions.appendChild(profile);
    const timer = actions.querySelector('[title*="Timer"]');
    if (timer && !timer.querySelector('svg')) timer.innerHTML = svg('timer');
    const theme = $('themeBtn');
    const wantedThemeIcon = document.body.classList.contains('dark') ? 'sun' : 'moon';
    if (theme && theme.dataset.nxIcon !== wantedThemeIcon) {
      theme.innerHTML = svg(wantedThemeIcon);
      theme.dataset.nxIcon = wantedThemeIcon;
    }
  }

  function buildHero(pageId, key, kicker, title, subtitle, cta, action) {
    const page = $(pageId);
    if (!page || page.querySelector('.nx-cine-hero')) return;
    const hero = document.createElement('section');
    hero.className = `nx-cine-hero ${key}`;
    hero.innerHTML = `<div class="nx-cine-copy"><div class="nx-cine-kicker">${kicker}</div><h2 class="nx-cine-title">${title}</h2><p class="nx-cine-sub">${subtitle}</p>${cta ? `<button class="nx-cine-cta" type="button" onclick="${action}">${cta} <span aria-hidden="true">→</span></button>` : ''}</div>`;
    const head = page.querySelector('.page-head');
    if (head) head.insertAdjacentElement('afterend', hero); else page.prepend(hero);
  }

  function buildNav() {
    let nav = $('nxBottomNav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'nxBottomNav';
      nav.setAttribute('aria-label','Main navigation');
      document.body.appendChild(nav);
    }
    const markup = pageMap.map(([route,,label,icon]) =>
      `<button type="button" class="nx-nav-item" data-nx-page="${route}" onclick="window.nxCinematicNavigate('${route}')"><b>${svg(icon)}</b><span>${label}</span></button>`
    ).join('');
    const current = [...nav.querySelectorAll('.nx-nav-item')].map(x => x.dataset.nxPage).join(',');
    const expected = pageMap.map(x => x[0]).join(',');
    if (nav.dataset.nxCinematic !== '1' || current !== expected) {
      nav.innerHTML = markup;
      nav.dataset.nxCinematic = '1';
    }
    syncNav();
  }

  window.nxCinematicNavigate = function(route) {
    const map = {home:'home',disciplines:'disciplines',study:'study',mind:'mind'};
    const actual = map[route] || route;
    if (typeof window.navigate === 'function') window.navigate(actual);
    setTimeout(syncNav, 80);
  };

  function syncNav() {
    const activeId = document.querySelector('.page.active')?.id || 'homePage';
    const route = activeId.replace(/Page$/,'');
    document.querySelectorAll('#nxBottomNav .nx-nav-item').forEach(btn => {
      const key = btn.dataset.nxPage;
      btn.classList.toggle('active', key === route);
    });
  }

  function buildScenes() {
    buildHero('homePage','home','YOUR SPACE TO GROW','Discipline today.<br>Freedom tomorrow.','A calmer mind. A stronger you. Build your life one small promise at a time.','Explore My Trackers',"window.navigate('trackers')");
    buildHero('disciplinesPage','discipline','THE PATH OF DISCIPLINE','Arise, O Parth.','Small duties, done with focus, become a life of strength.','Begin today',"window.navigate('trackers')");
    buildHero('studyPage','study','YOUR QUIET STUDY SPACE','Learn deeply.<br>Grow endlessly.','A focused corner for reading, revision and meaningful progress.','Start a focus session',"window.openModal && window.openModal('clockModal')");
    buildHero('mindPage','mindful','PAUSE · RESET · RETURN','Breathe. Be present.','Let the noise settle. Give yourself a moment under the water.','Start meditation',"window.navigate('meditation')");
  }

  function cleanLegacyHome() {
    const page = $('homePage');
    if (!page) return;
    // Keep the functional tracker entry and existing live data, but remove duplicate clutter cards.
    page.querySelectorAll('.nx-life-actions .nx-life-action').forEach(btn => {
      const txt = (btn.innerText || '').toLowerCase();
      if (!/tracker|study|meditat|mind/.test(txt)) btn.classList.add('nx-scene-hidden');
    });
  }

  function run() {
    addStyles();
    makeBrand();
    buildScenes();
    buildNav();
    cleanLegacyHome();
    syncNav();
  }

  function boot() {
    run();
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; run(); });
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('click', e => {
      if (e.target.closest('#themeBtn')) setTimeout(run,100);
      if (e.target.closest('#nxBottomNav')) setTimeout(syncNav,100);
    }, true);
    window.addEventListener('pageshow',run);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();