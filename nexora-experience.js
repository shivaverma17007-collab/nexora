/* NEXORA Experience Refresh — additive UI layer for the existing NEXORA app.
 * Load this file AFTER nexora-update.js. It preserves the existing state model,
 * local tracker history, authentication flow and Supabase policies.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const appState = () => (typeof state !== 'undefined' ? state : null);
  const appUser = () => (typeof currentNexoraUser !== 'undefined' ? currentNexoraUser : null);
  const appClient = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let selectedDate = todayKey();
  let openedTrackerId = null;
  let renderQueued = false;
  let observer = null;
  let pendingProfilePhoto = null;
  const delay = fn => { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; fn(); }); };
  const notify = message => { if (typeof window.showToast === 'function') window.showToast(message); else if (typeof window.toast === 'function') window.toast(message); };

  function addStyles() {
    const themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.setAttribute('content','#347d72');
    if ($('nxExperienceRefreshStyles')) return;
    const style = document.createElement('style');
    style.id = 'nxExperienceRefreshStyles';
    style.textContent = `
      body.nx-life-theme{--bg:#f3f7f5;--surface:#ffffff;--surface-2:#eaf2ef;--ink:#1c302d;--ink-soft:#405b55;--muted:#71827d;--line:#dce8e3;--primary:#347d72;--primary-soft:#e0f1ec;--shadow:0 8px 28px rgba(25,62,53,.07)}
      body.dark.nx-life-theme{--bg:#101a18;--surface:#192724;--surface-2:#21332f;--ink:#eff8f4;--ink-soft:#d0e1db;--muted:#9db2aa;--line:#304640;--primary:#70c7b4;--primary-soft:#24483f;--shadow:0 12px 30px rgba(0,0,0,.25)}
      body.nx-life-theme .hero{background:linear-gradient(135deg,#285d55,#347d72 60%,#6a9a83)}
      body.nx-life-theme .primary-btn{background:var(--primary);border-color:var(--primary)}
      body.nx-life-theme .secondary-btn,body.nx-life-theme .small-btn{border-color:var(--line)}
      #nxLifeHome{margin:10px 0 14px}
      .nx-life-welcome{position:relative;overflow:hidden;padding:20px;border-radius:25px;background:linear-gradient(135deg,#214f48,#347d72 64%,#83ad91);color:#fff;box-shadow:0 14px 34px rgba(31,91,76,.18)}
      .nx-life-welcome:after{content:'';position:absolute;width:170px;height:170px;right:-64px;top:-86px;border:1px solid #ffffff45;border-radius:50%;box-shadow:0 0 0 20px #ffffff0b,0 0 0 40px #ffffff08}
      .nx-life-welcome>*{position:relative;z-index:1}.nx-life-welcome .eyebrow{color:#d6eee6}.nx-life-welcome h2{color:#fff;font-size:24px;margin:7px 0}.nx-life-welcome p{color:#e6f3ef;font-size:13px;line-height:1.5;margin:0}
      .nx-life-home-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:17px}.nx-life-home-metric{padding:10px;border:1px solid #ffffff35;background:#ffffff16;border-radius:15px;min-width:0}.nx-life-home-metric b{display:block;color:#fff;font-size:19px}.nx-life-home-metric span{font-size:10px;color:#e4f2ed}
      .nx-life-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0}.nx-life-action{min-height:88px;text-align:left;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:4px;padding:12px;border-radius:18px;background:var(--surface);border:1px solid var(--line);color:var(--ink);box-shadow:var(--shadow);font-weight:800;font-size:12px}.nx-life-action:active{transform:scale(.985)}.nx-life-action b{font-size:23px;line-height:1.2}.nx-life-action small{font-size:10px;font-weight:600;color:var(--muted)}.nx-life-action.featured{background:var(--primary-soft);border-color:color-mix(in srgb,var(--primary) 35%,var(--line));color:var(--primary)}
      #nxLifeTrackerRoot{display:grid;gap:13px;margin-top:8px}.nx-life-tracker-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.nx-life-tracker-head h2{font-size:22px;margin:3px 0}.nx-life-tracker-head p{font-size:12px;color:var(--muted);margin:0}.nx-life-create{flex:none;padding:11px 14px;border-radius:14px;background:var(--primary);color:#fff;font-weight:850;box-shadow:0 7px 16px color-mix(in srgb,var(--primary) 23%,transparent)}
      .nx-life-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;padding:10px;border-radius:19px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow)}.nx-life-day{min-width:0;padding:8px 2px;border-radius:13px;background:transparent;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:5px;border:1px solid transparent}.nx-life-day small{font-size:9px;font-weight:800}.nx-life-day b{width:29px;height:29px;display:grid;place-items:center;border-radius:50%;font-size:12px;background:var(--surface-2);color:var(--ink)}.nx-life-day.done b{background:var(--primary);color:#fff}.nx-life-day.selected{background:var(--primary-soft);border-color:color-mix(in srgb,var(--primary) 32%,var(--line));color:var(--primary)}.nx-life-day.today small:after{content:' ·';color:var(--primary)}
      .nx-life-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.nx-life-stat{padding:12px;border-radius:16px;background:var(--surface-2);min-width:0}.nx-life-stat b{display:block;font-size:20px;color:var(--ink)}.nx-life-stat span{font-size:10px;color:var(--muted);line-height:1.3}
      .nx-life-list{display:grid;gap:9px}.nx-life-card{padding:14px;border-radius:20px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow);min-width:0}.nx-life-card-top{display:flex;align-items:center;gap:10px}.nx-life-icon{width:43px;height:43px;flex:none;display:grid;place-items:center;border-radius:14px;background:var(--primary-soft);font-size:22px}.nx-life-title{font-size:15px;font-weight:850;color:var(--ink);min-width:0;overflow-wrap:anywhere}.nx-life-meta{font-size:10px;color:var(--muted);margin-top:3px}.nx-life-progress-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:13px 0 7px;font-size:12px}.nx-life-progress-row b{font-size:13px;color:var(--ink)}.nx-life-progress{height:8px;border-radius:99px;background:var(--surface-2);overflow:hidden}.nx-life-progress i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--primary),#84bda0);transition:width .2s ease}.nx-life-dots{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin-top:11px}.nx-life-dot{min-width:0;height:25px;border-radius:8px;background:var(--surface-2);color:var(--muted);font-size:9px;font-weight:800;display:grid;place-items:center}.nx-life-dot.done{background:var(--primary-soft);color:var(--primary)}.nx-life-dot.today{outline:1px solid var(--primary)}
      .nx-life-card-actions{display:flex;align-items:center;gap:8px;margin-top:12px}.nx-life-card-actions button{min-height:39px;padding:8px 12px;border-radius:12px;font-size:11px;font-weight:850}.nx-life-log{background:var(--primary);color:#fff;flex:1}.nx-life-open{background:var(--surface-2);color:var(--ink)}.nx-life-undo{background:transparent;border:1px solid var(--line);color:var(--muted)}
      .nx-life-detail{margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}.nx-life-detail-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.nx-life-task{display:flex;align-items:center;gap:9px;padding:9px 0;border-top:1px solid var(--line);font-size:12px}.nx-life-task input{width:19px;height:19px;accent-color:var(--primary)}.nx-life-task span{flex:1;min-width:0;overflow-wrap:anywhere}.nx-life-task.done span{text-decoration:line-through;color:var(--muted)}.nx-life-add-task{padding:8px 11px;border-radius:11px;background:var(--primary-soft);color:var(--primary);font-size:11px;font-weight:850}
      .nx-life-empty{padding:23px 17px;border-radius:20px;border:1px dashed var(--line);background:var(--surface);text-align:center}.nx-life-empty b{display:block;font-size:28px;margin-bottom:7px}.nx-life-empty p{font-size:12px;color:var(--muted);line-height:1.5}
      #nxBottomNav{gap:4px!important;overflow-x:visible!important;padding-left:7px!important;padding-right:7px!important}.nx-nav-item{min-width:0!important;flex:1 1 0!important;max-width:none!important}.nx-nav-item b{font-size:19px!important}.nx-nav-item span{font-size:9px!important}
      .nx-theme-confirm-backdrop{position:fixed;inset:0;z-index:1000005;display:grid;place-items:center;padding:18px;background:rgba(13,25,22,.58);backdrop-filter:blur(7px)}.nx-theme-confirm{width:min(100%,420px);padding:20px;border-radius:24px;border:1px solid var(--line);background:var(--surface);color:var(--ink);box-shadow:0 25px 70px rgba(0,0,0,.3)}.nx-theme-confirm h3{font-size:18px;margin:0 0 8px}.nx-theme-confirm p{font-size:13px;line-height:1.55;color:var(--muted);margin:0}.nx-theme-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.nx-theme-confirm-actions button{min-height:43px;padding:10px 15px;border-radius:13px;font-weight:850}.nx-theme-cancel{background:var(--surface-2);color:var(--ink)}.nx-theme-danger{background:#c94f62;color:#fff}
      .nx-native-date-source{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important}.nx-date-wrap{width:100%;min-width:0;position:relative}.nx-date-trigger{width:100%;min-height:46px;padding:11px 13px;text-align:left;border:1px solid var(--line);border-radius:14px;background:var(--surface-2);color:var(--ink);font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:8px}.nx-date-backdrop{position:fixed;inset:0;z-index:1000001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,25,22,.56);backdrop-filter:blur(6px)}.nx-date-card{width:min(100%,390px);padding:16px;border-radius:23px;border:1px solid var(--line);background:var(--surface);color:var(--ink);box-shadow:0 20px 60px rgba(0,0,0,.28)}.nx-date-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:13px}.nx-date-head b{font-size:15px}.nx-date-head button{width:37px;height:37px;border-radius:11px;background:var(--surface-2);color:var(--ink);font-size:19px}.nx-date-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.nx-date-grid span{font-size:10px;color:var(--muted);text-align:center;padding:6px 0}.nx-date-grid button{height:39px;border-radius:11px;background:var(--surface-2);color:var(--ink);font-weight:700}.nx-date-grid button.selected{background:var(--primary);color:#fff}.nx-date-grid button:disabled{opacity:.3}.nx-date-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:13px}.nx-date-actions button{padding:10px 14px;border-radius:12px;background:var(--primary-soft);color:var(--primary);font-weight:800}
      .nx-photo-tools{display:grid;gap:9px}.nx-photo-preview{width:88px;height:88px;border-radius:50%;object-fit:cover;background:var(--surface-2);border:2px solid var(--line)}.nx-photo-select{display:inline-flex;align-items:center;justify-content:center;min-height:43px;padding:10px 14px;border-radius:13px;background:var(--primary-soft);color:var(--primary);font-weight:850;font-size:12px;width:max-content}.nx-photo-hint{font-size:10px;color:var(--muted)}
      #nxOwnerContent .nx-owner-panel .nx-inline-row .nx-muted,#nxOwnerContent .nx-owner-panel:first-child>p,#nxOwnerContent .nx-owner-panel:nth-child(2)>p{display:none!important}
      @media(max-width:390px){.nx-life-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.nx-life-welcome{padding:17px}.nx-life-day{padding:6px 1px}.nx-life-stat{padding:10px}}
    `;
    document.head.appendChild(style);
  }

  function currentTrackerLogs(trackerId, date) {
    const rows = Array.isArray(appState()?.trackerLogs) ? appState().trackerLogs : [];
    return rows.filter(x => String(x.trackerId) === String(trackerId) && x.date === date).reduce((sum,x) => sum + (Number(x.value) || 0), 0);
  }
  function trackerStreak(tracker) {
    const target = Math.max(1, Number(tracker.target) || 1);
    let cursor = new Date(todayKey() + 'T12:00:00');
    if (currentTrackerLogs(tracker.id, todayKey()) < target) cursor.setDate(cursor.getDate()-1);
    let streak = 0;
    for (let i=0;i<365;i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
      if (currentTrackerLogs(tracker.id,key) < target) break;
      streak++; cursor.setDate(cursor.getDate()-1);
    }
    return streak;
  }
  function weekDates() {
    const end = new Date(todayKey() + 'T12:00:00');
    return Array.from({length:7},(_,i)=>{const d=new Date(end);d.setDate(end.getDate()-6+i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;});
  }
  function shortDate(key) { const d=new Date(key+'T12:00:00'); return {day:d.toLocaleDateString(undefined,{weekday:'short'}).slice(0,2),date:d.getDate()}; }
  function activeTrackers() { return (appState()?.trackers || []).filter(t => !t.endDate || t.endDate >= todayKey()); }

  function installTrackerRoot() {
    const page=$('trackersPage'); if(!page) return;
    const head=page.querySelector('.page-head'); if(!head) return;
    $('nxTrackerIntro')?.style.setProperty('display','none','important');
    $('nxTrackerSummary')?.style.setProperty('display','none','important');
    $('nxTrackerLegacyHost')?.style.setProperty('display','none','important');
    let root=$('nxLifeTrackerRoot');
    if(!root){root=document.createElement('div');root.id='nxLifeTrackerRoot';head.insertAdjacentElement('afterend',root);}
    renderTrackers();
  }

  function renderTrackers() {
    const root=$('nxLifeTrackerRoot'); if(!root || !appState()) return;
    const trackers=activeTrackers();
    const logs=Array.isArray(state.trackerLogs)?state.trackerLogs:[];
    const days=weekDates();
    const totalToday=trackers.filter(t=>currentTrackerLogs(t.id,todayKey())>=Math.max(1,Number(t.target)||1)).length;
    const openTasks=(state.tasks||[]).filter(t=>t.trackerId && !(t.done||t.completed)).length;
    const doneTasks=(state.tasks||[]).filter(t=>t.trackerId && (t.done||t.completed)).length;
    const greeting=new Date().getHours()<12?'Good morning':new Date().getHours()<17?'Good afternoon':'Good evening';
    root.innerHTML=`
      <div class="nx-life-tracker-head"><div><div class="eyebrow">YOUR TRACKING SPACE</div><h2>My Trackers</h2><p>${greeting} · small steps add up</p></div><button class="nx-life-create" type="button" onclick="openModal('trackerModal')">＋ Create</button></div>
      <div class="nx-life-week" aria-label="Last seven days">${days.map(k=>{const d=shortDate(k);const done=trackers.some(t=>currentTrackerLogs(t.id,k)>=Math.max(1,Number(t.target)||1));return `<button type="button" class="nx-life-day ${selectedDate===k?'selected':''} ${done?'done':''} ${k===todayKey()?'today':''}" onclick="nxChooseTrackerDate('${k}')"><small>${d.day}</small><b>${d.date}</b></button>`;}).join('')}</div>
      <div class="nx-life-summary"><div class="nx-life-stat"><b>${trackers.length}</b><span>Active trackers</span></div><div class="nx-life-stat"><b>${totalToday}/${trackers.length}</b><span>Goals completed today</span></div><div class="nx-life-stat"><b>${openTasks}</b><span>Open tracker tasks</span></div></div>
      <div class="nx-life-list">${trackers.length?trackers.map(t=>trackerCard(t,days,logs)).join(''):`<div class="nx-life-empty"><b>🌱</b><strong>Your first tracker starts here</strong><p>Create one for study, fitness, reading, hydration or any goal. Add tasks only when you need them.</p><button class="nx-life-create" type="button" onclick="openModal('trackerModal')">Create my first tracker</button></div>`}</div>
      ${doneTasks?`<details class="nx-life-empty"><summary style="cursor:pointer;font-weight:800">Completed tracker tasks · ${doneTasks}</summary><p style="margin:10px 0 0">Your completed tasks are saved in their trackers.</p></details>`:''}
      ${(()=>{const old=(state.tasks||[]).filter(t=>!t.trackerId);return old.length?`<details class="nx-life-empty"><summary style="cursor:pointer;font-weight:800">Earlier tasks · ${old.length}</summary>${old.map(t=>`<div class="nx-life-task ${t.done||t.completed?'done':''}"><input type="checkbox" ${t.done||t.completed?'checked':''} onchange="toggleTask('${esc(t.id)}')"><span>${esc(t.text||t.title||'Task')}</span></div>`).join('')}</details>`:''})()}
    `;
  }

  function trackerCard(t,days,logs) {
    const value=currentTrackerLogs(t.id,selectedDate);
    const target=Math.max(1,Number(t.target)||1);
    const pct=Math.min(100,Math.round(value/target*100));
    const tasks=(state.tasks||[]).filter(x=>String(x.trackerId||'')===String(t.id));
    const completed=tasks.filter(x=>x.done||x.completed).length;
    const isToday=selectedDate===todayKey();
    const dateText=selectedDate===todayKey()?'Today':new Date(selectedDate+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});
    const dots=days.map(k=>{const v=currentTrackerLogs(t.id,k);const done=v>=target;return `<span class="nx-life-dot ${done?'done':''} ${k===todayKey()?'today':''}" title="${k}: ${v}/${target}">${done?'✓':shortDate(k).date}</span>`;}).join('');
    const detail=String(openedTrackerId)===String(t.id)?`<div class="nx-life-detail"><div class="nx-life-detail-head"><b style="font-size:12px">Tasks · ${completed}/${tasks.length}</b><button class="nx-life-add-task" type="button" onclick="nxAddTrackerTask('${esc(t.id)}')">＋ Add task</button></div>${tasks.length?tasks.map(x=>`<label class="nx-life-task ${x.done||x.completed?'done':''}"><input type="checkbox" ${x.done||x.completed?'checked':''} onchange="toggleTask('${esc(x.id)}')"><span>${esc(x.text||x.title||'Task')}</span><button class="nx-life-undo" type="button" onclick="nxDeleteTrackerTask('${esc(x.id)}')">×</button></label>`).join(''):'<p class="nx-life-meta">No tasks yet. Add only the next actions you need.</p>'}<div class="nx-life-card-actions"><button class="nx-life-open" type="button" onclick="nxEditTracker('${esc(t.id)}')">Edit tracker</button><button class="nx-life-undo" type="button" onclick="nxDeleteTracker('${esc(t.id)}')">Delete</button></div></div>`:'';
    return `<article class="nx-life-card"><div class="nx-life-card-top"><div class="nx-life-icon">${esc(t.icon||'🎯')}</div><div style="flex:1;min-width:0"><div class="nx-life-title">${esc(t.name||'My tracker')}</div><div class="nx-life-meta">${esc((t.mode||'standard').toUpperCase())} · ${t.durationMode==='until'&&t.endDate?'Ends '+esc(t.endDate):'Ongoing'} · 🔥 ${trackerStreak(t)} day streak</div></div><button class="nx-life-open" type="button" style="padding:8px 10px;border-radius:11px;font-size:10px;font-weight:850" onclick="nxOpenTracker('${esc(t.id)}')">${String(openedTrackerId)===String(t.id)?'Close':'Open'}</button></div><div class="nx-life-progress-row"><b>${value} / ${target} ${esc(t.unit||'times')}</b><span style="color:var(--muted)">${pct}% · ${dateText}</span></div><div class="nx-life-progress"><i style="width:${pct}%"></i></div><div class="nx-life-dots">${dots}</div><div class="nx-life-card-actions"><button class="nx-life-log" type="button" ${isToday?'':'disabled'} style="opacity:${isToday?1:.45}" onclick="nxLogTracker('${esc(t.id)}',1)">${pct>=100?'＋ Add more':`＋ Log ${esc(t.unit||'progress')}`}</button><button class="nx-life-undo" type="button" ${value>0&&isToday?'':'disabled'} onclick="nxLogTracker('${esc(t.id)}',-1)">Undo</button></div>${detail}</article>`;
  }

  window.nxChooseTrackerDate = function(key){selectedDate=key;renderTrackers();};
  window.nxOpenTracker = function(id){openedTrackerId=String(openedTrackerId)===String(id)?null:String(id);renderTrackers();};
  window.nxLogTracker = function(id,amount){if(selectedDate!==todayKey()){notify('You can add progress for today. Earlier days are shown as history.');return;}if(typeof window.logTracker==='function')window.logTracker(id,amount);else return;renderTrackers();};
  window.nxDeleteTrackerTask = async function(id){if(!await themeConfirm('Delete task?','This task will be removed from its tracker.','Delete'))return;state.tasks=state.tasks.filter(t=>String(t.id)!==String(id));persist();notify('Task deleted.');renderTrackers();};
  window.nxDeleteTracker = async function(id){if(!await themeConfirm('Delete tracker?','This tracker and its progress history will be removed. Its tasks will remain saved as earlier tasks.','Delete'))return;state.trackers=state.trackers.filter(t=>String(t.id)!==String(id));state.trackerLogs=(state.trackerLogs||[]).filter(x=>String(x.trackerId)!==String(id));(state.tasks||[]).forEach(t=>{if(String(t.trackerId||'')===String(id))delete t.trackerId;});persist();openedTrackerId=null;notify('Tracker deleted.');renderTrackers();};
  window.nxEditTracker = async function(id){const t=state.trackers.find(x=>String(x.id)===String(id));if(!t)return;const name=await themePrompt('Edit tracker name','Give this tracker a clear name.',t.name||'');if(name===null)return;if(!name.trim()){notify('Enter a tracker name.');return;}t.name=name.trim();persist();renderTrackers();};

  function installHome() {
    const page=$('homePage'); if(!page)return;
    let home=$('nxLifeHome');
    if(!home){home=document.createElement('section');home.id='nxLifeHome';const head=page.querySelector('.page-head');if(head)head.insertAdjacentElement('afterend',home);else page.prepend(home);}
    const name=(appState()?.profile?.name||'').trim();
    const first=name&&name.toLowerCase()!=='explorer'?name.split(/\s+/)[0]+', ':'';
    const greeting=new Date().getHours()<12?'Good morning':new Date().getHours()<17?'Good afternoon':'Good evening';
    const done=(state.tasks||[]).filter(t=>t.done||t.completed).length;
    const active=activeTrackers().length;
    const streak=state.streak||0;
    home.innerHTML=`<div class="nx-life-welcome"><div class="eyebrow">YOUR NEXORA SPACE</div><h2>${greeting}, ${esc(first||'Explorer').replace(/, $/,'')} ✨</h2><p>Make today count, one small step at a time.</p><div class="nx-life-home-metrics"><div class="nx-life-home-metric"><b>${active}</b><span>Trackers</span></div><div class="nx-life-home-metric"><b>${done}</b><span>Tasks done</span></div><div class="nx-life-home-metric"><b>${streak} 🔥</b><span>Day streak</span></div></div></div><div class="nx-life-actions"><button class="nx-life-action featured" onclick="navigate('trackers')"><b>🎯</b>My Trackers<small>Plan and track goals</small></button><button class="nx-life-action" onclick="navigate('study')"><b>📚</b>Study Space<small>Log a study session</small></button><button class="nx-life-action" onclick="openModal('clockModal')"><b>⏱️</b>Timer<small>Focus or stopwatch</small></button><button class="nx-life-action" onclick="navigate('meditation')"><b>🧘</b>Meditation<small>Take a calm pause</small></button><button class="nx-life-action" onclick="navigate('mind')"><b>🌿</b>Mind Refresh<small>Sounds and breathing</small></button><button class="nx-life-action" onclick="navigate('learning')"><b>🧩</b>Quizzes<small>Practice and progress</small></button><button class="nx-life-action" onclick="navigate('community')"><b>🌍</b>Community<small>Connect and grow</small></button><button class="nx-life-action" onclick="toggleHub(true)"><b>☰</b>More<small>Posts, reviews and settings</small></button></div>`;
    ['.home-split','#smartTickerBox','#streakHero','.section-head','.grid','.quick-row','#homeCurrentAffairsCard','#nxHomeDashboard','.nx-home-actions','.nx-coming-card'].forEach(sel=>page.querySelectorAll(sel).forEach(el=>el.style.setProperty('display','none','important')));
  }

  function installFooter() {
    const nav=$('nxBottomNav');if(!nav)return;
    const owner=nav.querySelector('#nxOwnerNav');
    nav.innerHTML=`<button type="button" class="nx-nav-item" data-nx-page="home" onclick="navigate('home')"><b>⌂</b><span>Home</span></button><button type="button" class="nx-nav-item" data-nx-page="trackers" onclick="navigate('trackers')"><b>🎯</b><span>Trackers</span></button><button type="button" class="nx-nav-item" data-nx-page="study" onclick="navigate('study')"><b>📚</b><span>Study</span></button><button type="button" class="nx-nav-item" data-nx-page="learning" onclick="navigate('learning')"><b>🧩</b><span>Quizzes</span></button><button type="button" class="nx-nav-item" data-nx-page="community" onclick="navigate('community')"><b>🌍</b><span>Community</span></button><button type="button" class="nx-nav-item" data-nx-page="more" onclick="toggleHub(true)"><b>☰</b><span>More</span></button>`;
    if(owner){owner.style.display='none';owner.onclick=()=>navigate('owner');nav.appendChild(owner);}
    syncFooter();
  }
  function syncFooter(){const active=document.querySelector('.page.active')?.id?.replace(/Page$/,'')||'home';document.querySelectorAll('#nxBottomNav .nx-nav-item[data-nx-page]').forEach(b=>b.classList.toggle('active',b.dataset.nxPage===active||(b.dataset.nxPage==='learning'&&active==='leaderboard')));}

  function themeConfirm(title,message,yesLabel='Continue') {
    return new Promise(resolve=>{
      $('nxThemeConfirm')?.remove();
      const root=document.createElement('div');root.id='nxThemeConfirm';root.className='nx-theme-confirm-backdrop';
      root.innerHTML=`<section class="nx-theme-confirm" role="dialog" aria-modal="true" aria-labelledby="nxThemeConfirmTitle"><h3 id="nxThemeConfirmTitle">${esc(title)}</h3><p>${esc(message)}</p><div class="nx-theme-confirm-actions"><button type="button" class="nx-theme-cancel" data-choice="no">Cancel</button><button type="button" class="nx-theme-danger" data-choice="yes">${esc(yesLabel)}</button></div></section>`;
      const finish=value=>{root.remove();resolve(value);};
      root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-choice="no"]'))finish(false);else if(e.target.closest('[data-choice="yes"]'))finish(true);});
      document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'&&root.isConnected){document.removeEventListener('keydown',onKey);finish(false);}});
      document.body.appendChild(root);root.querySelector('[data-choice="yes"]')?.focus();
    });
  }
  window.nxThemeConfirm=themeConfirm;

  function themePrompt(title,message,initial='') {
    return new Promise(resolve=>{
      $('nxThemePrompt')?.remove();const root=document.createElement('div');root.id='nxThemePrompt';root.className='nx-theme-confirm-backdrop';
      root.innerHTML=`<section class="nx-theme-confirm" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(message)}</p><input id="nxThemePromptValue" type="text" maxlength="80" value="${esc(initial)}" style="width:100%;margin-top:14px;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink)"><div class="nx-theme-confirm-actions"><button type="button" class="nx-theme-cancel" data-cancel>Cancel</button><button type="button" class="nx-life-create" data-save>Save</button></div></section>`;
      const finish=value=>{root.remove();resolve(value);};root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-cancel]'))finish(null);if(e.target.closest('[data-save]'))finish($('nxThemePromptValue').value);});document.body.appendChild(root);$('nxThemePromptValue')?.focus();$('nxThemePromptValue')?.select();
    });
  }

  function installDatePickers() {
    document.querySelectorAll('input[type="date"]').forEach(input=>{
      if(input.dataset.nxDate==='1')return;input.dataset.nxDate='1';
      const wrap=document.createElement('div');wrap.className='nx-date-wrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);input.classList.add('nx-native-date-source');input.tabIndex=-1;input.setAttribute('aria-hidden','true');
      const btn=document.createElement('button');btn.type='button';btn.className='nx-date-trigger';btn.innerHTML=`<span>${input.value||'Choose date'}</span><b>▦</b>`;wrap.appendChild(btn);input._nxDateButton=btn;
      const refresh=()=>{btn.querySelector('span').textContent=input.value||'Choose date';};input.addEventListener('change',refresh);btn.addEventListener('click',()=>openDatePicker(input));
    });
  }
  function openDatePicker(input) {
    $('nxDatePicker')?.remove();
    const current=input.value||input.min||todayKey();let cursor=new Date(current+'T12:00:00');cursor.setDate(1);
    const min=input.min?new Date(input.min+'T12:00:00'):null,max=input.max?new Date(input.max+'T12:00:00'):null;
    const root=document.createElement('div');root.id='nxDatePicker';root.className='nx-date-backdrop';
    root.innerHTML=`<div class="nx-date-card" role="dialog" aria-modal="true"><div class="nx-date-head"><button type="button" data-prev>‹</button><b data-month></b><button type="button" data-next>›</button></div><div class="nx-date-grid" data-grid></div><div class="nx-date-actions"><button type="button" data-cancel>Cancel</button></div></div>`;
    document.body.appendChild(root);
    const render=()=>{const year=cursor.getFullYear(),month=cursor.getMonth();root.querySelector('[data-month]').textContent=cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'});const first=new Date(year,month,1).getDay(),count=new Date(year,month+1,0).getDate();const cells=['Su','Mo','Tu','We','Th','Fr','Sa'].map(x=>`<span>${x}</span>`);for(let i=0;i<first;i++)cells.push('<span></span>');for(let day=1;day<=count;day++){const d=new Date(year,month,day,12),key=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,disabled=(min&&d<min)||(max&&d>max);cells.push(`<button type="button" data-day="${key}" class="${key===input.value?'selected':''}" ${disabled?'disabled':''}>${day}</button>`);}root.querySelector('[data-grid]').innerHTML=cells.join('');};
    root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-cancel]'))root.remove();if(e.target.closest('[data-prev]')){cursor.setMonth(cursor.getMonth()-1);render();}if(e.target.closest('[data-next]')){cursor.setMonth(cursor.getMonth()+1);render();}const day=e.target.closest('[data-day]');if(day){input.value=day.dataset.day;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input._nxDateButton.querySelector('span').textContent=input.value;root.remove();}});
    render();
  }

  function upgradeControls() {
    if(typeof window.initThemedSelects==='function')window.initThemedSelects();
    installDatePickers();
  }

  function installProfilePhoto() {
    const originalLoad=window.nxLoadProfile;
    if(typeof originalLoad==='function'&&!originalLoad.__nxPhotoPatch){
      const wrapped=async function(...args){const result=await originalLoad.apply(this,args);setTimeout(()=>{installProfilePhotoField();patchOwnAvatarAfterRender();},0);return result;};wrapped.__nxPhotoPatch=true;window.nxLoadProfile=wrapped;
    }
    installProfilePhotoField();
  }
  function installProfilePhotoField() {
    const old=$('nxProfileAvatar');if(!old)return;
    const field=old.closest('.field');if(!field)return;
    if($('nxProfilePhotoFile'))return;
    const current=$('nxProfileContent')?.querySelector('.nx-profile-cover .nx-avatar img')?.src||'';
    field.innerHTML=`<label>Profile photo</label><div class="nx-photo-tools"><img id="nxProfilePhotoPreview" class="nx-photo-preview" src="${current}" alt="Profile photo preview" style="${current?'':'display:none'}"><label class="nx-photo-select" for="nxProfilePhotoFile">Choose photo from device</label><input id="nxProfilePhotoFile" type="file" accept="image/*" style="display:none"><span class="nx-photo-hint">JPG, PNG or WebP · image is resized before saving</span></div>`;
    $('nxProfilePhotoFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){notify('Please choose an image file.');return;}if(file.size>12*1024*1024){notify('Choose an image smaller than 12 MB.');e.target.value='';return;}try{pendingProfilePhoto=await compressPhoto(file);const img=$('nxProfilePhotoPreview');img.src=pendingProfilePhoto;img.style.display='block';notify('Photo ready. Save your profile to apply it.');}catch(_){notify('This image could not be opened. Try another photo.');}});
  }
  function compressPhoto(file) {
    return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{const canvas=document.createElement('canvas'),max=320,scale=Math.min(1,max/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);let quality=.78,data=canvas.toDataURL('image/jpeg',quality);while(data.length>105000&&quality>.4){quality-=.08;data=canvas.toDataURL('image/jpeg',quality);}URL.revokeObjectURL(url);if(data.length>105000)reject(new Error('large'));else resolve(data);}catch(e){URL.revokeObjectURL(url);reject(e);}};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image'));};img.src=url;});
  }
  function installProfileSave() {
    const original=window.nxSaveProfile;if(typeof original!=='function'||original.__nxPhotoSavePatch)return;
    const wrapped=async function(){
      if(!appUser()||!appClient()){if(typeof window.openAuthModal==='function')window.openAuthModal();return;}
      const name=$('nxProfileName')?.value.trim()||'';if(!name){notify('Enter a display name.');return;}
      const bio=$('nxProfileBio')?.value.trim()||'';const is_private=!!$('nxProfilePrivate')?.checked;
      const username=$('nxProfileUsername')?.value.trim().replace(/^@/,'').toLowerCase()||'';
      try{
        const selectedPhoto=pendingProfilePhoto;
        let avatar_url=selectedPhoto;
        if(!avatar_url){const existing=await appClient().from('profiles').select('avatar_url').eq('id',appUser().id).maybeSingle();avatar_url=existing.data?.avatar_url||null;}
        const {error}=await appClient().from('profiles').update({display_name:name,bio,is_private,avatar_url}).eq('id',appUser().id);
        if(error)throw error;
        if(username){let result=await appClient().rpc('nexora_set_username',{p_username:username});if(result.error)result=await appClient().rpc('nexora_set_username',{username});if(result.error)result=await appClient().rpc('nexora_set_username',{new_username:username});if(result.error)notify('Profile saved, but username could not be updated.');}
        if(selectedPhoto&&appState()?.profile){appState().profile.customPfp=selectedPhoto;if(typeof window.persist==='function')window.persist();}
        pendingProfilePhoto=null;notify('Profile updated.');if(typeof window.nxLoadProfile==='function')await window.nxLoadProfile();
      }catch(_){notify('Profile could not be saved. Please try again.');}
    };
    wrapped.__nxPhotoSavePatch=true;window.nxSaveProfile=wrapped;
  }
  async function patchOwnAvatarAfterRender() {
    const img=$('nxProfilePhotoPreview');if(img&&pendingProfilePhoto){img.src=pendingProfilePhoto;img.style.display='block';}
    const user=appUser(),client=appClient();if(!user||!client)return;
    try{const {data}=await client.from('profiles').select('avatar_url,display_name').eq('id',user.id).maybeSingle();if(data?.avatar_url?.startsWith('data:image/')){const avatar=$('nxProfileContent')?.querySelector('.nx-profile-cover .nx-avatar');if(avatar)avatar.innerHTML=`<img class="nx-avatar-img" src="${data.avatar_url}" alt="${esc(data.display_name||'Profile')}">`;const preview=$('nxProfilePhotoPreview');if(preview&&!pendingProfilePhoto){preview.src=data.avatar_url;preview.style.display='block';}}}catch(_){}
  }

  function applyPublicDataAvatars() {
    const boxes=[...document.querySelectorAll('#nxCommunityContent [data-nx-person]')];
    if(!boxes.length||!appClient())return;
    appClient().from('profiles').select('id,display_name,username,avatar_url').then(({data})=>{
      if(!Array.isArray(data))return;
      boxes.forEach(card=>{const key=(card.dataset.nxPerson||'').toLowerCase();const p=data.find(x=>key.includes(String(x.display_name||'').toLowerCase())&&x.avatar_url?.startsWith('data:image/'));if(p){const avatar=card.querySelector('.nx-avatar');if(avatar)avatar.innerHTML=`<img class="nx-avatar-img" src="${p.avatar_url}" alt="${esc(p.display_name)}">`;}});
    }).catch(()=>{});
  }

  function scrubTechnicalCopy(root=document.body) {
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const parent=node.parentElement;if(!parent||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|CODE|PRE)$/.test(parent.tagName))return;
      if(/\b(Supabase|RLS|backend|server-side|owner-only|nexora_is_admin|RPC|SQL|service role|database function|row-level security|permission denied|schema cache|PostgREST|JWT)\b|\bPGRST\d+\b|violates? .*policy|relation .* does not exist|column .* does not exist/i.test(node.nodeValue||''))node.nodeValue='This feature could not be loaded right now. Please try again.';
    });
    const title=$('ownerPage')?.querySelector('.page-head .sub');if(title)title.textContent='A private space for managing NEXORA.';
    $('nxOwnerContent')?.querySelectorAll('.nx-owner-panel .nx-inline-row .nx-muted').forEach(el=>{if(/[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(el.textContent))el.remove();});
    const owner=$('nxOwnerContent');if(owner&&/Dashboard error|access denied/i.test(owner.textContent)){owner.textContent='The owner area is temporarily unavailable. Please try again.';}
  }

  function patchConfirmFunctions() {
    if(typeof window.deleteTask==='function'&&!window.deleteTask.__nxThemed){window.deleteTask=async function(id){if(!await themeConfirm('Delete task?','This task will be removed from your list.','Delete'))return;state.tasks=state.tasks.filter(t=>String(t.id)!==String(id));persist();notify('Task deleted.');};window.deleteTask.__nxThemed=true;}
    if(typeof window.removeTracker==='function'&&!window.removeTracker.__nxThemed){window.removeTracker=window.nxDeleteTracker;window.removeTracker.__nxThemed=true;}
    if(typeof window.nxDeletePost==='function'&&!window.nxDeletePost.__nxThemed){window.nxDeletePost=async function(id){if(!appUser()||!appClient())return;if(!await themeConfirm('Delete post?','This post will be removed from your profile.','Delete'))return;const {error}=await appClient().from('nexora_posts').delete().eq('id',id).eq('author_id',appUser().id);if(error){notify('Post could not be deleted.');return;}notify('Post deleted.');await window.nxLoadPosts?.();};window.nxDeletePost.__nxThemed=true;}
    if(typeof window.nxDeleteReview==='function'&&!window.nxDeleteReview.__nxThemed){window.nxDeleteReview=async function(id){if(!appUser()||!appClient())return;if(!await themeConfirm('Delete review?','This review will be removed.','Delete'))return;const {error}=await appClient().from('nexora_reviews').delete().eq('id',id);if(error){notify('Review could not be deleted.');return;}notify('Review deleted.');await window.nxLoadReviews?.();};window.nxDeleteReview.__nxThemed=true;}
    if(typeof window.nxResetDisciplineJourney==='function'&&!window.nxResetDisciplineJourney.__nxThemed){window.nxResetDisciplineJourney=async function(){if(!await themeConfirm('Reset your Discipline path?','Your tracker and task data will stay unchanged.','Reset'))return;delete state.disciplineJourney;persist();window.renderDisciplineJourney?.();notify('Discipline path reset.');};window.nxResetDisciplineJourney.__nxThemed=true;}
    if(typeof window.confirmReset==='function'&&!window.confirmReset.__nxThemed){window.confirmReset=async function(){if(!await themeConfirm('Reset NEXORA on this device?','This permanently clears local app data from this device. Export a backup first if you need one.','Reset data'))return;localStorage.removeItem('nexora');location.reload();};window.confirmReset.__nxThemed=true;}
    if(typeof window.nexoraDeleteAccount==='function'&&!window.nexoraDeleteAccount.__nxThemed){const original=window.nexoraDeleteAccount;window.nexoraDeleteAccount=async function(){if(!await themeConfirm('Delete your account?','This action cannot be undone. Your account and associated data will be removed.','Delete account'))return;const old=window.confirm;window.confirm=()=>true;try{return await original.apply(this,arguments);}finally{window.confirm=old;}};window.nexoraDeleteAccount.__nxThemed=true;}
    if(typeof window.enableCloudBackup==='function'&&!window.enableCloudBackup.__nxThemed){const original=window.enableCloudBackup;window.enableCloudBackup=async function(){if(!await themeConfirm('Review cloud backup','Review your existing cloud copy. If no previous copy exists, your current device data may be uploaded and automatic backup enabled. Continue only if you agree.','Continue'))return;const old=window.confirm;window.confirm=()=>true;try{return await original.apply(this,arguments);}finally{window.confirm=old;}};window.enableCloudBackup.__nxThemed=true;}
  }

  function patchOwnerConsole() {
    if(typeof window.nxLoadOwnerConsole==='function'&&!window.nxLoadOwnerConsole.__nxFriendly){const old=window.nxLoadOwnerConsole;window.nxLoadOwnerConsole=async function(...args){const r=await old.apply(this,args);scrubTechnicalCopy($('nxOwnerContent'));return r;};window.nxLoadOwnerConsole.__nxFriendly=true;}
  }

  function patchSound() {
    if(typeof window.soundPattern==='function')window.playAlarm=function(){const kind=state?.settings?.tone||'bell';window.soundPattern(kind);};
  }

  function refreshAll() {
    document.body.classList.add('nx-life-theme');
    installHome();installTrackerRoot();installFooter();installProfilePhoto();installProfileSave();patchOwnerConsole();patchConfirmFunctions();patchSound();upgradeControls();scrubTechnicalCopy();syncFooter();applyPublicDataAvatars();
  }

  function observeDynamicUI() {
    if(observer)return;
    observer=new MutationObserver(records=>{
      let controls=false,profile=false,owner=false,scrub=false;
      for(const record of records){
        if(record.type==='childList'){
          for(const node of record.addedNodes){
            if(node.nodeType===3){if(/Supabase|RLS|backend|server-side|owner-only|nexora_is_admin|RPC|SQL|service role|row-level security|permission denied|schema cache|PostgREST|PGRST|JWT/i.test(node.nodeValue||''))scrub=true;continue;}
            if(node.nodeType!==1)continue;
            if(node.matches?.('select,input[type="time"],input[type="date"]')||node.querySelector?.('select,input[type="time"],input[type="date"]'))controls=true;
            if(node.id==='nxProfileContent'||node.querySelector?.('#nxProfileContent'))profile=true;
            if(node.id==='nxOwnerContent'||node.closest?.('#nxOwnerContent'))owner=true;
            if(/Supabase|RLS|backend|server-side|owner-only|nexora_is_admin|RPC|SQL|service role|row-level security|permission denied|schema cache|PostgREST|PGRST|JWT/i.test(node.textContent||''))scrub=true;
          }
        } else if(record.type==='characterData') {
          if(record.target.parentElement?.closest?.('#nxOwnerContent'))owner=true;
          if(/Supabase|RLS|backend|server-side|owner-only|nexora_is_admin|RPC|SQL|service role|row-level security|permission denied|schema cache|PostgREST|PGRST|JWT/i.test(record.target.nodeValue||''))scrub=true;
        }
      }
      if(controls)delay(upgradeControls);if(profile)delay(()=>{installProfilePhoto();patchOwnAvatarAfterRender();});if(owner)delay(()=>scrubTechnicalCopy($('nxOwnerContent')));if(scrub)delay(()=>scrubTechnicalCopy(document.body));
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  function patchRenderHooks() {
    if(typeof window.persist==='function'&&!window.persist.__nxRefresh){const old=window.persist;window.persist=function(...args){const r=old.apply(this,args);delay(()=>{renderTrackers();installHome();syncFooter();});return r;};window.persist.__nxRefresh=true;}
    if(typeof window.navigate==='function'&&!window.navigate.__nxRefresh){const old=window.navigate;window.navigate=function(...args){const r=old.apply(this,args);delay(()=>{if(args[0]==='trackers')renderTrackers();if(args[0]==='home')installHome();syncFooter();});return r;};window.navigate.__nxRefresh=true;}
    if(typeof window.nxLoadCommunity==='function'&&!window.nxLoadCommunity.__nxAvatars){const old=window.nxLoadCommunity;window.nxLoadCommunity=async function(...args){const r=await old.apply(this,args);setTimeout(applyPublicDataAvatars,50);return r;};window.nxLoadCommunity.__nxAvatars=true;}
  }

  function boot() {
    if(!appState()||!document.body)return;
    addStyles();document.body.classList.add('nx-life-theme');
    patchRenderHooks();refreshAll();observeDynamicUI();
    setTimeout(refreshAll,200);setTimeout(refreshAll,900);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});
  else setTimeout(boot,0);
})();
