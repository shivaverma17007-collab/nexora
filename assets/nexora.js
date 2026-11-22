/* NEXORA Rebuild v2.1 — Flow MP3 player, login options and legacy data compatibility. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const today = () => new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const fmt = s => `${String(Math.floor(Math.max(0,s)/60)).padStart(2,"0")}:${String(Math.max(0,s)%60).padStart(2,"0")}`;
  const copy = x => JSON.parse(JSON.stringify(x));
  const KEY="nexora", SNAPSHOT="nexora_rebuild_v2_preflight";
  const SUPABASE_URL="https://reixlvsdqxlhvhzcjynq.supabase.co";
  const OWNER_ID="2951452f-f9bd-4047-a5a1-517c0d095496";
  const SUPABASE_KEY="sb_publishable_tOZu9amwcmUzQJN8FPTH_Q_bfOfm8uu";
  const db=window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY) : null;
  const defaults={tasks:[],study:[],journals:[],routines:[],disciplines:[],disciplineEffort:[],focusHistory:[],trackers:[],trackerLogs:[],routineMode:"default",homeTrackMode:"sprint",streak:0,lastActive:"",activeDays:[],focusSessions:0,hydrationMl:1500,hydrationGoal:3000,tickerIdx:0,modRole:"user",profile:{name:"Explorer",handle:"",bio:"Small steps. Real progress.",focusMode:"normal",exams:[],avatar:"3d-flame",customPfp:""},feedbacks:[],meditationSessions:[],settings:{quotes:true,streakVisible:true,compact:false,intensityOn:true,taskStreak:true,studyStreak:true,reminders:false,accent:"#7654cf",dark:false,dailyGoal:120,tone:"chime",font:"sans",scale:"normal",weight:"medium",defaultTrackMode:"standard",currentAffairsAuto:false,currentAffairsMode:"manual",currentAffairsHome:false,homePriority:"tasks"},mindFabPos:null,sprintDisciplineId:""};
  let rawBefore=null;
  try { rawBefore=localStorage.getItem(KEY); if(rawBefore&&!localStorage.getItem(SNAPSHOT))localStorage.setItem(SNAPSHOT,rawBefore); } catch(e){console.warn("NEXORA safety snapshot could not be written",e);}
  function normalize(raw){const old=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};const s={...copy(defaults),...old};s.settings={...copy(defaults.settings),...(old.settings||{})};s.profile={...copy(defaults.profile),...(old.profile||{})};["tasks","study","journals","routines","disciplines","disciplineEffort","focusHistory","trackers","trackerLogs","activeDays","feedbacks","meditationSessions"].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[];});if(!Array.isArray(s.profile.exams)){s.profile.exams=typeof s.profile.exams==="string"?s.profile.exams.split(",").map(x=>x.trim()).filter(Boolean):[];}s.hydrationGoal=Math.max(250,Math.min(10000,Number(s.hydrationGoal)||3000));return s;}
  function loadState(){try{return normalize(JSON.parse(localStorage.getItem(KEY)||"{}"));}catch(e){console.error("Local NEXORA data could not be parsed; original key retained.",e);return normalize({});}}
  let state=loadState(),user=null,backupEnabled=false,cloudBusy=false,suppressCloud=false,toastHandle=null,activeSocial="people",profileTarget=null,reviewRating=5,authHandled="",isOwnerVerified=false,ownerCheckPromise=null,currentLeaderboardMode="daily",pendingAvatarDataUrl=null;
  let focus={mode:"sessions",session:"focus",remaining:1500,elapsed:0,watch:0,running:false,watchRunning:false,interval:null};
  let music={audio:null,currentId:"",playing:false,volume:0.42,shuffle:false,repeat:"off",seeking:false};
  const initialFlowPrefs=(()=>{if(!state.music||typeof state.music!=="object")state.music={favorites:[],playlists:[],history:[],volume:0.42,lastTrackId:"",shuffle:false,repeat:"off"};return state.music;})();
  music.currentId=String(initialFlowPrefs.lastTrackId||"");music.volume=Number.isFinite(Number(initialFlowPrefs.volume))?Math.max(0,Math.min(1,Number(initialFlowPrefs.volume))):0.42;music.shuffle=!!initialFlowPrefs.shuffle;music.repeat=["off","all","one"].includes(initialFlowPrefs.repeat)?initialFlowPrefs.repeat:"off";
  let meditation={remaining:300,total:300,running:false,interval:null,finished:false,ctx:null,sources:[],soundTimer:null};
  function toast(msg){const n=$("toast");n.textContent=msg;n.classList.add("show");clearTimeout(toastHandle);toastHandle=setTimeout(()=>n.classList.remove("show"),2600);}
  function save(opts={}){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){toast("Device storage is full. Export a backup first.");return;}renderAll();if(!opts.localOnly&&!suppressCloud&&backupEnabled&&user)queueCloud();}
  function markDay(){
    const d=today();
    if(!Array.isArray(state.activeDays))state.activeDays=[];
    if(!state.activeDays.includes(d))state.activeDays.push(d);
    const last=String(state.lastActive||(state.activeDays.slice().sort().at(-1)||""));
    if(last!==d){
      const y=new Date(d+"T12:00:00");y.setDate(y.getDate()-1);
      const yesterday=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,"0")}-${String(y.getDate()).padStart(2,"0")}`;
      state.streak=last===yesterday?Math.max(0,Number(state.streak)||0)+1:1;
      state.lastActive=d;
    }
  }
  function activeTrackers(){return state.trackers.filter(t=>t&&t.archived!==true&&t.active!==false);}
  function isDone(t){return t.done===true||t.completed===true;}
  function tasksFor(id){return state.tasks.filter(t=>String(t.trackerId||"")===String(id));}
  function trackerValue(id){return state.trackerLogs.filter(x=>String(x.trackerId)===String(id)&&x.date===today()).reduce((n,x)=>n+(Number(x.value)||0),0);}
  function openDialog(title,html,eyebrow="NEXORA"){ $("dialogEyebrow").textContent=eyebrow;$("dialogTitle").textContent=title;$("dialogBody").innerHTML=html;if(!$ ("appDialog").open)$ ("appDialog").showModal(); }
  function closeDialog(){if($("appDialog").open)$("appDialog").close();}
  function dialogActions(cancel,submit){return `<div class="dialog-actions"><button type="button" class="button button-ghost" data-action="dialog-close">${cancel||"Cancel"}</button><button type="submit" class="button button-primary">${submit||"Save"}</button></div>`;}
  function closeMenu(){document.body.classList.remove("menu-open");$("menuToggle").setAttribute("aria-expanded","false");}
  function navigate(page){const node=$("page-"+page);if(!node){toast("This section is not available yet.");return;}document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p===node));const main=({home:"home",tracking:"tracking",social:"social",flow:"flow",settings:"settings",owner:"settings"})[page]||(["profile","history","discipline","study","meditation"].includes(page)?"tracking":(page==="journal"?"settings":"home"));document.querySelectorAll("#bottomNav [data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===main));closeMenu();window.scrollTo({top:0,behavior:"smooth"});if(page==="social")loadSocial(activeSocial);if(page==="profile")loadProfile(profileTarget||user?.id||null);if(page==="owner")loadOwnerConsole();renderAll();}

  // TRACKERS — older data fields and IDs are retained.
  function newTrackerDialog(){openDialog("Create a tracker",`<form id="trackerForm" class="dialog-form"><label>Tracker name<input name="name" maxlength="70" placeholder="e.g. SSC CGL preparation" required></label><div class="form-grid"><label>Target number<input name="target" type="number" min="1" value="1"></label><label>Unit<input name="unit" maxlength="20" value="times"></label></div><div class="form-grid"><label>Duration<select name="duration"><option value="ongoing">Ongoing · no end date</option><option value="until">Track until a date</option></select></label><label>End date<input name="endDate" type="date" min="${today()}" disabled></label></div><label>Mode inside this tracker<select name="mode"><option value="standard">Normal tracking</option><option value="sprint">Sprint focus</option><option value="freestyle">Freestyle</option></select></label>${dialogActions("Cancel","Create tracker")}</form>`);const f=$("trackerForm");f.elements.duration.addEventListener("change",()=>f.elements.endDate.disabled=f.elements.duration.value!=="until");}
  function addTaskDialog(id){openDialog("Add a task",`<form id="taskForm" class="dialog-form"><input type="hidden" name="trackerId" value="${esc(id)}"><label>Task name<input name="name" maxlength="120" placeholder="What needs to get done?" required></label><label>Optional reminder<input name="reminder" type="time"></label>${dialogActions("Cancel","Add task")}</form>`);}
  function createTracker(f){const d=new FormData(f),name=String(d.get("name")||"").trim(),duration=d.get("duration"),end=String(d.get("endDate")||"");if(!name)return toast("Give your tracker a name.");if(duration==="until"&&(!end||end<today()))return toast("Choose a valid future end date.");state.trackers.unshift({id:"tracker-"+Date.now(),name,target:Math.max(1,Number(d.get("target"))||1),unit:String(d.get("unit")||"times").trim()||"times",icon:"N",created:today(),durationMode:duration==="until"?"until":"ongoing",endDate:duration==="until"?end:null,mode:String(d.get("mode")||"standard")});save();closeDialog();toast("Your tracker is ready.");}
  function addTask(f){const d=new FormData(f),name=String(d.get("name")||"").trim();if(!name)return toast("Enter a task name.");state.tasks.unshift({id:"task-"+Date.now(),text:name,title:name,done:false,completed:false,trackerId:String(d.get("trackerId")||""),trackMode:"tracker",category:"personal",graphic:"N",reminder:String(d.get("reminder")||""),created:today()});save();closeDialog();toast("Task added to your tracker.");}
  function toggleTask(id){const t=state.tasks.find(x=>String(x.id)===String(id));if(!t)return;t.done=!isDone(t);t.completed=t.done;if(t.done)markDay();save();}
  function deleteTask(id){if(!confirm("Delete this task?"))return;state.tasks=state.tasks.filter(x=>String(x.id)!==String(id));save();}
  function deleteTracker(id){if(!confirm("Delete this tracker? Its tasks and logs will be kept as unassigned history."))return;state.trackers=state.trackers.filter(x=>String(x.id)!==String(id));state.tasks.forEach(t=>{if(String(t.trackerId)===String(id))t.trackerId=null;});save();}
  function logTracker(id,amount){const t=state.trackers.find(x=>String(x.id)===String(id));if(!t)return;let row=state.trackerLogs.find(x=>String(x.trackerId)===String(id)&&x.date===today());if(row)row.value=Math.max(0,(Number(row.value)||0)+amount);else if(amount>0)state.trackerLogs.push({trackerId:id,date:today(),value:amount});if(amount>0)markDay();save();}
  function renderTrackers(){const box=$("trackerList");if(!box)return;const all=activeTrackers();$("trackingCount").textContent=all.length;$("trackingDone").textContent=state.tasks.filter(isDone).length;if(!all.length){box.innerHTML=`<div class="empty-state">Your first tracker starts here.<br>Create one for study, workout, reading or any goal you care about.</div>`;return;}box.innerHTML=all.map(t=>{const value=trackerValue(t.id),target=Math.max(1,Number(t.target)||1),pct=Math.min(100,Math.round(value/target*100)),tasks=tasksFor(t.id),done=tasks.filter(isDone).length,mode=({standard:"Normal",sprint:"Sprint",freestyle:"Freestyle"})[t.mode]||"Normal",end=t.durationMode==="until"&&t.endDate?"Ends "+esc(t.endDate):"Ongoing · no end date";return `<article class="tracker-card"><div class="card-top"><span class="tracker-mark">N</span><div><div class="card-title">${esc(t.name)}</div><div class="card-meta">${mode} · ${end}</div></div><button class="danger-button" data-action="delete-tracker" data-id="${esc(t.id)}" aria-label="Delete tracker">×</button></div><div class="inline-controls" style="margin-top:12px"><b>${value} / ${target} ${esc(t.unit||"times")}</b><span>${pct}% today</span></div><div class="progress-track"><i style="width:${pct}%"></i></div><div class="row-actions"><button class="button button-soft" data-action="log-tracker" data-id="${esc(t.id)}" data-value="1">+ Add progress</button><button class="button button-ghost" data-action="log-tracker" data-id="${esc(t.id)}" data-value="-1">Undo</button><button class="button button-soft" data-action="add-task" data-id="${esc(t.id)}">+ Add task</button>${t.mode==="sprint"?`<button class="button button-ghost" data-action="open-timer">Focus timer</button>`:""}</div><div class="section-heading compact" style="margin-top:13px"><h3>Tasks · ${done}/${tasks.length}</h3></div>${tasks.length?tasks.map(x=>`<div class="task-row ${isDone(x)?"done":""}"><button class="check-button ${isDone(x)?"done":""}" data-action="toggle-task" data-id="${esc(x.id)}">${isDone(x)?"✓":""}</button><span>${esc(x.text||x.title||"Task")}</span><button class="danger-button" data-action="delete-task" data-id="${esc(x.id)}">×</button></div>`).join(""):`<div class="card-meta">Add tasks that belong to this tracker.</div>`}</article>`;}).join("");const unassigned=state.tasks.filter(t=>!t.trackerId);if(unassigned.length)box.insertAdjacentHTML("beforeend",`<article class="tracker-card"><b>Unassigned older tasks</b><p class="card-meta">These tasks were kept from your earlier NEXORA data.</p>${unassigned.slice(0,10).map(t=>`<div class="task-row ${isDone(t)?"done":""}"><button class="check-button ${isDone(t)?"done":""}" data-action="toggle-task" data-id="${esc(t.id)}">${isDone(t)?"✓":""}</button><span>${esc(t.text||t.title||"Task")}</span></div>`).join("")}</article>`);}

  // DISCIPLINE — the previous disciplineJourney object is retained unchanged.
  const plan=()=>{
    if(state.disciplinePlan&&typeof state.disciplinePlan==="object")return state.disciplinePlan;
    const legacy=state.disciplineJourney;
    if(!legacy||typeof legacy!=="object")return null;
    const logs={};
    (Array.isArray(legacy.completedDays)?legacy.completedDays:[]).forEach(date=>{logs[date]={"legacy-main":true};});
    state.disciplinePlan={id:"discipline-legacy-import",startDate:legacy.startDate||today(),durationMode:"fixed",durationDays:31,tasks:[{id:"legacy-main",name:legacy.habitText||"My small daily step"}],logs,legacyImported:true};
    // Keep disciplineJourney untouched as a rollback/reference copy.
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn("Legacy Discipline import stayed in memory; original data is retained.",e);}
    return state.disciplinePlan;
  };
  function createPlan(f){const d=new FormData(f),main=String(d.get("main")||"").trim();if(!main)return toast("Start with one small habit.");const extras=String(d.get("extras")||"").split("\n").map(x=>x.trim()).filter(Boolean).slice(0,7),duration=String(d.get("duration")||"14"),tasks=[main,...extras].map((name,i)=>({id:"habit-"+Date.now()+"-"+i,name:name.slice(0,100)}));state.disciplinePlan={id:"discipline-plan-"+Date.now(),startDate:today(),durationMode:duration==="ongoing"?"ongoing":"fixed",durationDays:duration==="ongoing"?null:Number(duration),tasks,logs:{}};save();toast("Your Discipline journey has started.");}
  function planDay(p){return Math.max(1,Math.floor((new Date(today()+"T12:00:00")-new Date((p.startDate||today())+"T12:00:00"))/86400000)+1);}
  function markPlanTask(id,done){const p=plan();if(!p)return;p.logs=p.logs||{};p.logs[today()]=p.logs[today()]||{};p.logs[today()][id]=done;save();}
  function renderDiscipline(){const box=$("disciplineContent");if(!box)return;const p=plan();if(!p){box.innerHTML=`<div class="surface-card"><h2>Start small. Keep showing up.</h2><p class="muted">Kal jahan the, aaj usse ek kadam aage. Choose a duration that feels realistic. You can continue without guilt.</p><form id="disciplineForm" class="form-grid"><label>Choose your plan<select name="duration"><option value="14">14 days</option><option value="10">10 days</option><option value="7">7 days</option><option value="ongoing">Unlimited · ongoing</option></select></label><label>Your first daily step<input name="main" maxlength="100" placeholder="Study for 25 minutes" required></label><label class="span-two">Other daily steps · optional<textarea name="extras" rows="3" placeholder="Revise notes&#10;Walk for 10 minutes"></textarea></label><button class="button button-primary span-two" type="submit">Start my Discipline plan</button></form></div>`;return;}const day=planDay(p),fixed=p.durationMode!=="ongoing",total=Number(p.durationDays||14),log=p.logs?.[today()]||{},activeDays=Object.keys(p.logs||{}).filter(k=>Object.values(p.logs[k]||{}).includes(true)).length,pct=fixed?Math.min(100,Math.round(Math.min(day,total)/total*100)):0;box.innerHTML=`<div class="surface-card"><div class="inline-controls"><b>${fixed?`Day ${Math.min(day,total)} of ${total}`:`Day ${day} · Ongoing`}</b><span>${activeDays} active check-in days</span></div>${fixed?`<div class="progress-track"><i style="width:${pct}%"></i></div>`:""}<p class="muted" style="margin:10px 0">Mark each step honestly. A missed day does not erase your earlier progress.</p>${(p.tasks||[]).map(t=>`<div class="task-row"><span>${esc(t.name)}</span><button class="button ${log[t.id]===true?"button-primary":"button-soft"}" data-action="discipline-mark" data-id="${esc(t.id)}" data-done="true">✓</button><button class="button ${log[t.id]===false?"button-primary":"button-ghost"}" data-action="discipline-mark" data-id="${esc(t.id)}" data-done="false">×</button></div>`).join("")}<p class="fine-print">✓ Done · × Not done. Your check-ins stay saved.</p><div class="row-actions"><button class="button button-soft" data-action="edit-plan">Change plan</button><button class="button button-ghost" data-action="open-timer">Study timer</button></div></div>`;const sel=$("studyDisciplineTask");if(sel){const old=sel.value;sel.innerHTML='<option value="">Personal study / no linked task</option>'+(p.tasks||[]).map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("");if((p.tasks||[]).some(t=>String(t.id)===old))sel.value=old;}}
  function editPlanDialog(){const p=plan();if(!p)return;openDialog("Discipline settings",`<form id="editPlanForm" class="dialog-form"><label>Duration<select name="duration"><option value="14">14 days</option><option value="10">10 days</option><option value="7">7 days</option><option value="ongoing">Unlimited · ongoing</option></select></label><label>Daily steps · one per line<textarea name="tasks" rows="6">${esc((p.tasks||[]).map(t=>t.name).join("\n"))}</textarea></label>${dialogActions("Cancel","Save plan")}</form>`);$("editPlanForm").elements.duration.value=p.durationMode==="ongoing"?"ongoing":String(p.durationDays||14);}

  // STUDY FOCUS TIMER AND STOPWATCH.
  const presets=[{id:"focus",name:"Focus",minutes:25,kind:"focus",detail:"Deep work block"},{id:"revision",name:"Revision",minutes:45,kind:"focus",detail:"Long revision block"},{id:"minor",name:"Minor Break",minutes:5,kind:"break",detail:"Short reset"},{id:"major",name:"Major Break",minutes:15,kind:"break",detail:"Longer rest"}];
  const allPresets=()=>presets.concat((state.settings.nxFocusPresets||[]).filter(x=>x&&x.id&&Number(x.minutes)>0));
  const currentPreset=()=>allPresets().find(x=>x.id===focus.session)||presets[0];
  function stopFocus(){clearInterval(focus.interval);focus.interval=null;focus.running=false;focus.watchRunning=false;}
  function timerDialog(){const item=currentPreset();openDialog("Focus Timer",`<div class="segmented"><button class="active" data-focus-mode="sessions">Sessions</button><button data-focus-mode="stopwatch">Stopwatch</button></div><div id="timerSessionPanel"><div class="timer-presets" id="timerPresets">${allPresets().map(p=>`<button type="button" class="${p.id===focus.session?"active":""}" data-session="${esc(p.id)}">${esc(p.name)}<small>${Number(p.minutes)} min · ${p.kind==="break"?"Break":"Study"}</small></button>`).join("")}</div><form id="customPresetForm" class="form-grid" style="margin-top:12px"><label>Custom session<input name="name" maxlength="32" placeholder="My focus block" required></label><label>Minutes<input name="minutes" type="number" min="1" max="180" value="30" required></label><label>Type<select name="kind"><option value="focus">Study</option><option value="break">Break</option></select></label><button class="button button-soft" type="submit">Add custom</button></form></div><div class="timer-display" id="timerDisplay">${fmt(focus.remaining)}</div><div class="card-meta" id="timerCaption">${esc(item.name)} · ${item.minutes} min</div><div class="form-grid" id="timerStudyFields"><label>Subject<input id="timerSubject" maxlength="80" placeholder="What are you studying?"></label><label>Link a Discipline task<select id="timerDisciplineTask"><option value="">Personal study</option></select></label></div><div class="dialog-actions"><button type="button" class="button button-ghost" data-action="timer-reset">Reset</button><button type="button" class="button button-primary" id="timerToggle">Start focus</button><button type="button" class="button button-soft" id="timerSaveWatch" hidden>Save stopwatch</button></div><label class="fine-print"><input type="checkbox" id="stopMusicOnFinish"> Stop music when a focus session ends</label>`);
    const sel=$("timerDisciplineTask");sel.innerHTML='<option value="">Personal study</option>'+(plan()?.tasks||[]).map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("");renderTimer();$("timerToggle").addEventListener("click",toggleFocus);$("timerSaveWatch").addEventListener("click",saveWatch);}
  function renderTimer(){if(!$("timerDisplay"))return;const p=currentPreset();$("timerDisplay").textContent=fmt(focus.mode==="stopwatch"?focus.watch:focus.remaining);$("timerCaption").textContent=focus.mode==="stopwatch"?"Stopwatch · count your time":`${p.name} · ${p.minutes} min`;$ ("timerToggle").textContent=focus.mode==="stopwatch"?(focus.watchRunning?"Pause stopwatch":"Start stopwatch"):(focus.running?"Pause":"Start focus");$("timerSaveWatch").hidden=focus.mode!=="stopwatch";$("timerStudyFields").hidden=focus.mode==="stopwatch"||p.kind==="break";$("timerSessionPanel").hidden=focus.mode!=="sessions";document.querySelectorAll("[data-focus-mode]").forEach(b=>b.classList.toggle("active",b.dataset.focusMode===focus.mode));}
  function chooseSession(id){const p=allPresets().find(x=>x.id===id);if(!p)return;stopFocus();focus.mode="sessions";focus.session=id;focus.remaining=Number(p.minutes)*60;focus.elapsed=0;timerDialog();}
  function addCustomPreset(e){e.preventDefault();const d=new FormData(e.currentTarget),name=String(d.get("name")||"").trim(),minutes=Math.max(1,Math.min(180,Number(d.get("minutes"))||0));if(!name||!minutes)return;if(!Array.isArray(state.settings.nxFocusPresets))state.settings.nxFocusPresets=[];const item={id:"custom-"+Date.now(),name,minutes,kind:d.get("kind")==="break"?"break":"focus",description:"Your custom session"};state.settings.nxFocusPresets.push(item);save();focus.session=item.id;focus.mode="sessions";focus.remaining=minutes*60;timerDialog();}
  function recordStudy(minutes,name,source,subject,taskId){state.study.unshift({id:"study-"+Date.now(),minutes:Math.max(1,Math.round(minutes)),subject:(subject||"Personal focus").slice(0,80),note:`${name} · ${source}`,date:today(),sessionName:name,source,disciplineTaskId:taskId||null});state.focusSessions=(Number(state.focusSessions)||0)+1;if(!Array.isArray(state.focusHistory))state.focusHistory=[];state.focusHistory.unshift({date:today(),minutes:Math.max(1,Math.round(minutes)),disciplineTaskId:taskId||null,sessionName:name});if(taskId&&state.disciplinePlan){state.disciplinePlan.logs=state.disciplinePlan.logs||{};state.disciplinePlan.logs[today()]=state.disciplinePlan.logs[today()]||{};state.disciplinePlan.logs[today()][taskId]=true;}markDay();save();toast("Study session saved.");}
  function toggleFocus(){if(focus.mode==="stopwatch"){if(focus.watchRunning){clearInterval(focus.interval);focus.interval=null;focus.watchRunning=false;}else{focus.watchRunning=true;focus.interval=setInterval(()=>{focus.watch++;renderTimer();},1000);}renderTimer();return;}if(focus.running){clearInterval(focus.interval);focus.interval=null;focus.running=false;renderTimer();return;}if(focus.remaining<=0){focus.remaining=currentPreset().minutes*60;focus.elapsed=0;}focus.running=true;renderTimer();focus.interval=setInterval(()=>{focus.remaining=Math.max(0,focus.remaining-1);focus.elapsed++;renderTimer();if(focus.remaining===0){clearInterval(focus.interval);focus.interval=null;focus.running=false;if(currentPreset().kind!=="break")recordStudy(Math.max(1,Math.round(focus.elapsed/60)),currentPreset().name,"Focus Timer",$("timerSubject")?.value||"",$("timerDisciplineTask")?.value||"");if($("stopMusicOnFinish")?.checked)stopMusic();renderTimer();toast("Session complete. Take a moment before the next one.");}},1000);}
  function resetFocus(){stopFocus();if(focus.mode==="stopwatch")focus.watch=0;else{focus.remaining=currentPreset().minutes*60;focus.elapsed=0;}renderTimer();}
  function setFocusMode(mode){stopFocus();focus.mode=mode==="stopwatch"?"stopwatch":"sessions";renderTimer();}
  function saveWatch(){const mins=Math.floor(focus.watch/60);if(mins<1)return toast("Use the stopwatch for at least one minute before saving.");recordStudy(mins,"Stopwatch session","Stopwatch",$("timerSubject")?.value||"");resetFocus();}

  // NEXORA FLOW — real MP3 recordings. Playlist and preference data stay local until backend sync is built.
  const flowTracks=[
    {id:"endless-forest-01",title:"Endless Forest",album:"Endless Forest",collection:"deep",duration:"2:38",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/01-endless-forest.mp3"},
    {id:"endless-forest-02",title:"Ancient Trees",album:"Endless Forest",collection:"deep",duration:"3:42",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/02-ancient-trees.mp3"},
    {id:"endless-forest-03",title:"Tricks",album:"Endless Forest",collection:"deep",duration:"2:45",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/03-tricks.mp3"},
    {id:"endless-forest-04",title:"Paranormal",album:"Endless Forest",collection:"deep",duration:"2:58",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/04-paranormal.mp3"},
    {id:"endless-forest-05",title:"Turn Back",album:"Endless Forest",collection:"deep",duration:"2:56",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/05-turn-back.mp3"},
    {id:"endless-forest-06",title:"Where Silence Grows",album:"Endless Forest",collection:"deep",duration:"2:49",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/06-where-silence-grows.mp3"},
    {id:"endless-forest-07",title:"Going in Circles",album:"Endless Forest",collection:"deep",duration:"3:03",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/07-going-in-circles.mp3"},
    {id:"endless-forest-08",title:"Middle of Nowhere",album:"Endless Forest",collection:"deep",duration:"3:20",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/08-middle-of-nowhere.mp3"},
    {id:"endless-forest-09",title:"Who's There?",album:"Endless Forest",collection:"deep",duration:"3:08",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/09-whos-there.mp3"},
    {id:"endless-forest-10",title:"Crow's Call",album:"Endless Forest",collection:"deep",duration:"2:54",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/10-crows-call.mp3"},
    {id:"endless-forest-11",title:"Spirits",album:"Endless Forest",collection:"deep",duration:"2:49",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/11-spirits.mp3"},
    {id:"endless-forest-12",title:"Whispering Wind",album:"Endless Forest",collection:"deep",duration:"2:28",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/12-whispering-wind.mp3"},
    {id:"endless-forest-13",title:"Until Dawn",album:"Endless Forest",collection:"deep",duration:"3:41",src:"https://purrplecat-audio.pages.dev/audio/endless-forest/13-until-dawn.mp3"},
    {id:"city-nights-01",title:"Fog Blanket",album:"City Nights 3",collection:"late",duration:"2:59",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/01-fog-blanket.mp3"},
    {id:"city-nights-02",title:"Downtown",album:"City Nights 3",collection:"late",duration:"2:43",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/02-downtown.mp3"},
    {id:"city-nights-03",title:"Window Seat",album:"City Nights 3",collection:"late",duration:"2:46",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/03-window-seat.mp3"},
    {id:"city-nights-04",title:"Corner Store",album:"City Nights 3",collection:"late",duration:"2:54",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/04-corner-store.mp3"},
    {id:"city-nights-05",title:"Skyscrapers",album:"City Nights 3",collection:"late",duration:"2:31",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/05-skyscrapers.mp3"},
    {id:"city-nights-06",title:"Cable Car",album:"City Nights 3",collection:"late",duration:"2:32",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/06-cable-car.mp3"},
    {id:"city-nights-07",title:"Insomnia",album:"City Nights 3",collection:"late",duration:"2:59",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/07-insomnia.mp3"},
    {id:"city-nights-08",title:"Half Awake",album:"City Nights 3",collection:"late",duration:"3:01",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/08-half-awake.mp3"},
    {id:"city-nights-09",title:"Cruisin'",album:"City Nights 3",collection:"late",duration:"2:59",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/09-cruisin.mp3"},
    {id:"city-nights-10",title:"Stray",album:"City Nights 3",collection:"late",duration:"3:06",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/10-stray.mp3"},
    {id:"city-nights-11",title:"Missing Pieces",album:"City Nights 3",collection:"late",duration:"2:51",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/11-missing-pieces.mp3"},
    {id:"city-nights-12",title:"3 A.M. Radio",album:"City Nights 3",collection:"late",duration:"3:00",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/12-3-a-m-radio.mp3"},
    {id:"city-nights-13",title:"Empty Sidewalks",album:"City Nights 3",collection:"late",duration:"2:50",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/13-empty-sidewalks.mp3"},
    {id:"city-nights-14",title:"Starry Night",album:"City Nights 3",collection:"late",duration:"3:28",src:"https://purrplecat-audio.pages.dev/audio/city-nights-3/14-starry-night.mp3"},
    {id:"sleep-tight-01",title:"Comfy",album:"Sleep Tight",collection:"calm",duration:"3:15",src:"https://purrplecat-audio.pages.dev/audio/sleep-tight/01-comfy.mp3"},
    {id:"sleep-tight-02",title:"Everchanging",album:"Sleep Tight",collection:"calm",duration:"3:37",src:"https://purrplecat-audio.pages.dev/audio/sleep-tight/02-everchanging.mp3"},
    {id:"sleep-tight-03",title:"Still of the Night",album:"Sleep Tight",collection:"calm",duration:"2:40",src:"https://purrplecat-audio.pages.dev/audio/sleep-tight/03-still-of-the-night.mp3"}
  ];
  const flowCollections=[{id:"deep",label:"Deep Focus",sub:"Endless Forest · 13 tracks"},{id:"late",label:"Late Night",sub:"City Nights 3 · 14 tracks"},{id:"calm",label:"Slow Down",sub:"Sleep Tight · 3 tracks"},{id:"favorites",label:"Favourites",sub:"Your saved tracks"},{id:"recent",label:"Recently played",sub:"Your listening history"},{id:"all",label:"All tracks",sub:"Full starter catalogue"}];
  let flowCollection="deep",flowSearch="";
  function flowPrefs(){
    if(!state.music||typeof state.music!=="object")state.music={favorites:[],playlists:[],history:[],volume:0.42,lastTrackId:"",shuffle:false,repeat:"off"};
    const p=state.music;if(!Array.isArray(p.favorites))p.favorites=[];if(!Array.isArray(p.playlists))p.playlists=[];if(!Array.isArray(p.history))p.history=[];
    p.volume=Number.isFinite(Number(p.volume))?Math.max(0,Math.min(1,Number(p.volume))):0.42;
    if(!["off","all","one"].includes(p.repeat))p.repeat="off";
    return p;
  }
  function flowTrack(id){return flowTracks.find(t=>t.id===id)||null;}
  function flowCurrent(){return flowTrack(music.currentId)||flowTrack(flowPrefs().lastTrackId)||null;}
  function flowCollectionTracks(){
    const p=flowPrefs();let rows=flowTracks;
    if(flowCollection==="favorites")rows=rows.filter(t=>p.favorites.includes(t.id));
    else if(flowCollection==="recent")rows=p.history.map(flowTrack).filter(Boolean);
    else if(flowCollection.startsWith("playlist:")){const pl=p.playlists.find(x=>x.id===flowCollection.slice(9));rows=(pl?.trackIds||[]).map(flowTrack).filter(Boolean);}
    else if(flowCollection!=="all")rows=rows.filter(t=>t.collection===flowCollection);
    const q=flowSearch.trim().toLowerCase();if(q)rows=rows.filter(t=>(t.title+" "+t.album+" Purrple Cat lofi").toLowerCase().includes(q));
    return rows;
  }
  function formatAudioTime(n){if(!Number.isFinite(n)||n<0)return"0:00";return Math.floor(n/60)+":"+String(Math.floor(n%60)).padStart(2,"0");}
  function ensureFlowAudio(){
    if(music.audio)return music.audio;
    const audio=$("flowAudio");if(!audio)return null;
    audio.volume=music.volume;audio.preload="metadata";music.audio=audio;
    audio.addEventListener("play",()=>{music.playing=true;renderFlowPlayer();});
    audio.addEventListener("pause",()=>{music.playing=false;renderFlowPlayer();});
    audio.addEventListener("timeupdate",updateFlowProgress);
    audio.addEventListener("loadedmetadata",updateFlowProgress);
    audio.addEventListener("ended",()=>{const p=flowPrefs();if(music.repeat==="one"||p.repeat==="one"){audio.currentTime=0;audio.play().catch(()=>{});}else nextFlowTrack(1,true);});
    audio.addEventListener("error",()=>{music.playing=false;renderFlowPlayer();toast("This MP3 could not be loaded right now. Try another track or check your connection.");});
    return audio;
  }
  function updateFlowProgress(){
    const audio=music.audio||$("flowAudio");if(!audio)return;
    const seek=$("flowSeek");if(seek&&!music.seeking&&Number.isFinite(audio.duration)&&audio.duration>0)seek.value=String(Math.round(audio.currentTime/audio.duration*1000));
    if($("flowCurrentTime"))$("flowCurrentTime").textContent=formatAudioTime(audio.currentTime);
    if($("flowDuration"))$("flowDuration").textContent=formatAudioTime(audio.duration);
  }
  function renderFlowPlayer(){
    const current=flowCurrent(),audio=music.audio||$("flowAudio");
    if($("flowNowTitle"))$("flowNowTitle").textContent=current?.title||"Choose a track";
    if($("flowNowArtist"))$("flowNowArtist").textContent=current?`Purrple Cat · ${current.album}`:"Music by Purrple Cat";
    if($("flowPlayPause")){$("flowPlayPause").textContent=music.playing?"Ⅱ":"▶";$ ("flowPlayPause").setAttribute("aria-label",music.playing?"Pause":"Play");}
    if($("flowNowFavorite")){$("flowNowFavorite").textContent=current&&flowPrefs().favorites.includes(current.id)?"♥":"♡";$ ("flowNowFavorite").disabled=!current;}
    if($("flowShuffle"))$("flowShuffle").classList.toggle("active",music.shuffle);
    if($("flowRepeat")){$("flowRepeat").classList.toggle("active",music.repeat!=="off");$("flowRepeat").setAttribute("aria-label","Repeat "+music.repeat);$("flowRepeat").title="Repeat "+music.repeat;}
    if($("flowVolume"))$("flowVolume").value=String(Math.round(music.volume*100));
    if($("flowVolumeValue"))$("flowVolumeValue").textContent=Math.round(music.volume*100)+"%";
    if(audio)updateFlowProgress();
  }
  function renderFlow(){
    const list=$("flowTracks");if(!list)return;const p=flowPrefs(),visible=flowCollectionTracks();
    const active=flowCollection;
    $("flowCollections").innerHTML=flowCollections.map(c=>`<button class="flow-collection ${active===c.id?"active":""}" data-flow-collection="${c.id}"><b>${c.label}</b><small>${c.sub}</small></button>`).join("");
    $("flowUserPlaylists").innerHTML=p.playlists.map(pl=>`<span class="flow-playlist-pair"><button class="flow-user-playlist ${active==="playlist:"+pl.id?"active":""}" data-flow-collection="playlist:${esc(pl.id)}">♫ ${esc(pl.name)} <span>${(pl.trackIds||[]).length}</span></button><button class="flow-playlist-delete" data-flow-delete-playlist="${esc(pl.id)}" aria-label="Delete ${esc(pl.name)}" title="Delete playlist">×</button></span>`).join("");
    $("flowTrackCount").textContent=`${visible.length} ${visible.length===1?"track":"tracks"}`;
    list.innerHTML=visible.map((t,i)=>`<article class="flow-track-row ${music.currentId===t.id?"current":""}"><button class="flow-track-main" data-flow-play="${t.id}" aria-label="Play ${esc(t.title)}"><span class="flow-track-index">${music.currentId===t.id&&music.playing?"Ⅱ":String(i+1).padStart(2,"0")}</span><span class="flow-track-text"><b>${esc(t.title)}</b><small>${esc(t.album)} · Purrple Cat</small></span><span class="flow-track-duration">${t.duration}</span></button><button class="flow-row-icon ${p.favorites.includes(t.id)?"saved":""}" data-flow-favorite="${t.id}" aria-label="${p.favorites.includes(t.id)?"Remove from":"Add to"} favourites">${p.favorites.includes(t.id)?"♥":"♡"}</button><button class="flow-row-icon" data-flow-add="${t.id}" aria-label="Add to playlist" title="Add to playlist">＋</button></article>`).join("")||`<div class="empty-state">${flowCollection==="favorites"?"No favourites yet. Tap ♡ on a track to save it.":flowCollection==="recent"?"Your recently played tracks will appear here.":flowCollection.startsWith("playlist:")?"This playlist is empty. Add tracks with the ＋ button.":"No tracks match this search."}</div>`;
    renderFlowPlayer();
  }
  function openMusic(){navigate("flow");}
  async function playFlowTrack(id){
    const selected=flowTrack(id);if(!selected)return;
    const audio=ensureFlowAudio();if(!audio)return;
    if(music.currentId!==id||audio.dataset.trackId!==id){music.currentId=id;audio.dataset.trackId=id;audio.src=selected.src;audio.load();}
    const p=flowPrefs();p.lastTrackId=id;p.history=[id,...p.history.filter(x=>x!==id)].slice(0,30);p.volume=music.volume;
    save({localOnly:true});
    try{await audio.play();music.playing=true;renderFlow();}catch(e){music.playing=false;renderFlowPlayer();toast("Tap Play again to start audio. Your browser may be blocking playback.");return;}
    if("mediaSession" in navigator&&"MediaMetadata" in window){try{navigator.mediaSession.metadata=new MediaMetadata({title:selected.title,artist:"Purrple Cat",album:selected.album});navigator.mediaSession.setActionHandler("play",()=>audio.play());navigator.mediaSession.setActionHandler("pause",()=>audio.pause());navigator.mediaSession.setActionHandler("previoustrack",()=>nextFlowTrack(-1));navigator.mediaSession.setActionHandler("nexttrack",()=>nextFlowTrack(1));}catch(e){console.warn("Media Session controls are unavailable",e);}}
  }
  function pauseFlow(){const audio=ensureFlowAudio();if(audio)audio.pause();music.playing=false;renderFlowPlayer();}
  function stopMusic(){pauseFlow();}
  function toggleFlowPlay(){const audio=ensureFlowAudio();if(!audio)return;if(music.playing){pauseFlow();return;}const current=flowCurrent();if(current)playFlowTrack(current.id);else{const first=flowCollectionTracks()[0]||flowTracks[0];if(first)playFlowTrack(first.id);}}
  function nextFlowTrack(direction,ended=false){
    const rows=flowCollectionTracks();if(!rows.length)return;
    const current=flowCurrent();let i=rows.findIndex(t=>t.id===current?.id);
    if(ended&&music.repeat!=="all"&&!music.shuffle&&i===rows.length-1){pauseFlow();return;}
    if(music.shuffle&&rows.length>1){let n=i;while(n===i)n=Math.floor(Math.random()*rows.length);i=n;}else{i=(i+direction+rows.length)%rows.length;}
    playFlowTrack(rows[Math.max(0,i)].id);
  }
  function toggleFlowFavorite(id){const p=flowPrefs(),i=p.favorites.indexOf(id);if(i>=0)p.favorites.splice(i,1);else p.favorites.unshift(id);save({localOnly:true});toast(i>=0?"Removed from favourites.":"Added to favourites.");}
  function createFlowPlaylist(){openDialog("Create a playlist",`<form id="flowPlaylistForm" class="dialog-form"><label>Playlist name<input name="name" maxlength="40" placeholder="e.g. Morning Focus" required></label><p class="fine-print">Your playlists are saved on this device for now. Account sync can be connected with the backend later.</p><div class="dialog-actions"><button type="button" class="button button-ghost" data-action="dialog-close">Cancel</button><button type="submit" class="button button-primary">Create playlist</button></div></form>`);}
  function addFlowTrackDialog(id){const t=flowTrack(id),p=flowPrefs();if(!t)return;if(!p.playlists.length){openDialog("Create your first playlist",`<p class="muted">Create a playlist first, then you can add tracks to it.</p><button class="button button-primary" id="flowCreateFromAdd">Create playlist</button>`);$("flowCreateFromAdd").onclick=createFlowPlaylist;return;}openDialog("Add to playlist",`<p class="muted">${esc(t.title)}</p><form id="flowAddTrackForm" class="dialog-form"><input type="hidden" name="trackId" value="${esc(id)}"><label>Choose playlist<select name="playlistId">${p.playlists.map(pl=>`<option value="${esc(pl.id)}">${esc(pl.name)}</option>`).join("")}</select></label><div class="dialog-actions"><button type="button" class="button button-ghost" data-action="dialog-close">Cancel</button><button type="submit" class="button button-primary">Add track</button></div></form>`);}
  function removeFlowPlaylist(id){const p=flowPrefs();p.playlists=p.playlists.filter(x=>x.id!==id);if(flowCollection==="playlist:"+id)flowCollection="all";save({localOnly:true});toast("Playlist removed.");}

  // MEDITATION — speechSynthesis plus generated rain/water/chimes/wind.
  const meditationText={hi:"अपने शरीर को आराम दें। कंधों को धीरे से ढीला छोड़ें। आंखें बंद करना चाहें तो कर सकते हैं। अपनी सांस को महसूस करें। विचार आएं तो उन्हें बिना जज किए जाने दें। धीरे से अपना ध्यान वापस सांस पर लाएं। आप जहां हैं, वहीं से शुरुआत कर सकते हैं।",en:"Allow your body to settle. Soften your shoulders and relax your face. Close your eyes if that feels comfortable. Notice your natural breath without trying to change it. When thoughts appear, let them pass without judgement. Gently bring your attention back to the breath. You can begin again, exactly where you are."};
  function speak(){if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window))return toast("Voice guidance is unavailable on this browser. The written guide remains available.");const l=$("meditationLanguage").value;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(meditationText[l]);u.lang=l==="hi"?"hi-IN":"en-IN";u.rate=.85;const v=window.speechSynthesis.getVoices(),match=v.find(x=>x.lang.toLowerCase().startsWith(l==="hi"?"hi":"en-in"))||v.find(x=>x.lang.toLowerCase().startsWith(l));if(match)u.voice=match;window.speechSynthesis.speak(u);}
  function stopVoice(){if("speechSynthesis" in window)window.speechSynthesis.cancel();}
  function stopAmbient(){clearInterval(meditation.soundTimer);meditation.soundTimer=null;meditation.sources.forEach(x=>{try{x.stop();}catch(_){}});meditation.sources=[];if(meditation.ctx){meditation.ctx.close().catch(()=>{});meditation.ctx=null;}document.querySelectorAll("[data-sound]").forEach(b=>b.classList.remove("active"));}
  async function startAmbient(kind){stopAmbient();const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return toast("Ambient audio is not supported on this browser.");try{const c=new AC(),master=c.createGain();master.gain.value=.2;master.connect(c.destination);meditation.ctx=c;await c.resume();if(kind==="chimes"){const ring=()=>{if(!meditation.ctx)return;const t=c.currentTime+.03;[523.25,659.25,783.99].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(.0001,t+i*.12);g.gain.exponentialRampToValueAtTime(.07,t+i*.12+.02);g.gain.exponentialRampToValueAtTime(.0001,t+i*.12+2.3);o.connect(g);g.connect(master);o.start(t+i*.12);o.stop(t+i*.12+2.4);});};ring();meditation.soundTimer=setInterval(ring,6500);}else{const n=c.sampleRate*3,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();src.buffer=b;src.loop=true;f.type=kind==="water"?"bandpass":"lowpass";f.frequency.value=kind==="wind"?440:kind==="water"?900:1500;g.gain.value=kind==="rain"?.16:kind==="water"?.1:.09;src.connect(f);f.connect(g);g.connect(master);src.start();meditation.sources.push(src);}document.querySelector(`[data-sound="${kind}"]`)?.classList.add("active");}catch(e){stopAmbient();toast("Tap the sound again to enable audio.");}}
  function startMeditation(){if(meditation.running)return;let m=$("meditationLength").value==="custom"?Number($("meditationCustom").value):Number($("meditationLength").value);m=Math.max(1,Math.min(60,m||0));if(!m)return toast("Choose 1 to 60 minutes.");meditation.total=m*60;meditation.remaining=meditation.total;meditation.finished=false;meditation.running=true;$("meditationClock").textContent=fmt(meditation.remaining);$("meditationStart").hidden=true;$("meditationPause").hidden=false;$("meditationStop").hidden=false;$("meditationPause").textContent="Pause";$("meditationClock").parentElement.classList.add("playing");meditation.interval=setInterval(()=>{meditation.remaining=Math.max(0,meditation.remaining-1);$("meditationClock").textContent=fmt(meditation.remaining);if(!meditation.remaining){clearInterval(meditation.interval);meditation.interval=null;meditation.running=false;meditation.finished=true;$("meditationPause").hidden=true;$("meditationStop").hidden=true;$("meditationStart").hidden=false;$("meditationClock").parentElement.classList.remove("playing");saveMeditationDialog();}},1000);}
  function pauseMeditation(){if(meditation.running){clearInterval(meditation.interval);meditation.interval=null;meditation.running=false;$("meditationPause").textContent="Resume";}else if(meditation.remaining>0){meditation.running=true;$("meditationPause").textContent="Pause";meditation.interval=setInterval(()=>{meditation.remaining=Math.max(0,meditation.remaining-1);$("meditationClock").textContent=fmt(meditation.remaining);if(!meditation.remaining){clearInterval(meditation.interval);meditation.interval=null;meditation.running=false;meditation.finished=true;$("meditationPause").hidden=true;$("meditationStop").hidden=true;$("meditationStart").hidden=false;$("meditationClock").parentElement.classList.remove("playing");saveMeditationDialog();}},1000);}}
  function stopMeditation(){clearInterval(meditation.interval);meditation.interval=null;meditation.running=false;meditation.finished=false;meditation.remaining=0;$("meditationClock").textContent="00:00";$("meditationStart").hidden=false;$("meditationPause").hidden=true;$("meditationStop").hidden=true;$("meditationClock").parentElement.classList.remove("playing");$("meditationPrompt").textContent="Session ended. You can begin again whenever you feel ready.";}
  function saveMeditationDialog(){openDialog("How calm do you feel?","<p class='muted'>Your session is complete. Save a quick reflection.</p><label>Calm rating<select id='calmRating'><option value='5'>5 · Very calm</option><option value='4'>4 · Calm</option><option value='3'>3 · Okay</option><option value='2'>2 · Restless</option><option value='1'>1 · Very restless</option></select></label><div class='dialog-actions'><button class='button button-primary' id='saveMeditation'>Save session</button><button class='button button-ghost' data-action='dialog-close'>Close</button></div>");$("saveMeditation").onclick=()=>{state.meditationSessions.unshift({id:"med-"+Date.now(),date:today(),minutes:Math.round(meditation.total/60),calmRating:Number($("calmRating").value||5)});meditation.finished=false;save();closeDialog();renderMeditationHistory();toast("Meditation session saved.");};}
  function renderMeditationHistory(){const a=state.meditationSessions||[];$("meditationHistory").innerHTML=a.slice(0,10).map(x=>`<div class="record-card inline-controls"><span>${Number(x.minutes)||0} min · ${esc(x.date||"")}</span><b>${"★".repeat(Number(x.calmRating)||0)}${"☆".repeat(5-(Number(x.calmRating)||0))}</b></div>`).join("")||`<div class="empty-state">Your completed sessions will appear here.</div>`;const days=new Set(a.map(x=>x.date));let d=new Date((days.has(today())?today():new Date(Date.now()-86400000).toISOString().slice(0,10))+"T12:00:00"),n=0;while(days.has(d.toISOString().slice(0,10))&&n<365){n++;d.setDate(d.getDate()-1);}$("meditationStreak").textContent=n+" day streak";}

  // AUTH: cloud conflicts require a choice; backup stays opt-in.
  function needLogin(){if(user)return true;openAuthDialog();toast("Sign in to continue. Guest browsing remains available.");return false;}
  function openAuthDialog(){openDialog(user?"Account":"Sign in or create an account",`<p class="muted">You can explore NEXORA as a guest. Sign-in is optional, and your device data stays available when you sign in.</p><form id="authForm" class="dialog-form"><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" minlength="6" autocomplete="current-password" required></label><div class="dialog-actions"><button class="button button-primary" type="submit" data-auth-mode="signin">Sign in</button><button class="button button-soft" type="submit" data-auth-mode="signup">Create account</button></div></form><div class="dialog-actions"><button class="text-button" data-action="reset-password">Forgot password?</button></div><div class="dialog-actions"><button class="button button-ghost" data-action="oauth-google">Continue with Google</button></div><p class="fine-print">Google sign-in requires the Google provider to be enabled in the connected Supabase project.</p>${user?`<div class="dialog-actions"><button class="button button-ghost" data-action="signout">Sign out</button></div>`:""}`);}
  async function authSubmit(f,button){if(!db)return toast("Account service is not available.");const d=new FormData(f),email=String(d.get("email")||"").trim(),password=String(d.get("password")||""),mode=button?.dataset.authMode;const r=mode==="signup"?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});if(r.error)return toast(r.error.message);if(mode==="signup"&&!r.data.session)return toast("Check your email to confirm the account, then sign in.");if(r.data.user)await handleSignedIn(r.data.user);closeDialog();toast(mode==="signup"?"Account created.":"Signed in.");}
  async function oauth(provider){if(!db)return toast("Account service is not available.");const {error}=await db.auth.signInWithOAuth({provider,options:{redirectTo:location.origin}});if(error)toast(error.message);}
  async function resetPassword(){if(!db)return toast("Account service is not available.");const email=$("authForm")?.elements.email.value.trim();if(!email)return toast("Enter your email address first.");const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)toast(error.message);else toast("Password reset link sent. Check your email.");}
  let cloudTimer=null;
  async function handleSignedIn(u){if(!u||authHandled===u.id)return;authHandled=u.id;user=u;$("accountSummary").textContent=u.email||"Signed in";$("signOut").hidden=false;try{const pref=await db.from("backup_preferences").select("enabled").eq("user_id",u.id).maybeSingle();backupEnabled=!!pref.data?.enabled&&localStorage.getItem("nexora_backup_pause_"+u.id)!=="1";const remote=await db.from("nexora_user_data").select("data").eq("user_id",u.id).maybeSingle();if(remote.error)throw remote.error;if(remote.data?.data){const deviceHasProgress=hasProgress();if(confirm(deviceHasProgress?"A cloud backup exists. Restore it to this device? Your current device data will first be archived. Choose Cancel to keep device data.":"A previous cloud backup exists for this account. Restore it to this device?")){if(deviceHasProgress)localStorage.setItem("nexora_before_restore_"+Date.now(),JSON.stringify(state));suppressCloud=true;state=normalize(remote.data.data);localStorage.setItem(KEY,JSON.stringify(state));suppressCloud=false;save({localOnly:true});toast("Cloud data restored. Device snapshot preserved.");}else{backupEnabled=false;localStorage.setItem("nexora_backup_pause_"+u.id,"1");try{await db.from("backup_preferences").upsert({user_id:u.id,enabled:false,timezone:"Asia/Kolkata",updated_at:new Date().toISOString()},{onConflict:"user_id"});}catch(_){}$("cloudStatus").textContent="Existing cloud backup left untouched. Device data kept and automatic backup paused.";}}else if(hasProgress()){if(confirm("Transfer a one-time copy of this device's guest data to the new account? This does not enable automatic backup.")){const ins=await db.from("nexora_user_data").insert({user_id:u.id,data:copy(state),updated_at:new Date().toISOString()});if(ins.error)throw ins.error;$("cloudStatus").textContent="Guest data copied once. Automatic backup remains off.";}else $("cloudStatus").textContent="Guest data remains on this device. No cloud copy was made.";backupEnabled=false;localStorage.setItem("nexora_backup_pause_"+u.id,"1");}if(backupEnabled)queueCloud();}catch(e){backupEnabled=false;$("cloudStatus").textContent="Account connected; backup paused: "+e.message;}renderSettings();checkOwnerAccess(true);}
  function hasProgress(){return hasExistingProgress(state);}
  function hasExistingProgress(s){
    const collections=["tasks","study","journals","routines","trackers","trackerLogs","focusHistory","feedbacks","meditationSessions"];
    if(collections.some(k=>Array.isArray(s[k])&&s[k].length))return true;
    if(Number(s.streak)>0||Number(s.focusSessions)>0||Number(s.hydrationMl)!==1500||Number(s.hydrationGoal)!==3000)return true;
    const profile=s.profile||{};
    if((profile.name&&profile.name!=="Explorer")||profile.handle||(profile.bio&&profile.bio!=="Small steps. Real progress.")||profile.customPfp||(profile.exams||[]).length)return true;
    return Object.keys(s.settings||{}).some(k=>JSON.stringify(s.settings[k])!==JSON.stringify(defaults.settings[k]));
  }
  function queueCloud(){clearTimeout(cloudTimer);cloudTimer=setTimeout(syncCloud,1600);}
  async function syncCloud(){if(!user||!backupEnabled||cloudBusy||!db)return;cloudBusy=true;$("cloudStatus").textContent="Backing up...";try{const {error}=await db.from("nexora_user_data").upsert({user_id:user.id,data:copy(state),updated_at:new Date().toISOString()},{onConflict:"user_id"});if(error)throw error;$("cloudStatus").textContent="Cloud backup updated.";}catch(e){backupEnabled=false;$("cloudStatus").textContent="Backup paused after an error: "+e.message;}finally{cloudBusy=false;renderSettings();}}
  async function enableBackup(){if(!user){openAuthDialog();toast("Sign in before enabling backup.");return;}try{const existing=await db.from("nexora_user_data").select("user_id,updated_at").eq("user_id",user.id).maybeSingle();if(existing.error)throw existing.error;if(existing.data&&!confirm("An existing cloud copy will be updated with this device's current data. Continue?"))return;const up=await db.from("nexora_user_data").upsert({user_id:user.id,data:copy(state),updated_at:new Date().toISOString()},{onConflict:"user_id"});if(up.error)throw up.error;const pref=await db.from("backup_preferences").upsert({user_id:user.id,enabled:true,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"Asia/Kolkata",updated_at:new Date().toISOString()},{onConflict:"user_id"});if(pref.error)throw pref.error;backupEnabled=true;localStorage.removeItem("nexora_backup_pause_"+user.id);$("cloudStatus").textContent="Cloud backup is enabled.";renderSettings();}catch(e){backupEnabled=false;$("cloudStatus").textContent="Could not enable backup: "+e.message;}}
  async function signOut(){if(!db||!user)return;const {error}=await db.auth.signOut();if(error)return toast(error.message);user=null;backupEnabled=false;authHandled="";isOwnerVerified=false;ownerCheckPromise=null;updateOwnerEntry();$("accountSummary").textContent="Guest mode · Device data remains saved.";renderSettings();closeDialog();toast("Signed out. Device data remains on this phone.");}

  // SOCIAL, PROFILE AND REVIEWS use only table/column names seen in the current source.
  const categoryName=c=>({overall:"Overall",interface:"Interface & design",usefulness:"Usefulness",performance:"Performance"})[c]||c;
  async function loadPeople(){const box=$("peopleList");if(!db){box.innerHTML=`<div class="empty-state">Community connection is unavailable.</div>`;return;}box.innerHTML=`<div class="empty-state">Loading public profiles...</div>`;try{const {data,error}=await db.from("profiles").select("id,display_name,username,avatar_url,bio,is_private,created_at").order("created_at",{ascending:false}).limit(100);if(error)throw error;const a=(data||[]).filter(p=>!user||p.id!==user.id);box.innerHTML=a.map(p=>`<article class="person-card" data-person="${esc(((p.display_name||"")+" "+(p.username||"")).toLowerCase())}"><div class="avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:esc((p.display_name||"N").slice(0,1).toUpperCase())}</div><div><b>${esc(p.display_name||"NEXORA member")}</b><small>@${esc(p.username||"member")} · ${p.is_private?"Private":"Public"} profile</small></div><button class="button button-soft" data-action="view-profile" data-id="${esc(p.id)}">View</button></article>`).join("")||`<div class="empty-state">No public profiles to show yet.</div>`;}catch(e){box.innerHTML=`<div class="empty-state">Could not load the community: ${esc(e.message)}</div>`;}}
  async function loadPosts(){
    const box=$("postsFeed");if(!db){box.innerHTML=`<div class="empty-state">Community posts need the connected account service.</div>`;return;}
    box.innerHTML=`<div class="empty-state">Loading posts...</div>`;
    try{
      const {data:posts,error}=await db.from("nexora_posts").select("id,author_id,body,created_at,updated_at").order("created_at",{ascending:false}).limit(60);
      if(error)throw error;if(!posts?.length){box.innerHTML=`<div class="empty-state">No visible posts yet. Be the first to share a small win.</div>`;return;}
      const ids=[...new Set(posts.map(x=>x.author_id))],postIds=posts.map(x=>x.id);
      const [people,likes]=await Promise.all([
        ids.length?db.from("profiles").select("id,display_name,username,avatar_url").in("id",ids):Promise.resolve({data:[],error:null}),
        postIds.length?db.from("nexora_likes").select("post_id,user_id").in("post_id",postIds):Promise.resolve({data:[],error:null})
      ]);
      if(people.error)throw people.error;if(likes.error)throw likes.error;
      box.innerHTML=posts.map(post=>{
        const person=(people.data||[]).find(x=>x.id===post.author_id)||{};
        const postLikes=(likes.data||[]).filter(x=>x.post_id===post.id);
        const liked=!!user&&postLikes.some(x=>x.user_id===user.id),own=!!user&&post.author_id===user.id;
        return `<article class="post-card"><div class="card-top"><div class="avatar">${person.avatar_url?`<img src="${esc(person.avatar_url)}" alt="">`:esc((person.display_name||"N").slice(0,1))}</div><div><b>${esc(person.display_name||"NEXORA member")}</b><div class="card-meta">${esc(person.username?"@"+person.username:"Member")} · ${new Date(post.created_at).toLocaleDateString()}</div></div></div><p>${esc(post.body)}</p><div class="row-actions"><button class="button button-soft" data-action="toggle-like" data-id="${esc(post.id)}">${liked?"♥ Liked":"♡ Like"} · ${postLikes.length}</button>${own?`<button class="button button-ghost" data-action="edit-post" data-id="${esc(post.id)}">Edit</button><button class="button button-ghost" data-action="delete-post" data-id="${esc(post.id)}">Delete</button>`:""}</div></article>`;
      }).join("");
    }catch(e){box.innerHTML=`<div class="empty-state">Posts could not be loaded: ${esc(e.message)}</div>`;}
  }
  async function publishPost(){if(!needLogin())return;const body=$("newPost").value.trim();if(!body)return toast("Write something first.");if(body.length>5000)return toast("Post must be 5,000 characters or less.");const {error}=await db.from("nexora_posts").insert({author_id:user.id,body});if(error)return toast("Post could not be published: "+error.message);$("newPost").value="";toast("Post published.");loadPosts();}
  async function deletePost(id){if(!needLogin()||!confirm("Delete this post?"))return;const {error}=await db.from("nexora_posts").delete().eq("id",id).eq("author_id",user.id);if(error)toast(error.message);else loadPosts();}
  async function editPostDialog(id){
    if(!needLogin())return;
    const {data,error}=await db.from("nexora_posts").select("id,body").eq("id",id).eq("author_id",user.id).maybeSingle();
    if(error)return toast("Post could not be opened: "+error.message);if(!data)return toast("Post not found.");
    openDialog("Edit post",`<form id="postEditForm" class="dialog-form"><textarea name="body" maxlength="5000" rows="6" required>${esc(data.body)}</textarea><input type="hidden" name="id" value="${esc(data.id)}">${dialogActions("Cancel","Save changes")}</form>`);
  }
  async function savePostEdit(f){
    if(!needLogin())return;const d=new FormData(f),id=String(d.get("id")||""),body=String(d.get("body")||"").trim();
    if(!body)return toast("Write something first.");
    const {error}=await db.from("nexora_posts").update({body,updated_at:new Date().toISOString()}).eq("id",id).eq("author_id",user.id);
    if(error)return toast("Post update failed: "+error.message);closeDialog();loadPosts();toast("Post updated.");
  }
  async function toggleLike(id){
    if(!needLogin())return;
    const found=await db.from("nexora_likes").select("post_id").eq("post_id",id).eq("user_id",user.id).maybeSingle();
    if(found.error)return toast("Like action unavailable: "+found.error.message);
    const result=found.data?await db.from("nexora_likes").delete().eq("post_id",id).eq("user_id",user.id):await db.from("nexora_likes").insert({post_id:id,user_id:user.id});
    if(result.error)return toast("Like action failed: "+result.error.message);loadPosts();
  }
  async function callRpc(name,candidates){
    let last=null;
    for(const args of candidates){
      const result=await db.rpc(name,args);if(!result.error)return result;last=result.error;
      const message=String(result.error.message||"").toLowerCase();
      if(!(message.includes("function")&&(message.includes("not found")||message.includes("schema cache")||message.includes("argument"))))break;
    }
    return {data:null,error:last||new Error("The requested action is unavailable.")};
  }
  async function loadRequests(){
    const box=$("requestsFeed");if(!user){box.innerHTML=`<div class="empty-state">Sign in to view and manage follow requests.</div>`;return;}if(!db)return;
    box.innerHTML=`<div class="empty-state">Loading follow requests...</div>`;
    try{
      const {data,error}=await db.from("nexora_follow_requests").select("id,requester_id,target_id,status,created_at").eq("target_id",user.id).eq("status","pending").order("created_at",{ascending:false});
      if(error)throw error;if(!data?.length){box.innerHTML=`<div class="empty-state">No pending follow requests.</div>`;return;}
      const ids=[...new Set(data.map(x=>x.requester_id))],people=ids.length?await db.from("profiles").select("id,display_name,username,avatar_url").in("id",ids):{data:[],error:null};if(people.error)throw people.error;
      box.innerHTML=data.map(req=>{const person=(people.data||[]).find(x=>x.id===req.requester_id)||{};return `<article class="person-card"><div class="avatar">${person.avatar_url?`<img src="${esc(person.avatar_url)}" alt="">`:esc((person.display_name||"N").slice(0,1))}</div><div><b>${esc(person.display_name||"NEXORA member")}</b><small>@${esc(person.username||"member")} · Follow request</small></div><button class="button button-primary" data-action="follow-request" data-id="${esc(req.id)}" data-decision="accept">Accept</button><button class="button button-ghost" data-action="follow-request" data-id="${esc(req.id)}" data-decision="reject">Reject</button></article>`;}).join("");
    }catch(e){box.innerHTML=`<div class="empty-state">Follow requests could not be loaded: ${esc(e.message)}</div>`;}
  }
  async function handleFollowRequest(id,decision){
    if(!needLogin())return;const name=decision==="accept"?"nexora_accept_follow_request":"nexora_reject_follow_request";
    const candidates=[{p_request_id:id},{request_id:id},{p_follow_request_id:id},{follow_request_id:id},{id}];
    const {error}=await callRpc(name,candidates);if(error)return toast("Request could not be updated: "+error.message);toast(decision==="accept"?"Follow request accepted.":"Follow request rejected.");loadRequests();
  }
  async function loadNotifications(){
    const box=$("notificationsFeed");if(!user){box.innerHTML=`<div class="empty-state">Sign in to view notifications.</div>`;return;}if(!db)return;
    box.innerHTML=`<div class="empty-state">Loading notifications...</div>`;
    try{
      const {data,error}=await db.from("nexora_notifications").select("id,title,message,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(40);
      if(error)throw error;box.innerHTML=(data||[]).map(n=>`<article class="record-card"><div class="inline-controls"><b>${esc(n.title||"NEXORA update")}</b><small>${new Date(n.created_at).toLocaleDateString()}</small></div><p style="font-size:12px;line-height:1.5;margin:8px 0">${esc(n.message||"")}</p>${n.read_at?`<small class="card-meta">Read</small>`:`<button class="button button-soft" data-action="mark-notification" data-id="${esc(n.id)}">Mark as read</button>`}</article>`).join("")||`<div class="empty-state">No notifications yet.</div>`;
    }catch(e){box.innerHTML=`<div class="empty-state">Notifications could not be loaded: ${esc(e.message)}</div>`;}
  }
  async function markNotification(id){if(!needLogin())return;const {error}=await db.from("nexora_notifications").update({read_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);if(error)toast(error.message);else loadNotifications();}
  async function loadReviews(){const box=$("reviewsFeed");if(!db){box.innerHTML=`<div class="empty-state">Reviews need the connected account service.</div>`;return;}box.innerHTML=`<div class="empty-state">Loading reviews...</div>`;try{const {data,error}=await db.from("nexora_reviews").select("id,user_id,category,rating,review_text,created_at,updated_at").order("updated_at",{ascending:false}).limit(100);if(error)throw error;if(!data?.length){box.innerHTML=`<div class="empty-state">No reviews yet. Your feedback can help shape NEXORA.</div>`;return;}const ids=[...new Set(data.map(x=>x.user_id))],p=ids.length?await db.from("profiles").select("id,display_name").in("id",ids):{data:[],error:null};if(p.error)throw p.error;box.innerHTML=data.map(r=>`<article class="record-card"><div class="inline-controls"><b>${esc((p.data||[]).find(x=>x.id===r.user_id)?.display_name||"NEXORA member")}</b><b style="color:#d9a640">${"★".repeat(Number(r.rating)||0)}${"☆".repeat(5-(Number(r.rating)||0))}</b></div><small class="card-meta">${esc(categoryName(r.category))} · ${new Date(r.updated_at||r.created_at).toLocaleDateString()}</small><p style="font-size:12px;line-height:1.5;margin:10px 0 0">${esc(r.review_text)}</p></article>`).join("");}catch(e){box.innerHTML=`<div class="empty-state">Reviews could not be loaded: ${esc(e.message)}</div>`;}}
  async function submitReview(f){if(!needLogin())return;const d=new FormData(f),text=String(d.get("review")||"").trim(),category=String(d.get("category")||"overall");if(!text)return;const {error}=await db.from("nexora_reviews").upsert({user_id:user.id,category,rating:reviewRating,review_text:text,updated_at:new Date().toISOString()},{onConflict:"user_id,category"});if(error)return toast("Review could not be saved: "+error.message);f.elements.review.value="";toast("Thank you for your review.");loadReviews();}
  async function loadProfile(id){
    const box=$("profileCard");
    if(!id||!db){box.innerHTML=`<div class="empty-state">Sign in to manage your profile. Public profiles can be browsed in Community.</div>`;$("profilePosts").innerHTML="";return;}
    try{
      const {data:p,error}=await db.from("profiles").select("id,display_name,username,avatar_url,bio,is_private").eq("id",id).maybeSingle();
      if(error)throw error;if(!p){box.innerHTML=`<div class="empty-state">Profile not found.</div>`;return;}
      const own=!!user&&user.id===id;
      const [followers,following,posts]=await Promise.all([
        db.from("nexora_follows").select("follower_id",{count:"exact",head:true}).eq("following_id",id),
        db.from("nexora_follows").select("following_id",{count:"exact",head:true}).eq("follower_id",id),
        db.from("nexora_posts").select("id,body,created_at").eq("author_id",id).order("created_at",{ascending:false}).limit(12)
      ]);
      const fail=[followers.error,following.error,posts.error].find(Boolean);if(fail)throw fail;
      let relationAction="";
      if(!own){
        if(!user)relationAction=`<button class="button button-primary" data-action="follow-profile" data-id="${esc(id)}">Sign in to follow</button>`;
        else{
          const [relation,request]=await Promise.all([
            db.from("nexora_follows").select("following_id").eq("follower_id",user.id).eq("following_id",id).maybeSingle(),
            p.is_private?db.from("nexora_follow_requests").select("id,status").eq("requester_id",user.id).eq("target_id",id).eq("status","pending").maybeSingle():Promise.resolve({data:null,error:null})
          ]);
          if(relation.error)throw relation.error;if(request.error)throw request.error;
          relationAction=relation.data?`<button class="button button-soft" data-action="unfollow-profile" data-id="${esc(id)}">Following · Unfollow</button>`:request.data?`<button class="button button-ghost" disabled>Request pending</button>`:`<button class="button button-primary" data-action="follow-profile" data-id="${esc(id)}">${p.is_private?"Request to follow":"Follow"}</button>`;
        }
      }
      const exams=own&&Array.isArray(state.profile.exams)&&state.profile.exams.length?`<p class="fine-print">Exam / study goals: ${esc(state.profile.exams.join(", "))}</p>`:"";
      box.innerHTML=`<div class="card-top"><div class="avatar">${p.avatar_url?`<img src="${esc(p.avatar_url)}" alt="">`:esc((p.display_name||"N").slice(0,1))}</div><div><h2>${esc(p.display_name||"NEXORA member")}</h2><div class="card-meta">@${esc(p.username||"member")} · ${p.is_private?"Private profile":"Public profile"}</div></div></div><p>${esc(p.bio||"Growing one step at a time.")}</p>${exams}<div class="profile-stat-row"><span>${Number(followers.count)||0} followers</span><span>${Number(following.count)||0} following</span><span>${(posts.data||[]).length} recent posts</span></div>${own?`<div class="row-actions"><button class="button button-soft" data-action="edit-profile">Edit profile</button></div>`:`<div class="row-actions">${relationAction}</div>`}`;
      $("profilePosts").innerHTML=(posts.data||[]).map(x=>`<article class="record-card"><p>${esc(x.body)}</p><small class="card-meta">${new Date(x.created_at).toLocaleDateString()}</small></article>`).join("")||`<div class="empty-state">No visible posts yet.</div>`;
    }catch(e){box.innerHTML=`<div class="empty-state">Profile could not be loaded: ${esc(e.message)}</div>`;}
  }
  function compressProfilePhoto(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{try{const canvas=document.createElement("canvas"),max=320,scale=Math.min(1,max/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);let quality=.78,data=canvas.toDataURL("image/jpeg",quality);while(data.length>105000&&quality>.4){quality-=.08;data=canvas.toDataURL("image/jpeg",quality);}URL.revokeObjectURL(url);if(data.length>105000)reject(new Error("photo-too-large"));else resolve(data);}catch(error){URL.revokeObjectURL(url);reject(error);}};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("invalid-image"));};img.src=url;
    });
  }
  function editProfileDialog(){
    const render=(p={})=>{
      const currentAvatar=p.avatar_url||state.profile.customPfp||"";pendingAvatarDataUrl=null;
      openDialog("Edit profile",`<form id="profileForm" class="dialog-form">
        <label>Display name<input name="name" maxlength="60" value="${esc(p.display_name||state.profile.name||"")}" required></label>
        <label>Username<input name="username" maxlength="24" value="${esc(p.username||state.profile.handle||"")}" placeholder="your_username"></label>
        <label>Bio<textarea name="bio" maxlength="300" rows="3">${esc(p.bio||state.profile.bio||"")}</textarea></label>
        <label>Profile photo<div class="photo-editor"><img id="profilePhotoPreview" src="${esc(currentAvatar)}" alt="Profile photo preview" ${currentAvatar?"":"hidden"}><span><input id="profilePhotoFile" type="file" accept="image/*"><small>JPG, PNG or WebP · resized before saving · max 12 MB</small></span></div><input type="hidden" name="avatar" value="${esc(currentAvatar)}"></label>
        <label>Exams / study goals<input name="exams" maxlength="180" value="${esc((p.exams||state.profile.exams||[]).join?.(", ")||"")}" placeholder="SSC CGL, UPSC, NEET"></label>
        <label><span><input type="checkbox" name="showPoints" ${(p.showPoints??state.profile.showPoints)?"checked":""}> Save my points/ranking display preference</span><small class="fine-print">Public display depends on existing profile backend support; no points are invented.</small></label>
        <label><span><input type="checkbox" name="private" ${p.is_private?"checked":""}> Private profile</span></label>
        ${dialogActions("Cancel","Save profile")}</form>`);
      $("profilePhotoFile").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")){toast("Choose an image file.");e.target.value="";return;}if(file.size>12*1024*1024){toast("Choose an image smaller than 12 MB.");e.target.value="";return;}try{pendingAvatarDataUrl=await compressProfilePhoto(file);const preview=$("profilePhotoPreview");preview.src=pendingAvatarDataUrl;preview.hidden=false;$("profileForm").elements.avatar.value=pendingAvatarDataUrl;toast("Photo ready. Save your profile to apply it.");}catch(_){pendingAvatarDataUrl=null;toast("This image could not be opened. Try another photo.");}});
    };
    if(!user){render(state.profile||{});return;}
    if(!db){toast("Profile service is unavailable.");return;}
    db.from("profiles").select("display_name,username,bio,avatar_url,is_private").eq("id",user.id).maybeSingle().then(({data,error})=>{if(error)return toast(error.message);render(data||{});});
  }
  async function saveProfile(f){
    const d=new FormData(f),name=String(d.get("name")||"").trim(),username=String(d.get("username")||"").trim().replace(/^@/,"").toLowerCase(),raw=String(d.get("avatar")||"").trim(),exams=String(d.get("exams")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);
    if(!name)return toast("Enter a display name.");
    let avatar_url=pendingAvatarDataUrl||"";if(!avatar_url&&raw){if(raw.startsWith("data:image/jpeg;base64,")&&raw.length<=105000){avatar_url=raw;}else{try{const u=new URL(raw);if(u.protocol!=="https:")throw new Error();avatar_url=u.href;}catch(_){return toast("Profile photo must be a valid HTTPS URL or a resized in-app image.");}}}
    const bio=String(d.get("bio")||"").trim();
    if(!user){state.profile={...state.profile,name,handle:username,bio,customPfp:avatar_url||state.profile.customPfp||"",exams,showPoints:d.has("showPoints")};pendingAvatarDataUrl=null;save({localOnly:true});closeDialog();toast("Your device profile is updated.");return;}
    if(!db)return toast("Profile service is unavailable.");
    const payload={display_name:name,bio,avatar_url:avatar_url||null,is_private:d.has("private")};
    const {error}=await db.from("profiles").update(payload).eq("id",user.id);if(error)return toast("Profile save failed: "+error.message);
    if(username){const result=await callRpc("nexora_set_username",[{p_username:username},{username},{new_username:username}]);if(result.error)return toast("Profile saved, but username update failed: "+result.error.message);}
    state.profile={...state.profile,name,handle:username,bio,customPfp:avatar_url||state.profile.customPfp||"",exams,showPoints:d.has("showPoints")};pendingAvatarDataUrl=null;save({localOnly:true});closeDialog();profileTarget=user.id;loadProfile(user.id);toast("Profile updated.");
  }
  async function followProfile(id){if(!needLogin())return;const candidates=[{target_user_id:id},{p_target_user_id:id},{p_target_id:id},{target_id:id},{p_user_id:id},{user_id:id}];const {error}=await callRpc("nexora_follow_user",candidates);if(error)return toast("Follow action unavailable: "+error.message);toast("Follow action sent. Private profiles may need approval.");loadProfile(id);}
  async function unfollowProfile(id){if(!needLogin())return;if(!confirm("Unfollow this member?"))return;const candidates=[{target_user_id:id},{p_target_user_id:id},{p_target_id:id},{target_id:id},{p_user_id:id},{user_id:id}];const {error}=await callRpc("nexora_unfollow_user",candidates);if(error)return toast("Unfollow could not be completed: "+error.message);toast("Unfollowed.");loadProfile(id);}
  function loadSocial(tab=activeSocial){
    activeSocial=tab;
    document.querySelectorAll("[data-social]").forEach(b=>b.classList.toggle("active",b.dataset.social===tab));
    ["people","posts","reviews","requests","notifications","leaderboard"].forEach(k=>$("social"+k[0].toUpperCase()+k.slice(1)).hidden=k!==tab);
    if(tab==="people")loadPeople();if(tab==="posts")loadPosts();if(tab==="reviews")loadReviews();if(tab==="requests")loadRequests();if(tab==="notifications")loadNotifications();if(tab==="leaderboard")loadLeaderboard(currentLeaderboardMode);
  }

  async function loadLeaderboard(mode=currentLeaderboardMode){
    currentLeaderboardMode=mode;
    document.querySelectorAll("[data-leaderboard-mode]").forEach(b=>b.classList.toggle("active",b.dataset.leaderboardMode===mode));
    const box=$("leaderboardList");if(!box)return;
    if(!db){box.innerHTML=`<div class="empty-state">Verified leaderboard is not connected.</div>`;return;}
    box.innerHTML=`<div class="empty-state">Loading verified points...</div>`;
    try{
      if(mode==="daily"){
        const {data:champion,error:championError}=await db.from("nexora_daily_champions").select("champion_date,winner_user_id,winner_name,winner_points,medal,title,message").eq("champion_date",today()).maybeSingle();
        if(championError)throw championError;
        $("championBox").innerHTML=champion?`<div class="profile-card"><span class="eyebrow light">DAILY DISCIPLINE CHAMPION</span><h2>${esc(champion.medal||"★")} ${esc(champion.winner_name||"NEXORA learner")}</h2><p>${esc(champion.message||"A day of honest effort deserves recognition.")}</p><b>${Number(champion.winner_points)||0} verified points</b></div>`:`<div class="surface-card"><b>Daily Champion</b><p class="muted">No champion has been published for today. No artificial winner is shown.</p></div>`;
      }else $("championBox").innerHTML="";
      let result=null,lastError=null;
      if(mode==="daily"){
        result=await db.rpc("nexora_leaderboard");
        if(!result.error){lastError=null;}else lastError=result.error;
      }
      if(!result||result.error){
        for(const key of ["p_period","period","p_range","range","mode","p_mode"]){
          const candidate=await db.rpc("nexora_leaderboard",{[key]:mode});
          if(!candidate.error){result=candidate;lastError=null;break;}
          lastError=candidate.error;const m=String(lastError.message||"").toLowerCase();
          if(!(m.includes("function")&&(m.includes("not found")||m.includes("schema cache")||m.includes("argument"))))break;
        }
      }
      if(!result||result.error)throw lastError||new Error("Leaderboard function unavailable.");
      const rows=Array.isArray(result.data)?result.data:(result.data?[result.data]:[]);
      box.innerHTML=rows.map(r=>`<article class="record-card inline-controls"><div><b>#${esc(r.rank_no??"—")} · ${esc(r.display_name||r.username||"Learner")}</b><div class="card-meta">${esc(r.username?"@"+r.username:"NEXORA member")}</div></div><b>${Number(r.total_points)||0} pts</b></article>`).join("")||`<div class="empty-state">No verified points yet. Learning points appear after secure quiz activities are enabled.</div>`;
    }catch(e){box.innerHTML=`<div class="empty-state">Leaderboard could not load: ${esc(e.message)}</div>`;}
  }
  function updateOwnerEntry(){const entry=$("ownerMenuItem");if(entry)entry.hidden=!isOwnerVerified;}
  async function checkOwnerAccess(force=false){
    if(!user||user.id!==OWNER_ID||!db){isOwnerVerified=false;ownerCheckPromise=null;updateOwnerEntry();return false;}
    if(ownerCheckPromise&&!force)return ownerCheckPromise;
    ownerCheckPromise=(async()=>{
      isOwnerVerified=false;
      try{const {data,error}=await db.rpc("nexora_is_admin");isOwnerVerified=!error&&data===true;}
      catch(_){isOwnerVerified=false;}
      updateOwnerEntry();return isOwnerVerified;
    })();
    return ownerCheckPromise;
  }
  async function deleteOwnerReview(id){
    if(!(await checkOwnerAccess()))return toast("Owner verification failed.");
    if(!confirm("Remove this review? This uses the current owner-only database permission."))return;
    const {error}=await db.from("nexora_reviews").delete().eq("id",id);
    if(error)return toast("Review could not be removed: "+error.message);
    toast("Review removed.");loadOwnerConsole();loadReviews();
  }
  async function loadOwnerConsole(){
    const box=$("ownerContent");if(!box)return;
    if(!(await checkOwnerAccess())){box.innerHTML=`<div class="empty-state">Access denied. This page is restricted to the fixed owner account and server verification.</div>`;return;}
    box.innerHTML=`<div class="empty-state">Loading restricted owner dashboard...</div>`;
    try{
      const [profiles,posts,reviews]=await Promise.all([
        db.from("profiles").select("id",{count:"exact",head:true}),
        db.from("nexora_posts").select("id",{count:"exact",head:true}),
        db.from("nexora_reviews").select("id",{count:"exact",head:true})
      ]);
      const failure=[profiles.error,posts.error,reviews.error].find(Boolean);if(failure)throw failure;
      const recent=await db.from("nexora_reviews").select("id,user_id,category,rating,review_text,created_at").order("created_at",{ascending:false}).limit(30);
      if(recent.error)throw recent.error;
      const ids=[...new Set((recent.data||[]).map(x=>x.user_id))],people=ids.length?await db.from("profiles").select("id,display_name,username").in("id",ids):{data:[],error:null};if(people.error)throw people.error;
      box.innerHTML=`<section class="surface-card"><div class="eyebrow">SERVER VERIFIED</div><h2>Owner access confirmed</h2><p class="muted">No admin creation or role assignment controls exist here. Permissions remain governed by the server-side owner check and database policies.</p><div class="stats-grid"><article class="stat-card"><span>Profiles</span><strong>${profiles.count??"—"}</strong></article><article class="stat-card"><span>Posts</span><strong>${posts.count??"—"}</strong></article><article class="stat-card"><span>Reviews</span><strong>${reviews.count??"—"}</strong></article></div></section><section class="surface-card"><h2>Review moderation</h2><p class="fine-print">Removal is attempted only under the existing owner-only database policy. The app does not bypass RLS.</p>${(recent.data||[]).map(r=>{const person=(people.data||[]).find(p=>p.id===r.user_id)||{};return `<article class="record-card"><div class="inline-controls"><b>${esc(person.display_name||"Member")} · ${esc(r.category||"Overall")}</b><b style="color:#d9a640">${"★".repeat(Number(r.rating)||0)}${"☆".repeat(5-(Number(r.rating)||0))}</b></div><p style="font-size:12px;line-height:1.5">${esc(r.review_text||"")}</p><button class="button button-ghost" data-action="owner-delete-review" data-id="${esc(r.id)}">Remove review</button></article>`;}).join("")||`<div class="empty-state">No reviews to moderate.</div>`}</section>`;
    }catch(e){box.innerHTML=`<div class="empty-state">Owner dashboard could not load: ${esc(e.message)}</div>`;}
  }

  // RENDERING, SETTINGS, HISTORY
  function renderHome(){const first=(state.profile?.name||"").trim().split(/\s+/)[0],h=new Date().getHours(),g=h<12?"Good morning":h<17?"Good afternoon":"Good evening";$("homeGreeting").textContent=`${g}${first&&first!=="Explorer"?", "+first:""}.`;$("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});$("statTrackers").textContent=activeTrackers().length;$("statTasks").textContent=state.tasks.filter(isDone).length;$("statStreak").textContent=Number(state.streak)||0;const a=Number(state.hydrationMl)||0,goal=Number(state.hydrationGoal)||3000,pct=Math.min(100,Math.round(a/goal*100));$("hydrationAmount").textContent=a;$("hydrationGoal").textContent=goal;$("hydrationPercent").textContent=pct+"%";$("hydrationBar").style.width=pct+"%";$("hydrationQuick").textContent=`${a} / ${goal} ml`;const pending=state.tasks.filter(t=>!isDone(t)).slice(0,5);$("homeTaskList").innerHTML=pending.map(t=>`<div class="task-row"><button class="check-button" data-action="toggle-task" data-id="${esc(t.id)}"></button><span>${esc(t.text||t.title||"Task")}</span><small class="card-meta">${esc(t.trackerId?"Tracker":"Personal")}</small></div>`).join("")||`<div class="empty-state">No pending tasks right now. Open My Trackers to plan your next step.</div>`;}
  function renderJournal(){
    const box=$("journalList");if(!box)return;
    box.innerHTML=(state.journals||[]).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,30).map(j=>`<article class="record-card"><div class="inline-controls"><b>${esc(j.mood||"Journal")}</b><small>${esc(j.date||"")}</small></div><p style="font-size:12px;line-height:1.55;margin:9px 0 0;white-space:pre-wrap">${esc(j.text||"")}</p></article>`).join("")||`<div class="empty-state">Your private reflections will appear here.</div>`;
  }
  function renderStudy(){const rows=state.study.filter(x=>(x.date||x.day)===today()),mins=rows.reduce((n,x)=>n+(Number(x.minutes)||0),0);$("studyToday").textContent=mins+" min";$("studySessions").textContent=rows.length;$("studyList").innerHTML=state.study.slice(0,12).map(x=>`<div class="record-card"><b>${esc(x.subject||"Study")} · ${Number(x.minutes)||0} min</b><div class="card-meta">${esc(x.note||"Study session")} · ${esc(x.date||x.day||"")}</div></div>`).join("")||`<div class="empty-state">Your study sessions will appear here.</div>`;}
  function renderHistory(){ $("historyStudy").textContent=state.study.reduce((n,x)=>n+(Number(x.minutes)||0),0);$("historyTasks").textContent=state.tasks.filter(isDone).length;$("historyDays").textContent=state.activeDays.length;const items=[...state.study.slice(0,8).map(x=>({date:x.date||x.day,label:`Study · ${Number(x.minutes)||0} min`})),...state.tasks.filter(isDone).slice(0,8).map(x=>({date:x.created||today(),label:`Task completed · ${x.text||x.title||"Task"}`}))].sort((a,b)=>String(b.date).localeCompare(String(a.date)));$("historyList").innerHTML=items.map(x=>`<div class="record-card inline-controls"><span>${esc(x.label)}</span><small>${esc(x.date)}</small></div>`).join("")||`<div class="empty-state">Your activity history will appear here.</div>`;}
  function renderLocalProfile(){const p=state.profile||{};$("profileCard").innerHTML=`<div class="card-top"><div class="avatar">${p.customPfp?`<img src="${esc(p.customPfp)}" alt="">`:"N"}</div><div><h2>${esc(p.name||"Explorer")}</h2><div class="card-meta">${esc(p.handle?"@"+p.handle:"Guest profile")}</div></div></div><p>${esc(p.bio||"Small steps. Real progress.")}</p>${Array.isArray(p.exams)&&p.exams.length?`<p class="fine-print">Exams: ${esc(p.exams.join(", "))}</p>`:""}${p.showPoints&&Number(state.points)>0?`<p class="fine-print">Points: ${Number(state.points)} · shown from saved account data</p>`:""}<div class="profile-stat-row"><span>${state.trackers.length} trackers</span><span>${state.tasks.filter(isDone).length} tasks done</span><span>${Number(state.streak)||0} day streak</span></div><p class="fine-print">This device profile is private until you choose to create an account.</p>`;}
  function renderSettings(){document.body.classList.toggle("dark",!!state.settings.dark);$("themeSwitch").setAttribute("aria-pressed",String(!!state.settings.dark));document.documentElement.style.setProperty("--primary",state.settings.accent||"#7654cf");$("accentColor").value=state.settings.accent||"#7654cf";$("textScale").value=state.settings.scale||"normal";$("dailyGoal").value=state.settings.dailyGoal||120;$("hydrationGoalSetting").value=state.hydrationGoal||3000;$("defaultTrackMode").value=state.settings.defaultTrackMode||"standard";$("accountSummary").textContent=user?(user.email||"Signed in"):"Guest mode · Your data stays on this device.";$("signOut").hidden=!user;$("backupToggle").textContent=backupEnabled?"Cloud backup enabled · Review":"Enable cloud backup";$("backupToggle").classList.toggle("button-primary",backupEnabled);}
  function renderAll(){renderHome();renderTrackers();renderDiscipline();renderStudy();renderJournal();renderMeditationHistory();renderHistory();renderSettings();renderFlow();if(!user&&!profileTarget)renderLocalProfile();const edit=document.querySelector("#page-profile [data-action=edit-profile]");if(edit)edit.hidden=!!profileTarget&&(!user||profileTarget!==user.id);}

  // UI EVENTS
  function renderStars(){$("reviewStars").innerHTML=[1,2,3,4,5].map(n=>`<button type="button" data-rating="${n}" class="${n<=reviewRating?"active":""}" aria-label="${n} stars">★</button>`).join("");$("reviewLabel").textContent=({1:"Worst",2:"Bad",3:"Okay",4:"Good",5:"Excellent"})[reviewRating];}
  document.addEventListener("click",e=>{
    const page=e.target.closest("[data-page]");if(page){e.preventDefault();if(page.dataset.page==="profile")profileTarget=user?.id||null;navigate(page.dataset.page);if(page.dataset.socialTab)loadSocial(page.dataset.socialTab);return;}
    const social=e.target.closest("[data-social]");if(social){loadSocial(social.dataset.social);return;}
    const session=e.target.closest("[data-session]");if(session){chooseSession(session.dataset.session);return;}
    const mode=e.target.closest("[data-focus-mode]");if(mode){setFocusMode(mode.dataset.focusMode);return;}
    const flowCollectionBtn=e.target.closest("[data-flow-collection]");if(flowCollectionBtn){flowCollection=flowCollectionBtn.dataset.flowCollection;renderFlow();return;}
    const flowPlay=e.target.closest("[data-flow-play]");if(flowPlay){playFlowTrack(flowPlay.dataset.flowPlay);return;}
    const flowFav=e.target.closest("[data-flow-favorite]");if(flowFav){toggleFlowFavorite(flowFav.dataset.flowFavorite);return;}
    const flowAdd=e.target.closest("[data-flow-add]");if(flowAdd){addFlowTrackDialog(flowAdd.dataset.flowAdd);return;}
    const flowDelete=e.target.closest("[data-flow-delete-playlist]");if(flowDelete){removeFlowPlaylist(flowDelete.dataset.flowDeletePlaylist);return;}
    const rating=e.target.closest("[data-rating]");if(rating){reviewRating=Number(rating.dataset.rating);renderStars();return;}
    const water=e.target.closest("[data-water]");if(water){state.hydrationMl=Math.max(0,(Number(state.hydrationMl)||0)+Number(water.dataset.water));markDay();save();return;}
    const sound=e.target.closest("[data-sound]");if(sound){startAmbient(sound.dataset.sound);document.querySelectorAll("[data-sound]").forEach(b=>b.classList.toggle("active",b===sound));return;}
    const leaderboard=e.target.closest("[data-leaderboard-mode]");if(leaderboard){loadLeaderboard(leaderboard.dataset.leaderboardMode);return;}
    const a=e.target.closest("[data-action]");if(!a)return;const id=a.dataset.id;
    switch(a.dataset.action){case"new-tracker":newTrackerDialog();break;case"add-task":addTaskDialog(id);break;case"toggle-task":toggleTask(id);break;case"delete-task":deleteTask(id);break;case"delete-tracker":deleteTracker(id);break;case"log-tracker":logTracker(id,Number(a.dataset.value)||1);break;case"open-timer":timerDialog();break;case"open-music":openMusic();break;case"discipline-mark":markPlanTask(id,a.dataset.done==="true");break;case"edit-plan":editPlanDialog();break;case"hydration":$("hydrationCard").scrollIntoView({behavior:"smooth",block:"center"});break;case"dialog-close":closeDialog();break;case"timer-reset":resetFocus();break;case"view-profile":profileTarget=id;navigate("profile");break;case"edit-profile":editProfileDialog();break;case"delete-post":deletePost(id);break;case"edit-post":editPostDialog(id);break;case"toggle-like":toggleLike(id);break;case"follow-request":handleFollowRequest(id,a.dataset.decision);break;case"mark-notification":markNotification(id);break;case"owner-delete-review":deleteOwnerReview(id);break;case"follow-profile":followProfile(id);break;case"unfollow-profile":unfollowProfile(id);break;case"oauth-google":oauth("google");break;case"reset-password":resetPassword();break;case"signout":signOut();break;}
  });
  document.addEventListener("submit",e=>{const f=e.target;if(f.id==="trackerForm"){e.preventDefault();createTracker(f);}if(f.id==="taskForm"){e.preventDefault();addTask(f);}if(f.id==="disciplineForm"){e.preventDefault();createPlan(f);}if(f.id==="editPlanForm"){e.preventDefault();const d=new FormData(f),names=String(d.get("tasks")||"").split("\n").map(x=>x.trim()).filter(Boolean).slice(0,8);if(!names.length)return toast("Keep at least one daily step.");const p=plan(),old=p.tasks||[];p.tasks=names.map((name,i)=>({id:old[i]?.id||"habit-"+Date.now()+"-"+i,name}));const length=d.get("duration");p.durationMode=length==="ongoing"?"ongoing":"fixed";p.durationDays=length==="ongoing"?null:Number(length);save();closeDialog();}if(f.id==="customPresetForm")addCustomPreset(e);if(f.id==="journalForm"){e.preventDefault();const d=new FormData(f),text=String(d.get("text")||"").trim();if(!text)return toast("Write a thought before saving.");state.journals.unshift({id:"journal-"+Date.now(),date:today(),mood:String(d.get("mood")||"Calm"),text});save();f.reset();toast("Private journal entry saved on this device.");}if(f.id==="studyForm"){e.preventDefault();const d=new FormData(f),mins=Math.max(1,Math.min(1440,Number(d.get("minutes"))||0)),taskId=String(d.get("disciplineTask")||"");state.study.unshift({id:"study-"+Date.now(),minutes:mins,subject:String(d.get("subject")||"Personal study").trim(),note:String(d.get("note")||"").trim(),date:today(),disciplineTaskId:taskId||null,sessionName:"Manual study log",source:"Manual"});if(taskId&&state.disciplinePlan){state.disciplinePlan.logs=state.disciplinePlan.logs||{};state.disciplinePlan.logs[today()]=state.disciplinePlan.logs[today()]||{};state.disciplinePlan.logs[today()][taskId]=true;}markDay();save();f.reset();toast("Study session saved.");}if(f.id==="reviewForm"){e.preventDefault();submitReview(f);}if(f.id==="profileForm"){e.preventDefault();saveProfile(f);}if(f.id==="authForm"){e.preventDefault();authSubmit(f,e.submitter);}if(f.id==="flowPlaylistForm"){e.preventDefault();const name=String(new FormData(f).get("name")||"").trim();if(!name)return;const p=flowPrefs();if(p.playlists.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast("A playlist with that name already exists.");p.playlists.push({id:"pl-"+Date.now().toString(36),name,trackIds:[]});flowCollection="playlist:"+p.playlists[p.playlists.length-1].id;save({localOnly:true});closeDialog();toast("Playlist created.");}if(f.id==="flowAddTrackForm"){e.preventDefault();const d=new FormData(f),p=flowPrefs(),pl=p.playlists.find(x=>x.id===String(d.get("playlistId"))),trackId=String(d.get("trackId"));if(pl){pl.trackIds=Array.isArray(pl.trackIds)?pl.trackIds:[];if(!pl.trackIds.includes(trackId))pl.trackIds.push(trackId);save({localOnly:true});closeDialog();toast("Track added to playlist.");}}if(f.id==="postEditForm"){e.preventDefault();savePostEdit(f);}});
  $("menuToggle").onclick=()=>{document.body.classList.add("menu-open");$("menuToggle").setAttribute("aria-expanded","true");};$("menuClose").onclick=closeMenu;$("menuBackdrop").onclick=closeMenu;$("dialogClose").onclick=closeDialog;$("accountButton").onclick=()=>{if(user){profileTarget=user.id;navigate("profile");}else openAuthDialog();};$("authOpen").onclick=openAuthDialog;$("backupToggle").onclick=enableBackup;$("signOut").onclick=signOut;
  $("exportData").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="nexora-backup-"+today()+".json";a.click();URL.revokeObjectURL(url);};
  $("themeSwitch").onclick=()=>{state.settings.dark=!state.settings.dark;save({localOnly:true});};$("accentColor").onchange=e=>{state.settings.accent=e.target.value;save({localOnly:true});};$("textScale").onchange=e=>{state.settings.scale=e.target.value;document.documentElement.dataset.scale=e.target.value;save({localOnly:true});};$("savePreferences").onclick=()=>{state.settings.dailyGoal=Math.max(1,Math.min(1440,Number($("dailyGoal").value)||120));state.hydrationGoal=Math.max(250,Math.min(10000,Number($("hydrationGoalSetting").value)||3000));state.settings.defaultTrackMode=$("defaultTrackMode").value;save();toast("Preferences saved.");};
  $("meditationLength").onchange=e=>$("meditationCustomWrap").hidden=e.target.value!=="custom";$("meditationStart").onclick=startMeditation;$("meditationPause").onclick=pauseMeditation;$("meditationStop").onclick=stopMeditation;$("voicePlay").onclick=speak;$("voiceStop").onclick=stopVoice;$("ambientStop").onclick=stopAmbient;$("meditationLanguage").onchange=e=>$("meditationPrompt").textContent=meditationText[e.target.value];$("publishPost").onclick=publishPost;$("peopleSearch").oninput=e=>{const q=e.target.value.trim().toLowerCase();document.querySelectorAll("[data-person]").forEach(n=>n.hidden=!n.dataset.person.includes(q));};

  $("flowCreatePlaylist").onclick=createFlowPlaylist;
  $("flowSearch").addEventListener("input",e=>{flowSearch=e.target.value;renderFlow();const search=$("flowSearch");search.focus();search.setSelectionRange(search.value.length,search.value.length);});
  $("flowPlayPause").onclick=toggleFlowPlay;$("flowPrevious").onclick=()=>nextFlowTrack(-1);$("flowNext").onclick=()=>nextFlowTrack(1);
  $("flowShuffle").onclick=()=>{music.shuffle=!music.shuffle;flowPrefs().shuffle=music.shuffle;save({localOnly:true});renderFlow();};
  $("flowRepeat").onclick=()=>{music.repeat=music.repeat==="off"?"all":music.repeat==="all"?"one":"off";flowPrefs().repeat=music.repeat;save({localOnly:true});renderFlow();};
  $("flowNowFavorite").onclick=()=>{const current=flowCurrent();if(current)toggleFlowFavorite(current.id);};
  $("flowSeek").addEventListener("input",()=>{music.seeking=true;const audio=ensureFlowAudio();if(audio&&Number.isFinite(audio.duration))$("flowCurrentTime").textContent=formatAudioTime(audio.duration*(Number($("flowSeek").value)/1000));});
  $("flowSeek").addEventListener("change",()=>{const audio=ensureFlowAudio();if(audio&&Number.isFinite(audio.duration))audio.currentTime=audio.duration*(Number($("flowSeek").value)/1000);music.seeking=false;updateFlowProgress();});
  $("flowVolume").addEventListener("input",e=>{music.volume=Number(e.target.value)/100;flowPrefs().volume=music.volume;if(music.audio)music.audio.volume=music.volume;$("flowVolumeValue").textContent=e.target.value+"%";});
  $("flowVolume").addEventListener("change",()=>save({localOnly:true}));

  if(db){db.auth.getSession().then(({data})=>{if(data?.session?.user)handleSignedIn(data.session.user);});db.auth.onAuthStateChange((event,session)=>{if(session?.user&&authHandled!==session.user.id)setTimeout(()=>handleSignedIn(session.user),0);if(event==="SIGNED_OUT"){user=null;backupEnabled=false;authHandled="";isOwnerVerified=false;ownerCheckPromise=null;updateOwnerEntry();renderSettings();}});}

  // FINAL BOOT.
  function boot(){document.documentElement.dataset.scale=state.settings.scale||"normal";renderStars();renderAll();setTimeout(()=>$ ("splash")?.classList.add("done"),650);setTimeout(()=>$ ("splash")?.remove(),1200);if("serviceWorker" in navigator&&location.protocol==="https:")window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).catch(e=>console.warn("NEXORA service worker",e)),{once:true});if(rawBefore&&localStorage.getItem(SNAPSHOT))$("cloudStatus").textContent="Existing device data preserved. A safety snapshot is stored on this device.";}
  boot();
  window.NEXORA_REBUILD=Object.freeze({version:"2.1.0",getStatus:()=>({localStorageKey:KEY,deviceSnapshot:!!localStorage.getItem(SNAPSHOT),signedIn:!!user,cloudBackupEnabled:backupEnabled})});
})();
