(() => {
  'use strict';

  const VERSION = '20260829-2';
  const catalog = Array.isArray(window.STORY_CATALOG) ? window.STORY_CATALOG : [];
  const loadedScripts = new Map();
  const state = { work: null, section: null, rate: 1, oneHand: false, currentIndex: 0, touch: null, suppressClickUntil: 0 };

  const $ = (s) => document.querySelector(s);
  const els = {
    work: $('#workSelect'), section: $('#sectionSelect'), content: $('#content'), rate: $('.rate'), toast: $('#toast'), controls: $('.controls-in')
  };
  window.els = { work: els.work, section: els.section };
  if (!els.work || !els.section || !els.content) return;

  const storage = {
    lastWork: 'lit-last-work',
    lastSection: (work) => `lit-last-section-${work}`,
    row: (work, section) => `lit-row-${work}-${section}`,
    scroll: (work, section) => `lit-scroll-${work}-${section}`,
    rate: 'lit-rate',
    oneHand: 'lit-onehand'
  };

  function safeGet(key, fallback = '') { try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; } }
  function safeSet(key, value) { try { localStorage.setItem(key, String(value)); } catch (_) {} }
  function escapeHtml(text) { return String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c])); }
  function stripBold(text) { return String(text ?? '').replace(/\*\*/g, ''); }
  function parseEnglish(raw) {
    raw = String(raw ?? '');
    const chunks = [...raw.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1].trim()).filter(Boolean);
    const escaped = escapeHtml(raw);
    const html = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return { plain: stripBold(raw), chunks, html };
  }
  function isHeadingRow(ja, en) {
    const a = String(ja ?? '').trim(), b = String(en ?? '').trim();
    return /^[〇一二三四五六七八九十百千]+$/.test(a) && /^\d+$/.test(b);
  }
  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => els.toast.classList.remove('show'), 1000);
  }

  function loadScript(src) {
    const key = src.split('?')[0];
    if (loadedScripts.has(key)) return loadedScripts.get(key);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${src}${src.includes('?') ? '&' : '?'}v=${VERSION}`;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(s);
    });
    loadedScripts.set(key, p);
    return p;
  }

  async function getSection(work, sectionId) {
    if (work.mode === 'bundle') {
      await loadScript(work.src);
      const loadedWork = window.STORY_WORKS?.[work.id];
      const section = loadedWork?.sections?.find(s => s.id === sectionId);
      if (!section) throw new Error(`Section ${work.id}:${sectionId} not found`);
      return section;
    }
    await loadScript(`${work.base}${sectionId}.js`);
    const section = window.STORY_SECTIONS?.[`${work.id}:${sectionId}`];
    if (!section) throw new Error(`Section ${work.id}:${sectionId} not found`);
    return section;
  }

  function currentWork() {
    if (!state.work) return null;
    return {
      ...state.work,
      sections: state.work.sectionIds.map(id => ({ id, rows: id === state.section?.id ? state.section.rows : [] }))
    };
  }
  window.currentWork = currentWork;

  function currentKey() { return state.work && state.section ? [state.work.id, state.section.id] : ['', '']; }
  function rows() { return [...els.content.querySelectorAll('.reader .row')]; }
  function playableRows() { return rows().map((row, index) => ({row,index})).filter(x => !x.row.classList.contains('row-heading')); }
  function nearestPlayable(index, direction = 1) {
    const all = rows();
    if (!all.length) return -1;
    index = Math.max(0, Math.min(index, all.length - 1));
    if (!all[index].classList.contains('row-heading')) return index;
    for (let d = 1; d < all.length; d++) {
      const forward = index + d * direction;
      const backward = index - d * direction;
      if (forward >= 0 && forward < all.length && !all[forward].classList.contains('row-heading')) return forward;
      if (backward >= 0 && backward < all.length && !all[backward].classList.contains('row-heading')) return backward;
    }
    return -1;
  }
  function nearestToCentre() {
    const p = playableRows();
    if (!p.length) return -1;
    const centre = innerHeight * 0.5;
    let best = p[0].index, distance = Infinity;
    p.forEach(({row,index}) => {
      const r = row.getBoundingClientRect();
      const d = Math.abs((r.top + r.bottom) / 2 - centre);
      if (d < distance) { distance = d; best = index; }
    });
    return best;
  }
  function savedRowIndex() {
    const [w,s] = currentKey();
    if (!w || !s) return -1;
    const n = Number(safeGet(storage.row(w,s), ''));
    const all = rows();
    if (Number.isInteger(n) && n >= 0 && n < all.length) return nearestPlayable(n, 1);
    return nearestToCentre();
  }
  function markCurrent(index, persist = true) {
    const all = rows();
    if (!all.length) return;
    const valid = nearestPlayable(index, 1);
    if (valid < 0) return;
    state.currentIndex = valid;
    all.forEach((r,i) => r.classList.toggle('oh-current', state.oneHand && i === valid));
    if (persist) {
      const [w,s] = currentKey();
      if (w && s) safeSet(storage.row(w,s), valid);
    }
    updateMediaSession();
  }
  function centreRow(index, smooth = true) {
    const row = rows()[index];
    if (row) row.scrollIntoView({behavior: smooth ? 'smooth' : 'auto', block:'center'});
  }

  function getVoice(lang) {
    const voices = speechSynthesis.getVoices?.() || [];
    const exact = voices.find(v => (v.lang || '').toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
    const prefix = lang.split('-')[0].toLowerCase();
    return voices.find(v => (v.lang || '').toLowerCase().startsWith(prefix)) || null;
  }
  function stopSpeech() { try { speechSynthesis.cancel(); } catch (_) {} }
  function speak(text, lang = 'en-GB', cell = null, mode = '全文') {
    text = stripBold(text).trim();
    if (!text || !('speechSynthesis' in window)) return;
    stopSpeech();
    document.querySelectorAll('.cell.play-uk,.cell.play-us').forEach(c => c.classList.remove('play-uk','play-us'));
    if (cell) cell.classList.add(lang === 'en-US' ? 'play-us' : 'play-uk');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = state.rate;
    const voice = getVoice(lang);
    if (voice) u.voice = voice;
    u.onend = u.onerror = () => cell?.classList.remove('play-uk','play-us');
    speechSynthesis.speak(u);
  }
  window.speak = speak;

  function accentForClick(cell, clientX) {
    const r = cell.getBoundingClientRect();
    return clientX <= r.left + r.width * .7 ? 'en-GB' : 'en-US';
  }
  function playRow(index, smooth = true) {
    const all = rows();
    const valid = nearestPlayable(index, index >= state.currentIndex ? 1 : -1);
    if (valid < 0 || !state.section) return;
    const data = state.section.rows[valid];
    if (!data) return;
    markCurrent(valid);
    if (smooth) centreRow(valid, true);
    const en = all[valid]?.querySelector('.en');
    setTimeout(() => speak(data[1], 'en-GB', en, '全文'), smooth ? 170 : 0);
  }
  function nextPlayableIndex(from, direction) {
    const all = rows();
    for (let i = from + direction; i >= 0 && i < all.length; i += direction) if (!all[i].classList.contains('row-heading')) return i;
    return -1;
  }
  async function moveSection(direction, edge = 'first', autoplay = true) {
    if (!state.work || !state.section) return false;
    const ids = state.work.sectionIds;
    const at = ids.indexOf(state.section.id);
    const target = at + direction;
    if (target < 0 || target >= ids.length) return false;
    els.section.value = ids[target];
    safeSet(storage.lastSection(state.work.id), ids[target]);
    await render({restore:true});
    const p = playableRows();
    if (!p.length) return true;
    const idx = edge === 'last' ? p[p.length - 1].index : p[0].index;
    markCurrent(idx);
    centreRow(idx, true);
    if (autoplay) setTimeout(() => playRow(idx, false), 180);
    return true;
  }
  async function nextAndPlay() {
    const next = nextPlayableIndex(state.currentIndex, 1);
    if (next >= 0) playRow(next); else await moveSection(1, 'first', true);
  }
  async function previousAndPlay() {
    const prev = nextPlayableIndex(state.currentIndex, -1);
    if (prev >= 0) playRow(prev); else await moveSection(-1, 'last', true);
  }

  function updateMediaSession() {
    if (!state.oneHand || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined' || !state.work || !state.section) return;
    const playable = playableRows();
    const pos = Math.max(0, playable.findIndex(x => x.index === state.currentIndex)) + 1;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({title:`${state.work.title} · ${state.section.id}`,artist:'English through Stories',album:`${pos} / ${playable.length}`});
    } catch (_) {}
  }
  function setMediaHandlers(on) {
    if (!('mediaSession' in navigator)) return;
    const set = (name, fn) => { try { navigator.mediaSession.setActionHandler(name, on ? fn : null); } catch (_) {} };
    set('play', () => playRow(state.currentIndex));
    set('pause', stopSpeech);
    set('previoustrack', previousAndPlay);
    set('nexttrack', nextAndPlay);
  }
  function setOneHand(on, persist = true) {
    state.oneHand = !!on;
    state.touch = null;
    if (persist) safeSet(storage.oneHand, state.oneHand ? '1' : '0');
    document.body.classList.toggle('onehand-on', state.oneHand);
    const toggle = $('#oneHandToggle');
    if (toggle) {
      toggle.classList.toggle('active', state.oneHand);
      toggle.setAttribute('aria-pressed', state.oneHand ? 'true' : 'false');
    }
    if (state.oneHand) markCurrent(savedRowIndex(), false);
    else { stopSpeech(); rows().forEach(r => r.classList.remove('oh-current')); }
    setMediaHandlers(state.oneHand);
  }

  function installOneHandToggle() {
    if ($('#oneHandToggle') || !els.controls) return;
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'oneHandToggle'; b.className = 'onehand-toggle'; b.setAttribute('aria-label','画面を見ずに操作するモード'); b.innerHTML='<span></span>';
    b.addEventListener('click', e => { e.stopPropagation(); setOneHand(!state.oneHand); });
    els.controls.appendChild(b);
  }

  function renderRows(section) {
    let audioNo = 0;
    const totalAudio = section.rows.filter(([ja,en]) => !isHeadingRow(ja,en)).length;
    const html = section.rows.map(([ja,en], i) => {
      const heading = isHeadingRow(ja,en);
      const parsed = parseEnglish(en);
      const progress = heading ? '' : `<span class="row-progress">${++audioNo} / ${totalAudio}</span>`;
      const classes = heading ? 'row row-heading' : 'row';
      return `<div class="${classes}" data-row-index="${i}"><div class="cell ja">${progress}${escapeHtml(ja)}</div><div class="cell en" data-chunks="${escapeHtml(JSON.stringify(parsed.chunks))}">${parsed.html}</div></div>`;
    }).join('');
    els.content.innerHTML = `<div class="section-title"><h2>${escapeHtml(state.work.icon)} ${escapeHtml(state.work.title)} <span>｜ ${escapeHtml(state.work.enTitle)}</span></h2><span>${escapeHtml(section.id)}</span></div><div class="reader">${html}</div>`;
  }

  function restorePosition() {
    const [w,s] = currentKey();
    if (!w || !s) return;
    const y = Number(safeGet(storage.scroll(w,s), ''));
    const saved = savedRowIndex();
    state.currentIndex = saved >= 0 ? saved : (playableRows()[0]?.index ?? 0);
    if (state.oneHand) markCurrent(state.currentIndex, false);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (Number.isFinite(y) && y > 0) scrollTo({top:y,behavior:'auto'});
      else if (state.currentIndex > 0) centreRow(state.currentIndex, false);
    }));
  }

  async function render({restore=true} = {}) {
    if (!state.work) return;
    const sectionId = els.section.value || state.work.sectionIds[0];
    els.content.innerHTML = '<div class="reader-loading">Loading chapter…</div>';
    try {
      const section = await getSection(state.work, sectionId);
      state.section = {id:section.id, rows:section.rows || []};
      renderRows(state.section);
      if (restore) restorePosition();
      window.dispatchEvent(new CustomEvent('literature:rendered',{detail:{work:state.work.id,section:state.section.id}}));
      updateMediaSession();
    } catch (err) {
      console.error(err);
      els.content.innerHTML = '<div class="reader-error">章の読み込みに失敗しました。再読み込みしてください。</div>';
    }
  }
  window.render = render;

  function fillWorks() {
    els.work.innerHTML = catalog.map(w => `<option value="${escapeHtml(w.id)}">${escapeHtml(w.icon)} ${escapeHtml(w.title)}</option>`).join('');
  }
  function fillSections(work) {
    els.section.innerHTML = work.sectionIds.map(id => `<option value="${id}">${id}</option>`).join('');
  }
  async function selectWork(workId, restoreSection = true) {
    state.work = catalog.find(w => w.id === workId) || catalog[0] || null;
    if (!state.work) return;
    els.work.value = state.work.id;
    safeSet(storage.lastWork, state.work.id);
    fillSections(state.work);
    const saved = restoreSection ? safeGet(storage.lastSection(state.work.id), '') : '';
    const sectionId = state.work.sectionIds.includes(saved) ? saved : state.work.sectionIds[0];
    els.section.value = sectionId;
    safeSet(storage.lastSection(state.work.id), sectionId);
    await render({restore:true});
  }

  function setRate(value, persist = true) {
    const n = Number(value);
    state.rate = Number.isFinite(n) ? n : 1;
    if (persist) safeSet(storage.rate, state.rate);
    els.rate?.querySelectorAll('button[data-rate]').forEach(b => b.classList.toggle('active', Number(b.dataset.rate) === state.rate));
  }

  els.work.addEventListener('change', () => { stopSpeech(); selectWork(els.work.value, true); });
  els.section.addEventListener('change', async () => {
    stopSpeech();
    safeSet(storage.lastSection(state.work.id), els.section.value);
    await render({restore:true});
  });
  els.rate?.addEventListener('click', e => {
    const b = e.target.closest('button[data-rate]');
    if (b) setRate(b.dataset.rate);
  });

  els.content.addEventListener('click', e => {
    if (state.oneHand || Date.now() < state.suppressClickUntil) return;
    const row = e.target.closest('.row');
    const cell = e.target.closest('.cell');
    if (!row || !cell || row.classList.contains('row-heading') || !state.section) return;
    const index = Number(row.dataset.rowIndex);
    const data = state.section.rows[index];
    if (!data) return;
    markCurrent(index);
    const lang = accentForClick(cell, e.clientX);
    if (cell.classList.contains('ja')) speak(data[1], lang, cell, '全文');
    else {
      const chunks = parseEnglish(data[1]).chunks;
      if (!chunks.length) {
        cell.classList.add('no-chunk'); setTimeout(() => cell.classList.remove('no-chunk'), 350); showToast('太字チャンクなし'); return;
      }
      speak(chunks.join(' / '), lang, cell, chunks.length === 1 ? 'チャンク' : `${chunks.length} chunks`);
    }
  });

  function isControlTarget(target) { return !!target.closest('.controls, select, button, .rate'); }
  document.addEventListener('touchstart', e => {
    if (!state.oneHand || e.touches.length !== 1 || isControlTarget(e.target)) return;
    const t=e.touches[0]; state.touch={x:t.clientX,y:t.clientY,time:performance.now()};
  },{passive:true});
  document.addEventListener('touchmove', e => {
    if (!state.oneHand || !state.touch || e.touches.length !== 1) return;
    const t=e.touches[0], dx=t.clientX-state.touch.x, dy=t.clientY-state.touch.y;
    if (Math.abs(dy)>9 && Math.abs(dy)>Math.abs(dx)*1.05) e.preventDefault();
  },{passive:false});
  document.addEventListener('touchend', e => {
    if (!state.oneHand || !state.touch) return;
    const t=e.changedTouches[0], dx=t.clientX-state.touch.x, dy=t.clientY-state.touch.y, elapsed=performance.now()-state.touch.time;
    state.touch=null; state.suppressClickUntil=Date.now()+500;
    const distance=Math.hypot(dx,dy);
    if (elapsed<=700 && distance<=18) { playRow(state.currentIndex); return; }
    if (elapsed>1200 || Math.abs(dy)<46 || Math.abs(dy)<=Math.abs(dx)*1.15) return;
    if (dy<0) nextAndPlay(); else previousAndPlay();
  },{passive:true});
  document.addEventListener('touchcancel',()=>{state.touch=null},{passive:true});
  document.addEventListener('click', e => {
    if (!state.oneHand || isControlTarget(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (Date.now()>=state.suppressClickUntil) playRow(state.currentIndex);
  },true);

  let scrollTimer;
  addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(()=>{
      const [w,s]=currentKey();
      if (w&&s) safeSet(storage.scroll(w,s),Math.max(0,scrollY));
      if (state.oneHand && !(speechSynthesis?.speaking || speechSynthesis?.pending)) {
        const near=nearestToCentre(); if (near>=0) markCurrent(near);
      }
    },120);
  },{passive:true});
  addEventListener('pagehide',()=>{
    const [w,s]=currentKey();
    if (w&&s) { safeSet(storage.scroll(w,s),Math.max(0,scrollY)); safeSet(storage.row(w,s),state.currentIndex); }
  });

  async function init() {
    if (!catalog.length) { els.content.innerHTML='<div class="reader-error">作品カタログを読み込めませんでした。</div>'; return; }
    fillWorks();
    installOneHandToggle();
    const storedRate=Number(safeGet(storage.rate,'1'));
    setRate([.86,1,1.12].includes(storedRate)?storedRate:1,false);
    state.oneHand=safeGet(storage.onehand,'0')==='1';
    const last=safeGet(storage.lastWork,'');
    await selectWork(catalog.some(w=>w.id===last)?last:catalog[0].id,true);
    setOneHand(state.oneHand,false);
    try { speechSynthesis.getVoices(); } catch (_) {}
  }

  init();
})();