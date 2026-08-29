(() => {
  const STORAGE_ONE = 'lit-onehand';
  const accent = 'en-GB';
  let oneHand = localStorage.getItem(STORAGE_ONE) === '1';
  let currentIndex = 0;
  let restoreKey = '';
  let scrollTimer = null;
  let decorateTimer = null;
  let navTimer = null;

  const controls = document.querySelector('.controls-in');
  const rateBar = document.querySelector('.rate');
  const content = document.getElementById('content');
  if (!controls || !rateBar || !content) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'oneHandToggle';
  toggle.className = 'onehand-toggle';
  toggle.setAttribute('aria-label', '片手モード');
  toggle.innerHTML = '<span></span>';
  controls.appendChild(toggle);

  const rocker = document.createElement('div');
  rocker.className = 'onehand-rocker';
  rocker.innerHTML = [
    '<button type="button" class="rocker-up" aria-label="同じ文を再生。再生中は一つ前へ"><span>⌃</span></button>',
    '<button type="button" class="rocker-down" aria-label="次の文へ"><span>⌄</span></button>'
  ].join('');
  document.body.appendChild(rocker);

  const keyNow = (prefix) => {
    const w = typeof currentWork === 'function' ? currentWork() : null;
    const sec = window.els?.section?.value || document.getElementById('sectionSelect')?.value || '';
    return w ? `${prefix}-${w.id}-${sec}` : `${prefix}-${sec}`;
  };

  const getRows = () => [...content.querySelectorAll('.reader .row')];

  function nearestRowToCentre() {
    const rows = getRows();
    if (!rows.length) return 0;
    const centre = window.innerHeight * 0.5;
    let best = 0;
    let dist = Infinity;
    rows.forEach((row, i) => {
      const r = row.getBoundingClientRect();
      const d = Math.abs((r.top + r.bottom) / 2 - centre);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  function savedIndex() {
    const raw = Number(localStorage.getItem(keyNow('lit-row')));
    const rows = getRows();
    return Number.isFinite(raw) && raw >= 0 && raw < rows.length ? raw : nearestRowToCentre();
  }

  function markCurrent(index) {
    const rows = getRows();
    if (!rows.length) return;
    currentIndex = Math.max(0, Math.min(index, rows.length - 1));
    rows.forEach((r, i) => r.classList.toggle('oh-current', i === currentIndex && oneHand));
    localStorage.setItem(keyNow('lit-row'), String(currentIndex));
  }

  function centreRow(index, smooth = true) {
    const row = getRows()[index];
    if (!row) return;
    row.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center', inline: 'nearest' });
  }

  function currentData() {
    const w = typeof currentWork === 'function' ? currentWork() : null;
    const sectionId = document.getElementById('sectionSelect')?.value;
    const s = w?.sections?.find(x => x.id === sectionId) || w?.sections?.[0];
    return { w, s };
  }

  function playCurrent(index = currentIndex, smooth = true) {
    const rows = getRows();
    const { s } = currentData();
    if (!rows.length || !s?.rows?.length) return;
    index = Math.max(0, Math.min(index, Math.min(rows.length, s.rows.length) - 1));
    markCurrent(index);
    centreRow(index, smooth);
    clearTimeout(navTimer);
    navTimer = setTimeout(() => {
      const row = getRows()[index];
      const en = row?.querySelector('.en');
      const text = s.rows[index]?.[1];
      if (en && text && typeof speak === 'function') speak(text, accent, en, '全文');
    }, smooth ? 180 : 0);
    updateMediaSession();
  }

  function moveSection(direction, targetEdge) {
    const { w, s } = currentData();
    if (!w || !s) return false;
    const idx = w.sections.findIndex(x => x.id === s.id);
    const next = idx + direction;
    if (next < 0 || next >= w.sections.length) return false;
    const secSelect = document.getElementById('sectionSelect');
    secSelect.value = w.sections[next].id;
    if (typeof render === 'function') render();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      decorate(false);
      const rows = getRows();
      const target = targetEdge === 'last' ? Math.max(0, rows.length - 1) : 0;
      playCurrent(target, true);
    }));
    return true;
  }

  function nextAndPlay() {
    const rows = getRows();
    if (!rows.length) return;
    if (currentIndex < rows.length - 1) playCurrent(currentIndex + 1);
    else moveSection(1, 'first') || playCurrent(currentIndex);
  }

  function previousAndPlay() {
    if (currentIndex > 0) playCurrent(currentIndex - 1);
    else moveSection(-1, 'last') || playCurrent(0);
  }

  function upperAction() {
    if (!oneHand) return;
    const isPlaying = !!(window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending));
    if (isPlaying) previousAndPlay();
    else playCurrent(currentIndex);
  }

  function lowerAction() {
    if (!oneHand) return;
    nextAndPlay();
  }

  function setMediaHandlers(on) {
    if (!('mediaSession' in navigator)) return;
    const set = (name, fn) => {
      try { navigator.mediaSession.setActionHandler(name, on ? fn : null); } catch (_) {}
    };
    set('play', () => playCurrent(currentIndex));
    set('pause', () => window.speechSynthesis?.cancel());
    set('previoustrack', previousAndPlay);
    set('nexttrack', nextAndPlay);
  }

  function updateMediaSession() {
    if (!oneHand || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    const { w, s } = currentData();
    if (!w || !s) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${w.title} · ${s.id}`,
        artist: 'English through Stories',
        album: `${currentIndex + 1} / ${s.rows.length}`
      });
    } catch (_) {}
  }

  function setOneHand(on, persist = true) {
    oneHand = !!on;
    if (persist) localStorage.setItem(STORAGE_ONE, oneHand ? '1' : '0');
    toggle.classList.toggle('active', oneHand);
    toggle.setAttribute('aria-pressed', oneHand ? 'true' : 'false');
    rocker.classList.toggle('active', oneHand);
    document.body.classList.toggle('onehand-on', oneHand);
    if (oneHand) {
      currentIndex = savedIndex();
      markCurrent(currentIndex);
      updateMediaSession();
    } else {
      getRows().forEach(r => r.classList.remove('oh-current'));
    }
    setMediaHandlers(oneHand);
  }

  function addProgressLabels() {
    const rows = getRows();
    const total = rows.length;
    rows.forEach((row, i) => {
      row.dataset.ohIndex = String(i);
      const ja = row.querySelector('.ja');
      if (!ja || ja.querySelector(':scope > .row-progress')) return;
      const p = document.createElement('span');
      p.className = 'row-progress';
      p.textContent = `${i + 1} / ${total}`;
      ja.prepend(p);
    });
  }

  function restoreScrollOnce() {
    const k = keyNow('lit-scroll');
    if (restoreKey === k) return;
    restoreKey = k;
    const y = Number(localStorage.getItem(k));
    if (Number.isFinite(y) && y > 0) {
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' })));
    }
  }

  function decorate(restore = true) {
    addProgressLabels();
    currentIndex = savedIndex();
    if (oneHand) markCurrent(currentIndex);
    if (restore) restoreScrollOnce();
    updateMediaSession();
  }

  const observer = new MutationObserver(() => {
    clearTimeout(decorateTimer);
    decorateTimer = setTimeout(() => decorate(true), 0);
  });
  observer.observe(content, { childList: true, subtree: false });

  content.addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (!row || !content.contains(row)) return;
    const idx = Number(row.dataset.ohIndex ?? getRows().indexOf(row));
    if (Number.isFinite(idx) && idx >= 0) {
      currentIndex = idx;
      localStorage.setItem(keyNow('lit-row'), String(idx));
      if (oneHand) markCurrent(idx);
      updateMediaSession();
    }
  }, true);

  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      localStorage.setItem(keyNow('lit-scroll'), String(Math.max(0, window.scrollY)));
      if (oneHand && !(speechSynthesis?.speaking || speechSynthesis?.pending)) {
        currentIndex = nearestRowToCentre();
        markCurrent(currentIndex);
      }
    }, 120);
  }, { passive: true });

  document.getElementById('workSelect')?.addEventListener('change', () => {
    restoreKey = '';
    setTimeout(() => decorate(true), 0);
  });
  document.getElementById('sectionSelect')?.addEventListener('change', () => {
    restoreKey = '';
    setTimeout(() => decorate(true), 0);
  });

  toggle.addEventListener('click', () => setOneHand(!oneHand));
  rocker.querySelector('.rocker-up').addEventListener('click', upperAction);
  rocker.querySelector('.rocker-down').addEventListener('click', lowerAction);

  decorate(true);
  setOneHand(oneHand, false);
})();
