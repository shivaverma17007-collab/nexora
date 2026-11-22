/*
 * NEXORA Final UI Integration v1
 * Load this file AFTER nexora-visual-refresh.js.
 * Frontend-only: preserves the existing state, Supabase, trackers and auth logic.
 */
(() => {
  'use strict';
  if (window.__NEXORA_FINAL_UI_V1__) return;
  window.__NEXORA_FINAL_UI_V1__ = true;

  const $ = id => document.getElementById(id);
  const getState = () => (typeof state !== 'undefined' && state) ? state : {};
  const toast = message => window.showToast ? window.showToast(message) : console.info(message);
  const persist = () => { if (typeof window.persist === 'function') window.persist(); };
  const todayKey = () => typeof window.today === 'function' ? window.today() : new Date().toISOString().slice(0, 10);
  const escapeHTML = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = seconds => String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, '0') + ':' + String(Math.max(0, seconds) % 60).padStart(2, '0');

  const icons = {
    home: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    tracking: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="m15.5 8.5 5-5m-3 0h3v3"/></svg>',
    social: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-1.9L6.1 12l1.4-2.4 1.7.6a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 1.9Z"/></svg>',
    timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/></svg>',
    music: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
  };

  const style = document.createElement('style');
  style.id = 'nxFinalUIStyles';
  style.textContent = `
    body.nx-v3-ui .page-head{display:block!important}
    body.nx-v3-ui #homePage>.page-head,body.nx-v3-ui #disciplinesPage>.page-head,body.nx-v3-ui #studyPage>.page-head,body.nx-v3-ui #mindPage>.page-head{display:none!important}
    body.nx-v3-ui .nx-final-overlay{position:fixed;inset:0;z-index:100100;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(9,7,17,.78);backdrop-filter:blur(12px);overscroll-behavior:contain}
    body.nx-v3-ui .nx-final-overlay.show{display:flex}
    body.nx-v3-ui.nx-final-overlay-open{overflow:hidden!important;touch-action:none}
    body.nx-v3-ui .nx-final-panel{width:min(100%,660px);max-height:90vh;overflow:auto;overscroll-behavior:contain;touch-action:pan-y;padding:18px;border:1px solid var(--v3-line);border-radius:25px;background:var(--v3-surface);color:var(--v3-ink);box-shadow:0 24px 80px #0008}
    .nx-final-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
    .nx-final-head h2{margin:0;font-size:22px;font-weight:950}.nx-final-head p{margin:5px 0 0;font-size:12px;color:var(--v3-muted)}
    .nx-final-close{width:38px;height:38px;border-radius:12px;background:var(--v3-surface2);color:var(--v3-ink);font-size:22px}
    .nx-study-tool-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:5px 0 18px}
    .nx-study-tool{min-height:112px;padding:15px;border-radius:20px;text-align:left;background:linear-gradient(145deg,var(--v3-surface),var(--v3-surface2));border:1px solid var(--v3-line);color:var(--v3-ink);box-shadow:var(--v3-shadow)}
    .nx-study-tool-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:13px;background:var(--v3-primary);color:#fff;margin-bottom:10px}.nx-study-tool-icon svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .nx-study-tool strong{display:block;font-size:15px}.nx-study-tool small{display:block;color:var(--v3-muted);font-size:11px;margin-top:4px}
    .nx-final-tabs,.nx-music-cats{display:flex;gap:7px;overflow:auto;padding:2px 0 12px;scrollbar-width:none}
    .nx-final-tabs button,.nx-music-cats button{white-space:nowrap;border:1px solid var(--v3-line);border-radius:99px;background:var(--v3-surface2);color:var(--v3-muted);padding:9px 13px;font-size:12px;font-weight:850}
    .nx-final-tabs button.active,.nx-music-cats button.active{background:var(--v3-primary);border-color:var(--v3-primary);color:#fff}
    .nx-preset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px}
    .nx-preset{min-height:75px;padding:12px;border-radius:16px;text-align:left;border:1px solid var(--v3-line);background:var(--v3-surface2);color:var(--v3-ink)}.nx-preset.active{border:2px solid var(--v3-primary);background:color-mix(in srgb,var(--v3-primary) 14%,var(--v3-surface))}.nx-preset b{display:block;font-size:13px}.nx-preset span{display:block;font-size:11px;color:var(--v3-muted);margin-top:4px}
    .nx-focus-display{text-align:center;padding:18px 10px 14px;border-radius:22px;background:radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--v3-primary) 22%,transparent),transparent 65%),var(--v3-surface2);border:1px solid var(--v3-line);margin:10px 0}
    .nx-focus-display strong{display:block;font-size:clamp(48px,13vw,72px);font-weight:950;letter-spacing:-.07em;line-height:1.05;font-variant-numeric:tabular-nums}.nx-focus-display span{display:block;color:var(--v3-muted);font-size:12px;margin-top:7px}
    .nx-focus-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px}.nx-focus-fields label{display:grid;gap:5px;font-size:11px;font-weight:850;color:var(--v3-muted)}.nx-focus-fields input,.nx-focus-fields select,.nx-custom-preset input{width:100%;min-width:0;padding:11px;border-radius:12px;border:1px solid var(--v3-line);background:var(--v3-surface);color:var(--v3-ink)}
    .nx-custom-preset{display:grid;grid-template-columns:1fr 82px 105px auto;gap:7px;margin:10px 0}.nx-custom-preset input,.nx-custom-preset select{width:100%;min-width:0;padding:10px;border-radius:12px;border:1px solid var(--v3-line);background:var(--v3-surface);color:var(--v3-ink)}.nx-custom-preset button{padding:10px;border-radius:12px;background:var(--v3-primary);color:#fff;font-size:12px;font-weight:850}
    .nx-final-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:13px 0}.nx-final-actions button{min-width:105px}
    .nx-music-list{display:grid;gap:7px;margin:8px 0 13px}.nx-music-track{display:flex;align-items:center;gap:11px;width:100%;padding:11px;border-radius:15px;border:1px solid var(--v3-line);background:var(--v3-surface2);color:var(--v3-ink);text-align:left}.nx-music-track.active{border-color:var(--v3-primary);background:color-mix(in srgb,var(--v3-primary) 13%,var(--v3-surface))}.nx-music-track b{display:block;font-size:12px}.nx-music-track small{display:block;color:var(--v3-muted);font-size:10px;margin-top:3px}.nx-music-play{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--v3-primary);color:#fff;flex:none}
    .nx-music-now{padding:15px;border-radius:19px;background:linear-gradient(140deg,#25203a,#171326);color:#fff}.nx-music-now small{color:#c5b7dc;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.nx-music-now h3{color:#fff;margin:5px 0;font-size:19px}.nx-music-now p{color:#d3cbe0;margin:0;font-size:11px}
    .nx-music-controls{display:flex;align-items:center;justify-content:center;gap:13px;margin:15px 0}.nx-music-controls button{width:44px;height:44px;border-radius:50%;background:var(--v3-surface2);color:var(--v3-ink);font-size:18px}.nx-music-controls button.primary{width:54px;height:54px;background:var(--v3-primary);color:#fff;font-size:21px}
    .nx-music-volume{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--v3-muted)}.nx-music-volume input{flex:1;accent-color:var(--v3-primary)}
    .nx-final-splash{position:fixed;inset:0;z-index:100200;display:grid;place-items:center;background:radial-gradient(circle at 50% 38%,#3c2a68,#100d19 66%);color:#fff;transition:opacity .45s ease,visibility .45s ease}.nx-final-splash.hide{opacity:0;visibility:hidden;pointer-events:none}.nx-final-splash-mark{position:relative;width:76px;height:76px;border-radius:25px;display:grid;place-items:center;background:linear-gradient(145deg,#b18af6,#6444b5);font-size:34px;font-weight:950;box-shadow:0 16px 48px #0007}.nx-final-splash-mark:after{content:'';position:absolute;inset:-8px;border:2px solid #ffffff38;border-top-color:#f4d9a1;border-radius:31px;animation:nxSplashSpin 1.2s linear infinite}@keyframes nxSplashSpin{to{transform:rotate(360deg)}}.nx-final-splash strong{display:block;letter-spacing:.23em;margin-top:17px;text-align:center}.nx-final-splash small{display:block;text-align:center;color:#cbbce4;margin-top:7px;letter-spacing:.12em}
    .nx-discipline-setup,.nx-discipline-task{padding:13px;border-radius:16px;background:var(--v3-surface2);border:1px solid var(--v3-line);margin-top:9px}.nx-discipline-task{display:flex;align-items:center;gap:8px}.nx-discipline-task .nx-task-name{flex:1;min-width:0;font-size:13px;font-weight:800}.nx-discipline-task button{width:38px;height:36px;border-radius:11px;font-weight:950}.nx-task-yes{background:#1e8d65;color:white}.nx-task-no{background:#a83c50;color:white}.nx-discipline-task .selected{outline:2px solid var(--v3-primary);outline-offset:2px}
    .nx-review-stars{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.nx-review-star{width:42px;height:42px;border-radius:12px;background:var(--v3-surface2);border:1px solid var(--v3-line);color:var(--v3-muted);font-size:24px}.nx-review-star.active{color:#e6b64b;border-color:#d6a944;background:color-mix(in srgb,#d6a944 13%,var(--v3-surface))}.nx-review-selected{font-size:12px;font-weight:850;color:var(--v3-primary);margin-top:7px}
    .nx-profile-editor{width:min(100%,620px)}.nx-profile-extras{font-size:12px;line-height:1.6;margin-top:9px;color:#fff}.nx-profile-editor .nx-form-card{margin-top:0}
    .nx-meditation-controls{display:grid;gap:12px;margin-bottom:14px}.nx-meditation-voice{padding:15px;border-radius:18px;background:var(--v3-surface2);border:1px solid var(--v3-line)}.nx-meditation-voice select{padding:10px;border-radius:11px;border:1px solid var(--v3-line);background:var(--v3-surface);color:var(--v3-ink)}.nx-meditation-sounds{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.nx-meditation-sounds button{padding:12px 5px;border-radius:14px;border:1px solid var(--v3-line);background:var(--v3-surface2);color:var(--v3-ink);font-size:11px;font-weight:800}.nx-meditation-sounds button.active{border-color:var(--v3-primary);background:color-mix(in srgb,var(--v3-primary) 13%,var(--v3-surface))}
    .nx-final-hub-group{margin-top:13px}.nx-final-hub-group .hub-label{margin-top:8px}
    @media(max-width:440px){.nx-final-panel{padding:14px;border-radius:22px}.nx-study-tool{padding:13px;min-height:104px}.nx-focus-fields{grid-template-columns:1fr}.nx-custom-preset{grid-template-columns:1fr 90px}.nx-custom-preset select{grid-column:1/-1}.nx-custom-preset button{grid-column:1/-1}.nx-preset-grid{gap:7px}.nx-meditation-sounds{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  function installSplash() {
    if ($('nxFinalSplash')) return;
    const node = document.createElement('div');
    node.id = 'nxFinalSplash';
    node.className = 'nx-final-splash';
    node.innerHTML = '<div><div class="nx-final-splash-mark">N</div><strong>N E X O R A</strong><small>YOUR SPACE TO GROW</small></div>';
    document.body.appendChild(node);
    requestAnimationFrame(() => setTimeout(() => node.classList.add('hide'), 620));
    setTimeout(() => node.remove(), 1150);
  }

  function makeOverlay(id, title, subtitle, content) {
    if ($(id)) return $(id);
    const node = document.createElement('div');
    node.id = id;
    node.className = 'nx-final-overlay';
    node.innerHTML = '<section class="nx-final-panel" role="dialog" aria-modal="true" aria-label="' + escapeHTML(title) + '"><div class="nx-final-head"><div><h2>' + escapeHTML(title) + '</h2><p>' + escapeHTML(subtitle) + '</p></div><button class="nx-final-close" type="button" aria-label="Close">×</button></div>' + content + '</section>';
    document.body.appendChild(node);
    node.querySelector('.nx-final-close').addEventListener('click', () => node.classList.remove('show'));
    node.addEventListener('click', event => { if (event.target === node) node.classList.remove('show'); });
    return node;
  }

  // --- Bottom navigation: Home / Tracking / Social / Settings ---
  function installFooterNavigation() {
    const nav = $('nxBottomNav');
    if (!nav) return;
    const oldRoutes = ['home', 'disciplines', 'study', 'mind'];
    const buttons = [...nav.querySelectorAll('[data-v3-page]')];
    if (buttons.length !== 4) return;
    const labels = [
      {route:'home',target:'home',label:'Home',icon:'home'},
      {route:'disciplines',target:'trackers',label:'Tracking',icon:'tracking'},
      {route:'study',target:'community',label:'Social',icon:'social'},
      {route:'mind',target:'settings',label:'Settings',icon:'settings'}
    ];
    buttons.forEach((button, index) => {
      const item = labels[index];
      button.dataset.v3Page = oldRoutes[index];
      button.dataset.finalTarget = item.target;
      button.dataset.nxPage = item.target;
      button.setAttribute('aria-label', item.label);
      button.innerHTML = '<b>' + icons[item.icon] + '</b><span>' + item.label + '</span>';
    });
    nav.dataset.v3Signature = oldRoutes.join('|');
    if (nav.dataset.finalBound !== '1') {
      nav.dataset.finalBound = '1';
      nav.addEventListener('click', event => {
        const button = event.target.closest('[data-final-target]');
        if (!button) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const target = button.dataset.finalTarget;
        if (typeof window.navigate === 'function') window.navigate(target);
        syncFooterNavigation();
      }, true);
    }
    syncFooterNavigation();
  }
  function syncFooterNavigation() {
    const activeId = document.querySelector('.page.active')?.id || 'homePage';
    let target = 'home';
    if (['trackersPage','analyticsPage','disciplinesPage','studyPage','mindPage','meditationPage','learningPage','historyPage','sprintPage','tasksPage','routinePage'].includes(activeId)) target = 'trackers';
    else if (['communityPage','profilePage','postsPage','reviewsPage','leaderboardPage','sharePage'].includes(activeId)) target = 'community';
    else if (['settingsPage','ownerPage','currentPage','journalPage'].includes(activeId)) target = 'settings';
    document.querySelectorAll('#nxBottomNav [data-final-target]').forEach(button => {
      const active = button.dataset.finalTarget === target;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
  }
  function wrapNavigateForFooter() {
    const original = window.navigate;
    if (typeof original !== 'function' || original.__nxFinalFooter) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      Promise.resolve().then(syncFooterNavigation);
      return result;
    };
    wrapped.__nxFinalFooter = true;
    window.navigate = wrapped;
  }

  // --- Focus Timer: default sessions, custom sessions and Stopwatch in one panel ---
  const defaultSessions = [
    {id:'focus',name:'Focus',minutes:25,description:'Deep work block',kind:'focus'},
    {id:'revision',name:'Revision',minutes:45,description:'Long revision block',kind:'focus'},
    {id:'minor-break',name:'Minor Break',minutes:5,description:'Short reset',kind:'break'},
    {id:'major-break',name:'Major Break',minutes:15,description:'Longer rest',kind:'break'}
  ];
  let focusMode = 'sessions', selectedSession = defaultSessions[0], remaining = 1500, elapsed = 0, focusInterval = null, focusRunning = false;
  let stopwatchSeconds = 0, stopwatchInterval = null, stopwatchRunning = false;
  function allSessions() {
    const custom = Array.isArray(getState().settings?.nxFocusPresets) ? getState().settings.nxFocusPresets : [];
    return defaultSessions.concat(custom.filter(item => item && item.id && Number(item.minutes) > 0));
  }
  function renderSessions() {
    const grid = $('nxFocusPresets');
    if (!grid) return;
    grid.innerHTML = '';
    allSessions().forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nx-preset' + (selectedSession.id === item.id ? ' active' : '');
      button.innerHTML = '<b>' + escapeHTML(item.name) + '</b><span>' + Number(item.minutes) + ' min · ' + (item.kind === 'break' ? 'Break' : 'Study') + ' · ' + escapeHTML(item.description || 'Custom session') + '</span>';
      button.addEventListener('click', () => chooseSession(item.id));
      grid.appendChild(button);
    });
  }
  function renderFocusClock() {
    if (!$('nxFocusClock')) return;
    $('nxFocusClock').textContent = fmt(focusMode === 'stopwatch' ? stopwatchSeconds : remaining);
    $('nxFocusCaption').textContent = focusMode === 'stopwatch' ? 'Stopwatch · count your time' : selectedSession.name + ' · ' + selectedSession.minutes + ' minute session';
    const isBreak = selectedSession.kind === 'break';
    const subjectField = $('nxFocusSubject')?.closest('label');
    const taskField = $('nxFocusDisciplineTask')?.closest('label');
    if (subjectField) subjectField.style.display = isBreak || focusMode === 'stopwatch' ? 'none' : '';
    if (taskField) taskField.style.display = isBreak || focusMode === 'stopwatch' ? 'none' : '';
    $('nxFocusStart').textContent = focusMode === 'stopwatch' ? (stopwatchRunning ? 'Pause' : 'Start stopwatch') : (focusRunning ? 'Pause' : 'Start focus');
  }
  function chooseSession(id) {
    const item = allSessions().find(p => String(p.id) === String(id));
    if (!item) return;
    if (focusRunning) resetFocus();
    selectedSession = item;
    remaining = Number(item.minutes) * 60;
    elapsed = 0;
    renderSessions();
    renderFocusClock();
  }
  function refreshFocusDisciplineOptions() {
    const select = $('nxFocusDisciplineTask');
    if (!select) return;
    const keep = select.value;
    const tasks = getState().disciplinePlan?.tasks || [];
    select.innerHTML = '<option value="">Personal study / no linked task</option>' + tasks.map(task => '<option value="' + escapeHTML(task.id) + '">' + escapeHTML(task.name) + '</option>').join('');
    if (tasks.some(task => String(task.id) === String(keep))) select.value = keep;
  }
  function setFocusMode(mode) {
    if (focusRunning) { clearInterval(focusInterval); focusInterval = null; focusRunning = false; }
    if (stopwatchRunning) { clearInterval(stopwatchInterval); stopwatchInterval = null; stopwatchRunning = false; }
    focusMode = mode === 'stopwatch' ? 'stopwatch' : 'sessions';
    $('nxFocusSessionsArea').style.display = focusMode === 'sessions' ? '' : 'none';
    $('nxFocusSaveStopwatch').style.display = focusMode === 'stopwatch' ? 'inline-flex' : 'none';
    $('nxFocusOverlay').querySelectorAll('[data-focus-mode]').forEach(button => button.classList.toggle('active', button.dataset.focusMode === focusMode));
    renderFocusClock();
  }
  function recordStudySession(minutes, name, source) {
    const app = getState();
    if (!Array.isArray(app.study)) app.study = [];
    const subject = ($('nxFocusSubject')?.value || '').trim() || 'Personal focus';
    const taskId = $('nxFocusDisciplineTask')?.value || '';
    const record = {id:Date.now(),minutes:Math.max(1,Math.round(minutes)),subject:subject.slice(0,80),note:name + ' · ' + source,date:todayKey(),disciplineTaskId:taskId || null,sessionName:name,source};
    app.study.unshift(record);
    app.focusSessions = (Number(app.focusSessions) || 0) + 1;
    if (!Array.isArray(app.focusHistory)) app.focusHistory = [];
    app.focusHistory.unshift({date:todayKey(),minutes:record.minutes,disciplineTaskId:taskId || null,sessionName:name});
    if (taskId && app.disciplinePlan) {
      if (!app.disciplinePlan.logs) app.disciplinePlan.logs = {};
      if (!app.disciplinePlan.logs[todayKey()]) app.disciplinePlan.logs[todayKey()] = {};
      app.disciplinePlan.logs[todayKey()][taskId] = true;
    }
    if (typeof window.markStreak === 'function') window.markStreak('study');
    persist();
    if (typeof window.renderAll === 'function') window.renderAll();
    renderDisciplinePlan();
    toast('Study session saved with its subject and duration.');
  }
  function completeFocus() {
    const isBreak = selectedSession.kind === 'break';
    if (!isBreak) {
      const minutes = Math.max(1, Math.round(elapsed / 60));
      recordStudySession(minutes, selectedSession.name, 'Focus Timer');
    }
    if ($('nxStopMusicOnFinish')?.checked) stopMusic();
    if (typeof window.playAlarm === 'function') window.playAlarm();
    toast(isBreak ? 'Break complete. Return when you feel ready.' : 'Session complete. Your study progress is saved.');
  }
  function startFocus() {
    if (focusMode === 'stopwatch') {
      if (stopwatchRunning) { clearInterval(stopwatchInterval); stopwatchRunning = false; }
      else { stopwatchRunning = true; stopwatchInterval = setInterval(() => { stopwatchSeconds++; renderFocusClock(); }, 1000); }
      renderFocusClock();
      return;
    }
    if (focusRunning) { clearInterval(focusInterval); focusInterval = null; focusRunning = false; renderFocusClock(); return; }
    if (remaining <= 0) { remaining = Number(selectedSession.minutes) * 60; elapsed = 0; }
    focusRunning = true;
    renderFocusClock();
    focusInterval = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      elapsed++;
      renderFocusClock();
      if (remaining === 0) { clearInterval(focusInterval); focusInterval = null; focusRunning = false; completeFocus(); renderFocusClock(); }
    }, 1000);
  }
  function resetFocus() {
    clearInterval(focusInterval); focusInterval = null; focusRunning = false;
    if (focusMode === 'stopwatch') {
      clearInterval(stopwatchInterval); stopwatchInterval = null; stopwatchRunning = false; stopwatchSeconds = 0;
    } else { remaining = Number(selectedSession.minutes) * 60; elapsed = 0; }
    renderFocusClock();
  }
  function saveStopwatch() {
    const minutes = Math.floor(stopwatchSeconds / 60);
    if (minutes < 1) { toast('Use the stopwatch for at least one minute before saving.'); return; }
    recordStudySession(minutes, 'Stopwatch session', 'Stopwatch');
    resetFocus();
  }
  function addCustomSession() {
    const name = $('nxCustomSessionName').value.trim();
    const minutes = Math.max(1, Math.min(180, Number($('nxCustomSessionMinutes').value) || 0));
    if (!name || !minutes) { toast('Enter a name and a duration from 1 to 180 minutes.'); return; }
    const app = getState();
    if (!app.settings) app.settings = {};
    if (!Array.isArray(app.settings.nxFocusPresets)) app.settings.nxFocusPresets = [];
    const kind = $('nxCustomSessionKind')?.value === 'break' ? 'break' : 'focus';
    const item = {id:'custom-' + Date.now(),name,minutes,description:'Your custom session',kind};
    app.settings.nxFocusPresets.push(item);
    persist();
    $('nxCustomSessionName').value = '';
    chooseSession(item.id);
    toast('Custom session saved.');
  }
  function installFocusPanel() {
    const overlay = makeOverlay('nxFocusOverlay','Focus Timer','Focus, Revision, Breaks and Stopwatch — all in one place.','<div class="nx-final-tabs"><button type="button" data-focus-mode="sessions" class="active">Sessions</button><button type="button" data-focus-mode="stopwatch">Stopwatch</button></div><div id="nxFocusSessionsArea"><div class="nx-preset-grid" id="nxFocusPresets"></div><div class="nx-custom-preset"><input id="nxCustomSessionName" maxlength="32" placeholder="Name your session"><input id="nxCustomSessionMinutes" type="number" min="1" max="180" value="30" aria-label="Custom minutes"><select id="nxCustomSessionKind" aria-label="Session type"><option value="focus">Study</option><option value="break">Break</option></select><button type="button" id="nxAddCustomSession">Add custom</button></div></div><div class="nx-focus-display"><strong id="nxFocusClock">25:00</strong><span id="nxFocusCaption">Focus · 25 minute session</span></div><div class="nx-focus-fields"><label>Subject<input id="nxFocusSubject" maxlength="80" placeholder="What are you studying?"></label><label>Connect to a Discipline task<select id="nxFocusDisciplineTask"><option value="">Personal study / no linked task</option></select></label></div><div class="nx-final-actions"><button type="button" class="secondary-btn" id="nxFocusReset">Reset</button><button type="button" class="primary-btn" id="nxFocusStart">Start focus</button><button type="button" class="small-btn" id="nxFocusSaveStopwatch" style="display:none">Save stopwatch</button></div><label style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--v3-muted);margin-top:6px"><input id="nxStopMusicOnFinish" type="checkbox"> Stop music when a focus session ends</label>');
    if (overlay.dataset.nxFocusControlsBound === '1') { renderSessions(); refreshFocusDisciplineOptions(); renderFocusClock(); return; }
    overlay.dataset.nxFocusControlsBound = '1';
    overlay.querySelectorAll('[data-focus-mode]').forEach(button => button.addEventListener('click', () => setFocusMode(button.dataset.focusMode)));
    $('nxAddCustomSession').addEventListener('click', addCustomSession);
    $('nxFocusReset').addEventListener('click', resetFocus);
    $('nxFocusStart').addEventListener('click', startFocus);
    $('nxFocusSaveStopwatch').addEventListener('click', saveStopwatch);
    if ($('studySubject') && !$('nxFocusSubject').value) $('nxFocusSubject').value = $('studySubject').value === 'Custom subject' ? '' : $('studySubject').value;
    renderSessions(); refreshFocusDisciplineOptions(); renderFocusClock();
  }

  const musicCatalog = {
    deep: [
      {id:'midnight-pages',name:'Midnight Pages',bpm:76,root:196,style:'lofi'},
      {id:'quiet-momentum',name:'Quiet Momentum',bpm:82,root:220,style:'lofi'},
      {id:'blue-hour',name:'Blue Hour Notes',bpm:72,root:174.61,style:'lofi'}
    ],
    break: [
      {id:'soft-horizon',name:'Soft Horizon',bpm:68,root:196,style:'soft'},
      {id:'rain-glass',name:'Rain on Glass',bpm:64,root:164.81,style:'ambient'},
      {id:'after-bell',name:'After the Bell',bpm:70,root:185,style:'soft'}
    ],
    revision: [
      {id:'memory-lane',name:'Memory Lane',bpm:84,root:220,style:'lofi'},
      {id:'steady-notes',name:'Steady Notes',bpm:88,root:196,style:'piano'},
      {id:'clear-recall',name:'Clear Recall',bpm:80,root:207.65,style:'piano'}
    ],
    ambience: [
      {id:'library-rain',name:'Library Rain',bpm:62,root:174.61,style:'ambient'},
      {id:'evening-water',name:'Evening Water',bpm:66,root:196,style:'ambient'},
      {id:'forest-window',name:'Forest Window',bpm:60,root:164.81,style:'ambient'}
    ]
  };
  const musicLabels = {deep:'Deep Focus',break:'Relax & Break',revision:'Revision',ambience:'Study Ambience'};
  let musicCategory='deep', musicTrack=musicCatalog.deep[0], musicContext=null, musicMaster=null, musicTimer=null, musicStep=0, musicElapsed=0, musicPlaying=false, musicVolume=.42, noiseBuffer=null;
  function musicContextReady() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { toast('Audio playback is not supported by this browser.'); return false; }
    if (musicContext) return true;
    musicContext = new AC();
    musicMaster = musicContext.createGain(); musicMaster.gain.value = musicVolume;
    const filter = musicContext.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=4200; filter.Q.value=.4;
    const comp = musicContext.createDynamicsCompressor(); comp.threshold.value=-24; comp.knee.value=20; comp.ratio.value=3;
    musicMaster.connect(filter); filter.connect(comp); comp.connect(musicContext.destination);
    return true;
  }
  function musicTone(freq, when, duration, volume, type, cutoff) {
    if (!musicContext || !musicMaster) return;
    const osc=musicContext.createOscillator(), filter=musicContext.createBiquadFilter(), gain=musicContext.createGain();
    osc.type=type || 'triangle'; osc.frequency.setValueAtTime(freq,when);
    filter.type='lowpass'; filter.frequency.setValueAtTime(cutoff || 1800,when);
    gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.025); gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    osc.connect(filter); filter.connect(gain); gain.connect(musicMaster); osc.start(when); osc.stop(when+duration+.04);
  }
  function musicNoise(when,duration,volume,highpass) {
    if (!musicContext || !musicMaster) return;
    if (!noiseBuffer) { noiseBuffer=musicContext.createBuffer(1,musicContext.sampleRate,musicContext.sampleRate); const data=noiseBuffer.getChannelData(0); for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1; }
    const src=musicContext.createBufferSource(), filter=musicContext.createBiquadFilter(), gain=musicContext.createGain();
    src.buffer=noiseBuffer; filter.type=highpass?'highpass':'lowpass'; filter.frequency.value=highpass?6500:1300;
    gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.008); gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    src.connect(filter); filter.connect(gain); gain.connect(musicMaster); src.start(when); src.stop(when+duration+.02);
  }
  function musicTick() {
    if (!musicContext || musicContext.state !== 'running') return;
    const t=musicContext.currentTime+.025, step=musicStep%64, bar=Math.floor(step/16)%4, root=musicTrack.root || 196, bpm=musicTrack.bpm || 76, semitone=[0,5,3,7][bar], style=musicTrack.style;
    const chord=[root*Math.pow(2,semitone/12),root*Math.pow(2,(semitone+3)/12),root*Math.pow(2,(semitone+7)/12)];
    if (step%16===0) chord.forEach((freq,i)=>musicTone(freq/2,t,3.65,i===0?.035:.022,style==='piano'?'sine':'triangle',1100));
    if (style !== 'ambient') {
      if (step%4===0) musicTone(72,t,.16,.22,'sine',160);
      if (step%16===8) musicNoise(t,.13,.055,true);
      if (step%2===0) musicNoise(t,.045,.013,true);
    }
    if (step%8===2 || step%8===6) {
      const note=[0,3,5,7,10,12][(Math.floor(step/2)+bar*2)%6];
      musicTone(root*Math.pow(2,note/12)*2,t,.42,style==='ambient'?.035:.055,style==='piano'?'sine':'triangle',2600);
    }
    musicStep++; musicElapsed += 60/bpm/4;
    if ($('nxMusicProgress')) $('nxMusicProgress').style.width=((musicElapsed%180)/180*100)+'%';
  }
  function renderMusicNow() {
    if (!$('nxMusicTitle')) return;
    $('nxMusicTitle').textContent=musicTrack.name;
    $('nxMusicSubtitle').textContent=musicLabels[musicCategory]+' · original instrumental loop';
    $('nxMusicToggle').textContent=musicPlaying?'Ⅱ':'▶';
    $('nxMusicToggle').setAttribute('aria-label',musicPlaying?'Pause music':'Play music');
  }
  function renderMusicCategory() {
    const tabs=$('nxMusicCategories'), list=$('nxMusicList'); if(!tabs || !list)return;
    tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.musicCategory===musicCategory));
    list.innerHTML='';
    musicCatalog[musicCategory].forEach(track=>{
      const button=document.createElement('button'); button.type='button'; button.className='nx-music-track'+(track.id===musicTrack.id?' active':'');
      button.innerHTML='<span class="nx-music-play">'+(track.id===musicTrack.id&&musicPlaying?'Ⅱ':'▶')+'</span><span><b>'+escapeHTML(track.name)+'</b><small>'+track.bpm+' BPM · instrumental</small></span>';
      button.addEventListener('click',()=>{musicTrack=track;startMusic();renderMusicCategory();}); list.appendChild(button);
    });
    renderMusicNow();
  }
  function startMusic() {
    if(!musicContextReady())return;
    musicContext.resume().then(()=>{
      if(musicTimer)clearInterval(musicTimer);
      musicStep=0;musicElapsed=0;musicPlaying=true;
      musicTimer=setInterval(musicTick,(60/(musicTrack.bpm||76)/4)*1000);
      renderMusicCategory();
    }).catch(()=>toast('Tap Play again to enable audio.'));
  }
  function stopMusic() {
    if(musicTimer)clearInterval(musicTimer); musicTimer=null; musicPlaying=false;
    if(musicContext){musicContext.close().catch(()=>{});musicContext=null;musicMaster=null;}
    renderMusicNow();
  }
  function toggleMusic() {
    if(!musicPlaying){startMusic();return;}
    if(musicContext && musicContext.state==='running') musicContext.suspend().then(()=>{musicPlaying=false;renderMusicNow();});
    else if(musicContext) musicContext.resume().then(()=>{musicPlaying=true;renderMusicNow();});
  }
  function stepMusic(direction) {
    const tracks=musicCatalog[musicCategory], index=tracks.findIndex(t=>t.id===musicTrack.id);
    musicTrack=tracks[(index+direction+tracks.length)%tracks.length];startMusic();renderMusicCategory();
  }
  function installMusicPanel() {
    const overlay=makeOverlay('nxMusicOverlay','NEXORA Music','Original lo-fi inspired instrumentals for different study moods.','<div class="nx-music-cats" id="nxMusicCategories"></div><div class="nx-music-list" id="nxMusicList"></div><div class="nx-music-now"><small>NOW PLAYING · NEXORA ORIGINAL</small><h3 id="nxMusicTitle">Midnight Pages</h3><p id="nxMusicSubtitle">Deep Focus · instrumental loop</p><div class="progress" style="margin-top:13px;background:#ffffff25"><i id="nxMusicProgress" style="width:0%;background:#e6c17c"></i></div></div><div class="nx-music-controls"><button type="button" id="nxMusicPrev" aria-label="Previous track">◀</button><button type="button" id="nxMusicToggle" class="primary" aria-label="Play or pause">▶</button><button type="button" id="nxMusicNext" aria-label="Next track">▶|</button></div><label class="nx-music-volume">Volume <input id="nxMusicVolume" type="range" min="0" max="100" value="42"><span id="nxMusicVolumeText">42%</span></label><p style="font-size:10px;color:var(--v3-muted);margin-top:10px">These are original in-app generated instrumental loops, not external copyrighted songs. Audio starts only after you tap Play.</p>');
    if (overlay.dataset.nxMusicControlsBound === '1') { renderMusicCategory(); return; }
    overlay.dataset.nxMusicControlsBound = '1';
    $('nxMusicCategories').innerHTML=Object.keys(musicCatalog).map(key=>'<button type="button" data-music-category="'+key+'">'+musicLabels[key]+'</button>').join('');
    overlay.querySelectorAll('[data-music-category]').forEach(button=>button.addEventListener('click',()=>{musicCategory=button.dataset.musicCategory;musicTrack=musicCatalog[musicCategory][0];if(musicPlaying)startMusic();else renderMusicCategory();}));
    $('nxMusicPrev').addEventListener('click',()=>stepMusic(-1));$('nxMusicNext').addEventListener('click',()=>stepMusic(1));$('nxMusicToggle').addEventListener('click',toggleMusic);
    $('nxMusicVolume').addEventListener('input',event=>{musicVolume=Number(event.target.value)/100;if(musicMaster&&musicContext)musicMaster.gain.setTargetAtTime(musicVolume,musicContext.currentTime,.06);$('nxMusicVolumeText').textContent=event.target.value+'%';});
    renderMusicCategory();
  }
  function installStudyTools() {
    const page=$('studyPage'); if(!page)return;
    let section=$('nxStudyToolGrid');
    if(!section){
      const hero=page.querySelector('.nx-v3-hero');
      section=document.createElement('section'); section.id='nxStudyToolGrid';
      section.innerHTML='<div class="nx-v3-section-title"><h2>Study tools</h2><span>Your focus workspace</span></div><div class="nx-study-tool-grid"><button type="button" class="nx-study-tool" id="nxOpenFocus"><span class="nx-study-tool-icon">'+icons.timer+'</span><strong>Focus Timer</strong><small>Focus · Revision · Breaks · Stopwatch</small></button><button type="button" class="nx-study-tool" id="nxOpenMusic"><span class="nx-study-tool-icon">'+icons.music+'</span><strong>Music</strong><small>Lo-fi playlists for every study mood</small></button></div>';
      if(hero)hero.insertAdjacentElement('afterend',section);else page.prepend(section);
    }
    installFocusPanel();installMusicPanel();
    const focus=$('nxOpenFocus');if(focus&&focus.dataset.bound!=='1'){focus.dataset.bound='1';focus.addEventListener('click',()=>{refreshFocusDisciplineOptions();renderSessions();$('nxFocusOverlay').classList.add('show');renderFocusClock();});}
    const music=$('nxOpenMusic');if(music&&music.dataset.bound!=='1'){music.dataset.bound='1';music.addEventListener('click',()=>{$('nxMusicOverlay').classList.add('show');renderMusicCategory();});}
  }
  function openFocusTimer() {
    if(!$('nxFocusOverlay'))installStudyTools();
    refreshFocusDisciplineOptions();renderSessions();$('nxFocusOverlay')?.classList.add('show');renderFocusClock();
  }

  // --- Discipline: 7 / 10 / 14 days or ongoing; daily tick/cross per task ---
  function ensureDisciplinePlan() {
    const app=getState();
    if(app.disciplinePlan)return app.disciplinePlan;
    const legacy=app.disciplineJourney;
    const habit=legacy?.habitText || 'My small daily step';
    const logs={};
    (legacy?.completedDays || []).forEach(date=>{logs[date]={main:true};});
    app.disciplinePlan={id:'discipline-plan-'+Date.now(),startDate:legacy?.startDate || todayKey(),durationMode:'ongoing',durationDays:null,tasks:[{id:'main',name:habit}],logs,legacyDurationDays:31};
    return app.disciplinePlan;
  }
  function renderDisciplinePlan() {
    const body=$('nxDisciplineProgramBody'); if(!body)return;
    if(!getState().disciplinePlan && getState().disciplineJourney){ensureDisciplinePlan();persist();}
    const plan=getState().disciplinePlan;
    if(!plan){
      body.innerHTML='<div class="nx-discipline-setup"><p class="sub">Start small. Kal tum jahan the, aaj usse ek kadam aage hona bhi progress hai.</p><div class="field"><label>Choose your plan</label><select id="nxPlanDuration"><option value="14">14 days</option><option value="10">10 days</option><option value="7">7 days</option><option value="ongoing">Unlimited · keep going</option></select></div><div class="field"><label>Your first habit</label><input id="nxPlanMainTask" maxlength="100" placeholder="Example: Study for 25 minutes"></div><div class="field"><label>Other daily steps (one per line, optional)</label><textarea id="nxPlanExtraTasks" rows="3" placeholder="Revise notes\nWalk for 10 minutes"></textarea></div><button class="primary-btn" id="nxCreateDisciplinePlan" style="width:100%">Start my Discipline plan</button></div>';
      $('nxCreateDisciplinePlan').addEventListener('click',createDisciplinePlan);
      return;
    }
    const tasks=Array.isArray(plan.tasks)?plan.tasks:[];
    const dayCount=Math.max(1,Math.floor((new Date(todayKey()+'T12:00:00')-new Date((plan.startDate||todayKey())+'T12:00:00'))/86400000)+1);
    const fixed=plan.durationMode!=='ongoing';
    const total=fixed?Number(plan.durationDays||14):null;
    const completedDates=Object.keys(plan.logs||{}).filter(date=>Object.values(plan.logs[date]||{}).some(value=>value===true));
    const dayLog=plan.logs?.[todayKey()]||{};
    body.innerHTML='<div class="nx-discipline-setup"><div class="nx-inline-row"><b>'+(fixed?'Day '+Math.min(dayCount,total)+' of '+total:'Day '+dayCount+' · Ongoing')+'</b><span class="nx-muted">'+completedDates.length+' active days</span></div>'+(fixed?'<div class="progress" style="margin:9px 0"><i style="width:'+Math.min(100,dayCount/total*100)+'%"></i></div>':'')+'<p class="sub" style="margin:8px 0">Chhoti shuruaat bhi kaafi hai. Apne aaj ke steps honestly mark karo.</p>'+tasks.map(task=>'<div class="nx-discipline-task"><span class="nx-task-name">'+escapeHTML(task.name)+'</span><button type="button" class="nx-task-yes '+(dayLog[task.id]===true?'selected':'')+'" data-task="'+escapeHTML(task.id)+'" data-status="yes" aria-label="Mark done">✓</button><button type="button" class="nx-task-no '+(dayLog[task.id]===false?'selected':'')+'" data-task="'+escapeHTML(task.id)+'" data-status="no" aria-label="Mark not done">×</button></div>').join('')+'<p class="nx-muted" style="font-size:11px;margin-top:10px">✓ Done · × Not done. Missed steps do not erase your earlier progress.</p><button type="button" class="text-btn" id="nxPlanSettingsLink" style="margin-top:8px">Change plan in Settings</button></div>';
    body.querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>markDisciplineTask(button.dataset.task,button.dataset.status==='yes')));
    $('nxPlanSettingsLink').addEventListener('click',()=>{window.navigate?.('settings');setTimeout(openDisciplineSettings,80);});
    ensureDisciplineSettingsCard();
  }
  function createDisciplinePlan() {
    const duration=$('nxPlanDuration')?.value||'14';
    const main=$('nxPlanMainTask')?.value.trim()||'';
    if(!main){toast('Start with one small habit.');return;}
    const extra=($('nxPlanExtraTasks')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean).slice(0,7);
    const tasks=[main].concat(extra).map((name,index)=>({id:'step-'+Date.now()+'-'+index,name:name.slice(0,100)}));
    getState().disciplinePlan={id:'discipline-plan-'+Date.now(),startDate:todayKey(),durationMode:duration==='ongoing'?'ongoing':'fixed',durationDays:duration==='ongoing'?null:Number(duration),tasks,logs:{}};
    persist();renderDisciplinePlan();refreshFocusDisciplineOptions();toast('Your Discipline plan has started.');
  }
  function markDisciplineTask(taskId,done) {
    const plan=getState().disciplinePlan;if(!plan)return;
    if(!plan.logs)plan.logs={};if(!plan.logs[todayKey()])plan.logs[todayKey()]={};
    plan.logs[todayKey()][taskId]=done;
    persist();renderDisciplinePlan();
  }
  function ensureDisciplineSettingsCard() {
    const page=$('settingsPage');if(!page||$('nxDisciplineSettingsCard'))return;
    const card=document.createElement('section');card.id='nxDisciplineSettingsCard';card.className='card';
    card.innerHTML='<div class="section-head"><h2>Discipline plan</h2></div><p class="sub">Change your duration and daily steps here. Your previous check-ins stay saved.</p><button type="button" class="primary-btn" id="nxEditDisciplinePlan">Edit Discipline plan</button>';
    page.appendChild(card);$('nxEditDisciplinePlan').addEventListener('click',openDisciplineSettings);
  }
  function openDisciplineSettings() {
    const plan=ensureDisciplinePlan();
    const node=makeOverlay('nxDisciplineSettingsOverlay','Discipline settings','Adjust the plan without deleting past progress.','<div class="field"><label>Plan duration</label><select id="nxEditPlanDuration"><option value="14">14 days</option><option value="10">10 days</option><option value="7">7 days</option><option value="ongoing">Unlimited · ongoing</option></select></div><div class="field"><label>Daily steps (one per line)</label><textarea id="nxEditPlanTasks" rows="6"></textarea></div><button type="button" class="primary-btn" id="nxSaveDisciplineSettings" style="width:100%">Save plan settings</button>');
    $('nxEditPlanDuration').value=plan.durationMode==='ongoing'?'ongoing':String(plan.durationDays||14);
    $('nxEditPlanTasks').value=(plan.tasks||[]).map(task=>task.name).join('\n');
    $('nxSaveDisciplineSettings').onclick=()=>{
      const lines=$('nxEditPlanTasks').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,8);
      if(!lines.length){toast('Keep at least one daily step.');return;}
      const oldTasks=plan.tasks||[];
      plan.tasks=lines.map((name,index)=>({id:oldTasks[index]?.id||'step-'+Date.now()+'-'+index,name:name.slice(0,100)}));
      const duration=$('nxEditPlanDuration').value;plan.durationMode=duration==='ongoing'?'ongoing':'fixed';plan.durationDays=duration==='ongoing'?null:Number(duration);
      persist();$('nxDisciplineSettingsOverlay').classList.remove('show');renderDisciplinePlan();refreshFocusDisciplineOptions();toast('Discipline settings saved.');
    };
    node.classList.add('show');
  }

  // --- Reviews: five selectable stars, with clear category labels ---
  const ratingLabels={1:'Worst',2:'Bad',3:'Okay',4:'Good',5:'Excellent'};
  function installReviewStars() {
    const rating=$('nxReviewRating');if(!rating||$('nxReviewStars'))return;
    const field=rating.closest('.field');if(!field)return;
    const wrap=document.createElement('div');wrap.id='nxReviewStars';wrap.innerHTML='<div class="nx-review-stars" role="group" aria-label="Choose a review rating">'+[1,2,3,4,5].map(n=>'<button type="button" class="nx-review-star" data-rating="'+n+'" aria-label="'+n+' stars · '+ratingLabels[n]+'">★</button>').join('')+'</div><div class="nx-review-selected" id="nxReviewSelected">Selected: Excellent</div>';
    field.appendChild(wrap);rating.style.display='none';
    let lastValue='';
    function select(value){value=Math.max(1,Math.min(5,Number(value)||5));rating.value=String(value);lastValue=String(value);wrap.querySelectorAll('[data-rating]').forEach(btn=>{const on=Number(btn.dataset.rating)<=value;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(Number(btn.dataset.rating)===value));});$('nxReviewSelected').textContent='Selected: '+ratingLabels[value];}
    wrap.querySelectorAll('[data-rating]').forEach(btn=>btn.addEventListener('click',()=>select(Number(btn.dataset.rating))));
    select(Number(rating.value)||5);
    // The existing review loader updates the hidden select after its async database read.
    setInterval(()=>{if(rating.value&&rating.value!==lastValue)select(Number(rating.value));},350);
  }

  // --- Profile: compact profile card + dedicated Edit Profile overlay ---
  let profileSaveInProgress=false;
  function decorateProfile() {
    const box=$('nxProfileContent');if(!box)return;
    const cover=box.querySelector('.nx-profile-cover');
    if(cover){
      const app=getState();
      const isOwn=!!box.querySelector('#nxProfileName');
      if(isOwn){
        let extra=cover.querySelector('.nx-profile-extras');
        if(!extra){extra=document.createElement('div');extra.className='nx-profile-extras';cover.appendChild(extra);}
        const exams=Array.isArray(app.profile?.exams)?app.profile.exams.join(', '):String(app.profile?.exams||'');
        const points=Number(app.points||app.profile?.points||0);
        extra.innerHTML=(exams?'<div><b>Exams:</b> '+escapeHTML(exams)+'</div>':'')+(app.profile?.showPoints?'<div><b>Points:</b> '+points+'</div>':'');
      }
    }
    const editForm=box.querySelector('.nx-form-card');
    if(editForm){
      let overlay=$('nxProfileEditOverlay');
      if(overlay)overlay.remove();
      overlay=makeOverlay('nxProfileEditOverlay','Edit Profile','Update your details, then save to return to your profile.','<div id="nxProfileEditMount"></div>');
      const mount=$('nxProfileEditMount');
      const save=editForm.querySelector('button.primary-btn');if(save)save.textContent='Save Profile';
      const existingExams=editForm.querySelector('#nxProfileExams');
      if(!existingExams){
        const field=document.createElement('div');field.className='field';field.innerHTML='<label>Exams / study goals</label><input id="nxProfileExams" maxlength="180" placeholder="SSC CGL, UPSC, NEET…">';
        const privacy=editForm.querySelector('#nxProfilePrivate')?.closest('label');
        editForm.insertBefore(field,privacy||save);
      }
      $('nxProfileExams').value=Array.isArray(getState().profile?.exams)?getState().profile.exams.join(', '):String(getState().profile?.exams||'');
      if(!editForm.querySelector('#nxProfileSharePoints')){
        const share=document.createElement('label');share.className='nx-inline-row';share.style.cssText='justify-content:flex-start;gap:9px;margin-top:10px';
        share.innerHTML='<input id="nxProfileSharePoints" type="checkbox" style="width:auto"><span><b>Show points & ranking on my profile</b><small class="nx-muted" style="display:block">Your preference is saved locally; public display needs profile backend support.</small></span>';
        editForm.insertBefore(share,save);
      }
      $('nxProfileSharePoints').checked=!!getState().profile?.showPoints;
      mount.appendChild(editForm);
      let trigger=cover?.querySelector('#nxEditProfileButton');
      if(!trigger){trigger=document.createElement('button');trigger.id='nxEditProfileButton';trigger.type='button';trigger.className='secondary-btn';trigger.textContent='Edit Profile';trigger.style.marginTop='12px';cover?.appendChild(trigger);}
      trigger.onclick=()=>overlay.classList.add('show');
      box.querySelectorAll('button').forEach(button=>{if(/open posts manager/i.test(button.textContent||''))button.remove();});
      const postHeading=[...box.querySelectorAll('b')].find(el=>/visible posts/i.test(el.textContent||''));if(postHeading)postHeading.textContent='Your Posts';
    }
  }
  function installProfileEditor() {
    if(typeof window.nxLoadProfile==='function'&&!window.nxLoadProfile.__nxFinalProfile){
      const original=window.nxLoadProfile;
      const wrapped=async function(...args){const result=await original.apply(this,args);decorateProfile();if(profileSaveInProgress){$('nxProfileEditOverlay')?.classList.remove('show');profileSaveInProgress=false;}return result;};
      wrapped.__nxFinalProfile=true;window.nxLoadProfile=wrapped;
    }
    if(typeof window.nxSaveProfile==='function'&&!window.nxSaveProfile.__nxFinalProfile){
      const original=window.nxSaveProfile;
      const wrapped=async function(...args){
        const examText=$('nxProfileExams')?.value||'';
        const app=getState();if(!app.profile)app.profile={};
        app.profile.exams=examText.split(',').map(x=>x.trim()).filter(Boolean).slice(0,8);
        app.profile.showPoints=!!$('nxProfileSharePoints')?.checked;
        persist();profileSaveInProgress=true;
        const result=await original.apply(this,args);
        setTimeout(()=>{profileSaveInProgress=false;},1200);
        return result;
      };
      wrapped.__nxFinalProfile=true;window.nxSaveProfile=wrapped;
    }
    decorateProfile();
  }

  // --- Meditation: bilingual guided voice + selectable ambient soundscapes ---
  let medContext=null,medGain=null,medSource=null,medSoundTimer=null,medSoundKind='none';
  const meditationScripts={
    hi:'अपने शरीर को आराम दें। कंधों को धीरे से ढीला छोड़ें। आंखें बंद करना चाहें तो कर सकते हैं। अब अपनी सांस को महसूस करें। सांस को बदलने की कोशिश न करें। विचार आएं तो उन्हें बिना जज किए जाने दें। धीरे से अपना ध्यान वापस सांस पर लाएं। आप जहां हैं, वहीं से शुरुआत कर सकते हैं।',
    en:'Allow your body to settle. Soften your shoulders and relax your face. Close your eyes if that feels comfortable. Notice your natural breath without trying to change it. When thoughts appear, let them pass without judgement. Gently bring your attention back to the breath. You can begin again, exactly where you are.'
  };
  function speakMeditation() {
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){toast('Voice guidance is not supported on this browser. The written guide is still available.');return;}
    const lang=$('nxMeditationVoiceLanguage')?.value||'hi';
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(meditationScripts[lang]);
    utterance.lang=lang==='hi'?'hi-IN':'en-IN';utterance.rate=.84;utterance.pitch=1;
    const voices=window.speechSynthesis.getVoices();
    const match=voices.find(v=>v.lang.toLowerCase().startsWith(lang==='hi'?'hi':'en-in'))||voices.find(v=>v.lang.toLowerCase().startsWith(lang));
    if(match)utterance.voice=match;
    window.speechSynthesis.speak(utterance);
  }
  function stopMeditationVoice(){if('speechSynthesis'in window)window.speechSynthesis.cancel();}
  function stopMeditationSound(){if(medSoundTimer)clearInterval(medSoundTimer);medSoundTimer=null;if(medSource){try{medSource.stop();}catch(_){}medSource=null;}if(medContext){medContext.close().catch(()=>{});medContext=null;medGain=null;}medSoundKind='none';document.querySelectorAll('[data-med-sound]').forEach(b=>b.classList.remove('active'));}
  function startMeditationSound(kind) {
    stopMeditationSound();
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('Ambient audio is not supported on this device.');return;}
    medSoundKind=kind;medContext=new AC();medGain=medContext.createGain();medGain.gain.value=.22;medGain.connect(medContext.destination);
    medContext.resume().then(()=>{
      if(kind==='chimes'){
        const ring=()=>{if(!medContext)return;const when=medContext.currentTime+.03;[523.25,659.25,783.99].forEach((freq,i)=>{const osc=medContext.createOscillator(),gain=medContext.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,when+i*.12);gain.gain.exponentialRampToValueAtTime(.09,when+i*.12+.02);gain.gain.exponentialRampToValueAtTime(.0001,when+i*.12+2.4);osc.connect(gain);gain.connect(medGain);osc.start(when+i*.12);osc.stop(when+i*.12+2.5);});};ring();medSoundTimer=setInterval(ring,6500);
      }else{
        const length=medContext.sampleRate*3,buffer=medContext.createBuffer(1,length,medContext.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
        const source=medContext.createBufferSource(),filter=medContext.createBiquadFilter(),gain=medContext.createGain();source.buffer=buffer;source.loop=true;
        filter.type=kind==='wind'?'lowpass':kind==='water'?'bandpass':'lowpass';filter.frequency.value=kind==='wind'?440:kind==='water'?900:1800;filter.Q.value=kind==='water'?1.2:.45;
        gain.gain.value=kind==='rain'?.18:kind==='water'?.11:.10;source.connect(filter);filter.connect(gain);gain.connect(medGain);source.start();medSource=source;
      }
      document.querySelectorAll('[data-med-sound]').forEach(b=>b.classList.toggle('active',b.dataset.medSound===kind));
    }).catch(()=>toast('Tap the sound again to enable audio.'));
  }
  function installMeditationControls() {
    const page=$('meditationPage');if(!page||$('nxGuidedMeditation'))return;
    const hero=page.querySelector('.nx-v3-hero');
    const card=document.createElement('section');card.id='nxGuidedMeditation';card.className='nx-meditation-controls';
    card.innerHTML='<div class="nx-meditation-voice"><div class="eyebrow">GUIDED MEDITATION · VOICE</div><h3 style="margin:5px 0 10px">A gentle guided pause</h3><label style="display:grid;gap:6px;font-size:12px;color:var(--v3-muted);font-weight:800">Guidance language<select id="nxMeditationVoiceLanguage"><option value="hi">हिन्दी</option><option value="en">English</option></select></label><p class="sub" id="nxMeditationGuideText" style="margin-top:10px">अपने शरीर को आराम दें। अपनी सांस को महसूस करें। विचार आएं तो उन्हें जाने दें और धीरे से सांस पर लौट आएं।</p><div class="nx-final-actions"><button type="button" class="primary-btn" id="nxMeditationVoicePlay">Play voice guidance</button><button type="button" class="secondary-btn" id="nxMeditationVoiceStop">Stop voice</button></div></div><div class="nx-meditation-voice"><div class="eyebrow">AMBIENT SOUNDS</div><h3 style="margin:5px 0 10px">Choose your atmosphere</h3><div class="nx-meditation-sounds"><button type="button" data-med-sound="rain">Rain</button><button type="button" data-med-sound="water">Flowing water</button><button type="button" data-med-sound="chimes">Soft chimes</button><button type="button" data-med-sound="wind">Gentle wind</button></div><div class="nx-final-actions"><button type="button" class="small-btn" id="nxMeditationSoundStop">Stop sound</button></div></div>';
    if(hero)hero.insertAdjacentElement('afterend',card);else page.prepend(card);
    $('nxMeditationVoiceLanguage').addEventListener('change',event=>{$('nxMeditationGuideText').textContent=meditationScripts[event.target.value];});
    $('nxMeditationVoicePlay').addEventListener('click',speakMeditation);$('nxMeditationVoiceStop').addEventListener('click',stopMeditationVoice);
    card.querySelectorAll('[data-med-sound]').forEach(button=>button.addEventListener('click',()=>startMeditationSound(button.dataset.medSound)));
    $('nxMeditationSoundStop').addEventListener('click',stopMeditationSound);
  }
  function replaceMindBreathingWithMeditation() {
    const page=$('mindPage');if(!page||$('nxMindMeditationRedirect'))return;
    page.querySelectorAll('.breath-orb,#breathToggle,#breathLabel,.mind-choice').forEach(el=>el.style.display='none');
    const card=document.createElement('section');card.id='nxMindMeditationRedirect';card.className='card';
    card.innerHTML='<h2>Guided Meditation</h2><p class="sub">Breathing drills have been replaced with a guided meditation space, Hindi and English voice guidance, and ambient sounds.</p><button type="button" class="primary-btn" id="nxMindOpenMeditation">Open Meditation</button>';
    const hero=page.querySelector('.nx-v3-hero');if(hero)hero.insertAdjacentElement('afterend',card);else page.appendChild(card);
    $('nxMindOpenMeditation').addEventListener('click',()=>window.navigate?.('meditation'));
  }

  // --- Hamburger: reorder existing links into clear functional groups ---
  function organizeHamburger() {
    const hub=$('hub');if(!hub||hub.dataset.nxFinalGrouped==='1')return;
    const links=[...hub.querySelectorAll('.hub-link')];if(!links.length)return;
    const groups=[
      {name:'Tracking',test:t=>/tracker|analytics|discipline|sprint|task/i.test(t)},
      {name:'Study',test:t=>/study|quiz|pyq|current affairs|meditation|learning/i.test(t)},
      {name:'Social',test:t=>/community|posts|reviews|leaderboard|peer profile/i.test(t)},
      {name:'History',test:t=>/history/i.test(t)},
      {name:'Settings',test:t=>/settings|account|profile|backup|privacy|owner|share/i.test(t)}
    ];
    const buckets=groups.map(g=>({group:g,items:[]}));
    links.forEach(link=>{
      const text=(link.textContent||'').trim();
      const bucket=buckets.find(item=>item.group.test(text));
      (bucket||buckets[4]).items.push(link);
    });
    hub.querySelectorAll('.hub-label').forEach(label=>label.style.display='none');
    const root=document.createElement('div');root.id='nxFinalHubGroups';
    buckets.forEach(bucket=>{
      if(!bucket.items.length)return;
      const section=document.createElement('section');section.className='nx-final-hub-group';
      const label=document.createElement('div');label.className='hub-label';label.textContent=bucket.group.name;section.appendChild(label);
      bucket.items.forEach(link=>section.appendChild(link));root.appendChild(section);
    });
    const foot=hub.querySelector('.hub-foot');if(foot)hub.insertBefore(root,foot);else hub.appendChild(root);
    hub.dataset.nxFinalGrouped='1';
  }


  function installHomeHydrationShortcut(){
    const page=$('homePage'),root=$('nxV3Home'),grid=root?.querySelector('.nx-v3-quick-grid');
    if(!page||!root||!grid)return;
    const hydration=page.querySelector('[data-home-role="hydration"]');
    if(hydration&&!$('nxV3HydrationMount')){
      const mount=document.createElement('section');mount.id='nxV3HydrationMount';
      mount.innerHTML='<div class="nx-v3-section-title"><h2>Daily wellbeing</h2><span>Small healthy actions</span></div>';
      hydration.style.display='';hydration.style.width='100%';hydration.style.gridColumn='1/-1';
      mount.appendChild(hydration);
      const taskWrap=root.querySelector('.nx-v3-task-wrap');
      if(taskWrap)taskWrap.insertAdjacentElement('afterend',mount);else root.appendChild(mount);
    }
    if(hydration&&!grid.querySelector('[data-final-hydration]')){
      const button=document.createElement('button');button.type='button';button.className='nx-v3-quick';button.dataset.finalHydration='1';
      button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5S5.5 10 5.5 15a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5Z"/><path d="M9 16c.4 1.3 1.4 2 3 2"/></svg><strong>Hydration</strong><span>Keep water intake on track</span>';
      button.addEventListener('click',()=>$('nxV3HydrationMount')?.scrollIntoView({behavior:'smooth',block:'center'}));
      grid.appendChild(button);
    }
  }

  function interceptLegacyClockModal() {
    const original=window.openModal;
    if(typeof original!=='function'||original.__nxFinalClockRedirect)return;
    const wrapped=function(id,...args){
      if(id==='clockModal'){
        if(typeof window.navigate==='function')window.navigate('study');
        setTimeout(openFocusTimer,80);
        return;
      }
      return original.call(this,id,...args);
    };
    wrapped.__nxFinalClockRedirect=true;window.openModal=wrapped;
  }

  function installFinalUI() {
    installSplash();
    const header=document.querySelector('.topbar');
    const clockButton=header?.querySelector('.top-actions [title*="Timer" i],.top-actions [aria-label*="Timer" i]');
    clockButton?.remove();
    installFooterNavigation();wrapNavigateForFooter();
    installStudyTools();interceptLegacyClockModal();installHomeHydrationShortcut();
    installMeditationControls();replaceMindBreathingWithMeditation();
    installReviewStars();installProfileEditor();organizeHamburger();
    ensureDisciplineSettingsCard();renderDisciplinePlan();
    const home=$('homePage');
    const mindful=home?.querySelector('[data-v3-open="mind"]');
    if(mindful){mindful.dataset.v3Open='meditation';const title=mindful.querySelector('strong');const detail=mindful.querySelector('span');if(title)title.textContent='Meditation';if(detail)detail.textContent='Guided calm';}
    installHomeHydrationShortcut();
    const oldClock=$('clockModal');if(oldClock)oldClock.style.display='none';
    const pageObserver=new MutationObserver(records=>{
      if(records.some(r=>r.target?.classList?.contains('page')))syncFooterNavigation();
    });
    pageObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
    const overlayObserver=new MutationObserver(records=>{if(records.some(record=>record.target?.classList?.contains('nx-final-overlay'))){document.body.classList.toggle('nx-final-overlay-open',!!document.querySelector('.nx-final-overlay.show'));}});
    overlayObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){document.querySelectorAll('.nx-final-overlay.show').forEach(node=>node.classList.remove('show'));}});
  }

  // Re-render the custom Discipline view after the legacy app refreshes its pages.
  if(typeof window.renderAll==='function'&&!window.renderAll.__nxFinalDiscipline){
    const original=window.renderAll;
    const wrapped=function(...args){const result=original.apply(this,args);Promise.resolve().then(()=>{renderDisciplinePlan();syncFooterNavigation();});return result;};
    wrapped.__nxFinalDiscipline=true;window.renderAll=wrapped;
  }
  if(typeof window.renderDisciplines==='function'&&!window.renderDisciplines.__nxFinalDiscipline){
    const original=window.renderDisciplines;
    const wrapped=function(...args){const result=original.apply(this,args);Promise.resolve().then(renderDisciplinePlan);return result;};
    wrapped.__nxFinalDiscipline=true;window.renderDisciplines=wrapped;
  }
  window.nxOpenFocusTimer=openFocusTimer;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installFinalUI,{once:true});
  else installFinalUI();
  window.addEventListener('pageshow',()=>{installFooterNavigation();syncFooterNavigation();});
  setTimeout(()=>{installFooterNavigation();installStudyTools();installHomeHydrationShortcut();installMeditationControls();installReviewStars();installProfileEditor();organizeHamburger();renderDisciplinePlan();},500);
})();
