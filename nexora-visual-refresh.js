/* NEXORA Visual Refresh v2
 * Rebuilds the presentation layer around the existing working app.
 * Keeps the current navigation, tracker state, forms, authentication and Supabase logic.
 */
(() => {
  'use strict';
  if (window.__NEXORA_VISUAL_REFRESH_V2__) return;
  window.__NEXORA_VISUAL_REFRESH_V2__ = true;

  const $ = (id) => document.getElementById(id);
  const appState = () => (typeof state !== 'undefined' && state) ? state : {};
  const todayIST = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const iconPaths = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    discipline: '<path d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/><path d="M12 7v10"/>',
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
    check: '<path d="m5 12 4 4L19 6"/>',
    chart: '<path d="M4 19V5m0 14h17M8 15v-4m5 4V7m5 8V4"/>'
  };
  const svg = (name, extra = '') => `<svg viewBox="0 0 24 24" ${extra} aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.home}</svg>`;

  const css = `
    body.nx-v2-ui{
      --nx-bg:#f6f3fb;--nx-surface:#ffffff;--nx-surface-2:#f0ecf8;
      --nx-ink:#211a32;--nx-ink-soft:#504662;--nx-muted:#837a93;
      --nx-line:#e7e0f0;--nx-primary:#7550c9;--nx-primary-2:#9a70ed;
      --nx-primary-soft:#efe8fb;--nx-gold:#b68a43;--nx-shadow:0 12px 34px rgba(43,27,72,.08);
      background:radial-gradient(ellipse at 88% 0%,rgba(205,183,244,.20),transparent 32%),var(--nx-bg)!important;
      color:var(--nx-ink)!important;
    }
    body.dark.nx-v2-ui{
      --nx-bg:#100d19;--nx-surface:#1d182b;--nx-surface-2:#282138;
      --nx-ink:#f7f2ff;--nx-ink-soft:#ded4ed;--nx-muted:#aaa0bb;
      --nx-line:#393047;--nx-primary:#b18bff;--nx-primary-2:#8b5cf6;
      --nx-primary-soft:#312544;--nx-gold:#e3bb72;--nx-shadow:0 16px 40px rgba(0,0,0,.26);
      background:radial-gradient(ellipse at 16% 0%,rgba(88,52,146,.22),transparent 34%),var(--nx-bg)!important;
    }
    body.nx-v2-ui,body.nx-v2-ui button,body.nx-v2-ui input,body.nx-v2-ui textarea,body.nx-v2-ui select{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    body.nx-v2-ui .app{max-width:900px;padding-left:16px;padding-right:16px;padding-bottom:calc(112px + env(safe-area-inset-bottom))}
    body.nx-v2-ui .topbar{
      min-height:68px;height:auto;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:9px;
      align-items:center;padding:9px 14px;margin:0 -16px 8px;position:sticky;top:0;z-index:100;
      background:color-mix(in srgb,var(--nx-bg) 88%,transparent);border-bottom:1px solid var(--nx-line);
      box-shadow:0 6px 22px rgba(25,15,42,.035);backdrop-filter:blur(20px);
    }
    body.nx-v2-ui .topbar .brand{justify-self:center;gap:8px;min-width:0}
    body.nx-v2-ui .topbar .brandmark{width:34px;height:34px;border-radius:0;background:transparent;box-shadow:none;color:var(--nx-primary);font-size:0;animation:none;text-shadow:none;display:grid;place-items:center}
    body.nx-v2-ui .topbar .brandmark svg{width:34px;height:34px;display:block}
    body.nx-v2-ui .topbar .brand-title{font-size:15px;letter-spacing:.19em;font-weight:950;color:var(--nx-ink)}
    body.nx-v2-ui .topbar .top-actions{display:flex;align-items:center;gap:6px;min-width:0}
    body.nx-v2-ui .topbar .icon-btn,body.nx-v2-ui .nx-menu-left{
      width:39px;height:39px;min-width:39px;display:grid;place-items:center;border-radius:14px;
      background:var(--nx-surface);border:1px solid var(--nx-line);color:var(--nx-ink);
      box-shadow:0 4px 14px rgba(37,22,58,.07);font-size:0;padding:0;
    }
    body.nx-v2-ui .topbar .icon-btn svg,body.nx-v2-ui .nx-menu-left svg{width:19px;height:19px}
    body.nx-v2-ui .topbar #headerProfileBtn{width:39px;height:39px;min-width:39px;max-width:39px;display:grid;place-items:center;padding:2px;overflow:hidden;border-radius:50%;margin:0;background:var(--nx-surface);border:1px solid var(--nx-line)}
    body.nx-v2-ui .topbar #headerProfileBtn .profile-pill-text{display:none}
    body.nx-v2-ui .topbar #headerProfileBtn .avatar-ring{width:34px;height:34px}
    body.nx-v2-ui .page{max-width:900px;margin:0 auto;padding:11px 2px 26px;animation:nxV2In .24s ease both}
    body.nx-v2-ui .page-head{display:none!important}
    body.nx-v2-ui h1,body.nx-v2-ui h2,body.nx-v2-ui h3{color:var(--nx-ink);letter-spacing:-.025em}
    body.nx-v2-ui .sub,body.nx-v2-ui .item-meta,body.nx-v2-ui .nx-muted{color:var(--nx-muted)!important}
    body.nx-v2-ui .card,body.nx-v2-ui .nx-social-card,body.nx-v2-ui .nx-form-card,body.nx-v2-ui .nx-page-wrap>*,body.nx-v2-ui .nx-phase,body.nx-v2-ui .nx-life-card{
      background:var(--nx-surface)!important;color:var(--nx-ink)!important;border:1px solid var(--nx-line)!important;
      border-radius:21px!important;box-shadow:var(--nx-shadow)!important;
    }
    body.nx-v2-ui .card{padding:17px!important}
    body.nx-v2-ui .section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:19px 2px 11px}
    body.nx-v2-ui .section-head h2{font-size:17px;font-weight:900;margin:0}
    body.nx-v2-ui .primary-btn,body.nx-v2-ui .nx-life-create,body.nx-v2-ui .nx-life-log,body.nx-v2-ui .nx-v2-primary{
      display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:45px;padding:11px 16px;
      background:linear-gradient(120deg,var(--nx-primary-2),var(--nx-primary));color:#fff!important;
      border:0;border-radius:14px;font-size:13px;font-weight:850;box-shadow:0 8px 22px rgba(117,80,201,.22);
    }
    body.dark.nx-v2-ui .primary-btn,body.dark.nx-v2-ui .nx-life-create,body.dark.nx-v2-ui .nx-life-log,body.dark.nx-v2-ui .nx-v2-primary{color:#fff!important}
    body.nx-v2-ui .secondary-btn,body.nx-v2-ui .small-btn,body.nx-v2-ui .text-btn{border-radius:13px;font-weight:800}
    body.nx-v2-ui .secondary-btn{background:var(--nx-primary-soft);color:var(--nx-primary);border:1px solid var(--nx-line);min-height:42px}
    body.nx-v2-ui .small-btn{background:var(--nx-primary-soft);color:var(--nx-primary);border:1px solid var(--nx-line)}
    body.nx-v2-ui .text-btn{color:var(--nx-primary)}
    body.nx-v2-ui .field{gap:7px;margin:12px 0}
    body.nx-v2-ui .field label{font-size:12px;font-weight:800;color:var(--nx-ink-soft)}
    body.nx-v2-ui .field input,body.nx-v2-ui .field textarea,body.nx-v2-ui .field select,body.nx-v2-ui input,body.nx-v2-ui textarea,body.nx-v2-ui select{
      background:var(--nx-surface-2);color:var(--nx-ink);border:1px solid var(--nx-line);border-radius:13px;
    }
    body.nx-v2-ui .field input,body.nx-v2-ui .field textarea,body.nx-v2-ui .field select{min-height:45px;padding:11px 13px}
    body.nx-v2-ui button:focus-visible,body.nx-v2-ui input:focus-visible,body.nx-v2-ui textarea:focus-visible,body.nx-v2-ui select:focus-visible{outline:3px solid color-mix(in srgb,var(--nx-primary) 45%,transparent);outline-offset:2px}
    body.nx-v2-ui .item{background:var(--nx-surface-2);border:1px solid var(--nx-line);border-radius:16px;padding:12px}
    body.nx-v2-ui .progress{background:var(--nx-surface-2);height:9px;border-radius:99px}
    body.nx-v2-ui .progress i{background:linear-gradient(90deg,var(--nx-primary),#d0a65e);border-radius:99px}

    .nx-v2-hero{
      position:relative;isolation:isolate;overflow:hidden;min-height:290px;display:flex;align-items:flex-end;
      margin:6px 0 18px;padding:24px;border:1px solid rgba(255,255,255,.18);border-radius:27px;
      background-size:cover;background-position:center 48%;color:#fff;box-shadow:0 20px 52px rgba(22,12,42,.20);
    }
    .nx-v2-hero:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(8,7,20,.86) 0%,rgba(8,7,20,.53) 48%,rgba(8,7,20,.12) 100%),linear-gradient(0deg,rgba(7,6,18,.56),transparent 62%)}
    .nx-v2-hero:after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 80% 15%,rgba(255,255,255,.18),transparent 22%)}
    .nx-v2-hero.home{min-height:315px;background-image:url('./nexora-home-scene.jpg');background-position:center 42%}
    .nx-v2-hero.discipline{min-height:315px;background-image:url('./nexora-discipline-scene.jpg');background-position:64% 42%}
    .nx-v2-hero.study{min-height:285px;background-image:url('./nexora-study-scene.jpg');background-position:center 53%}
    .nx-v2-hero.mindful{min-height:285px;background-image:url('./nexora-mindful-scene.jpg');background-position:center 50%}
    .nx-v2-hero-copy{max-width:450px;text-shadow:0 2px 18px rgba(0,0,0,.48)}
    .nx-v2-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:10px;color:#eadcff;font-size:10px;font-weight:950;letter-spacing:.19em;text-transform:uppercase}
    .nx-v2-kicker:before{content:"";width:21px;height:2px;background:#d6b474;border-radius:99px}
    .nx-v2-title{margin:0 0 10px!important;color:#fff!important;font-size:clamp(29px,6.4vw,42px)!important;line-height:1.04!important;font-weight:950!important;letter-spacing:-.045em!important;max-width:430px}
    .nx-v2-copy{max-width:370px;margin:0;color:#f5efff;font-size:13px;line-height:1.55}
    .nx-v2-hero-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:17px}
    .nx-v2-hero-btn{min-height:43px;padding:11px 16px;display:inline-flex;align-items:center;gap:9px;border-radius:99px;background:linear-gradient(120deg,#a77af2,#7042ca);color:#fff;font-size:12px;font-weight:900;box-shadow:0 8px 25px rgba(89,43,164,.40)}
    .nx-v2-hero-btn svg{width:15px;height:15px}
    .nx-v2-hero-note{align-self:center;margin-left:auto;max-width:190px;padding:13px 14px;border:1px solid rgba(255,255,255,.28);border-radius:17px;background:rgba(15,11,29,.44);backdrop-filter:blur(12px);color:#fff;font-size:12px;line-height:1.5}
    .nx-v2-hero-note b{display:block;color:#f4d9a1;font-size:10px;letter-spacing:.08em;text-transform:uppercase;margin-top:6px}

    #homePage>#nxV2Home{display:block}
    #homePage>*:not(.page-head):not(.nx-v2-hero):not(#nxV2Home){display:none!important}
    #nxHomeDashboard,#nxLifeHome,.nx-home-actions,.nx-life-actions{display:none!important}
    .nx-v2-home{display:grid;gap:14px;margin:0 0 20px}
    .nx-v2-welcome{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:2px 2px 0}
    .nx-v2-welcome-copy{min-width:0}
    .nx-v2-overline{font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-weight:950;color:var(--nx-primary)}
    .nx-v2-greeting{margin:5px 0 3px!important;font-size:22px!important;font-weight:950!important}
    .nx-v2-subline{margin:0;color:var(--nx-muted);font-size:12px;line-height:1.45}
    .nx-v2-home-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .nx-v2-stat{min-width:0;padding:13px 12px;border:1px solid var(--nx-line);border-radius:17px;background:var(--nx-surface);box-shadow:var(--nx-shadow)}
    .nx-v2-stat b{display:block;color:var(--nx-ink);font-size:22px;line-height:1.1;font-weight:950;letter-spacing:-.04em}
    .nx-v2-stat span{display:block;margin-top:6px;color:var(--nx-muted);font-size:10px;font-weight:750;line-height:1.3}
    .nx-v2-tracker-cta{width:100%;display:flex;align-items:center;gap:14px;text-align:left;padding:17px;border-radius:22px;border:1px solid color-mix(in srgb,var(--nx-primary) 28%,var(--nx-line));background:linear-gradient(120deg,color-mix(in srgb,var(--nx-primary-soft) 86%,var(--nx-surface)),var(--nx-surface));box-shadow:var(--nx-shadow);color:var(--nx-ink)}
    body.dark.nx-v2-ui .nx-v2-tracker-cta{background:linear-gradient(120deg,#2a2040,#1d182b)}
    .nx-v2-tracker-icon{width:48px;height:48px;flex:none;display:grid;place-items:center;border-radius:16px;background:linear-gradient(145deg,var(--nx-primary-2),var(--nx-primary));color:#fff;box-shadow:0 9px 21px rgba(117,80,201,.25)}
    .nx-v2-tracker-icon svg{width:24px;height:24px}
    .nx-v2-tracker-copy{flex:1;min-width:0}
    .nx-v2-tracker-copy small{display:block;color:var(--nx-primary);font-size:9px;font-weight:950;letter-spacing:.14em}
    .nx-v2-tracker-copy strong{display:block;margin:3px 0;font-size:17px;font-weight:950}
    .nx-v2-tracker-copy span{display:block;color:var(--nx-muted);font-size:11px;line-height:1.4}
    .nx-v2-tracker-arrow{width:22px;height:22px;flex:none;color:var(--nx-primary)}
    .nx-v2-quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .nx-v2-quick{min-width:0;min-height:94px;padding:13px 10px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:7px;text-align:left;border:1px solid var(--nx-line);border-radius:18px;background:var(--nx-surface);color:var(--nx-ink);box-shadow:var(--nx-shadow)}
    .nx-v2-quick svg{width:22px;height:22px;color:var(--nx-primary)}
    .nx-v2-quick strong{font-size:11px;font-weight:900;line-height:1.25}
    .nx-v2-quick span{font-size:10px;color:var(--nx-muted);line-height:1.25}
    .nx-v2-task-wrap{display:grid;gap:8px}
    .nx-v2-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:3px 2px 0}
    .nx-v2-section-title h2{font-size:16px;font-weight:950;margin:0}
    .nx-v2-section-title span{font-size:10px;color:var(--nx-muted)}
    #nxV2TaskMount>.card{width:100%;margin:0!important}

    .nx-v2-discipline-note{padding:15px 16px;border-radius:19px;background:linear-gradient(120deg,#fbf2dc,#fffaf0);border:1px solid #ead9b8;color:#4a351c;line-height:1.55;font-size:12px}
    body.dark.nx-v2-ui .nx-v2-discipline-note{background:linear-gradient(120deg,#30251d,#241c1a);border-color:#51402b;color:#f5dfba}
    #nxDisciplineJourney{margin:12px 0 16px!important;padding:18px!important}
    #nxDisciplineJourney h2{font-size:20px!important}
    body.nx-v2-ui .nx-phase{padding:14px!important}
    body.nx-v2-ui #disciplineList{display:grid;gap:10px}

    body.nx-v2-ui #studyPage .card.tint-blue{background:linear-gradient(135deg,#f1e9ff,#fff)!important;border:1px solid #e6dcf5!important;color:#2b2042!important}
    body.dark.nx-v2-ui #studyPage .card.tint-blue{background:linear-gradient(135deg,#302441,#211b30)!important;border-color:#4c3b60!important;color:#fff!important}
    body.nx-v2-ui #studyPage .card.tint-blue h1{font-size:32px;font-weight:950}
    body.nx-v2-ui #studyPage .card.tint-blue .eyebrow{color:var(--nx-primary)}
    body.nx-v2-ui #studyList{display:grid;gap:9px}

    body.nx-v2-ui #mindPage .card:first-of-type{padding:22px 16px!important;background:linear-gradient(145deg,#eaf5ff,#fff)!important;border-color:#d9eaf2!important}
    body.dark.nx-v2-ui #mindPage .card:first-of-type{background:linear-gradient(145deg,#172b3b,#1d182b)!important;border-color:#2e4b5b!important}
    body.nx-v2-ui .breath-orb{width:min(220px,62vw);height:min(220px,62vw);margin:20px auto;border:1px solid rgba(104,168,204,.35);background:radial-gradient(circle at 35% 30%,#d9f0ff,#84b9d5 58%,#496a9d);box-shadow:0 0 0 12px rgba(123,183,211,.10),0 16px 38px rgba(40,104,146,.25);color:#102b45;font-weight:900}
    body.dark.nx-v2-ui .breath-orb{background:radial-gradient(circle at 35% 30%,#bce9f6,#4687a7 58%,#243c68);color:#071d2b}
    body.nx-v2-ui .mind-choice{width:100%;min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;margin:0 0 8px;border:1px solid var(--nx-line);border-radius:16px;background:var(--nx-surface);color:var(--nx-ink);box-shadow:var(--nx-shadow);text-align:left;font-weight:800}
    body.nx-v2-ui .mind-choice b{color:var(--nx-primary);font-size:11px}

    body.nx-v2-ui #nxBottomNav{
      position:fixed;left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));
      width:min(calc(100% - 18px),610px);max-width:610px;z-index:99990;
      display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:7px;
      min-height:70px;border:1px solid var(--nx-line);border-radius:23px;
      background:color-mix(in srgb,var(--nx-surface) 92%,transparent);
      box-shadow:0 13px 42px rgba(16,9,31,.18);backdrop-filter:blur(22px);
    }
    body.nx-v2-ui #nxBottomNav .nx-nav-item{
      min-width:0;min-height:54px;max-width:none;flex:1 1 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
      padding:6px 2px;border:0;border-radius:16px;background:transparent;color:var(--nx-muted);font-size:10px;font-weight:850;
    }
    body.nx-v2-ui #nxBottomNav .nx-nav-item b{display:grid;place-items:center;font-size:0;line-height:1}
    body.nx-v2-ui #nxBottomNav .nx-nav-item b svg{width:21px;height:21px}
    body.nx-v2-ui #nxBottomNav .nx-nav-item span{font-size:10px;line-height:1.1}
    body.nx-v2-ui #nxBottomNav .nx-nav-item.active{background:linear-gradient(135deg,var(--nx-primary-2),var(--nx-primary));color:#fff;box-shadow:0 7px 18px rgba(117,80,201,.28)}
    body.nx-v2-ui .nova-fab{bottom:calc(93px + env(safe-area-inset-bottom))}
    body.nx-v2-ui .nova-panel{bottom:calc(160px + env(safe-area-inset-bottom))}
    body.nx-v2-ui .hub{background:var(--nx-surface);color:var(--nx-ink);border-left:1px solid var(--nx-line)}
    body.nx-v2-ui .hub-link{border-radius:13px;color:var(--nx-ink)}
    body.nx-v2-ui .hub-link.active,body.nx-v2-ui .hub-link:hover{background:var(--nx-primary-soft);color:var(--nx-primary)}
    body.nx-v2-ui .modal-backdrop.show{overscroll-behavior:contain;touch-action:none}
    body.nx-v2-ui .select-sheet,body.nx-v2-ui .nx-release-dialog,body.nx-v2-ui .nx-safety-card{background:var(--nx-surface);color:var(--nx-ink);border:1px solid var(--nx-line);box-shadow:0 24px 70px rgba(0,0,0,.24)}
    body.nx-v2-ui .nx-page-wrap{display:grid;gap:12px}
    body.nx-v2-ui .nx-social-card,body.nx-v2-ui .nx-form-card{padding:16px!important}
    body.nx-v2-ui .nx-avatar{border-radius:15px}
    body.nx-v2-ui .nx-owner-metrics{gap:9px}
    body.nx-v2-ui .tabs{gap:7px;scrollbar-width:none}
    body.nx-v2-ui .tab{background:var(--nx-surface);border-color:var(--nx-line);color:var(--nx-muted)}
    body.nx-v2-ui .tab.active{background:var(--nx-primary);border-color:var(--nx-primary);color:#fff}
    body.nx-v2-ui .danger{color:#b42345;background:#fff0f2}
    body.dark.nx-v2-ui .danger{color:#ff9cae;background:#48202d}
    @keyframes nxV2In{from{opacity:.7;transform:translateY(5px)}to{opacity:1;transform:none}}
    @media(min-width:680px){
      body.nx-v2-ui .page{padding:16px 8px 34px}
      .nx-v2-hero{min-height:350px;padding:28px}
      .nx-v2-hero.home,.nx-v2-hero.discipline{min-height:360px}
      .nx-v2-hero.study,.nx-v2-hero.mindful{min-height:325px}
      .nx-v2-home{gap:16px}
      .nx-v2-home-stats{max-width:680px}
    }
    @media(max-width:430px){
      body.nx-v2-ui .topbar{grid-template-columns:38px minmax(0,1fr) auto;gap:5px;padding:8px 9px}
      body.nx-v2-ui .topbar .brand-title{font-size:13px;letter-spacing:.15em}
      body.nx-v2-ui .topbar .icon-btn,body.nx-v2-ui .nx-menu-left{width:36px;height:36px;min-width:36px}
      .nx-v2-hero{min-height:260px;padding:18px;border-radius:22px}
      .nx-v2-hero.home,.nx-v2-hero.discipline{min-height:275px}
      .nx-v2-hero.study,.nx-v2-hero.mindful{min-height:255px}
      .nx-v2-hero-note{display:none}
      .nx-v2-title{font-size:29px!important}
      .nx-v2-home-stats{gap:7px}
      .nx-v2-stat{padding:11px 9px}
      .nx-v2-stat b{font-size:19px}
      .nx-v2-quick-grid{gap:7px}
      .nx-v2-quick{min-height:86px;padding:11px 8px}
      body.nx-v2-ui #nxBottomNav{width:calc(100% - 14px);padding:5px;min-height:66px}
      body.nx-v2-ui #nxBottomNav .nx-nav-item{min-height:52px}
    }
    @media(prefers-reduced-motion:reduce){body.nx-v2-ui *,body.nx-v2-ui *:before,body.nx-v2-ui *:after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
  `;

  function installStyles() {
    if (!$('nxV2VisualStyles')) {
      const style = document.createElement('style');
      style.id = 'nxV2VisualStyles';
      style.textContent = css;
      document.head.appendChild(style);
    }
    document.body.classList.add('nx-v2-ui');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', document.body.classList.contains('dark') ? '#100d19' : '#f6f3fb');
  }

  function installHeader() {
    const mark = document.querySelector('.topbar .brandmark');
    if (mark) mark.innerHTML = `<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 33c-3-6-3-12 0-19 3 7 3 13 0 19Z"/><path d="M20 33C9 31 5 25 6 18c8 0 12 5 14 15Z"/><path d="M20 33c11-2 15-8 14-15-8 0-12 5-14 15Z"/><path d="M8 33h24M13 36h14"/></svg>`;
    const header = document.querySelector('.topbar');
    const actions = header?.querySelector('.top-actions');
    if (!header || !actions) return;
    const menu = header.querySelector('[aria-label="Open NEXORA Hub"], [title*="Hub"]');
    if (menu && menu.parentElement !== header) header.insertBefore(menu, header.firstChild);
    if (menu) menu.innerHTML = svg('menu');
    const timer = actions.querySelector('[title*="Timer" i], [aria-label*="Timer" i]');
    if (timer) timer.innerHTML = svg('timer');
    const theme = $('themeBtn');
    if (theme) {
      theme.innerHTML = svg(document.body.classList.contains('dark') ? 'sun' : 'moon');
      theme.dataset.nxV2Icon = document.body.classList.contains('dark') ? 'sun' : 'moon';
    }
  }

  const pages = [
    { id: 'homePage', route: 'home', key: 'home', label: 'Home', icon: 'home', kicker: 'YOUR SPACE TO GROW', title: 'Discipline today.\nFreedom tomorrow.', copy: 'A calmer mind. A stronger you. Build your life one small promise at a time.', cta: 'Open My Trackers', action: 'trackers', note: 'Your goals deserve one clear home.' },
    { id: 'disciplinesPage', route: 'disciplines', key: 'discipline', label: 'Discipline', icon: 'discipline', kicker: 'THE PATH OF DISCIPLINE', title: 'Arise, O Parth.', copy: 'Let purpose guide your effort. Build lasting habits through a gentle, guided journey.', cta: 'Begin your 31-day path', action: 'journey', note: 'Consistency without guilt. Continue at your pace.' },
    { id: 'studyPage', route: 'study', key: 'study', label: 'Study', icon: 'study', kicker: 'YOUR QUIET STUDY SPACE', title: 'Learn deeply.\nGrow endlessly.', copy: 'A focused corner for reading, revision and meaningful progress.', cta: 'Start a focus session', action: 'timer', note: 'Make room for deep work, one session at a time.' },
    { id: 'mindPage', route: 'mind', key: 'mindful', label: 'Mindful', icon: 'mindful', kicker: 'PAUSE · RESET · RETURN', title: 'Breathe. Be present.', copy: 'Step into a quieter space. Follow your breath and let the noise settle.', cta: 'Start breathing', action: 'breathing', note: 'You do not need to solve everything right now.' }
  ];

  function runHeroAction(action) {
    if (action === 'trackers') {
      if (typeof window.navigate === 'function') window.navigate('trackers');
      return;
    }
    if (action === 'journey') {
      const target = $('nxDisciplineJourney') || $('disciplineList');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (typeof window.navigate === 'function') window.navigate('disciplines');
      return;
    }
    if (action === 'timer') {
      if (typeof window.openModal === 'function') window.openModal('clockModal');
      else if (typeof window.navigate === 'function') window.navigate('study');
      return;
    }
    if (action === 'breathing') {
      const toggle = $('breathToggle');
      if (toggle) toggle.click();
      else if (typeof window.navigate === 'function') window.navigate('meditation');
    }
  }

  function installHeroes() {
    pages.forEach((page) => {
      const host = $(page.id);
      if (!host || host.querySelector('.nx-v2-hero')) return;
      const hero = document.createElement('section');
      hero.className = `nx-v2-hero ${page.key}`;
      hero.innerHTML = `<div class="nx-v2-hero-copy"><div class="nx-v2-kicker">${page.kicker}</div><h2 class="nx-v2-title">${page.title.replace('\n', '<br>')}</h2><p class="nx-v2-copy">${page.copy}</p><div class="nx-v2-hero-actions"><button type="button" class="nx-v2-hero-btn">${page.cta}${svg('arrow')}</button></div></div><div class="nx-v2-hero-note">${page.note}<b>NEXORA · GROW WITH PURPOSE</b></div>`;
      hero.querySelector('button').addEventListener('click', () => runHeroAction(page.action));
      const oldHead = host.querySelector('.page-head');
      if (oldHead) oldHead.insertAdjacentElement('afterend', hero);
      else host.prepend(hero);
    });
  }

  function installHome() {
    const page = $('homePage');
    if (!page) return;
    let root = $('nxV2Home');
    if (!root) {
      root = document.createElement('section');
      root.id = 'nxV2Home';
      root.className = 'nx-v2-home';
      root.innerHTML = `
        <div class="nx-v2-welcome"><div class="nx-v2-welcome-copy"><div class="nx-v2-overline">YOUR NEXORA SPACE</div><h2 class="nx-v2-greeting" id="nxV2Greeting">A fresh start, one step at a time.</h2><p class="nx-v2-subline">Your progress, your pace. Start with what matters today.</p></div></div>
        <div class="nx-v2-home-stats">
          <div class="nx-v2-stat"><b id="nxV2TrackerCount">0</b><span>Active trackers</span></div>
          <div class="nx-v2-stat"><b id="nxV2TasksDone">0</b><span>Tasks completed</span></div>
          <div class="nx-v2-stat"><b id="nxV2Streak">0</b><span>Day streak</span></div>
        </div>
        <button type="button" class="nx-v2-tracker-cta" id="nxV2TrackerCta"><span class="nx-v2-tracker-icon">${svg('tracker')}</span><span class="nx-v2-tracker-copy"><small>YOUR STARTING POINT</small><strong>My Trackers</strong><span>Create a tracker for any goal, add tasks, and choose an end date or keep it ongoing.</span></span><span class="nx-v2-tracker-arrow">${svg('arrow')}</span></button>
        <div class="nx-v2-quick-grid">
          <button type="button" class="nx-v2-quick" data-nx-open="disciplines">${svg('discipline')}<strong>Discipline Journey</strong><span>Build steady habits</span></button>
          <button type="button" class="nx-v2-quick" data-nx-open="study">${svg('book')}<strong>Study Space</strong><span>Focus and learn</span></button>
          <button type="button" class="nx-v2-quick" data-nx-open="mind">${svg('leaf')}<strong>Mindful Reset</strong><span>Pause and breathe</span></button>
        </div>
        <div class="nx-v2-task-wrap"><div class="nx-v2-section-title"><h2>Tasks inside your trackers</h2><span>Today</span></div><div id="nxV2TaskMount"></div></div>`;
      const hero = page.querySelector('.nx-v2-hero');
      if (hero) hero.insertAdjacentElement('afterend', root);
      else page.appendChild(root);
    }

    const taskCard = page.querySelector('[data-home-role="tasks"]');
    const taskMount = $('nxV2TaskMount');
    if (taskCard && taskMount && taskCard.parentElement !== taskMount) taskMount.appendChild(taskCard);

    const trackerCta = $('nxV2TrackerCta');
    if (trackerCta && trackerCta.dataset.nxV2Bound !== '1') {
      trackerCta.dataset.nxV2Bound = '1';
      trackerCta.addEventListener('click', () => {
        if (typeof window.navigate === 'function') window.navigate('trackers');
      });
    }
    root.querySelectorAll('[data-nx-open]').forEach((button) => {
      if (button.dataset.nxV2Bound === '1') return;
      button.dataset.nxV2Bound = '1';
      button.addEventListener('click', () => {
        const route = button.dataset.nxOpen;
        if (typeof window.navigate === 'function') window.navigate(route);
      });
    });
    updateHomeStats();
  }

  function updateHomeStats() {
    const s = appState();
    const trackers = Array.isArray(s.trackers) ? s.trackers.filter((item) => item && item.archived !== true && item.active !== false) : [];
    const tasks = Array.isArray(s.tasks) ? s.tasks : [];
    const completed = tasks.filter((item) => item && (item.done === true || item.completed === true)).length;
    const streak = Number(s.streak || 0);
    const name = String(s.profile?.name || '').trim();
    const firstName = name && name.toLowerCase() !== 'explorer' ? name.split(/\s+/)[0] : '';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetingEl = $('nxV2Greeting');
    if (greetingEl) greetingEl.textContent = `${greeting}${firstName ? `, ${firstName}` : ''}.`;
    if ($('nxV2TrackerCount')) $('nxV2TrackerCount').textContent = String(trackers.length);
    if ($('nxV2TasksDone')) $('nxV2TasksDone').textContent = String(completed);
    if ($('nxV2Streak')) $('nxV2Streak').textContent = String(streak);
  }

  function buildNavigation() {
    let nav = $('nxBottomNav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'nxBottomNav';
      document.body.appendChild(nav);
    }
    nav.className = 'nx-bottom-nav';
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML = pages.map((page) => `<button type="button" class="nx-nav-item" data-nx-page="${page.route}" aria-label="${page.label}"><b>${svg(page.icon)}</b><span>${page.label}</span></button>`).join('');
    nav.querySelectorAll('[data-nx-page]').forEach((button) => {
      button.addEventListener('click', () => {
        const route = button.dataset.nxPage;
        if (typeof window.navigate === 'function') window.navigate(route);
        setTimeout(syncNavigation, 0);
      });
    });
    syncNavigation();
  }

  function syncNavigation() {
    const active = document.querySelector('.page.active')?.id || 'homePage';
    const activeRoute = ({ homePage: 'home', disciplinesPage: 'disciplines', studyPage: 'study', mindPage: 'mind' })[active] || null;
    document.querySelectorAll('#nxBottomNav [data-nx-page]').forEach((button) => {
      const selected = button.dataset.nxPage === activeRoute;
      button.classList.toggle('active', selected);
      if (selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function patchRenderHooks() {
    const wrap = (name, after) => {
      const original = window[name];
      if (typeof original !== 'function' || original.__nxV2Wrapped) return;
      const replacement = function (...args) {
        const result = original.apply(this, args);
        Promise.resolve().then(after);
        return result;
      };
      replacement.__nxV2Wrapped = true;
      window[name] = replacement;
    };
    wrap('renderHome', updateHomeStats);
    wrap('renderAll', () => { updateHomeStats(); syncNavigation(); });
    wrap('persist', updateHomeStats);
    const navigate = window.navigate;
    if (typeof navigate === 'function' && !navigate.__nxV2Wrapped) {
      const replacement = function (...args) {
        const result = navigate.apply(this, args);
        Promise.resolve().then(syncNavigation);
        return result;
      };
      replacement.__nxV2Wrapped = true;
      window.navigate = replacement;
    }
  }

  function observeActivePage() {
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.target.classList?.contains('page'))) syncNavigation();
    });
    document.querySelectorAll('.page').forEach((page) => observer.observe(page, { attributes: true, attributeFilter: ['class'] }));
  }

  function init() {
    if (!document.body) return;
    installStyles();
    installHeader();
    installHeroes();
    installHome();
    buildNavigation();
    patchRenderHooks();
    observeActivePage();
    document.addEventListener('click', (event) => {
      if (event.target.closest('#themeBtn')) {
        setTimeout(() => {
          installHeader();
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute('content', document.body.classList.contains('dark') ? '#100d19' : '#f6f3fb');
        }, 80);
      }
    }, true);
    window.addEventListener('pageshow', () => {
      installHome(); updateHomeStats(); syncNavigation();
    });
    setTimeout(() => { updateHomeStats(); syncNavigation(); }, 150);
    setTimeout(() => { updateHomeStats(); syncNavigation(); }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
