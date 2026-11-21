/* NEXORA consolidated UI release - 2026-11-21
 * Load AFTER the existing inline NEXORA application script.
 * This file does not contain server secrets and never grants owner access on its own.
 */
(function () {
  'use strict';

  const OWNER_ID = '2951452f-f9bd-4047-a5a1-517c0d095496';
  const RELEASE_ID = '2026-11-21-product-refresh-v1';
  const RELEASE_SEEN = 'nexora_release_seen_' + RELEASE_ID;
  const RELEASE_NEVER = 'nexora_updates_never_show';
  const $ = (id) => document.getElementById(id);
  const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const signedIn = () => typeof currentNexoraUser !== 'undefined' && !!currentNexoraUser;
  const client = () => typeof supabaseClient !== 'undefined' ? supabaseClient : null;
  const toast = (msg) => { if (typeof showToast === 'function') showToast(msg); else alert(msg); };
  const needLogin = () => { if (signedIn()) return true; if (typeof openAuthModal === 'function') openAuthModal(); else toast('Please sign in first / पहले लॉगिन करें।'); return false; };
  const dateLabel = (value) => { try { return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_) { return ''; } };
  const initials = (value) => (String(value || 'N').trim().split(/\s+/).slice(0, 2).map(x => x[0] || '').join('').toUpperCase() || 'N');
  const avatarHTML = (url, name) => {
    const src = (() => { try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } })();
    return src ? `<img class="nx-avatar-img" src="${safe(src)}" alt="${safe(name || 'Profile')}" loading="lazy">` : `<span class="nx-avatar-initials">${safe(initials(name))}</span>`;
  };
  const setPageTitle = (id, title, subtitle) => {
    const page = $(id); if (!page) return;
    const h = page.querySelector('.page-head h1'); if (h) h.textContent = title;
    const p = page.querySelector('.page-head .sub'); if (p && subtitle) p.textContent = subtitle;
  };

  let selectedProfileId = null;
  let profileCache = new Map();
  let isOwnerVerified = false;
  let ownerCheckPromise = null;
  let currentReviewCategory = 'overall';
  let currentLeaderboardMode = 'daily';
  let trackerTaskTarget = null;
  let editingPostId = null;
  let meditationInterval = null;
  let meditationRemaining = 0;
  let meditationStartMinutes = 0;
  let meditationFinished = false;
  let homeChampionLoadedFor = '';

  function addStyles() {
    const themeMeta = document.querySelector('meta[name="theme-color"]'); if (themeMeta) themeMeta.setAttribute('content','#6953c8');
    if ($('nxReleaseStyles')) return;
    const style = document.createElement('style');
    style.id = 'nxReleaseStyles';
    style.textContent = `
      :root{--nx-accent:#6953c8;--nx-accent-2:#8b79df;--nx-teal:#41aa91;--nx-card-shadow:0 14px 34px rgba(48,35,89,.09)}
      body{background:radial-gradient(ellipse at 8% 0%,rgba(139,121,223,.12),transparent 38%),radial-gradient(ellipse at 100% 22%,rgba(65,170,145,.08),transparent 32%),var(--bg)}
      .topbar{display:grid!important;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:10px}
      .topbar>.brand{justify-self:center;min-width:0}
      .topbar .brand-title{letter-spacing:.15em;font-size:16px}
      .topbar .brandmark{border-radius:14px;box-shadow:0 7px 20px rgba(105,83,200,.26);animation:none}
      .topbar .top-actions{justify-self:end;display:flex;align-items:center;gap:6px}
      .topbar .icon-btn{width:38px;height:38px;border-radius:13px}
      .nx-menu-left{grid-column:1;grid-row:1}
      .nx-profile-right{width:40px;height:40px;min-width:40px;max-width:40px;flex:0 0 40px!important;padding:0!important;border:2px solid var(--surface)!important;border-radius:50%!important;background:linear-gradient(135deg,#a78bfa,#5b9bd5)!important;box-shadow:0 0 0 1px var(--line),0 5px 14px rgba(62,49,113,.16)!important;overflow:hidden}
      .nx-profile-right .avatar-ring{width:100%;height:100%;padding:2px;background:transparent}
      .nx-profile-right .avatar-core{font-size:15px}
      .nx-profile-right .profile-pill-text{display:none!important}
      .nx-menu-left{background:var(--surface)!important;border:1px solid var(--line)!important;color:var(--ink)!important;width:40px;height:40px;border-radius:13px;box-shadow:var(--nx-card-shadow)}
      .app{padding-bottom:calc(112px + env(safe-area-inset-bottom))}
      .card,.hero,.smart-ticker{box-shadow:var(--nx-card-shadow)}
      .hero{border-radius:28px;background:linear-gradient(135deg,#6953c8 0%,#8775db 52%,#4c9eaa 120%);}
      .page-head h1{font-size:clamp(25px,6vw,32px);letter-spacing:-.045em}
      .nx-home-dashboard{position:relative;overflow:hidden;margin:0 0 14px;border-radius:28px;padding:20px;background:linear-gradient(135deg,#282345,#6253aa 62%,#398e91);color:#fff;box-shadow:0 18px 42px rgba(54,43,105,.22)}
      .nx-home-dashboard:after{content:'';position:absolute;width:190px;height:190px;right:-75px;top:-95px;border:1px solid #ffffff35;border-radius:50%;box-shadow:0 0 0 22px #ffffff0b,0 0 0 44px #ffffff08}
      .nx-home-dashboard>*{position:relative;z-index:1}
      .nx-home-dashboard h2{font-size:23px;color:#fff;margin:6px 0}
      .nx-home-dashboard p{font-size:12px;line-height:1.5;color:#ffffffd9;margin:0}
      .nx-home-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:16px}
      .nx-home-metric{background:#ffffff18;border:1px solid #ffffff2c;border-radius:16px;padding:10px 9px;min-width:0}
      .nx-home-metric b{display:block;font-size:19px;color:white}
      .nx-home-metric span{font-size:10px;color:#ffffffd6}
      .nx-home-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0 16px}
      .nx-home-dragging{outline:2px dashed var(--primary)!important;outline-offset:3px;opacity:.82;transform:scale(.99);user-select:none}
      .nx-longpress-control{font-size:9px!important;padding:5px 7px!important;border-radius:9px!important;white-space:nowrap!important;touch-action:manipulation}
      .nx-action-card{display:flex;flex-direction:column;gap:5px;align-items:flex-start;text-align:left;padding:13px 11px;min-height:90px;border-radius:18px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--nx-card-shadow);color:var(--ink);font-size:12px;font-weight:800}
      .nx-action-card .nx-action-icon{font-size:22px}
      .nx-action-card small{font-size:10px;color:var(--muted);font-weight:600;line-height:1.3}
      .nx-coming-card{position:relative;border:1px dashed color-mix(in srgb,var(--primary) 42%,var(--line));background:linear-gradient(145deg,var(--surface),var(--primary-soft));border-radius:19px;padding:14px;color:var(--ink)}
      .nx-coming-tag{display:inline-flex;border-radius:99px;padding:4px 9px;background:var(--primary-soft);color:var(--primary);font-size:10px;font-weight:900;letter-spacing:.05em}
      .nx-coming-card p{font-size:12px;line-height:1.5;color:var(--muted);margin:5px 0 0}
      .nx-bottom-nav{position:fixed;z-index:9990;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,860px);padding:7px 8px calc(7px + env(safe-area-inset-bottom));display:flex;gap:3px;justify-content:space-between;background:color-mix(in srgb,var(--surface) 93%,transparent);border:1px solid var(--line);border-bottom:0;border-radius:20px 20px 0 0;box-shadow:0 -8px 28px rgba(32,25,58,.12);backdrop-filter:blur(18px);overflow-x:auto;scrollbar-width:none}
      .nx-bottom-nav::-webkit-scrollbar{display:none}
      .nx-nav-item{flex:1 0 48px;max-width:92px;min-width:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:52px;border-radius:14px;background:transparent;color:var(--muted);font-size:9px;font-weight:800;white-space:nowrap;padding:5px 3px}
      .nx-nav-item b{font-size:18px;line-height:1}
      .nx-nav-item.active{background:var(--primary-soft);color:var(--primary)}
      .nx-nav-item.nx-upcoming{opacity:.65}
      .nx-page-wrap{display:grid;gap:12px}
      .nx-social-card{border:1px solid var(--line);background:var(--surface);border-radius:20px;padding:14px;box-shadow:var(--nx-card-shadow)}
      .nx-social-top{display:flex;align-items:center;gap:10px}
      .nx-avatar{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:50%;overflow:hidden;background:var(--primary-soft);color:var(--primary);font-weight:900}
      .nx-avatar-img{width:100%;height:100%;object-fit:cover}
      .nx-avatar-initials{font-size:14px}
      .nx-social-meta{min-width:0;flex:1}
      .nx-social-meta b{display:block;font-size:13px;color:var(--ink)}
      .nx-social-meta small{display:block;color:var(--muted);font-size:10px;margin-top:3px}
      .nx-owner-badge{display:inline-flex;align-items:center;gap:4px;margin-left:5px;padding:3px 7px;border-radius:99px;background:#f3dba1;color:#69470a;font-size:9px;font-weight:950;letter-spacing:.04em}
      .nx-post-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.6;margin:12px 0;color:var(--ink)}
      .nx-social-actions{display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding-top:10px}
      .nx-social-btn{border:1px solid var(--line);border-radius:12px;padding:8px 11px;background:var(--surface-2);color:var(--ink);font-size:11px;font-weight:800}
      .nx-social-btn.active{background:var(--primary-soft);color:var(--primary);border-color:var(--primary)}
      .nx-form-card{border:1px solid var(--line);border-radius:20px;padding:14px;background:var(--surface);box-shadow:var(--nx-card-shadow)}
      .nx-form-card textarea,.nx-form-card input,.nx-form-card select{width:100%;border:1px solid var(--line);border-radius:13px;padding:12px;background:var(--surface-2);color:var(--ink)}
      .nx-profile-cover{border-radius:24px;padding:18px;background:linear-gradient(135deg,#4b3c87,#8274d4 60%,#4aa18e);color:white;box-shadow:var(--nx-card-shadow)}
      .nx-profile-cover h2,.nx-profile-cover p{color:white}
      .nx-profile-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}
      .nx-profile-stat{border-radius:14px;background:#ffffff1c;border:1px solid #ffffff2d;padding:9px;text-align:center}
      .nx-profile-stat b{display:block;font-size:18px;color:#fff}
      .nx-profile-stat small{font-size:10px;color:#ffffffd5}
      .nx-owner-panel{border-radius:22px;padding:16px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--nx-card-shadow)}
      .nx-owner-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .nx-owner-metric{border-radius:15px;padding:12px;background:var(--surface-2)}
      .nx-owner-metric b{display:block;font-size:22px}
      .nx-owner-metric span{font-size:10px;color:var(--muted)}
      .nx-star{font-size:19px;color:#d99b25;letter-spacing:2px}
      .nx-inline-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
      .nx-phase{border:1px solid var(--line);background:var(--surface);border-radius:17px;padding:12px}
      .nx-phase.active{border-color:var(--primary);box-shadow:0 0 0 2px var(--primary-soft)}
      .nx-release-overlay{position:fixed;inset:0;z-index:1000002;display:grid;place-items:center;padding:18px;background:rgba(14,10,29,.78);backdrop-filter:blur(10px)}
      .nx-release-dialog{width:min(100%,470px);max-height:90vh;overflow:auto;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:26px;padding:21px;box-shadow:0 28px 100px rgba(0,0,0,.36)}
      .nx-release-logo{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;background:linear-gradient(135deg,#715bd0,#4c9eaa);color:#fff;font-size:22px;font-weight:950}
      .nx-release-dialog h2{margin:13px 0 7px;font-size:22px}
      .nx-release-dialog p{font-size:13px;line-height:1.55;color:var(--muted)}
      .nx-release-check{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--muted);margin:14px 0}
      .nx-release-check input{margin-top:2px}
      .nx-release-actions{display:grid;gap:8px}
      .nx-muted{font-size:11px;color:var(--muted)}
      body.dark .nx-coming-card{background:linear-gradient(145deg,var(--surface),var(--primary-soft))}
      @media(max-width:390px){.nx-home-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.nx-nav-item{min-width:45px}.nx-bottom-nav{gap:1px;padding-left:4px;padding-right:4px}.topbar .icon-btn{width:35px;height:35px}}
    `;
    document.head.appendChild(style);
  }

  function addPage(id, title, subtitle, body) {
    if ($(id + 'Page')) return;
    const main = document.querySelector('main') || document.querySelector('.app');
    if (!main) return;
    const section = document.createElement('section');
    section.className = 'page'; section.id = id + 'Page';
    section.innerHTML = `<div class="page-head"><div class="eyebrow">NEXORA SPACE</div><h1>${title}</h1><p class="sub">${subtitle}</p></div>${body}`;
    main.appendChild(section);
  }

  function addPages() {
    addPage('trackers', 'My Trackers 🎯', 'Start with one tracker. Name it, add tasks, and choose a finish date or keep it ongoing.', '<div id="nxTrackerIntro" class="nx-social-card"><div class="nx-inline-row"><b>One place for everything you want to track</b><button class="primary-btn" onclick="openModal(\'trackerModal\')">+ Create tracker</button></div><p class="sub" style="margin:8px 0 0">Study · Workout · Pin uploads · Reading · Any personal goal. Sprint and Freestyle are options inside each tracker.</p></div><div class="nx-owner-metrics" id="nxTrackerSummary"></div><div id="nxTrackerLegacyHost"></div>');
    addPage('profile', 'My Profile 👤', 'Your public identity and profile controls in one place.', '<div id="nxProfileContent" class="nx-page-wrap"><div class="nx-social-card">Loading profile…</div></div>');
    addPage('community', 'Community 🌍', 'Discover members, follow public profiles and manage requests.', '<div class="nx-page-wrap"><div class="nx-form-card"><input id="nxPeopleSearch" type="search" placeholder="Search by name or username / नाम या username खोजें" oninput="nxFilterPeople()"><div class="nx-muted" style="margin-top:7px">Public profile details are visible to everyone. Private posts and lists follow the owner’s approval settings.</div></div><div id="nxCommunityTabs" class="tabs"><button class="tab active" onclick="nxCommunityTab(\'people\',this)">People</button><button class="tab" onclick="nxCommunityTab(\'requests\',this)">Requests</button><button class="tab" onclick="nxCommunityTab(\'notifications\',this)">Notifications</button></div><div id="nxCommunityContent" class="nx-page-wrap"></div></div>');
    addPage('posts', 'Posts & Updates ✍️', 'Create and manage your posts. Visibility follows profile privacy.', '<div class="nx-page-wrap"><div id="nxPostComposer" class="nx-form-card"><b>Create a post</b><p class="nx-muted">Share a learning win, progress update or thought. Maximum 5,000 characters.</p><textarea id="nxNewPost" maxlength="5000" rows="4" placeholder="What would you like to share?"></textarea><div class="nx-inline-row" style="margin-top:9px"><span class="nx-muted">Only signed-in users can post.</span><button class="primary-btn" onclick="nxCreatePost()">Publish post</button></div></div><div class="nx-inline-row"><b>Community feed</b><button class="small-btn" onclick="nxLoadPosts()">Refresh</button></div><div id="nxPostsFeed" class="nx-page-wrap"></div></div>');
    addPage('reviews', 'App Reviews ⭐', 'Honest public feedback helps NEXORA improve. Hindi / English both welcome.', '<div class="nx-page-wrap"><div class="nx-form-card"><b>Share your experience</b><p class="nx-muted">Choose a category, rate it and submit. You can edit your own review later.</p><label class="field"><span>Category</span><select id="nxReviewCategory" onchange="nxReviewCategoryChanged(this.value)"><option value="overall">Overall experience</option><option value="interface">Interface & design</option><option value="usefulness">Usefulness</option><option value="performance">Performance</option></select></label><div class="field"><span>Rating</span><select id="nxReviewRating"><option value="5">5 · Excellent</option><option value="4">4 · Good</option><option value="3">3 · Okay</option><option value="2">2 · Needs work</option><option value="1">1 · Poor</option></select></div><div class="field"><span>Your review</span><textarea id="nxReviewText" maxlength="2000" rows="4" placeholder="Tell us what works and what should improve…"></textarea></div><button class="primary-btn" onclick="nxSubmitReview()">Submit / Update review</button><p class="nx-muted" style="margin:8px 0 0">Reviews are public, including when a profile is private. Do not include personal contact details.</p></div><div class="nx-inline-row"><b>Community reviews</b><button class="small-btn" onclick="nxLoadReviews()">Refresh</button></div><div id="nxReviewsFeed" class="nx-page-wrap"></div></div>');
    addPage('learning', 'Study & Quizzes 📚', 'Your exam-preparation home. Verified question banks are being connected.', '<div class="nx-page-wrap"><div class="nx-coming-card"><span class="nx-coming-tag">COMING SOON · जल्द आ रहा है</span><h3 style="margin:9px 0 0">Exam-wise PYQ quizzes</h3><p>Previous-year questions by exam, subject and chapter. हर सवाल का जवाब server verify करेगा.</p></div><div class="nx-coming-card"><span class="nx-coming-tag">COMING SOON · जल्द आ रहा है</span><h3 style="margin:9px 0 0">Daily Current Affairs & GK</h3><p>Daily exam-focused briefs, grammar, maths concepts and refreshed practice sets.</p></div><div class="nx-coming-card"><span class="nx-coming-tag">COMING SOON · जल्द आ रहा है</span><h3 style="margin:9px 0 0">NOVA AI Study Mentor</h3><p>Secure AI learning help. अभी demo जवाबों को real AI service बताकर नहीं दिखाया जाएगा.</p></div><div class="nx-social-card"><div class="nx-inline-row"><div><b>Leaderboard 🏆</b><p class="nx-muted" style="margin:4px 0 0">Verified points · Daily / Weekly / All-time</p></div><button class="primary-btn" onclick="navigate(&quot;leaderboard&quot;)">Open leaderboard</button></div></div></div>');
    addPage('meditation', 'Meditation 🧘', 'A guided pause in Hindi. Choose 5 minutes, 10 minutes or your own session length.', '<div class="nx-page-wrap"><div class="nx-profile-cover"><div class="eyebrow" style="color:#ffffffba">PAUSE · BREATHE · RESET</div><h2 style="margin:7px 0">अपने लिए कुछ शांत पल</h2><p>आराम से बैठें। सांस को बदलने की कोशिश न करें—बस उसे महसूस करें। कोई जल्दबाज़ी नहीं।</p></div><div class="nx-social-card"><b>🔥 Current meditation streak: <span id="nxMeditationStreak">0 days</span></b></div><div class="nx-form-card"><div class="field"><label>Session length</label><select id="nxMeditationLength"><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="custom">Custom</option></select></div><div class="field" id="nxMeditationCustomWrap" style="display:none"><label>Custom minutes (1–60)</label><input id="nxMeditationCustom" type="number" min="1" max="60" value="7"></div><div class="nx-social-card" style="text-align:center"><div class="eyebrow">YOUR SESSION</div><div id="nxMeditationTimer" style="font-size:44px;font-weight:900;letter-spacing:-.05em;margin:8px 0">05:00</div><p id="nxMeditationPrompt" class="sub">शुरू करने के लिए तैयार हों। अपने कंधों को ढीला छोड़ें।</p><div class="nx-inline-row" style="justify-content:center"><button id="nxMeditationStartBtn" class="primary-btn" onclick="nxStartMeditation()">Start meditation</button><button id="nxMeditationPauseBtn" class="secondary-btn" style="display:none" onclick="nxPauseMeditation()">Pause</button><button id="nxMeditationStopBtn" class="small-btn" style="display:none" onclick="nxStopMeditation()">End</button></div></div><div id="nxMeditationRating" style="display:none;margin-top:12px"><b>How calm do you feel now?</b><p class="nx-muted">अभी आप कितना शांत महसूस कर रहे हैं?</p><select id="nxMeditationMood"><option value="5">5 · Very calm</option><option value="4">4 · Calm</option><option value="3">3 · A little calmer</option><option value="2">2 · Still restless</option><option value="1">1 · No change</option></select><button class="primary-btn" style="width:100%;margin-top:10px" onclick="nxSaveMeditation()">Save session</button></div></div><div class="nx-social-card"><b>Guided Hindi practice</b><ol style="padding-left:20px;font-size:13px;line-height:1.8"><li>आंखें हल्के से बंद करें या नज़र नीचे रखें।</li><li>धीरे से सांस अंदर लें और बिना ज़ोर लगाए बाहर छोड़ें।</li><li>कंधों, चेहरे और हाथों को ढीला छोड़ें।</li><li>ध्यान भटके तो खुद को दोष न दें; बस सांस पर लौट आएं।</li><li>अंत में अपने आसपास की आवाज़ों को महसूस करें और धीरे से आंखें खोलें।</li></ol><button class="secondary-btn" onclick="navigate(&quot;mind&quot;)">Open ambient sounds & breathing</button></div><div class="nx-social-card"><b>Your meditation history</b><div id="nxMeditationHistory" class="nx-page-wrap"></div></div></div>');
    addPage('leaderboard', 'Leaderboard 🏆', 'Learning performance will count only after answers are verified by the server.', '<div class="nx-page-wrap"><div id="nxChampionBox"></div><div class="tabs"><button class="tab active" onclick="nxLoadLeaderboard(\'daily\',this)">Daily</button><button class="tab" onclick="nxLoadLeaderboard(\'weekly\',this)">Weekly</button><button class="tab" onclick="nxLoadLeaderboard(\'all_time\',this)">All time</button></div><div id="nxLeaderboardList" class="nx-page-wrap"><div class="nx-social-card">Loading leaderboard…</div></div></div>');
    addPage('owner', 'Owner Console ✦', 'Restricted management area. Access is verified by the Supabase owner authorization function.', '<div id="nxOwnerContent" class="nx-page-wrap"><div class="nx-owner-panel">Verifying owner access…</div></div>');
  }

  function moveHeaderControls() {
    const bar = document.querySelector('.topbar');
    const brand = bar?.querySelector('.brand');
    const actions = bar?.querySelector('.top-actions');
    const profile = $('headerProfileBtn');
    if (!bar || !brand || !actions) return;
    if (!brand.querySelector('.brandmark')) { const mark = document.createElement('span'); mark.className = 'brandmark'; mark.textContent = '✦'; brand.insertBefore(mark, brand.firstChild); }
    let menu = actions.querySelector('[aria-label="Open NEXORA Hub"]');
    if (menu) { menu.classList.add('nx-menu-left'); bar.insertBefore(menu, brand); }
    if (profile) {
      actions.appendChild(profile);
      profile.classList.remove('hide','profile-pill'); profile.classList.add('nx-profile-right');
      profile.setAttribute('aria-label','Open profile / प्रोफ़ाइल खोलें');
      profile.title = 'My Profile';
      profile.onclick = () => nxOpenMyProfile();
    }
  }

  function addHomeDashboard() {
    const page = $('homePage'); const head = page?.querySelector('.page-head');
    if (!page || !head || $('nxHomeDashboard')) return;
    head.insertAdjacentHTML('afterend', `
      <div class="nx-home-dashboard" id="nxHomeDashboard">
        <div style="font-size:10px;letter-spacing:.15em;font-weight:900;color:#ffffffb9">YOUR NEXORA SPACE</div>
        <h2 id="nxHomeGreeting">Small steps. Real progress.</h2>
        <p>One clear place to plan, track and grow. Start with your first tracker. Long-press Home cards to rearrange them.</p>
        <div class="nx-home-metrics"><div class="nx-home-metric"><b id="nxHomeDone">0</b><span>Tasks completed</span></div><div class="nx-home-metric"><b id="nxHomeStudy">0m</b><span>Study today</span></div><div class="nx-home-metric"><b id="nxHomeStreak">0</b><span>Day streak</span></div></div><button id="nxHydrationRestoreBtn" class="secondary-btn nx-longpress-control" style="display:none;margin-top:12px;background:#ffffff20;color:#fff;border-color:#ffffff55">Hold to show Hydration / हाइड्रेशन वापस लाएँ</button><div id="nxHomeChampion" style="display:none;margin-top:12px;padding:11px 12px;border:1px solid #ffffff45;border-radius:16px;background:#ffffff18"><b id="nxHomeChampionTitle">🥇 Discipline Champion</b><p id="nxHomeChampionText" style="margin:4px 0 0;font-size:12px;color:#ffffffdf"></p></div>
      </div>
      <div class="nx-home-actions">
        <button class="nx-action-card" onclick="navigate('trackers')"><span class="nx-action-icon">🎯</span>My Trackers<small>Create your first tracker</small></button>
        <button class="nx-action-card" onclick="navigate('study')"><span class="nx-action-icon">📚</span>Study Space<small>Log a learning session</small></button>
        <button class="nx-action-card" onclick="navigate('learning')"><span class="nx-action-icon">🧩</span>Quizzes<small>PYQ practice · Coming soon</small></button>
        <button class="nx-action-card" onclick="navigate('community')"><span class="nx-action-icon">🌍</span>Community<small>Discover people</small></button>
        <button class="nx-action-card" onclick="navigate('posts')"><span class="nx-action-icon">✍️</span>Posts<small>Share your progress</small></button>
        <button class="nx-action-card" onclick="navigate('reviews')"><span class="nx-action-icon">⭐</span>App Reviews<small>Help us improve</small></button><button class="nx-action-card" onclick="navigate('meditation')"><span class="nx-action-icon">🧘</span>Meditation<small>5, 10 or custom minutes</small></button>
      </div>
      <div class="nx-coming-card" style="margin-bottom:14px"><div class="nx-inline-row"><b>Learning tools are growing</b><span class="nx-coming-tag">UPCOMING</span></div><p>PYQs, live Current Affairs, GK, Grammar, Maths practice and verified quiz points will appear here as their secure services go live.</p></div>`);
  }

  function addFooter() {
    if ($('nxBottomNav')) return;
    const nav = document.createElement('nav'); nav.id = 'nxBottomNav'; nav.className = 'nx-bottom-nav'; nav.setAttribute('aria-label','NEXORA quick navigation');
    const items = [
      ['home','⌂','Home'],['trackers','🎯','Trackers'],['study','📚','Study'],['learning','🧩','Quizzes'],['meditation','🧘','Meditate'],['community','🌍','Community'],['posts','✍️','Posts'],['reviews','⭐','Reviews'],['more','☰','More']
    ];
    nav.innerHTML = items.map(([page,icon,label]) => `<button type="button" class="nx-nav-item" data-nx-page="${page}" onclick="nxBottomNavigate('${page}')"><b>${icon}</b><span>${label}</span></button>`).join('') + `<button type="button" id="nxOwnerNav" class="nx-nav-item" style="display:none" onclick="navigate('owner')"><b>✦</b><span>Owner</span></button>`;
    document.body.appendChild(nav);
  }

  window.nxBottomNavigate = function (page) {
    if (page === 'more') { if (typeof toggleHub === 'function') toggleHub(true); return; }
    if (page === 'study') { navigate('study'); return; }
    if (page === 'home') { navigate('home'); return; }
    navigate(page);
  };

  function syncBottomNavVisibility() {
    const nav = $('nxBottomNav'); if (!nav) return;
    const overlayOpen = !!document.querySelector('#modalBackdrop.show, #hubBackdrop.show, #nxReleaseOverlay, #nxSafetyOverlay');
    nav.style.display = overlayOpen ? 'none' : 'flex';
  }

  function updateFooterActive(page) {
    document.querySelectorAll('.nx-nav-item[data-nx-page]').forEach(button => {
      const p = button.dataset.nxPage;
      button.classList.toggle('active', p === page || (p === 'trackers' && page === 'analytics') || (p === 'study' && page === 'study'));
    });
  }

  async function checkOwnerAccess(force) {
    if (ownerCheckPromise && !force) return ownerCheckPromise;
    ownerCheckPromise = (async () => {
      isOwnerVerified = false;
      const user = signedIn() ? currentNexoraUser : null;
      if (!user || user.id !== OWNER_ID || !client()) { updateOwnerButton(); return false; }
      try {
        const { data, error } = await client().rpc('nexora_is_admin');
        isOwnerVerified = !error && data === true;
      } catch (_) { isOwnerVerified = false; }
      updateOwnerButton();
      return isOwnerVerified;
    })();
    return ownerCheckPromise;
  }

  function updateOwnerButton() {
    const button = $('nxOwnerNav');
    if (button) button.style.display = isOwnerVerified ? 'flex' : 'none';
    const hub = $('hub');
    if (hub && !$('nxOwnerHubLink')) {
      const link = document.createElement('button'); link.id = 'nxOwnerHubLink'; link.className = 'hub-link'; link.innerHTML = '<span>✦</span>Owner Console'; link.onclick = () => { toggleHub(false); navigate('owner'); };
      hub.appendChild(link);
    }
    if ($('nxOwnerHubLink')) $('nxOwnerHubLink').style.display = isOwnerVerified ? 'flex' : 'none';
  }

  function ownerBadge(id) { return id === OWNER_ID ? '<span class="nx-owner-badge">✦ OWNER</span>' : ''; }

  async function nxOpenMyProfile() {
    if (!signedIn()) { if (typeof openAuthModal === 'function') openAuthModal(); toast('Sign in to manage your profile. / प्रोफ़ाइल मैनेज करने के लिए लॉगिन करें।'); return; }
    selectedProfileId = currentNexoraUser.id; navigate('profile');
  }

  async function fetchProfile(id) {
    if (!client() || !id) return null;
    const { data, error } = await client().from('profiles').select('id,display_name,username,avatar_url,bio,is_private,created_at,updated_at').eq('id', id).maybeSingle();
    if (error) throw error;
    if (data) profileCache.set(id, data);
    return data;
  }

  window.nxOpenProfile = async function (id) {
    selectedProfileId = id;
    navigate('profile');
    await nxLoadProfile();
  };

  window.nxLoadProfile = async function () {
    const box = $('nxProfileContent'); if (!box) return;
    const id = selectedProfileId || (signedIn() ? currentNexoraUser.id : null);
    if (!id || !client()) { box.innerHTML = '<div class="nx-social-card">Sign in to manage your own profile. You can still browse public community profiles from Community.</div>'; return; }
    box.innerHTML = '<div class="nx-social-card">Loading profile…</div>';
    try {
      const profile = await fetchProfile(id);
      if (!profile) { box.innerHTML = '<div class="nx-social-card">Profile not found.</div>'; return; }
      const own = signedIn() && currentNexoraUser.id === id;
      const [{ count: followers }, { count: following }, { data: posts, error: postError }] = await Promise.all([
        client().from('nexora_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', id),
        client().from('nexora_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', id),
        client().from('nexora_posts').select('id,author_id,body,created_at').eq('author_id', id).order('created_at', { ascending: false }).limit(12)
      ]);
      if (postError) throw postError;
      let followButton = '';
      if (!own) {
        if (!signedIn()) followButton = '<button class="primary-btn" onclick="openAuthModal()">Sign in to follow</button>';
        else {
          const { data: relation } = await client().from('nexora_follows').select('following_id').eq('follower_id', currentNexoraUser.id).eq('following_id', id).maybeSingle();
          const { data: request } = await client().from('nexora_follow_requests').select('id,status').eq('requester_id', currentNexoraUser.id).eq('target_id', id).eq('status','pending').maybeSingle();
          followButton = relation ? `<button class="secondary-btn" onclick="nxUnfollow('${id}')">Following · Unfollow</button>` : request ? '<button class="secondary-btn" disabled>Request pending</button>' : `<button class="primary-btn" onclick="nxFollow('${id}')">${profile.is_private ? 'Request to follow' : 'Follow'}</button>`;
        }
      }
      const postHTML = (posts || []).map(p => `<div class="nx-social-card"><div class="nx-post-body">${safe(p.body)}</div><div class="nx-muted">${dateLabel(p.created_at)}</div></div>`).join('') || '<div class="nx-social-card nx-muted">No visible posts yet.</div>';
      box.innerHTML = `
        <div class="nx-profile-cover"><div class="nx-social-top"><div class="nx-avatar" style="width:62px;height:62px;background:#ffffff2c;color:white">${avatarHTML(profile.avatar_url, profile.display_name)}</div><div style="min-width:0;flex:1"><h2 style="margin:0 0 3px">${safe(profile.display_name || 'NEXORA member')}${ownerBadge(id)}</h2><p style="margin:0;font-size:12px;opacity:.85">@${safe(profile.username || 'username-not-set')}</p></div></div><p style="margin:12px 0 0;font-size:13px;line-height:1.5">${safe(profile.bio || 'Growing one step at a time.')}</p><div class="nx-profile-stats"><div class="nx-profile-stat"><b>${followers || 0}</b><small>Followers</small></div><div class="nx-profile-stat"><b>${following || 0}</b><small>Following</small></div><div class="nx-profile-stat"><b>${posts?.length || 0}</b><small>Recent posts</small></div></div></div>
        <div class="nx-inline-row">${own ? '<b>Your profile settings</b>' : `<b>${safe(profile.is_private ? 'Private profile' : 'Public profile')}</b>`}${followButton}</div>
        ${own ? `<div class="nx-form-card"><div class="field"><label>Display name</label><input id="nxProfileName" maxlength="60" value="${safe(profile.display_name || '')}"></div><div class="field"><label>Username (3–24 letters, numbers or underscore)</label><input id="nxProfileUsername" maxlength="24" value="${safe(profile.username || '')}" placeholder="your_username"></div><div class="field"><label>Bio</label><textarea id="nxProfileBio" maxlength="300" rows="3">${safe(profile.bio || '')}</textarea></div><div class="field"><label>Profile photo URL (HTTPS)</label><input id="nxProfileAvatar" type="url" value="${safe(profile.avatar_url || '')}" placeholder="https://..."></div><label class="nx-inline-row" style="justify-content:flex-start;gap:9px"><input id="nxProfilePrivate" type="checkbox" ${profile.is_private ? 'checked' : ''} style="width:auto"> <span><b>Private profile</b><small class="nx-muted" style="display:block">Your posts and follower lists need approved followers. Profile details and reviews remain public.</small></span></label><button class="primary-btn" style="width:100%;margin-top:13px" onclick="nxSaveProfile()">Save profile</button></div>` : ''}
        <div class="nx-inline-row"><b>Visible posts</b><button class="small-btn" onclick="navigate('posts')">Open posts manager</button></div>${postHTML}`;
    } catch (error) { box.innerHTML = `<div class="nx-social-card">Could not load profile: ${safe(error.message || error)}</div>`; }
  };

  window.nxSaveProfile = async function () {
    if (!needLogin()) return;
    const display_name = $('nxProfileName')?.value.trim() || '';
    const bio = $('nxProfileBio')?.value.trim() || '';
    const avatarRaw = $('nxProfileAvatar')?.value.trim() || '';
    const is_private = !!$('nxProfilePrivate')?.checked;
    if (!display_name) { toast('Enter a display name.'); return; }
    let avatar_url = null;
    if (avatarRaw) { try { const u = new URL(avatarRaw); if (u.protocol !== 'https:') throw new Error(); avatar_url = u.href; } catch (_) { toast('Profile photo URL must be a valid HTTPS link.'); return; } }
    const payload = { display_name, bio, is_private, avatar_url };
    const { error } = await client().from('profiles').update(payload).eq('id', currentNexoraUser.id);
    if (error) { toast('Profile save failed: ' + error.message); return; }
    const username = $('nxProfileUsername')?.value.trim().replace(/^@/, '').toLowerCase() || '';
    if (username) {
      let result = await client().rpc('nexora_set_username', { p_username: username });
      if (result.error) result = await client().rpc('nexora_set_username', { username });
      if (result.error) result = await client().rpc('nexora_set_username', { new_username: username });
      if (result.error) { toast('Profile saved, but username could not be changed: ' + result.error.message); await nxLoadProfile(); return; }
    }
    toast('Profile updated. / प्रोफ़ाइल अपडेट हो गई।');
    await nxLoadProfile();
  };

  async function tryRpc(name, candidates) {
    let lastError = null;
    for (const args of candidates) {
      const result = await client().rpc(name, args);
      if (!result.error) return result;
      lastError = result.error;
      const msg = String(result.error.message || '').toLowerCase();
      if (!(msg.includes('function') && (msg.includes('not found') || msg.includes('schema cache') || msg.includes('argument')))) break;
    }
    return { data: null, error: lastError || new Error('RPC unavailable') };
  }

  window.nxFollow = async function (id) {
    if (!needLogin()) return;
    const args = [{ target_user_id: id }, { p_target_user_id: id }, { p_target_id: id }, { target_id: id }, { p_user_id: id }, { user_id: id }];
    const { data, error } = await tryRpc('nexora_follow_user', args);
    if (error) { toast('Follow could not be completed: ' + error.message); return; }
    toast('Follow updated. Private profiles may require approval.'); await nxLoadProfile(); await nxLoadCommunity('people');
  };

  window.nxUnfollow = async function (id) {
    if (!needLogin()) return;
    const args = [{ target_user_id: id }, { p_target_user_id: id }, { p_target_id: id }, { target_id: id }, { p_user_id: id }, { user_id: id }];
    const { error } = await tryRpc('nexora_unfollow_user', args);
    if (error) { toast('Unfollow could not be completed: ' + error.message); return; }
    toast('Unfollowed.'); await nxLoadProfile(); await nxLoadCommunity('people');
  };

  window.nxFilterPeople = function () {
    const query = ($('nxPeopleSearch')?.value || '').trim().toLowerCase();
    document.querySelectorAll('[data-nx-person]').forEach(card => { card.style.display = card.dataset.nxPerson.includes(query) ? '' : 'none'; });
  };

  window.nxCommunityTab = function (tab, button) {
    document.querySelectorAll('#nxCommunityTabs .tab').forEach(x => x.classList.remove('active'));
    button?.classList.add('active'); nxLoadCommunity(tab);
  };

  window.nxLoadCommunity = async function (tab) {
    const box = $('nxCommunityContent'); if (!box || !client()) return;
    box.innerHTML = '<div class="nx-social-card">Loading…</div>';
    try {
      if (tab === 'people') {
        const { data, error } = await client().from('profiles').select('id,display_name,username,avatar_url,bio,is_private,created_at').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        const others = (data || []).filter(p => !signedIn() || p.id !== currentNexoraUser.id);
        profileCache = new Map((data || []).map(p => [p.id, p]));
        box.innerHTML = others.length ? others.map(p => `<div class="nx-social-card" data-nx-person="${safe((p.display_name || '') + ' ' + (p.username || '')).toLowerCase()}"><div class="nx-social-top"><div class="nx-avatar">${avatarHTML(p.avatar_url,p.display_name)}</div><div class="nx-social-meta"><b>${safe(p.display_name || 'NEXORA member')}${ownerBadge(p.id)}</b><small>@${safe(p.username || 'username-not-set')} · ${p.is_private ? 'Private profile' : 'Public profile'}</small></div><button class="small-btn" onclick="nxOpenProfile('${p.id}')">View</button></div><p class="nx-muted" style="margin:8px 0 0">${safe(p.bio || 'Growing one step at a time.')}</p></div>`).join('') : '<div class="nx-social-card">No other public profiles to show yet.</div>';
      } else if (tab === 'requests') {
        if (!needLogin()) { box.innerHTML = '<div class="nx-social-card">Sign in to view follow requests.</div>'; return; }
        const { data, error } = await client().from('nexora_follow_requests').select('id,requester_id,target_id,status,created_at').eq('target_id', currentNexoraUser.id).eq('status','pending').order('created_at',{ascending:false});
        if (error) throw error;
        const ids = [...new Set((data || []).map(x => x.requester_id))];
        let people = [];
        if (ids.length) { const res = await client().from('profiles').select('id,display_name,username,avatar_url').in('id',ids); if (res.error) throw res.error; people = res.data || []; }
        box.innerHTML = data?.length ? data.map(req => { const p = people.find(x => x.id === req.requester_id) || {}; return `<div class="nx-social-card"><div class="nx-social-top"><div class="nx-avatar">${avatarHTML(p.avatar_url,p.display_name)}</div><div class="nx-social-meta"><b>${safe(p.display_name || 'Member')}</b><small>@${safe(p.username || 'member')} · Follow request</small></div></div><div class="nx-social-actions"><button class="primary-btn" onclick="nxHandleFollowRequest('${req.id}','accept')">Accept</button><button class="small-btn" onclick="nxHandleFollowRequest('${req.id}','reject')">Reject</button></div></div>`; }).join('') : '<div class="nx-social-card">No pending follow requests.</div>';
      } else {
        if (!needLogin()) { box.innerHTML = '<div class="nx-social-card">Sign in to view notifications.</div>'; return; }
        const { data, error } = await client().from('nexora_notifications').select('id,title,message,read_at,created_at').eq('user_id',currentNexoraUser.id).order('created_at',{ascending:false}).limit(40);
        if (error) throw error;
        box.innerHTML = data?.length ? data.map(n => `<div class="nx-social-card" style="opacity:${n.read_at ? '.72' : '1'}"><div class="nx-inline-row"><b>${safe(n.title)}</b><small class="nx-muted">${dateLabel(n.created_at)}</small></div><p style="font-size:13px;line-height:1.5;margin:8px 0">${safe(n.message)}</p>${!n.read_at ? `<button class="small-btn" onclick="nxMarkNotification('${n.id}')">Mark read</button>` : '<span class="nx-muted">Read</span>'}</div>`).join('') : '<div class="nx-social-card">No notifications yet.</div>';
      }
    } catch (error) { box.innerHTML = `<div class="nx-social-card">Could not load this section: ${safe(error.message || error)}</div>`; }
  };

  window.nxHandleFollowRequest = async function (id, action) {
    if (!needLogin()) return;
    const candidates = [{ p_request_id: id }, { request_id: id }, { p_follow_request_id: id }, { follow_request_id: id }, { id }];
    const { error } = await tryRpc(action === 'accept' ? 'nexora_accept_follow_request' : 'nexora_reject_follow_request', candidates);
    if (error) { toast('Request could not be updated: ' + error.message); return; }
    toast(action === 'accept' ? 'Follow request accepted.' : 'Follow request rejected.'); nxLoadCommunity('requests');
  };

  window.nxMarkNotification = async function (id) {
    if (!needLogin()) return;
    const { error } = await client().from('nexora_notifications').update({ read_at: new Date().toISOString() }).eq('id',id).eq('user_id',currentNexoraUser.id);
    if (error) toast(error.message); else nxLoadCommunity('notifications');
  };

  window.nxCreatePost = async function () {
    if (!needLogin()) return;
    const body = $('nxNewPost')?.value.trim() || '';
    if (!body) { toast('Write something first.'); return; }
    if (body.length > 5000) { toast('Post must be 5,000 characters or less.'); return; }
    const { error } = await client().from('nexora_posts').insert({ author_id: currentNexoraUser.id, body });
    if (error) { toast('Post could not be published: ' + error.message); return; }
    $('nxNewPost').value = ''; toast('Post published.'); await nxLoadPosts();
  };

  window.nxLoadPosts = async function () {
    const box = $('nxPostsFeed'); if (!box || !client()) return;
    box.innerHTML = '<div class="nx-social-card">Loading posts…</div>';
    try {
      const { data: posts, error } = await client().from('nexora_posts').select('id,author_id,body,created_at,updated_at').order('created_at',{ascending:false}).limit(60);
      if (error) throw error;
      if (!posts?.length) { box.innerHTML = '<div class="nx-social-card">No visible posts yet. Be the first to share a progress update.</div>'; return; }
      const ids = [...new Set(posts.map(p => p.author_id))];
      const postIds = posts.map(p => p.id);
      const [{ data: people, error: pe }, { data: likes, error: le }] = await Promise.all([
        client().from('profiles').select('id,display_name,username,avatar_url').in('id',ids),
        client().from('nexora_likes').select('post_id,user_id').in('post_id',postIds)
      ]);
      if (pe) throw pe; if (le) throw le;
      box.innerHTML = posts.map(p => {
        const person = people?.find(x => x.id === p.author_id) || {};
        const count = (likes || []).filter(x => x.post_id === p.id).length;
        const liked = signedIn() && likes?.some(x => x.post_id === p.id && x.user_id === currentNexoraUser.id);
        const own = signedIn() && p.author_id === currentNexoraUser.id;
        return `<article class="nx-social-card"><div class="nx-social-top"><button class="nx-avatar" onclick="nxOpenProfile('${p.author_id}')">${avatarHTML(person.avatar_url,person.display_name)}</button><div class="nx-social-meta"><b>${safe(person.display_name || 'NEXORA member')}${ownerBadge(p.author_id)}</b><small>@${safe(person.username || 'member')} · ${dateLabel(p.created_at)}</small></div>${own ? `<button class="small-btn" onclick="nxEditPost('${p.id}')">Edit</button><button class="small-btn danger" onclick="nxDeletePost('${p.id}')">Delete</button>` : ''}</div><div class="nx-post-body">${safe(p.body)}</div><div class="nx-social-actions"><button class="nx-social-btn ${liked ? 'active' : ''}" onclick="nxToggleLike('${p.id}')">${liked ? '♥ Liked' : '♡ Like'} · ${count}</button><button class="nx-social-btn" onclick="nxOpenProfile('${p.author_id}')">View profile</button></div></article>`;
      }).join('');
    } catch (error) { box.innerHTML = `<div class="nx-social-card">Could not load posts: ${safe(error.message || error)}</div>`; }
  };

  window.nxToggleLike = async function (postId) {
    if (!needLogin()) return;
    const { data: row, error: readError } = await client().from('nexora_likes').select('post_id').eq('post_id',postId).eq('user_id',currentNexoraUser.id).maybeSingle();
    if (readError) { toast(readError.message); return; }
    const result = row
      ? await client().from('nexora_likes').delete().eq('post_id',postId).eq('user_id',currentNexoraUser.id)
      : await client().from('nexora_likes').insert({ post_id: postId, user_id: currentNexoraUser.id });
    if (result.error) toast('Like could not be updated: ' + result.error.message); else nxLoadPosts();
  };

  window.nxEditPost = async function (postId) {
    if (!needLogin()) return;
    const { data, error } = await client().from('nexora_posts').select('body').eq('id',postId).eq('author_id',currentNexoraUser.id).maybeSingle();
    if (error || !data) { toast(error?.message || 'Post not found.'); return; }
    editingPostId = postId; $('nxPostEditText').value = data.body || '';
    if (typeof openModal === 'function') openModal('nxPostEditModal');
  };

  window.nxSavePostEdit = async function () {
    if (!needLogin() || !editingPostId) return;
    const body = $('nxPostEditText')?.value.trim() || '';
    if (!body || body.length > 5000) { toast('Post must contain 1–5,000 characters.'); return; }
    const result = await client().from('nexora_posts').update({ body, updated_at: new Date().toISOString() }).eq('id',editingPostId).eq('author_id',currentNexoraUser.id);
    if (result.error) toast('Edit failed: ' + result.error.message); else { editingPostId = null; closeModals(); toast('Post updated.'); nxLoadPosts(); }
  };

  window.nxDeletePost = async function (postId) {
    if (!needLogin() || !confirm('Delete this post? / क्या यह पोस्ट हटानी है?')) return;
    const { error } = await client().from('nexora_posts').delete().eq('id',postId).eq('author_id',currentNexoraUser.id);
    if (error) toast('Post could not be deleted: ' + error.message); else { toast('Post deleted.'); nxLoadPosts(); }
  };

  window.nxReviewCategoryChanged = function (value) { currentReviewCategory = value; nxLoadOwnReview(value); };
  async function nxLoadOwnReview(category) {
    if (!signedIn() || !client()) return;
    const { data, error } = await client().from('nexora_reviews').select('rating,review_text').eq('user_id',currentNexoraUser.id).eq('category',category).maybeSingle();
    if (error) return;
    if (data) { $('nxReviewRating').value = String(data.rating); $('nxReviewText').value = data.review_text || ''; }
    else { $('nxReviewRating').value = '5'; $('nxReviewText').value = ''; }
  }

  window.nxSubmitReview = async function () {
    if (!needLogin()) return;
    const category = $('nxReviewCategory')?.value || 'overall';
    const rating = Number($('nxReviewRating')?.value || 5);
    const review_text = $('nxReviewText')?.value.trim() || '';
    if (!review_text) { toast('Write your review first.'); return; }
    const { error } = await client().from('nexora_reviews').upsert({ user_id: currentNexoraUser.id, category, rating, review_text, updated_at: new Date().toISOString() }, { onConflict: 'user_id,category' });
    if (error) { toast('Review could not be saved: ' + error.message); return; }
    toast('Review saved. Thank you! / समीक्षा देने के लिए धन्यवाद।'); await nxLoadReviews();
  };

  window.nxLoadReviews = async function () {
    const box = $('nxReviewsFeed'); if (!box || !client()) return;
    box.innerHTML = '<div class="nx-social-card">Loading reviews…</div>';
    try {
      const { data, error } = await client().from('nexora_reviews').select('id,user_id,category,rating,review_text,created_at,updated_at').order('updated_at',{ascending:false}).limit(100);
      if (error) throw error;
      if (!data?.length) { box.innerHTML = '<div class="nx-social-card">No reviews yet. Your feedback can help shape NEXORA.</div>'; return; }
      const ids = [...new Set(data.map(x => x.user_id))];
      const { data: people, error: pe } = await client().from('profiles').select('id,display_name,username').in('id',ids);
      if (pe) throw pe;
      box.innerHTML = data.map(r => {
        const person = people?.find(x => x.id === r.user_id) || {};
        const own = signedIn() && currentNexoraUser.id === r.user_id;
        const owner = isOwnerVerified && currentNexoraUser.id === OWNER_ID;
        const category = ({interface:'Interface & design',usefulness:'Usefulness',performance:'Performance',overall:'Overall'})[r.category] || r.category;
        return `<div class="nx-social-card"><div class="nx-inline-row"><div><b>${safe(person.display_name || 'NEXORA member')}${ownerBadge(r.user_id)}</b><div class="nx-muted">${safe(category)} · ${dateLabel(r.updated_at || r.created_at)}</div></div><span class="nx-star">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></div><p style="font-size:13px;line-height:1.6;margin:10px 0">${safe(r.review_text)}</p>${own || owner ? `<button class="small-btn danger" onclick="nxDeleteReview('${r.id}')">Delete review</button>` : ''}</div>`;
      }).join('');
    } catch (error) { box.innerHTML = `<div class="nx-social-card">Could not load reviews: ${safe(error.message || error)}</div>`; }
  };

  window.nxDeleteReview = async function (id) {
    if (!needLogin() || !confirm('Delete this review?')) return;
    const { error } = await client().from('nexora_reviews').delete().eq('id',id);
    if (error) toast('Delete failed: ' + error.message); else { toast('Review deleted.'); nxLoadReviews(); }
  };

  window.nxOpenOwnerConsole = async function () {
    if (!(await checkOwnerAccess(true))) { toast('Owner access denied. / केवल निर्धारित Owner account को अनुमति है।'); navigate('home'); return; }
    navigate('owner'); await nxLoadOwnerConsole();
  };

  window.nxLoadOwnerConsole = async function () {
    const box = $('nxOwnerContent'); if (!box) return;
    if (!(await checkOwnerAccess())) { box.innerHTML = '<div class="nx-owner-panel">Access denied. Owner identity could not be verified.</div>'; return; }
    box.innerHTML = '<div class="nx-owner-panel">Loading owner dashboard…</div>';
    try {
      const [profiles, posts, reviews] = await Promise.all([
        client().from('profiles').select('id',{count:'exact',head:true}),
        client().from('nexora_posts').select('id',{count:'exact',head:true}),
        client().from('nexora_reviews').select('id',{count:'exact',head:true})
      ]);
      const errors = [profiles.error,posts.error,reviews.error].filter(Boolean);
      if (errors.length) throw errors[0];
      const { data: recent, error } = await client().from('nexora_reviews').select('id,user_id,category,rating,review_text,created_at').order('created_at',{ascending:false}).limit(30);
      if (error) throw error;
      const ids = [...new Set((recent || []).map(x => x.user_id))];
      let people = [];
      if (ids.length) { const p = await client().from('profiles').select('id,display_name,username').in('id',ids); if (p.error) throw p.error; people = p.data || []; }
      box.innerHTML = `<div class="nx-owner-panel"><div class="nx-inline-row"><div><b>Owner verified ✦</b><div class="nx-muted">${OWNER_ID}</div></div><span class="nx-owner-badge">SOLE OWNER</span></div><p class="nx-muted" style="margin:10px 0">Only the fixed owner identity and the server-side nexora_is_admin() check can open this page. No user/admin creation controls exist.</p><div class="nx-owner-metrics"><div class="nx-owner-metric"><b>${profiles.count ?? '—'}</b><span>Profiles</span></div><div class="nx-owner-metric"><b>${posts.count ?? '—'}</b><span>Readable posts</span></div><div class="nx-owner-metric"><b>${reviews.count ?? '—'}</b><span>Reviews</span></div></div></div><div class="nx-owner-panel"><b>Review moderation</b><p class="nx-muted">Delete uses the existing owner-only RLS policy on nexora_reviews.</p>${(recent || []).length ? recent.map(r => {const person=people.find(x=>x.id===r.user_id)||{};return `<div class="nx-social-card" style="margin-top:9px"><div class="nx-inline-row"><b>${safe(person.display_name || 'Member')} · ${safe(r.category)}</b><span class="nx-star">${'★'.repeat(r.rating)}</span></div><p style="font-size:12px;line-height:1.5">${safe(r.review_text)}</p><button class="small-btn danger" onclick="nxDeleteReview('${r.id}')">Remove review</button></div>`}).join('') : '<p class="nx-muted">No reviews yet.</p>'}</div>`;
    } catch (error) { box.innerHTML = `<div class="nx-owner-panel">Dashboard error: ${safe(error.message || error)}</div>`; }
  };

  async function rpcLeaderboard(mode) {
    if (mode === 'daily') {
      const first = await client().rpc('nexora_leaderboard');
      if (!first.error) return first;
    }
    const keys = ['p_period','period','p_range','range','mode','p_mode'];
    let last = null;
    for (const key of keys) {
      const result = await client().rpc('nexora_leaderboard', { [key]: mode });
      if (!result.error) return result;
      last = result.error;
      const msg = String(last.message || '').toLowerCase();
      if (!(msg.includes('function') && (msg.includes('not found') || msg.includes('schema cache') || msg.includes('argument')))) break;
    }
    return { data: null, error: last || new Error('Leaderboard function unavailable') };
  }

  window.nxLoadLeaderboard = async function (mode, button) {
    currentLeaderboardMode = mode;
    document.querySelectorAll('#leaderboardPage .tab').forEach(x => x.classList.remove('active'));
    if (button) button.classList.add('active');
    const box = $('nxLeaderboardList'); if (!box || !client()) return;
    box.innerHTML = '<div class="nx-social-card">Loading…</div>';
    try {
      if (mode === 'daily') {
        const { data: champion } = await client().from('nexora_daily_champions').select('champion_date,winner_user_id,winner_name,winner_points,medal,title,message').eq('champion_date',todayIST()).maybeSingle();
        $('nxChampionBox').innerHTML = champion ? `<div class="nx-profile-cover" style="margin-bottom:10px"><div class="eyebrow" style="color:#ffffffb9">DAILY DISCIPLINE CHAMPION</div><h2 style="font-size:21px">${safe(champion.medal || '🥇')} ${safe(champion.winner_name)}</h2><p>${safe(champion.message || 'Congratulations, Discipline Champion.')}</p><b>${champion.winner_points} points</b></div>` : '<div class="nx-social-card" style="margin-bottom:10px"><b>🥇 Daily Champion</b><p class="nx-muted" style="margin:5px 0 0">No champion has been published for today yet. No points means no artificial winner.</p></div>';
      } else $('nxChampionBox').innerHTML = '';
      const { data, error } = await rpcLeaderboard(mode);
      if (error) throw error;
      const rows = Array.isArray(data) ? data : (data ? [data] : []);
      if (!rows.length) { box.innerHTML = '<div class="nx-social-card">No verified points yet. Complete learning activities after the quiz system is activated.</div>'; return; }
      box.innerHTML = rows.map(r => `<div class="nx-social-card"><div class="nx-inline-row"><div><b>#${safe(r.rank_no ?? '')} · ${safe(r.display_name || r.username || 'Learner')}${ownerBadge(r.user_id)}</b><div class="nx-muted">@${safe(r.username || 'member')}</div></div><b>${safe(r.total_points ?? 0)} pts</b></div></div>`).join('');
    } catch (error) { box.innerHTML = `<div class="nx-social-card">Leaderboard could not load: ${safe(error.message || error)}</div>`; }
  };

  async function loadHomeChampion(force) {
    const box = $('nxHomeChampion');
    if (!box || !client()) return;
    const date = todayIST();
    if (!force && homeChampionLoadedFor === date) return;
    homeChampionLoadedFor = date;
    try {
      const { data, error } = await client().from('nexora_daily_champions').select('winner_name,winner_points,medal,message').eq('champion_date',date).maybeSingle();
      if (error) throw error;
      if (!data) { box.style.display = 'none'; return; }
      $('nxHomeChampionTitle').textContent = `${data.medal || '🥇'} ${data.winner_name} · Discipline Champion`;
      $('nxHomeChampionText').textContent = data.message || `Congratulations, ${data.winner_name}, Discipline Champion. ${data.winner_points} points yesterday.`;
      box.style.display = 'block';
    } catch (_) { box.style.display = 'none'; }
  }

  function addTrackerFields() {
    const modal = $('trackerModal'); if (!modal || $('nxTrackerOptions')) return;
    const actions = modal.querySelector('.modal-actions'); if (!actions) return;
    actions.insertAdjacentHTML('beforebegin', `<div id="nxTrackerOptions" class="nx-form-card" style="margin-top:10px"><div class="field"><label>Tracking duration</label><select id="nxTrackerDuration"><option value="ongoing">Ongoing · No end date</option><option value="until">Track until a date</option></select></div><div class="field" id="nxTrackerEndWrap" style="display:none"><label>End date</label><input id="nxTrackerEndDate" type="date" min="${todayIST()}"></div><div class="field"><label>Mode inside this tracker</label><select id="nxTrackerMode"><option value="standard">Normal tracking</option><option value="sprint">Sprint focus</option><option value="freestyle">Freestyle</option></select><small class="nx-muted">Sprint and Freestyle are options inside your tracker, not separate goals.</small></div></div>`);
    $('nxTrackerDuration').addEventListener('change', () => { $('nxTrackerEndWrap').style.display = $('nxTrackerDuration').value === 'until' ? 'grid' : 'none'; });
  }

  function addPostEditModal() {
    if ($('nxPostEditModal')) return;
    const modal = document.createElement('div'); modal.className = 'modal'; modal.id = 'nxPostEditModal';
    modal.innerHTML = `<div class="modal-head"><h2>Edit post</h2><button class="icon-btn" onclick="closeModals()">×</button></div><div class="field"><label>Post text</label><textarea id="nxPostEditText" maxlength="5000" rows="6"></textarea></div><div class="modal-actions"><button class="secondary-btn" onclick="closeModals()">Cancel</button><button class="primary-btn" onclick="nxSavePostEdit()">Save changes</button></div>`;
    document.body.appendChild(modal);
  }

  function addTrackerTaskModal() {
    if ($('nxTrackerTaskModal')) return;
    const modal = document.createElement('div'); modal.className = 'modal'; modal.id = 'nxTrackerTaskModal';
    modal.innerHTML = `<div class="modal-head"><h2>Add task to tracker</h2><button class="icon-btn" onclick="closeModals()">×</button></div><div class="field"><label>Task name</label><input id="nxTrackerTaskName" maxlength="120" placeholder="What needs to get done?"></div><div class="field"><label>Optional reminder</label><input id="nxTrackerTaskReminder" type="time"></div><div class="modal-actions"><button class="secondary-btn" onclick="closeModals()">Cancel</button><button class="primary-btn" onclick="nxSaveTrackerTask()">Add task</button></div>`;
    document.body.appendChild(modal);
  }

  window.nxAddTrackerTask = function (id) {
    trackerTaskTarget = id; $('nxTrackerTaskName').value = ''; $('nxTrackerTaskReminder').value = '';
    if (typeof openModal === 'function') openModal('nxTrackerTaskModal');
  };

  window.nxSaveTrackerTask = function () {
    const name = $('nxTrackerTaskName')?.value.trim() || '';
    if (!name) { toast('Enter a task name.'); return; }
    state.tasks.unshift({ id: 'nxtask-' + Date.now(), text: name, title: name, done: false, completed: false, trackerId: trackerTaskTarget, trackMode: 'tracker', category: 'personal', graphic: '📌', reminder: $('nxTrackerTaskReminder')?.value || '', created: todayIST() });
    if (typeof persist === 'function') persist(); closeModals(); toast('Task added to your tracker.');
  };

  function renderTrackerTasks() {
    const list = $('trackerList'); if (!list) return;
    const cards = [...list.children];
    cards.forEach((card, index) => {
      const tracker = state.trackers?.[index]; if (!tracker || card.querySelector('.nx-tracker-taskbox')) return;
      const tasks = (state.tasks || []).filter(t => String(t.trackerId || '') === String(tracker.id));
      const done = tasks.filter(t => t.done || t.completed).length;
      const mode = tracker.mode || 'standard';
      const dates = tracker.durationMode === 'until' && tracker.endDate ? `Until ${dateLabel(tracker.endDate)}` : 'Ongoing';
      const box = document.createElement('div'); box.className = 'nx-tracker-taskbox'; box.style.cssText = 'border-top:1px solid var(--line);margin-top:11px;padding-top:10px;width:100%';
      box.innerHTML = `<div class="nx-inline-row"><span class="nx-muted">${safe(mode.toUpperCase())} · ${safe(dates)} · ${done}/${tasks.length} tasks</span><button class="small-btn" onclick="nxAddTrackerTask('${safe(String(tracker.id))}')">+ Add task</button></div>${tasks.length ? tasks.map(t => `<div class="nx-inline-row" style="padding:7px 0;border-bottom:1px solid var(--line)"><button class="check ${t.done || t.completed ? 'done' : ''}" onclick="toggleTask('${safe(String(t.id))}')">${t.done || t.completed ? '✓' : ''}</button><span style="flex:1;font-size:12px;${t.done || t.completed ? 'text-decoration:line-through;opacity:.6' : ''}">${safe(t.text || t.title)}</span><button class="small-btn danger" onclick="deleteTask('${safe(String(t.id))}')">×</button></div>`).join('') : '<p class="nx-muted" style="margin:8px 0">No tasks yet. Add your first task here.</p>'}${mode === 'sprint' ? `<button class="secondary-btn" style="width:100%;margin-top:9px" onclick="navigate('sprint')">Start a focus sprint</button>` : ''}`;
      card.appendChild(box);
    });
  }

  function addTrackerSummary() {
    const box = $('nxTrackerSummary'); if (!box || box.dataset.ready) return;
    box.dataset.ready = '1';
    box.innerHTML = `<div class="nx-owner-metric"><b id="nxTrackerCount">0</b><span>Active trackers</span></div><div class="nx-owner-metric"><b id="nxTrackerTasks">0</b><span>Open tasks</span></div><div class="nx-owner-metric"><b id="nxTrackerWins">0</b><span>Completed tasks</span></div>`;
  }

  function updateTrackerSummary() {
    if ($('nxTrackerCount')) $('nxTrackerCount').textContent = (state.trackers || []).filter(t => !t.endDate || t.endDate >= todayIST()).length;
    if ($('nxTrackerTasks')) $('nxTrackerTasks').textContent = (state.tasks || []).filter(t => t.trackerId && !(t.done || t.completed)).length;
    if ($('nxTrackerWins')) $('nxTrackerWins').textContent = (state.tasks || []).filter(t => t.trackerId && (t.done || t.completed)).length;
  }

  function renderNewTrackersPage() {
    const host = $('nxTrackerLegacyHost'); if (!host) return;
    const trackers = state.trackers || [];
    if (!trackers.length) { host.innerHTML = '<div class="nx-social-card" style="text-align:center"><div style="font-size:30px">🎯</div><b>Your first tracker starts here</b><p class="nx-muted">Study, Workout, Pins Uploading or anything you want. Give it a name, add tasks and choose ongoing or a finish date.</p><button class="primary-btn" onclick="openModal(\'trackerModal\')">Create my first tracker</button></div>'; updateTrackerSummary(); return; }
    host.innerHTML = trackers.map(t => {
      const todayValue = typeof trackerValue === 'function' ? trackerValue(t, todayIST()) : 0;
      const pct = Math.min(100,Math.round(todayValue / Math.max(1,Number(t.target)||1) * 100));
      const tasks = (state.tasks || []).filter(x => String(x.trackerId || '') === String(t.id));
      const done = tasks.filter(x => x.done || x.completed).length;
      const mode = t.mode || 'standard';
      const until = t.durationMode === 'until' && t.endDate ? 'Ends ' + dateLabel(t.endDate) : 'Ongoing · No end date';
      return `<div class="nx-social-card"><div class="nx-social-top"><div class="nx-avatar">${safe(t.icon || '🎯')}</div><div class="nx-social-meta"><b>${safe(t.name)}</b><small>${safe(mode.toUpperCase())} · ${safe(until)}</small></div><button class="small-btn danger" onclick="removeTracker('${safe(String(t.id))}')">Delete</button></div><div class="nx-inline-row" style="margin-top:12px"><b>${todayValue} / ${safe(t.target)} ${safe(t.unit || 'times')}</b><span class="nx-muted">${pct}% today</span></div><div class="progress" style="margin:7px 0 10px"><i style="width:${pct}%"></i></div><div class="nx-inline-row"><button class="small-btn" onclick="logTracker('${safe(String(t.id))}',1)">+ Add progress</button><button class="small-btn" onclick="logTracker('${safe(String(t.id))}',-1)">Undo</button><button class="secondary-btn" onclick="nxAddTrackerTask('${safe(String(t.id))}')">+ Add task</button>${mode === 'sprint' ? `<button class="secondary-btn" onclick="navigate('sprint')">Start sprint</button>` : ''}</div><div style="border-top:1px solid var(--line);margin-top:10px;padding-top:9px"><div class="nx-inline-row"><b style="font-size:12px">Tasks · ${done}/${tasks.length} complete</b><span class="nx-muted">${tasks.length ? Math.round(done/tasks.length*100) : 0}%</span></div>${tasks.length ? tasks.map(x => `<div class="nx-inline-row" style="padding:7px 0;border-bottom:1px solid var(--line)"><button class="check ${x.done || x.completed ? 'done' : ''}" onclick="toggleTask('${safe(String(x.id))}')">${x.done || x.completed ? '✓' : ''}</button><span style="flex:1;font-size:12px;${x.done || x.completed ? 'text-decoration:line-through;opacity:.6' : ''}">${safe(x.text || x.title)}</span><button class="small-btn danger" onclick="deleteTask('${safe(String(x.id))}')">×</button></div>`).join('') : '<p class="nx-muted" style="margin:8px 0">Add tasks that belong to this tracker.</p>'}</div></div>`;
    }).join('');
    const unassigned = (state.tasks || []).filter(t => !t.trackerId);
    if (unassigned.length) host.insertAdjacentHTML('beforeend', `<div class="nx-social-card"><b>Unassigned tasks</b><p class="nx-muted">Older tasks that were created before trackers can be kept here or moved into a tracker later.</p>${unassigned.map(t => `<div class="nx-inline-row" style="padding:7px 0;border-top:1px solid var(--line)"><button class="check ${t.done || t.completed ? 'done' : ''}" onclick="toggleTask('${safe(String(t.id))}')">${t.done || t.completed ? '✓' : ''}</button><span style="flex:1;font-size:12px">${safe(t.text || t.title)}</span><button class="small-btn danger" onclick="deleteTask('${safe(String(t.id))}')">×</button></div>`).join('')}</div>`);
    updateTrackerSummary();
  }

  function bindLongPressControl(button, action, hint) {
    if (!button || button.dataset.nxHoldBound === '1') return;
    button.dataset.nxHoldBound = '1';
    let timer = null, fired = false;
    const clear = () => { if (timer) clearTimeout(timer); timer = null; };
    button.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      fired = false;
      timer = setTimeout(() => { fired = true; action(); }, 650);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(name => button.addEventListener(name, clear));
    button.addEventListener('contextmenu', event => event.preventDefault());
    button.addEventListener('click', event => {
      if (fired) { event.preventDefault(); event.stopPropagation(); fired = false; }
      else toast(hint || 'Press and hold for a moment.');
    });
  }

  function applyHomeCardOrder() {
    const split = $('homePage')?.querySelector('.home-split'); if (!split) return;
    const order = state.settings?.homeCardOrder;
    if (!Array.isArray(order) || !order.length) return;
    order.forEach(role => {
      const card = split.querySelector(`[data-home-role="${String(role).replace(/[^a-z-]/g,'')}"]`);
      if (card) split.appendChild(card);
    });
  }

  function initHomeCardReorder() {
    const split = $('homePage')?.querySelector('.home-split'); if (!split) return;
    applyHomeCardOrder();
    const cards = [...split.querySelectorAll('[data-home-role]')];
    cards.forEach(card => {
      if (card.dataset.nxDragBound === '1') return;
      card.dataset.nxDragBound = '1';
      card.title = 'Long-press and drag to rearrange this Home card';
      let timer = null, active = false, pointerId = null, changed = false;
      const clear = () => { if (timer) clearTimeout(timer); timer = null; active = false; pointerId = null; card.classList.remove('nx-home-dragging'); };
      card.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (event.target.closest('button,input,textarea,select,a,label')) return;
        pointerId = event.pointerId; active = false; changed = false;
        try { card.setPointerCapture(pointerId); } catch (_) {}
        timer = setTimeout(() => { active = true; card.classList.add('nx-home-dragging'); toast('Move the card, then release to save its position.'); }, 550);
      });
      card.addEventListener('pointermove', event => {
        if (event.pointerId !== pointerId) return;
        if (!active) return;
        const target = document.elementFromPoint(event.clientX,event.clientY)?.closest('.home-split [data-home-role]');
        if (!target || target === card) return;
        const rect = target.getBoundingClientRect();
        const before = event.clientY < rect.top + rect.height / 2;
        split.insertBefore(card, before ? target : target.nextSibling);
        changed = true;
      });
      card.addEventListener('pointerup', event => {
        if (event.pointerId !== pointerId) return;
        const wasActive = active; clear();
        if (wasActive && changed) {
          state.settings.homeCardOrder = [...split.querySelectorAll('[data-home-role]')].map(x=>x.dataset.homeRole);
          if (typeof persist === 'function') persist();
          toast('Home card order saved. / Home layout save ho gaya.');
        }
      });
      card.addEventListener('pointercancel', clear);
    });

    const hydration = split.querySelector('[data-home-role="hydration"]');
    if (hydration && !$('nxHydrationHideBtn')) {
      const head = hydration.querySelector(':scope > div:first-child');
      if (head) {
        const button = document.createElement('button'); button.id = 'nxHydrationHideBtn'; button.type = 'button'; button.className = 'small-btn nx-longpress-control'; button.textContent = 'Hold to hide'; button.style.marginLeft = 'auto';
        head.appendChild(button);
        bindLongPressControl(button, () => { state.settings.hydrationHidden = true; if (typeof persist === 'function') persist(); toast('Hydration hidden. Hold the restore button on Home to show it again.'); }, 'Hold this button for a moment to hide Hydration.');
      }
    }
    const restore = $('nxHydrationRestoreBtn');
    if (restore) bindLongPressControl(restore, () => { state.settings.hydrationHidden = false; if (typeof persist === 'function') persist(); toast('Hydration is back on Home.'); }, 'Hold for a moment to show Hydration again.');
    if (hydration) hydration.style.display = state.settings?.hydrationHidden ? 'none' : '';
    if (restore) restore.style.display = state.settings?.hydrationHidden ? 'inline-flex' : 'none';
  }

  function formatMeditationTime(seconds) { const m=Math.floor(Math.max(0,seconds)/60); const s=Math.max(0,seconds)%60; return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }
  function renderMeditationHistory() {
    const box=$('nxMeditationHistory'); if(!box)return;
    const all=state.meditationSessions||[];
    const rows=all.slice(0,8);
    const days=new Set(all.map(x=>x.date));
    let base=todayIST();
    if(!days.has(base)){const y=new Date(base+'T12:00:00');y.setDate(y.getDate()-1);base=y.toISOString().slice(0,10);}
    let streak=0, cursor=new Date(base+'T12:00:00');
    while(days.has(cursor.toISOString().slice(0,10))&&streak<365){streak++;cursor.setDate(cursor.getDate()-1);}
    if($('nxMeditationStreak'))$('nxMeditationStreak').textContent=streak+' day'+(streak===1?'':'s');
    box.innerHTML=rows.length?rows.map(x=>`<div class="nx-inline-row" style="padding:8px 0;border-top:1px solid var(--line)"><span style="font-size:12px">${safe(x.minutes)} min · ${dateLabel(x.date)}</span><b>${'★'.repeat(Number(x.calmRating)||0)}${'☆'.repeat(5-(Number(x.calmRating)||0))}</b></div>`).join(''):'<p class="nx-muted">Your completed sessions will appear here.</p>';
  }
  window.nxStartMeditation = function () {
    if (meditationInterval) return;
    const preset=$('nxMeditationLength')?.value||'5';
    const minutes=preset==='custom'?Math.max(1,Math.min(60,Number($('nxMeditationCustom')?.value)||0)):Number(preset);
    if (!minutes) { toast('Choose a session between 1 and 60 minutes.'); return; }
    meditationStartMinutes=minutes; meditationRemaining=minutes*60; meditationFinished=false;
    $('nxMeditationTimer').textContent=formatMeditationTime(meditationRemaining);
    $('nxMeditationPrompt').textContent='धीरे से सांस लें… और आराम से छोड़ें। विचार आएं तो उन्हें जाने दें।';
    $('nxMeditationStartBtn').style.display='none'; $('nxMeditationPauseBtn').style.display='inline-flex'; $('nxMeditationPauseBtn').textContent='Pause'; $('nxMeditationStopBtn').style.display='inline-flex'; $('nxMeditationRating').style.display='none';
    meditationInterval=setInterval(()=>{ meditationRemaining=Math.max(0,meditationRemaining-1); $('nxMeditationTimer').textContent=formatMeditationTime(meditationRemaining); if(meditationRemaining===0){ clearInterval(meditationInterval); meditationInterval=null; meditationFinished=true; $('nxMeditationPrompt').textContent='बहुत अच्छा। कुछ पल शांत बैठें और अपने मन की स्थिति महसूस करें।'; $('nxMeditationPauseBtn').style.display='none'; $('nxMeditationStopBtn').style.display='none'; $('nxMeditationRating').style.display='block'; toast('Session complete. Rate how calm you feel.'); } },1000);
  };
  window.nxPauseMeditation = function () { if(meditationInterval){clearInterval(meditationInterval);meditationInterval=null;$('nxMeditationPauseBtn').textContent='Resume';}else if(meditationRemaining>0){$('nxMeditationPauseBtn').textContent='Pause';meditationInterval=setInterval(()=>{meditationRemaining=Math.max(0,meditationRemaining-1);$('nxMeditationTimer').textContent=formatMeditationTime(meditationRemaining);if(meditationRemaining===0){clearInterval(meditationInterval);meditationInterval=null;meditationFinished=true;$('nxMeditationPrompt').textContent='Session complete. Notice how you feel.';$('nxMeditationPauseBtn').style.display='none';$('nxMeditationStopBtn').style.display='none';$('nxMeditationRating').style.display='block';}},1000);} };
  window.nxStopMeditation = function () { if(meditationInterval){clearInterval(meditationInterval);meditationInterval=null;} meditationRemaining=0; $('nxMeditationTimer').textContent='00:00'; $('nxMeditationPauseBtn').style.display='none'; $('nxMeditationStopBtn').style.display='none'; $('nxMeditationStartBtn').style.display='inline-flex'; $('nxMeditationPrompt').textContent='Session ended. You can begin again whenever you feel ready.'; $('nxMeditationRating').style.display='none'; };
  window.nxSaveMeditation = function () { if(!meditationFinished)return; if(!Array.isArray(state.meditationSessions))state.meditationSessions=[]; state.meditationSessions.unshift({id:'med-'+Date.now(),date:todayIST(),minutes:meditationStartMinutes,calmRating:Number($('nxMeditationMood')?.value||5)}); if(typeof persist==='function')persist(); meditationFinished=false; meditationRemaining=0; $('nxMeditationTimer').textContent='00:00'; $('nxMeditationRating').style.display='none'; $('nxMeditationStartBtn').style.display='inline-flex'; $('nxMeditationPrompt').textContent='Session saved. Thank yourself for taking this pause.'; renderMeditationHistory(); toast('Meditation session saved.'); };
  function addDisciplineJourney() {
    const page = $('disciplinesPage'); if (!page || $('nxDisciplineJourney')) return;
    const head = page.querySelector('.page-head'); if (!head) return;
    head.insertAdjacentHTML('afterend', `<div id="nxDisciplineJourney" class="nx-social-card" style="margin-bottom:12px"><div class="nx-inline-row"><div><div class="eyebrow">YOUR GUIDED 31-DAY PATH</div><h2 style="margin:5px 0">Discipline, without guilt 🌱</h2></div><span class="nx-coming-tag">14 + 10 + 7 DAYS</span></div><p class="sub">Build a small habit in three gentle phases. Missed a day? Continue without losing your progress.</p><div id="nxDisciplineProgramBody"></div></div>`);
  }

  function isoDayDifference(a,b) { const aa = new Date(a + 'T12:00:00'); const bb = new Date(b + 'T12:00:00'); return Math.floor((bb-aa)/86400000); }
  function renderDisciplineJourney() {
    const box = $('nxDisciplineProgramBody'); if (!box || typeof state === 'undefined') return;
    const p = state.disciplineJourney || null;
    if (!p) {
      box.innerHTML = `<div class="nx-phase"><b>Phase 1 · Days 1–14</b><p class="nx-muted">Notice your routine and build one small, realistic habit.</p></div><div class="nx-phase" style="margin-top:7px"><b>Phase 2 · Days 15–24</b><p class="nx-muted">Gradually increase the effort without overloading yourself.</p></div><div class="nx-phase" style="margin-top:7px"><b>Phase 3 · Days 25–31</b><p class="nx-muted">Reflect: what will you stop, and what will you start?</p></div><div class="field"><label>What is your biggest discipline struggle?</label><textarea id="nxDisciplineStruggle" rows="2" placeholder="For example: consistency, distraction, starting late…"></textarea></div><div class="field"><label>Which small habit do you want to build?</label><input id="nxDisciplineHabit" maxlength="120" placeholder="For example: revise for 15 minutes"></div><button class="primary-btn" style="width:100%;margin-top:10px" onclick="nxStartDisciplineJourney()">Create my 31-day path</button>`;
      return;
    }
    const day = Math.max(1,Math.min(32,isoDayDifference(p.startDate,todayIST())+1));
    const phase = day <= 14 ? 1 : day <= 24 ? 2 : 3;
    const completed = (p.completedDays || []).length;
    const phaseText = phase === 1 ? 'Build a small base habit' : phase === 2 ? 'Increase effort gradually' : 'Choose what to stop and start';
    const dayMarked = (p.completedDays || []).includes(todayIST());
    box.innerHTML = `<div class="nx-inline-row"><b>Day ${Math.min(day,31)} of 31 · Phase ${phase}</b><span class="nx-muted">${completed}/31 completed check-ins</span></div><div class="progress" style="margin:9px 0"><i style="width:${Math.min(100,completed/31*100)}%"></i></div><div class="nx-phase active"><b>${phase === 1 ? 'Days 1–14' : phase === 2 ? 'Days 15–24' : 'Days 25–31'} · ${phaseText}</b><p class="nx-muted" style="margin:5px 0 0">${phase === 1 ? 'Choose one tiny habit you can repeat. Consistency matters more than intensity.' : phase === 2 ? 'Add a little more only when the current step feels manageable.' : 'Create a sustainable routine by deciding what to leave behind and what to begin.'}</p><p style="font-size:12px;margin:7px 0 0"><b>Habit:</b> ${safe(p.habitText || 'Your chosen habit')} · <b>Challenge:</b> ${safe(p.struggleText || 'Building consistency')}</p></div>${phase === 3 ? `<div class="field"><label>What will I stop?</label><textarea id="nxDisciplineStop" rows="2" placeholder="A habit or distraction I want to reduce…">${safe(p.stopText || '')}</textarea></div><div class="field"><label>What will I start?</label><textarea id="nxDisciplineStart" rows="2" placeholder="A small habit I want to add…">${safe(p.startText || '')}</textarea></div><button class="small-btn" onclick="nxSaveDisciplineReflection()">Save reflection</button>` : ''}<button class="primary-btn" style="width:100%;margin-top:10px" ${dayMarked ? 'disabled' : ''} onclick="nxMarkDisciplineDay()">${dayMarked ? 'Today’s check-in completed ✓' : 'Mark today’s step complete'}</button><button class="text-btn" style="margin-top:8px" onclick="nxResetDisciplineJourney()">Reset my 31-day path</button>`;
  }

  window.nxStartDisciplineJourney = function () { const struggleText = $('nxDisciplineStruggle')?.value.trim() || ''; const habitText = $('nxDisciplineHabit')?.value.trim() || ''; if (!habitText) { toast('Write one small habit to begin with.'); return; } state.disciplineJourney = { startDate: todayIST(), completedDays: [], stopText: '', startText: '', struggleText, habitText }; persist(); renderDisciplineJourney(); };
  window.nxMarkDisciplineDay = function () { if (!state.disciplineJourney) return; state.disciplineJourney.completedDays = [...new Set([...(state.disciplineJourney.completedDays || []),todayIST()])]; persist(); renderDisciplineJourney(); toast('Small step recorded. Keep going gently.'); };
  window.nxSaveDisciplineReflection = function () { if (!state.disciplineJourney) return; state.disciplineJourney.stopText = $('nxDisciplineStop')?.value || ''; state.disciplineJourney.startText = $('nxDisciplineStart')?.value || ''; persist(); renderDisciplineJourney(); toast('Reflection saved.'); };
  window.nxResetDisciplineJourney = function () { if (!confirm('Reset this 31-day path? Existing task and tracker data will stay unchanged.')) return; delete state.disciplineJourney; persist(); renderDisciplineJourney(); };

  function cleanHub() {
    const hub = $('hub'); if (!hub) return;
    const links = [...hub.querySelectorAll('.hub-link')];
    links.forEach(link => {
      const page = link.dataset.page;
      if (page === 'routine' || page === 'sprint' || page === 'tasks') link.style.display = 'none';
      if (page === 'current') link.innerHTML = '<span>📰</span>Current Affairs · Soon';
      if (page === 'analytics') { link.dataset.page = 'trackers'; link.textContent = '🎯 My Trackers'; link.onclick = () => { toggleHub(false); navigate('trackers'); }; }
      if (page === 'disciplines') { link.textContent = '🌱 Discipline Path'; }
    });
    if (!$('nxHubCommunity')) {
      const marker = hub.querySelector('.hub-label');
      const extra = document.createElement('div'); extra.innerHTML = `<div class="hub-label">Community & learning</div><button class="hub-link" id="nxHubCommunity"><span>🌍</span>Community</button><button class="hub-link" id="nxHubPosts"><span>✍️</span>Posts</button><button class="hub-link" id="nxHubReviews"><span>⭐</span>App Reviews</button><button class="hub-link" id="nxHubLearning"><span>🧩</span>Quizzes & PYQs</button><button class="hub-link" id="nxHubMeditation"><span>🧘</span>Meditation</button><button class="hub-link" id="nxHubLeaderboard"><span>🏆</span>Leaderboard</button>`;
      if (marker) marker.insertAdjacentElement('afterend', extra); else hub.appendChild(extra);
      $('nxHubCommunity').onclick = () => { toggleHub(false); navigate('community'); };
      $('nxHubPosts').onclick = () => { toggleHub(false); navigate('posts'); };
      $('nxHubReviews').onclick = () => { toggleHub(false); navigate('reviews'); };
      $('nxHubLearning').onclick = () => { toggleHub(false); navigate('learning'); };
      $('nxHubMeditation').onclick = () => { toggleHub(false); navigate('meditation'); };
      $('nxHubLeaderboard').onclick = () => { toggleHub(false); navigate('leaderboard'); };
    }
    const profileLink = $('hubProfileLink'); if (profileLink) { profileLink.onclick = () => nxOpenMyProfile(); profileLink.textContent = '👤 My Profile'; }
    const peerLink = links.find(link => /Browse Peer Profiles/i.test(link.textContent || '')); if (peerLink) { peerLink.textContent = '🌍 Community'; peerLink.onclick = () => { toggleHub(false); navigate('community'); }; }
  }

  function removeUnsupportedAuthOptions() {
    const auth = $('authModal'); if (!auth) return;
    [...auth.querySelectorAll('.auth-provider')].forEach(button => { if (/apple/i.test(button.textContent || '')) button.remove(); });
    const phone = $('authPhone'); if (phone) {
      const field = phone.closest('.field'); const otp = $('authPhoneOtp'); const otpField = otp?.closest('.field');
      const buttons = phone.closest('.field')?.nextElementSibling;
      field?.remove(); otpField?.remove(); buttons?.remove();
    }
    const labels = [...auth.querySelectorAll('label')];
    labels.filter(x => /mobile number|phone verification/i.test(x.textContent || '')).forEach(x => x.closest('.field')?.remove());
  }

  function addForgotPasswordCooldown() {
    if (typeof window.nexoraResetPassword !== 'function' || window.nexoraResetPassword.__nxCooldown) return;
    const original = window.nexoraResetPassword;
    let deadline = 0; let timer = null;
    window.nexoraResetPassword = async function () {
      const now = Date.now();
      if (now < deadline) { toast('Please wait before requesting another reset email. / कृपया 1 मिनट प्रतीक्षा करें।'); return; }
      deadline = now + 60000;
      const button = [...document.querySelectorAll('#authModal button')].find(b => /forgot password|reset password/i.test(b.textContent || ''));
      if (button) {
        button.disabled = true;
        clearInterval(timer);
        timer = setInterval(() => {
          const left = Math.max(0,Math.ceil((deadline-Date.now())/1000));
          if (left > 0) button.textContent = `Try again in ${left}s`;
          else { button.disabled = false; button.textContent = 'Forgot password?'; clearInterval(timer); }
        },1000);
      }
      return original.apply(this, arguments);
    };
    window.nexoraResetPassword.__nxCooldown = true;
  }

  function patchNameBasedOwnerLabels() {
    if (typeof window.renderHeaderAndTicker === 'function' && !window.renderHeaderAndTicker.__nxOwnerSafe) {
      const old = window.renderHeaderAndTicker;
      window.renderHeaderAndTicker = function () {
        old.apply(this,arguments);
        moveHeaderControls();
        if ($('topProfileTag')) $('topProfileTag').textContent = signedIn() && currentNexoraUser.id === OWNER_ID ? '✦ Owner · NEXORA' : (state?.profile?.focusMode === 'study' ? 'Study & growth' : 'Your workspace');
        if ($('creatorBadge')) $('creatorBadge').classList.toggle('hide', !(selectedProfileId === OWNER_ID || (signedIn() && currentNexoraUser.id === OWNER_ID)));
      };
      window.renderHeaderAndTicker.__nxOwnerSafe = true;
    }
  }

  function patchProfileModalToDedicatedPage() {
    const btn = $('headerProfileBtn'); if (btn) btn.onclick = () => nxOpenMyProfile();
    const creator = $('creatorBadge');
    if (creator) creator.textContent = '✦ Owner';
    if (typeof window.openProfileModal === 'function' && !window.openProfileModal.__nxFixedOwner) {
      const original = window.openProfileModal;
      window.openProfileModal = function (who) {
        const id = who === 'me' ? (signedIn() ? currentNexoraUser.id : '') : String(who || '');
        const result = original.apply(this,arguments);
        if (creator) creator.classList.toggle('hide', id !== OWNER_ID);
        return result;
      };
      window.openProfileModal.__nxFixedOwner = true;
    }
  }

  function patchTrackerFunctions() {
    addTrackerFields(); addTrackerTaskModal(); addTrackerSummary();
    if (typeof window.createTracker === 'function' && !window.createTracker.__nxTrackerOptions) {
      const original = window.createTracker;
      window.createTracker = function () {
        const durationMode = $('nxTrackerDuration')?.value || 'ongoing';
        const endDate = durationMode === 'until' ? ($('nxTrackerEndDate')?.value || '') : '';
        const mode = $('nxTrackerMode')?.value || 'standard';
        if (durationMode === 'until' && (!endDate || endDate < todayIST())) { toast('Choose a valid future end date.'); return; }
        const before = state.trackers.length;
        original.apply(this,arguments);
        if (state.trackers.length > before) {
          const tracker = state.trackers[state.trackers.length - 1];
          tracker.durationMode = durationMode; tracker.endDate = endDate || null; tracker.mode = mode;
          if (typeof persist === 'function') persist();
        }
      };
      window.createTracker.__nxTrackerOptions = true;
    }
    if (typeof window.renderAnalytics === 'function' && !window.renderAnalytics.__nxTrackerDecorated) {
      const original = window.renderAnalytics;
      window.renderAnalytics = function () { original.apply(this,arguments); renderTrackerTasks(); updateTrackerSummary(); };
      window.renderAnalytics.__nxTrackerDecorated = true;
    }
    if (typeof window.deleteTask === 'function' && !window.deleteTask.__nxConfirm) {
      const original = window.deleteTask;
      window.deleteTask = function (id) { if (!confirm('Delete this task? / क्या यह task हटाना है?')) return; return original.call(this,id); };
      window.deleteTask.__nxConfirm = true;
    }
    if (typeof window.openTaskModal === 'function' && !window.openTaskModal.__nxTrackerFirst) {
      window.openTaskModal = function () { navigate('trackers'); toast('First open a tracker, then use + Add task inside it. / पहले tracker बनाएँ, फिर उसी में task जोड़ें।'); };
      window.openTaskModal.__nxTrackerFirst = true;
    }
    const modal = $('trackerModal');
    if (modal) {
      const show = window.openModal;
      if (typeof show === 'function' && !show.__nxTrackerReset) {
        window.openModal = function (id) {
          if (id === 'trackerModal') { setTimeout(() => { if ($('nxTrackerDuration')) $('nxTrackerDuration').value = 'ongoing'; if ($('nxTrackerEndWrap')) $('nxTrackerEndWrap').style.display = 'none'; if ($('nxTrackerMode')) $('nxTrackerMode').value = 'standard'; },0); }
          return show.apply(this,arguments);
        };
        window.openModal.__nxTrackerReset = true;
      }
    }
  }

  function patchFunctions() {
    if (typeof window.renderAll === 'function' && !window.renderAll.__nxRefreshNewPages) {
      const originalRenderAll = window.renderAll;
      window.renderAll = function () { originalRenderAll.apply(this,arguments); renderNewTrackersPage(); renderDisciplineJourney(); };
      window.renderAll.__nxRefreshNewPages = true;
    }
    if (typeof window.navigate === 'function' && !window.navigate.__nxNavigation) {
      const original = window.navigate;
      window.navigate = function (page) {
        const result = original.apply(this,arguments);
        if (result) {
          updateFooterActive(page);
          if (page === 'home') loadHomeChampion(true);
          if (page === 'trackers') { setPageTitle('trackersPage','My Trackers 🎯','One clear starting point for every goal.'); renderNewTrackersPage(); }
          if (page === 'profile') nxLoadProfile();
          if (page === 'community') nxLoadCommunity('people');
          if (page === 'posts') nxLoadPosts();
          if (page === 'reviews') { nxLoadOwnReview($('nxReviewCategory')?.value || 'overall'); nxLoadReviews(); }
          if (page === 'leaderboard') nxLoadLeaderboard('daily');
          if (page === 'meditation') renderMeditationHistory();
          if (page === 'owner') nxLoadOwnerConsole();
        }
        return result;
      };
      window.navigate.__nxNavigation = true;
    }
    if (typeof window.renderHome === 'function' && !window.renderHome.__nxBetterHome) {
      const original = window.renderHome;
      window.renderHome = function () {
        original.apply(this,arguments);
        if ($('nxHomeGreeting')) $('nxHomeGreeting').textContent = `${state.profile?.name && state.profile.name !== 'Explorer' ? state.profile.name.split(' ')[0] + ', ' : ''}${new Date().getHours()<12?'Good morning':new Date().getHours()<17?'Good afternoon':'Good evening'} ✨`;
        if ($('nxHomeDone')) $('nxHomeDone').textContent = (state.tasks || []).filter(t=>t.done||t.completed).length;
        if ($('nxHomeStudy')) { const m=(state.study||[]).filter(x=>(x.date||x.day)===todayIST()).reduce((a,x)=>a+(Number(x.minutes)||0),0); $('nxHomeStudy').textContent=m>=60?Math.floor(m/60)+'h '+m%60+'m':m+'m'; }
        if ($('nxHomeStreak')) $('nxHomeStreak').textContent = state.streak || 0;
        initHomeCardReorder();
      };
      window.renderHome.__nxBetterHome = true;
    }
    if (typeof window.renderDisciplines === 'function' && !window.renderDisciplines.__nxJourney) {
      const original = window.renderDisciplines;
      window.renderDisciplines = function () { original.apply(this,arguments); renderDisciplineJourney(); };
      window.renderDisciplines.__nxJourney = true;
    }
    if (typeof window.askNova === 'function' && !window.askNova.__nxUpcoming) {
      window.askNova = function () { toast('NOVA AI connection is coming soon. / NOVA AI सेवा जल्द उपलब्ध होगी।'); };
      window.askNova.__nxUpcoming = true;
    }
    patchNameBasedOwnerLabels();
    if (typeof window.openModal === 'function' && !window.openModal.__nxFooterVisibility) {
      const original = window.openModal;
      window.openModal = function () { const result = original.apply(this,arguments); syncBottomNavVisibility(); return result; };
      window.openModal.__nxFooterVisibility = true;
    }
    if (typeof window.closeModals === 'function' && !window.closeModals.__nxFooterVisibility) {
      const original = window.closeModals;
      window.closeModals = function () { const result = original.apply(this,arguments); syncBottomNavVisibility(); return result; };
      window.closeModals.__nxFooterVisibility = true;
    }
    if (typeof window.toggleHub === 'function' && !window.toggleHub.__nxFooterVisibility) {
      const original = window.toggleHub;
      window.toggleHub = function () { const result = original.apply(this,arguments); syncBottomNavVisibility(); return result; };
      window.toggleHub.__nxFooterVisibility = true;
    }
  }

  function addReleaseNotice() {
    try {
      if (localStorage.getItem(RELEASE_NEVER) === '1' || localStorage.getItem(RELEASE_SEEN) === '1') return;
    } catch (_) {}
    const previous = $('nxSafetyOverlay');
    if (previous) {
      const card = previous.querySelector('.nx-safety-card');
      if (card) {
        card.innerHTML = `<div class="nx-safety-mark">N</div><h2 id="nxSafetyTitle">NEXORA has grown ✨</h2><p><b>Hindi:</b> Ab NEXORA mein My Trackers ek clear starting point hai. Dedicated Profile, Posts, Community aur App Reviews pages, Meditation aur quick-action footer bhi shamil hain.</p><p style="margin-top:9px"><b>English:</b> Explore the refreshed Home, My Trackers, dedicated Profile and Posts, Community, public App Reviews, Meditation, and quick-action footer.</p><div class="nx-safety-note"><b>Account safety:</b> Guest data is preserved. Cloud backup stays OFF unless you explicitly enable it. Verified quizzes, PYQs, live Current Affairs and secure AI will activate after their backend is ready.<br><br><span class="nx-coming-tag">COMING SOON · जल्द आ रहा है</span></div><label class="nx-release-check"><input type="checkbox" id="nxNeverShowAgain"><span>Don’t show future update notices / आगे के update notices दोबारा मत दिखाना</span></label><div class="nx-safety-actions"><button class="nx-safety-action nx-safety-primary" data-choice-index="0">Explore NEXORA / चलिए शुरू करें</button><button class="nx-safety-action" data-choice-index="1">Close / बंद करें</button></div>`;
        previous.addEventListener('click', event => {
          if (event.target.closest('[data-choice-index]')) {
            try {
              localStorage.setItem(RELEASE_SEEN,'1');
              if ($('nxNeverShowAgain')?.checked) localStorage.setItem(RELEASE_NEVER,'1');
            } catch (_) {}
            setTimeout(syncBottomNavVisibility,0);
          }
        }, true);
        return;
      }
    }
    const root = document.createElement('div'); root.className = 'nx-release-overlay'; root.id = 'nxReleaseOverlay';
    root.innerHTML = `<section class="nx-release-dialog" role="dialog" aria-modal="true" aria-labelledby="nxReleaseTitle"><div class="nx-release-logo">N</div><h2 id="nxReleaseTitle">NEXORA has grown ✨</h2><p><b>Hindi:</b> Ab NEXORA mein My Trackers ek clear starting point hai. Dedicated Profile, Posts, Community aur App Reviews pages, Meditation aur quick-action footer bhi shamil hain.</p><p><b>English:</b> Explore the refreshed Home, My Trackers, dedicated Profile and Posts, Community, public App Reviews, Meditation, and quick-action footer.</p><div class="nx-coming-card"><span class="nx-coming-tag">COMING SOON · जल्द आ रहा है</span><p>Verified quizzes, PYQs, live Current Affairs and secure AI tools will activate as their backend services are completed. They will not be shown as live features before they are ready.</p></div><label class="nx-release-check"><input type="checkbox" id="nxNeverShowAgain"><span>Don’t show future update notices / आगे के update notices दोबारा मत दिखाना</span></label><div class="nx-release-actions"><button class="primary-btn" id="nxReleaseGotIt">Explore NEXORA / चलिए शुरू करें</button><button class="secondary-btn" id="nxReleaseClose">Close / बंद करें</button></div></section>`;
    document.body.appendChild(root);
    const close = () => {
      try { localStorage.setItem(RELEASE_SEEN,'1'); if ($('nxNeverShowAgain')?.checked) localStorage.setItem(RELEASE_NEVER,'1'); } catch (_) {}
      root.remove(); syncBottomNavVisibility();
    };
    $('nxReleaseGotIt').addEventListener('click',close); $('nxReleaseClose').addEventListener('click',close);
  }

  function removeOldPreviewReviewCopy() {
    if ($('novaHeaderTitle')) $('novaHeaderTitle').textContent = 'NOVA AI · Coming Soon';
    if ($('novaHeaderSub')) $('novaHeaderSub').textContent = 'Secure AI learning mentor is being connected';
    const current = $('currentAffairsFeed'); if (current) current.innerHTML = '<div class="nx-coming-card"><span class="nx-coming-tag">COMING SOON · जल्द आ रहा है</span><h3 style="margin:9px 0 0">Daily exam-focused current affairs</h3><p>Verified daily briefs, GK facts and exam-specific updates will appear here after the secure content service is connected.</p></div>';
    const share = $('sharePage');
    const para = share?.querySelector('.card p.sub');
    if (para && /Preview mode: feedback/i.test(para.textContent || '')) para.textContent = 'Public reviews are available on the App Reviews page. This page keeps your private notes and suggestions on this device.';
    const legacyForm = $('fbText')?.closest('.card');
    if (legacyForm) {
      const heading = legacyForm.querySelector('h3'); if (heading) heading.textContent = 'Private feedback to NEXORA';
      const typePicker = $('feedbackTypePicker')?.closest('.field'); if (typePicker) typePicker.style.display = 'none';
      const ratingPicker = $('ratingPicker')?.closest('.field'); if (ratingPicker) ratingPicker.style.display = 'none';
      const label = legacyForm.querySelector('textarea')?.closest('.field')?.querySelector('label'); if (label) label.textContent = 'Your private note';
      const area = $('fbText'); if (area) area.placeholder = 'Share an idea, issue or suggestion privately…';
      const button = legacyForm.querySelector('button.primary-btn'); if (button) button.textContent = 'Save private feedback';
      const note = document.createElement('p'); note.className = 'nx-muted'; note.textContent = 'Private on this device; never shown in the public review feed.'; legacyForm.appendChild(note);
    }
    const feedHeading = $('feedbackFeed')?.previousElementSibling?.querySelector('h2'); if (feedHeading) feedHeading.textContent = 'My saved private feedback';
  }

  function init() {
    if (typeof state === 'undefined' || !document.body) return;
    addStyles();
    addPages();
    addHomeDashboard();
    const homeTaskCard = $('homePage')?.querySelector('[data-home-role="tasks"]');
    const homeTaskHeading = homeTaskCard?.querySelector('.section-head h2'); if (homeTaskHeading) homeTaskHeading.textContent = 'Tasks inside your trackers';
    const homeAddTask = homeTaskCard?.querySelector('.section-head button'); if (homeAddTask) { homeAddTask.textContent = 'My Trackers →'; homeAddTask.onclick = () => navigate('trackers'); }
    addFooter();
    addTrackerFields();
    if ($('nxMeditationLength')) $('nxMeditationLength').addEventListener('change',()=>{ $('nxMeditationCustomWrap').style.display=$('nxMeditationLength').value==='custom'?'grid':'none'; });
    renderMeditationHistory();
    addTrackerTaskModal();
    addPostEditModal();
    addTrackerSummary();
    addDisciplineJourney();
    cleanHub();
    removeUnsupportedAuthOptions();
    addForgotPasswordCooldown();
    patchProfileModalToDedicatedPage();
    patchFunctions();
    patchTrackerFunctions();
    moveHeaderControls();
    setPageTitle('analyticsPage','My Trackers 🎯','Create a tracker for any part of life. Add tasks, choose Sprint or Freestyle, and track to a date or keep going.');
    setPageTitle('disciplinesPage','Discipline Journey 🌱','Your original guided 14 + 10 + 7 day habit-building path stays part of NEXORA.');
    addReleaseNotice();
    syncBottomNavVisibility();
    loadHomeChampion();
    checkOwnerAccess(true);
    if (client()?.auth?.onAuthStateChange) client().auth.onAuthStateChange(() => { setTimeout(() => { checkOwnerAccess(true); },0); });
    if (typeof renderAll === 'function') renderAll();
    renderNewTrackersPage(); renderDisciplineJourney();
    if (typeof navigate === 'function') updateFooterActive('home');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
