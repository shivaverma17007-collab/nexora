/*
 * NEXORA Visual Refresh v3 — single UI owner
 * Replaces the competing presentation code from the earlier visual refresh.
 * Keeps the existing index.html application state, tracker engine, account/auth,
 * Supabase and feature pages. This file deliberately changes presentation only.
 */
(() => {
  'use strict';
  if (window.__NEXORA_VISUAL_REFRESH_V3__) return;
  window.__NEXORA_VISUAL_REFRESH_V3__ = true;

  const $ = (id) => document.getElementById(id);
  const appState = () => (typeof state !== 'undefined' && state) ? state : {};
  const svgPaths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    discipline: '<path d="M12 21V8m0 0C7 3 3 5 3 10c4 0 7 1 9 6m0-8c5-5 9-3 9 2-4 0-7 1-9 6"/><path d="M7 21h10"/>',
    study: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 5.5v17M8 7h8M8 11h8"/>',
    mindful: '<path d="M12 21c-4.5-2.4-7-5.2-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 12c0 3.8-2.5 6.6-7 9z"/><path d="M12 9v8m-4-4h8"/>',
    tracker: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="m15.5 8.5 5-5m-3 0h3v3"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/>',
    moon: '<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5z"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M4 5.5v17"/>',
    leaf: '<path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-6 8-16Z"/><path d="M4 21c3-5 7-8 13-12"/>',
    check: '<path d="m5 12 4 4L19 6"/>'
  };
  const icon = (name, extra = '') => `<svg viewBox="0 0 24 24" ${extra} aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${svgPaths[name] || svgPaths.home}</svg>`;

  const pages = [
    { id: 'homePage', route: 'home', key: 'home', label: 'Home', icon: 'home', kicker: 'YOUR SPACE TO GROW', title: 'Discipline today.<br>Freedom tomorrow.', copy: 'A calmer mind. A stronger you. Build your life one small promise at a time.', cta: 'Open My Trackers', action: 'trackers', note: 'Your goals deserve one clear home.' },
    { id: 'disciplinesPage', route: 'disciplines', key: 'discipline', label: 'Discipline', icon: 'discipline', kicker: 'THE PATH OF DISCIPLINE', title: 'Arise, O Parth.', copy: 'Let purpose guide your effort. Build lasting habits through a gentle, guided journey.', cta: 'Continue your journey', action: 'journey', note: 'Consistency without guilt. Continue at your pace.' },
    { id: 'studyPage', route: 'study', key: 'study', label: 'Study', icon: 'study', kicker: 'YOUR QUIET STUDY SPACE', title: 'Learn deeply.<br>Grow endlessly.', copy: 'A focused corner for reading, revision and meaningful progress.', cta: 'Start a focus session', action: 'timer', note: 'Make room for deep work, one session at a time.' },
    { id: 'mindPage', route: 'mind', key: 'mindful', label: 'Mindful', icon: 'mindful', kicker: 'PAUSE · RESET · RETURN', title: 'Breathe. Be present.', copy: 'Step into a quieter space. Follow your breath and let the noise settle.', cta: 'Start breathing', action: 'breathing', note: 'You do not need to solve everything right now.' }
  ];

  const css = `
    body.nx-v3-ui {
      --v3-bg:#100d19; --v3-surface:#1d182b; --v3-surface2:#282138;
      --v3-ink:#f7f2ff; --v3-muted:#aaa0bb; --v3-line:#393047;
      --v3-primary:#a879f1; --v3-primary2:#7546d0; --v3-gold:#e6c17c;
      --v3-shadow:0 14px 36px rgba(0,0,0,.26);
      background:radial-gradient(ellipse at 16% 0%,rgba(88,52,146,.24),transparent 34%),var(--v3-bg)!important;
      color:var(--v3-ink)!important;
    }
    body.nx-v3-ui:not(.dark) {
      --v3-bg:#f6f3fb; --v3-surface:#fff; --v3-surface2:#f0ecf8;
      --v3-ink:#211a32; --v3-muted:#837a93; --v3-line:#e7e0f0;
      --v3-primary:#7550c9; --v3-primary2:#9a70ed; --v3-gold:#a67c39;
      --v3-shadow:0 12px 34px rgba(43,27,72,.08);
      background:radial-gradient(ellipse at 88% 0%,rgba(205,183,244,.20),transparent 32%),var(--v3-bg)!important;
    }
    body.nx-v3-ui,body.nx-v3-ui button,body.nx-v3-ui input,body.nx-v3-ui textarea,body.nx-v3-ui select{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    body.nx-v3-ui{min-height:100vh;overflow-x:hidden}
    body.nx-v3-ui .app{max-width:900px;padding:0 15px calc(116px + env(safe-area-inset-bottom));margin:auto}
    body.nx-v3-ui .topbar{height:auto;min-height:68px;display:grid!important;grid-template-columns:42px minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px 13px;margin:0 -15px 8px;position:sticky;top:0;z-index:100;background:color-mix(in srgb,var(--v3-bg) 90%,transparent)!important;border-bottom:1px solid var(--v3-line)!important;box-shadow:0 6px 22px rgba(25,15,42,.05);backdrop-filter:blur(20px)}
    body.nx-v3-ui .topbar>.brand{justify-self:center;gap:8px;min-width:0}
    body.nx-v3-ui .topbar .brandmark{width:35px;height:35px;border-radius:0;background:transparent;box-shadow:none;color:var(--v3-primary);font-size:0;animation:none;text-shadow:none;display:grid;place-items:center}
    body.nx-v3-ui .topbar .brandmark svg{width:35px;height:35px;display:block}
    body.nx-v3-ui .topbar .brand-title{font-size:15px;letter-spacing:.19em;font-weight:950;color:var(--v3-ink)}
    body.nx-v3-ui .topbar .top-actions{display:flex;align-items:center;justify-self:end;gap:6px;min-width:0}
    body.nx-v3-ui .topbar .icon-btn,body.nx-v3-ui .nx-menu-left{width:39px;height:39px;min-width:39px;padding:0;display:grid;place-items:center;border-radius:14px;background:var(--v3-surface)!important;border:1px solid var(--v3-line)!important;color:var(--v3-ink)!important;box-shadow:0 4px 14px rgba(37,22,58,.07);font-size:0}
    body.nx-v3-ui .topbar .icon-btn svg,body.nx-v3-ui .nx-menu-left svg{width:20px;height:20px}
    body.nx-v3-ui .topbar #headerProfileBtn{width:40px;height:40px;min-width:40px;max-width:40px;display:grid;place-items:center;padding:2px;overflow:hidden;border-radius:50%;margin:0;background:var(--v3-surface)!important;border:2px solid var(--v3-primary)!important}
    body.nx-v3-ui .topbar #headerProfileBtn .profile-pill-text{display:none!important}
    body.nx-v3-ui .topbar #headerProfileBtn .avatar-ring{width:34px;height:34px}
    body.nx-v3-ui .nx-menu-left{grid-column:1;grid-row:1}
    body.nx-v3-ui .page{max-width:900px;margin:0 auto;padding:10px 1px 28px;animation:v3Enter .22s ease both}
    body.nx-v3-ui .page-head{display:none!important}
    body.nx-v3-ui h1,body.nx-v3-ui h2,body.nx-v3-ui h3{color:var(--v3-ink);letter-spacing:-.025em}
    body.nx-v3-ui .sub,body.nx-v3-ui .item-meta,body.nx-v3-ui .nx-muted{color:var(--v3-muted)!important}
    body.nx-v3-ui .card,body.nx-v3-ui .nx-social-card,body.nx-v3-ui .nx-form-card,body.nx-v3-ui .nx-page-wrap>*,body.nx-v3-ui .nx-phase,body.nx-v3-ui .nx-life-card{background:var(--v3-surface)!important;color:var(--v3-ink)!important;border:1px solid var(--v3-line)!important;border-radius:21px!important;box-shadow:var(--v3-shadow)!important}
    body.nx-v3-ui .card{padding:17px!important}
    body.nx-v3-ui .section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 2px 11px}
    body.nx-v3-ui .section-head h2{font-size:17px;font-weight:900;margin:0}
    body.nx-v3-ui .primary-btn,body.nx-v3-ui .nx-life-create,body.nx-v3-ui .nx-life-log{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:11px 16px;background:linear-gradient(120deg,var(--v3-primary),var(--v3-primary2))!important;color:#fff!important;border:0;border-radius:14px;font-size:13px;font-weight:850;box-shadow:0 8px 22px rgba(117,80,201,.22)}
    body.nx-v3-ui .secondary-btn,body.nx-v3-ui .small-btn{border-radius:13px;font-weight:800;background:color-mix(in srgb,var(--v3-primary) 14%,var(--v3-surface))!important;color:var(--v3-primary)!important;border:1px solid var(--v3-line)!important;min-height:40px}
    body.nx-v3-ui .text-btn{color:var(--v3-primary)!important}
    body.nx-v3-ui .field{gap:7px;margin:12px 0}
    body.nx-v3-ui .field label{font-size:12px;font-weight:800;color:var(--v3-ink)}
    body.nx-v3-ui .field input,body.nx-v3-ui .field textarea,body.nx-v3-ui .field select,body.nx-v3-ui input,body.nx-v3-ui textarea,body.nx-v3-ui select{background:var(--v3-surface2)!important;color:var(--v3-ink)!important;border:1px solid var(--v3-line)!important;border-radius:13px}
    body.nx-v3-ui .field input,body.nx-v3-ui .field textarea,body.nx-v3-ui .field select{min-height:45px;padding:11px 13px}
    body.nx-v3-ui .item{background:var(--v3-surface2)!important;border:1px solid var(--v3-line)!important;border-radius:16px;padding:12px}
    body.nx-v3-ui .progress{background:var(--v3-surface2);height:9px;border-radius:99px}
    body.nx-v3-ui .progress i{background:linear-gradient(90deg,var(--v3-primary),var(--v3-gold));border-radius:99px}
    .nx-v3-hero{position:relative;isolation:isolate;overflow:hidden;min-height:292px;display:flex;align-items:flex-end;margin:5px 0 18px;padding:22px;border:1px solid rgba(255,255,255,.18);border-radius:27px;background-size:cover;background-position:center 48%;color:#fff;box-shadow:0 20px 52px rgba(22,12,42,.20)}
    .nx-v3-hero:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(8,7,20,.86) 0%,rgba(8,7,20,.58) 50%,rgba(8,7,20,.12) 100%),linear-gradient(0deg,rgba(7,6,18,.60),transparent 64%)}
    .nx-v3-hero:after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 80% 15%,rgba(255,255,255,.15),transparent 22%)}
    .nx-v3-hero.home{min-height:320px;background-image:url('./nexora-home-scene.jpg');background-position:center 42%}
    .nx-v3-hero.discipline{min-height:315px;background-image:url('./nexora-discipline-scene.png');background-position:56% 50%}
    .nx-v3-hero.study{min-height:290px;background-image:url('./nexora-study-scene.png');background-position:center 54%}
    .nx-v3-hero.mindful{min-height:290px;background-image:url('./nexora-mindful-scene.png');background-position:center 50%}
    .nx-v3-hero-copy{width:100%;max-width:470px;text-shadow:0 2px 18px rgba(0,0,0,.48)}
    .nx-v3-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:11px;color:#eadcff;font-size:10px;font-weight:950;letter-spacing:.19em;text-transform:uppercase}
    .nx-v3-kicker:before{content:"";width:22px;height:2px;background:#d6b474;border-radius:99px}
    .nx-v3-title{margin:0 0 10px!important;color:#fff!important;font-size:clamp(29px,6.5vw,43px)!important;line-height:1.04!important;font-weight:950!important;letter-spacing:-.045em!important;max-width:450px}
    .nx-v3-copy{max-width:390px;margin:0;color:#f5efff;font-size:14px;line-height:1.55}
    .nx-v3-hero-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
    .nx-v3-hero-btn{min-height:47px;padding:12px 18px;display:inline-flex;align-items:center;gap:10px;border-radius:99px;background:linear-gradient(120deg,#a77af2,#7042ca);color:#fff;font-size:13px;font-weight:900;box-shadow:0 8px 25px rgba(89,43,164,.40)}
    .nx-v3-hero-btn svg{width:17px;height:17px}
    .nx-v3-hero-note{align-self:center;margin-left:auto;max-width:190px;padding:13px 14px;border:1px solid rgba(255,255,255,.28);border-radius:17px;background:rgba(15,11,29,.44);backdrop-filter:blur(12px);color:#fff;font-size:12px;line-height:1.5}
    .nx-v3-hero-note b{display:block;color:#f4d9a1;font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-top:6px}
    #homePage>#nxV3Home{display:grid}
    #homePage>*:not(.page-head):not(.nx-v3-hero):not(#nxV3Home){display:none!important}
    #nxHomeDashboard,#nxLifeHome,#nxV2Home,.nx-home-dashboard,.nx-home-actions,.nx-life-actions{display:none!important}
    #nxV3Home{display:grid;gap:14px;margin:0 0 18px}
    .nx-v3-welcome{padding:2px 2px 0}
    .nx-v3-overline{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:950;color:var(--v3-primary)}
    .nx-v3-greeting{margin:5px 0 3px!important;font-size:clamp(22px,5.2vw,27px)!important;font-weight:950!important;line-height:1.12}
    .nx-v3-subline{margin:0;color:var(--v3-muted);font-size:13px;line-height:1.45}
    .nx-v3-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .nx-v3-stat{min-width:0;padding:14px 12px;border:1px solid var(--v3-line);border-radius:19px;background:var(--v3-surface);box-shadow:var(--v3-shadow)}
    .nx-v3-stat b{display:block;color:var(--v3-ink);font-size:24px;line-height:1.1;font-weight:950;letter-spacing:-.04em}
    .nx-v3-stat span{display:block;margin-top:7px;color:var(--v3-muted);font-size:11px;font-weight:750;line-height:1.3}
    .nx-v3-tracker-cta{width:100%;min-width:0;display:flex;align-items:center;gap:14px;text-align:left;padding:17px;border-radius:23px;border:1px solid color-mix(in srgb,var(--v3-primary) 30%,var(--v3-line));background:linear-gradient(120deg,color-mix(in srgb,var(--v3-primary) 13%,var(--v3-surface)),var(--v3-surface));box-shadow:var(--v3-shadow);color:var(--v3-ink)}
    .nx-v3-tracker-icon{width:60px;height:60px;flex:none;display:grid;place-items:center;border-radius:19px;background:linear-gradient(145deg,var(--v3-primary),var(--v3-primary2));color:#fff;box-shadow:0 9px 21px rgba(117,80,201,.25)}
    .nx-v3-tracker-icon svg{width:28px;height:28px}
    .nx-v3-tracker-copy{flex:1;min-width:0}
    .nx-v3-tracker-copy small{display:block;color:var(--v3-primary);font-size:10px;font-weight:950;letter-spacing:.14em}
    .nx-v3-tracker-copy strong{display:block;margin:4px 0;font-size:21px;font-weight:950}
    .nx-v3-tracker-copy span{display:block;color:var(--v3-muted);font-size:12px;line-height:1.45;overflow-wrap:anywhere}
    .nx-v3-tracker-arrow{width:23px;height:23px;flex:none;color:var(--v3-primary)}
    .nx-v3-quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .nx-v3-quick{min-width:0;min-height:100px;padding:13px 11px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;text-align:left;border:1px solid var(--v3-line);border-radius:19px;background:var(--v3-surface);color:var(--v3-ink);box-shadow:var(--v3-shadow)}
    .nx-v3-quick svg{width:23px;height:23px;color:var(--v3-primary)}
    .nx-v3-quick strong{font-size:12px;font-weight:900;line-height:1.25}
    .nx-v3-quick span{font-size:10px;color:var(--v3-muted);line-height:1.25}
    .nx-v3-task-wrap{display:grid;gap:9px}
    .nx-v3-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:3px 2px 0}
    .nx-v3-section-title h2{font-size:17px;font-weight:950;margin:0}
    .nx-v3-section-title span{font-size:10px;color:var(--v3-muted)}
    #nxV3TaskMount>.card{width:100%;margin:0!important}
    body.nx-v3-ui #nxDisciplineJourney{margin:12px 0 16px!important;padding:18px!important}
    body.nx-v3-ui #nxDisciplineJourney h2{font-size:20px!important}
    body.nx-v3-ui #disciplineList{display:grid;gap:10px}
    body.nx-v3-ui #studyList{display:grid;gap:9px}
    body.nx-v3-ui #mindPage .card:first-of-type{padding:22px 16px!important;background:linear-gradient(145deg,#172b3b,#1d182b)!important;border-color:#2e4b5b!important}
    body.nx-v3-ui:not(.dark) #mindPage .card:first-of-type{background:linear-gradient(145deg,#eaf5ff,#fff)!important;border-color:#d9eaf2!important}
    body.nx-v3-ui .breath-orb{width:min(230px,64vw);height:min(230px,64vw);margin:22px auto;border:1px solid rgba(104,168,204,.35);background:radial-gradient(circle at 35% 30%,#d9f0ff,#84b9d5 58%,#496a9d);box-shadow:0 0 0 13px rgba(123,183,211,.10),0 16px 38px rgba(40,104,146,.25);color:#102b45;font-weight:900}
    body.nx-v3-ui .breath-orb span{color:#102b45}
    body.nx-v3-ui .mind-choice{width:100%;min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;margin:0 0 8px;border:1px solid var(--v3-line);border-radius:16px;background:var(--v3-surface);color:var(--v3-ink);box-shadow:var(--v3-shadow);text-align:left;font-weight:800}
    body.nx-v3-ui .mind-choice b{color:var(--v3-primary);font-size:11px}
    body.nx-v3-ui #nxBottomNav[style*="display: none"]{display:none!important}
    body.nx-v3-ui #nxBottomNav{position:fixed!important;left:50%!important;transform:translateX(-50%)!important;bottom:max(8px,env(safe-area-inset-bottom))!important;width:min(calc(100% - 16px),650px)!important;max-width:650px!important;z-index:99990!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px!important;padding:7px!important;min-height:70px!important;border:1px solid var(--v3-line)!important;border-radius:24px!important;background:color-mix(in srgb,var(--v3-surface) 93%,transparent)!important;box-shadow:0 13px 42px rgba(16,9,31,.22)!important;backdrop-filter:blur(22px)!important;overflow:visible!important}
    body.nx-v3-ui #nxBottomNav .nx-nav-item{min-width:0!important;min-height:54px!important;max-width:none!important;flex:1 1 0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;padding:6px 2px!important;border:0!important;border-radius:17px!important;background:transparent!important;color:var(--v3-muted)!important;font-size:10px!important;font-weight:850!important;white-space:normal!important}
    body.nx-v3-ui #nxBottomNav .nx-nav-item b{display:grid!important;place-items:center!important;font-size:0!important;line-height:1!important}
    body.nx-v3-ui #nxBottomNav .nx-nav-item b svg{width:22px!important;height:22px!important}
    body.nx-v3-ui #nxBottomNav .nx-nav-item span{font-size:10px!important;line-height:1.1!important}
    body.nx-v3-ui #nxBottomNav .nx-nav-item.active{background:linear-gradient(135deg,var(--v3-primary),var(--v3-primary2))!important;color:#fff!important;box-shadow:0 7px 18px rgba(117,80,201,.30)!important}
    body.nx-v3-ui #nxBottomNav .nx-nav-item[aria-current="page"]{color:#fff!important}
    body.nx-v3-ui .nova-fab{right:17px;bottom:calc(93px + env(safe-area-inset-bottom));z-index:99991}
    body.nx-v3-ui .nova-panel{bottom:calc(164px + env(safe-area-inset-bottom));z-index:99992}
    body.nx-v3-ui .mind-fab{display:none!important}
    body.nx-v3-ui .hub{background:var(--v3-surface)!important;color:var(--v3-ink)!important;border-left:1px solid var(--v3-line)}
    body.nx-v3-ui .hub-link{border-radius:13px;color:var(--v3-ink)}
    body.nx-v3-ui .hub-link.active,body.nx-v3-ui .hub-link:hover{background:color-mix(in srgb,var(--v3-primary) 15%,var(--v3-surface))!important;color:var(--v3-primary)!important}
    body.nx-v3-ui .modal-backdrop.show,body.nx-v3-ui .hub-backdrop.show{overscroll-behavior:contain;touch-action:none}
    body.nx-v3-ui .modal,body.nx-v3-ui .select-sheet,body.nx-v3-ui .nx-picker-card,body.nx-v3-ui .nx-date-card,body.nx-v3-ui .nx-theme-confirm,body.nx-v3-ui .nx-release-dialog,body.nx-v3-ui .nx-safety-card{background:var(--v3-surface)!important;color:var(--v3-ink)!important;border:1px solid var(--v3-line)!important;box-shadow:0 24px 70px rgba(0,0,0,.30)}
    body.nx-v3-ui .nx-page-wrap{display:grid;gap:12px}
    body.nx-v3-ui .nx-social-card,body.nx-v3-ui .nx-form-card{padding:16px!important}
    body.nx-v3-ui .nx-owner-metrics{gap:9px}
    body.nx-v3-ui .tabs{gap:7px;scrollbar-width:none}
    body.nx-v3-ui .tab{background:var(--v3-surface)!important;border-color:var(--v3-line)!important;color:var(--v3-muted)!important}
    body.nx-v3-ui .tab.active{background:var(--v3-primary2)!important;border-color:var(--v3-primary2)!important;color:#fff!important}
    body.nx-v3-ui .danger{color:#ff9cae!important;background:#48202d!important}
    @keyframes v3Enter{from{opacity:.72;transform:translateY(5px)}to{opacity:1;transform:none}}
    @media(min-width:680px){.nx-v3-hero{min-height:350px;padding:28px}.nx-v3-hero.home,.nx-v3-hero.discipline{min-height:370px}.nx-v3-hero.study,.nx-v3-hero.mindful{min-height:330px}#nxV3Home{gap:16px}.nx-v3-stats{max-width:700px}}
    @media(max-width:430px){body.nx-v3-ui .app{padding-left:12px;padding-right:12px}body.nx-v3-ui .topbar{grid-template-columns:38px minmax(0,1fr) auto;gap:5px;padding:8px 9px;margin:0 -12px 7px}body.nx-v3-ui .topbar .brand-title{font-size:13px;letter-spacing:.15em}body.nx-v3-ui .topbar .icon-btn,body.nx-v3-ui .nx-menu-left{width:36px;height:36px;min-width:36px}.nx-v3-hero{min-height:270px;padding:18px;border-radius:23px}.nx-v3-hero.home,.nx-v3-hero.discipline{min-height:285px}.nx-v3-hero.study,.nx-v3-hero.mindful{min-height:265px}.nx-v3-hero-note{display:none}.nx-v3-title{font-size:30px!important}.nx-v3-copy{font-size:13px}.nx-v3-stats{gap:7px}.nx-v3-stat{padding:12px 9px}.nx-v3-stat b{font-size:21px}.nx-v3-stat span{font-size:10px}.nx-v3-tracker-cta{gap:10px;padding:14px}.nx-v3-tracker-icon{width:52px;height:52px;border-radius:16px}.nx-v3-tracker-copy strong{font-size:18px}.nx-v3-tracker-copy span{font-size:11px}.nx-v3-quick-grid{gap:7px}.nx-v3-quick{min-height:91px;padding:10px 8px}.nx-v3-quick strong{font-size:10px}body.nx-v3-ui #nxBottomNav{width:calc(100% - 12px)!important;padding:5px!important;min-height:66px!important}body.nx-v3-ui #nxBottomNav .nx-nav-item{min-height:51px!important}}
    @media(prefers-reduced-motion:reduce){body.nx-v3-ui *,body.nx-v3-ui *:before,body.nx-v3-ui *:after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
  `;

  function installStyles() {
    let style = $('nxV3VisualStyles');
    if (!style) { style = document.createElement('style'); style.id = 'nxV3VisualStyles'; document.head.appendChild(style); }
    style.textContent = css;
    document.body.classList.add('nx-v3-ui');
    document.body.classList.remove('nx-v2-ui');
  }

  function installHeader() {
    const header = document.querySelector('.topbar');
    if (!header) return;
    const brand = header.querySelector('.brand');
    const actions = header.querySelector('.top-actions');
    if (!brand || !actions) return;
    const mark = brand.querySelector('.brandmark');
    if (mark) mark.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 33c-3-6-3-12 0-19 3 7 3 13 0 19Z"/><path d="M20 33C9 31 5 25 6 18c8 0 12 5 14 15Z"/><path d="M20 33c11-2 15-8 14-15-8 0-12 5-14 15Z"/><path d="M8 33h24M13 36h14"/></svg>`;
    const menu = header.querySelector('[aria-label="Open NEXORA Hub"]');
    if (menu) {
      menu.classList.add('nx-menu-left');
      if (menu.parentElement !== header) header.insertBefore(menu, brand);
      menu.innerHTML = icon('menu');
      menu.setAttribute('aria-label', 'Open NEXORA menu');
    }
    const timer = actions.querySelector('[title*="Timer" i], [aria-label*="Timer" i]');
    if (timer) timer.innerHTML = icon('timer');
    const theme = $('themeBtn');
    if (theme) theme.innerHTML = icon(document.body.classList.contains('dark') ? 'sun' : 'moon');
    const profile = $('headerProfileBtn');
    if (profile && profile.parentElement !== actions) actions.appendChild(profile);
  }

  function runHeroAction(action) {
    if (action === 'trackers') { if (typeof window.navigate === 'function') window.navigate('trackers'); return; }
    if (action === 'journey') {
      const target = $('nxDisciplineJourney') || $('disciplineList');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (typeof window.navigate === 'function') window.navigate('disciplines');
      return;
    }
    if (action === 'timer') { if (typeof window.openModal === 'function') window.openModal('clockModal'); else window.navigate?.('study'); return; }
    if (action === 'breathing') {
      const toggle = $('breathToggle');
      if (toggle) toggle.click(); else if (typeof window.navigate === 'function') window.navigate('meditation');
    }
  }

  function installHeroes() {
    pages.forEach((page) => {
      const host = $(page.id);
      if (!host || host.querySelector('.nx-v3-hero')) return;
      const hero = document.createElement('section');
      hero.className = `nx-v3-hero ${page.key}`;
      hero.innerHTML = `<div class="nx-v3-hero-copy"><div class="nx-v3-kicker">${page.kicker}</div><h2 class="nx-v3-title">${page.title}</h2><p class="nx-v3-copy">${page.copy}</p><div class="nx-v3-hero-actions"><button type="button" class="nx-v3-hero-btn">${page.cta}${icon('arrow')}</button></div></div><div class="nx-v3-hero-note">${page.note}<b>NEXORA · GROW WITH PURPOSE</b></div>`;
      hero.querySelector('button').addEventListener('click', () => runHeroAction(page.action));
      const oldHead = host.querySelector('.page-head');
      if (oldHead) oldHead.insertAdjacentElement('afterend', hero); else host.prepend(hero);
    });
  }

  function installHome() {
    const page = $('homePage');
    if (!page) return;
    $('nxLifeHome')?.remove();
    $('nxHomeDashboard')?.remove();
    let root = $('nxV3Home');
    if (!root) {
      root = document.createElement('section');
      root.id = 'nxV3Home';
      root.innerHTML = `
        <div class="nx-v3-welcome"><div class="nx-v3-overline">YOUR NEXORA SPACE</div><h2 class="nx-v3-greeting" id="nxV3Greeting">A fresh start, one step at a time.</h2><p class="nx-v3-subline">Your progress, your pace. Start with what matters today.</p></div>
        <div class="nx-v3-stats"><div class="nx-v3-stat"><b id="nxV3TrackerCount">0</b><span>Active trackers</span></div><div class="nx-v3-stat"><b id="nxV3TasksDone">0</b><span>Tasks completed</span></div><div class="nx-v3-stat"><b id="nxV3Streak">0</b><span>Day streak</span></div></div>
        <button type="button" class="nx-v3-tracker-cta" id="nxV3TrackerCta"><span class="nx-v3-tracker-icon">${icon('tracker')}</span><span class="nx-v3-tracker-copy"><small>YOUR STARTING POINT</small><strong>My Trackers</strong><span>Create a tracker for any goal, add tasks, and choose an end date or keep it ongoing.</span></span><span class="nx-v3-tracker-arrow">${icon('arrow')}</span></button>
        <div class="nx-v3-quick-grid"><button type="button" class="nx-v3-quick" data-v3-open="disciplines">${icon('discipline')}<strong>Discipline Journey</strong><span>Build steady habits</span></button><button type="button" class="nx-v3-quick" data-v3-open="study">${icon('book')}<strong>Study Space</strong><span>Focus and learn</span></button><button type="button" class="nx-v3-quick" data-v3-open="mind">${icon('leaf')}<strong>Mindful Reset</strong><span>Pause and breathe</span></button></div>
        <div class="nx-v3-task-wrap"><div class="nx-v3-section-title"><h2>Tasks inside your trackers</h2><span>Today</span></div><div id="nxV3TaskMount"></div></div>`;
      const hero = page.querySelector('.nx-v3-hero');
      if (hero) hero.insertAdjacentElement('afterend', root); else page.appendChild(root);
    }
    const taskCard = page.querySelector('[data-home-role="tasks"]');
    const mount = $('nxV3TaskMount');
    if (taskCard && mount && taskCard.parentElement !== mount) mount.appendChild(taskCard);
    const tracker = $('nxV3TrackerCta');
    if (tracker && tracker.dataset.v3Bound !== '1') {
      tracker.dataset.v3Bound = '1';
      tracker.addEventListener('click', () => window.navigate?.('trackers'));
    }
    root.querySelectorAll('[data-v3-open]').forEach((button) => {
      if (button.dataset.v3Bound === '1') return;
      button.dataset.v3Bound = '1';
      button.addEventListener('click', () => window.navigate?.(button.dataset.v3Open));
    });
    updateHomeStats();
  }

  function updateHomeStats() {
    const s = appState();
    const trackers = Array.isArray(s.trackers) ? s.trackers.filter(x => x && x.archived !== true && x.active !== false) : [];
    const tasks = Array.isArray(s.tasks) ? s.tasks : [];
    const completed = tasks.filter(x => x && (x.done === true || x.completed === true)).length;
    const name = String(s.profile?.name || '').trim();
    const first = name && name.toLowerCase() !== 'explorer' ? name.split(/\s+/)[0] : '';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greet = $('nxV3Greeting');
    if (greet) greet.textContent = `${greeting}${first ? `, ${first}` : ''}.`;
    if ($('nxV3TrackerCount')) $('nxV3TrackerCount').textContent = String(trackers.length);
    if ($('nxV3TasksDone')) $('nxV3TasksDone').textContent = String(completed);
    if ($('nxV3Streak')) $('nxV3Streak').textContent = String(Number(s.streak || 0));
  }

  function renderNavigation() {
    let nav = $('nxBottomNav');
    if (!nav) { nav = document.createElement('nav'); nav.id = 'nxBottomNav'; document.body.appendChild(nav); }
    const signature = 'home|disciplines|study|mind';
    const liveSignature = Array.from(nav.querySelectorAll('[data-v3-page]')).map(button => button.dataset.v3Page).join('|');
    if (nav.dataset.v3Signature !== signature || liveSignature !== signature) {
      nav.className = 'nx-bottom-nav';
      nav.setAttribute('aria-label', 'NEXORA main navigation');
      nav.innerHTML = pages.map(p => `<button type="button" class="nx-nav-item" data-v3-page="${p.route}" aria-label="${p.label}"><b>${icon(p.icon)}</b><span>${p.label}</span></button>`).join('');
      nav.dataset.v3Signature = signature;
      nav.querySelectorAll('[data-v3-page]').forEach(button => {
        button.addEventListener('click', () => {
          window.navigate?.(button.dataset.v3Page);
          queueMicrotask(syncNavigation);
        });
      });
    }
    syncNavigation();
  }

  function syncNavigation() {
    const activeId = document.querySelector('.page.active')?.id || 'homePage';
    const route = ({homePage:'home',trackersPage:null,analyticsPage:null,disciplinesPage:'disciplines',studyPage:'study',mindPage:'mind',meditationPage:'mind'})[activeId] ?? null;
    document.querySelectorAll('#nxBottomNav [data-v3-page]').forEach(button => {
      const active = button.dataset.v3Page === route;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
  }

  function patchRenderHooks() {
    const wrap = (name, after) => {
      const original = window[name];
      if (typeof original !== 'function' || original.__nxV3Wrapped) return;
      const replacement = function(...args) { const result = original.apply(this,args); Promise.resolve().then(after); return result; };
      replacement.__nxV3Wrapped = true;
      window[name] = replacement;
    };
    wrap('renderHome', updateHomeStats);
    wrap('renderAll', () => { updateHomeStats(); syncNavigation(); });
    wrap('persist', updateHomeStats);
    const originalNavigate = window.navigate;
    if (typeof originalNavigate === 'function' && !originalNavigate.__nxV3Wrapped) {
      const replacement = function(...args) { const result = originalNavigate.apply(this,args); Promise.resolve().then(syncNavigation); return result; };
      replacement.__nxV3Wrapped = true;
      window.navigate = replacement;
    }
  }

  function enforceSingleNavAndHome() {
    const nav = $('nxBottomNav');
    if (nav && nav.dataset.v3Signature !== 'home|disciplines|study|mind') renderNavigation();
    if ($('nxLifeHome')) $('nxLifeHome').remove();
    if ($('nxHomeDashboard')) $('nxHomeDashboard').remove();
    if ($('homePage') && !$('nxV3Home')) installHome();
  }

  function init() {
    if (!document.body) return;
    installStyles();
    installHeader();
    installHeroes();
    installHome();
    renderNavigation();
    patchRenderHooks();
    const observer = new MutationObserver(records => {
      let navChanged = false;
      let pageChanged = false;
      for (const record of records) {
        if (record.target?.id === 'nxBottomNav' || record.target?.closest?.('#nxBottomNav')) navChanged = true;
        if (record.target?.classList?.contains('page')) pageChanged = true;
        for (const node of record.addedNodes || []) {
          if (node.nodeType !== 1) continue;
          if (node.id === 'nxLifeHome' || node.id === 'nxHomeDashboard') { node.remove(); continue; }
          if (node.id === 'nxBottomNav' || node.querySelector?.('#nxBottomNav')) navChanged = true;
        }
      }
      if (navChanged) renderNavigation();
      if (pageChanged) syncNavigation();
    });
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('click', event => {
      if (event.target.closest('#themeBtn')) setTimeout(installHeader,100);
    },true);
    window.addEventListener('pageshow',() => {installHeader();installHome();updateHomeStats();renderNavigation();});
    setTimeout(() => {installHeader();installHome();updateHomeStats();renderNavigation();},250);
    setTimeout(() => {installHeader();installHome();updateHomeStats();renderNavigation();},1100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
