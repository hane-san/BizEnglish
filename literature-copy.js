(() => {
  const HOLD_MS = 1900;
  const MOVE_CANCEL = 14;
  const DESKTOP_COPY_QUERY = '(min-width: 801px) and (hover: hover) and (pointer: fine)';
  let state = null;
  let suppressClickUntil = 0;

  const oneHandOn = () => localStorage.getItem('lit-onehand') === '1';
  const desktopCopyOn = () => {
    try { return window.matchMedia(DESKTOP_COPY_QUERY).matches; } catch (_) { return false; }
  };

  function installDesktopHotspots() {
    const cells = document.querySelectorAll('.reader .row:not(.row-heading) .cell.en');
    cells.forEach(cell => {
      const existing = cell.querySelector('.desktop-copy-hotspot');
      if (!desktopCopyOn()) {
        existing?.remove();
        cell.classList.remove('has-desktop-copy');
        return;
      }
      if (existing) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'desktop-copy-hotspot';
      button.setAttribute('aria-label', 'この英文をコピー');
      button.title = 'Copy English';
      button.innerHTML = '<span aria-hidden="true">⧉</span>';
      cell.appendChild(button);
      cell.classList.add('has-desktop-copy');
    });
  }

  function clearState(removeReady = true) {
    if (!state) return;
    clearTimeout(state.timer);
    if (removeReady && state.cell) state.cell.classList.remove('copy-ready');
    state = null;
  }

  function arm(cell, x, y, pointerId) {
    if (oneHandOn()) return;
    clearState();
    state = {
      cell,
      x,
      y,
      pointerId,
      ready: false,
      timer: setTimeout(() => {
        if (!state || state.cell !== cell || oneHandOn()) return;
        state.ready = true;
        cell.classList.add('copy-ready');
        try { navigator.vibrate?.(18); } catch (_) {}
      }, HOLD_MS)
    };
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    return fallbackCopy(text);
  }

  async function finish(cell, explicitText = '') {
    const text = (explicitText || cell.querySelector('.en-text')?.textContent || cell.textContent).trim();
    const ok = text ? await copyText(text) : false;
    cell.classList.remove('copy-ready');
    cell.classList.add(ok ? 'copy-done' : 'copy-failed');
    setTimeout(() => cell.classList.remove('copy-done', 'copy-failed'), 650);
    suppressClickUntil = Date.now() + 650;
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.desktop-copy-hotspot')) { clearState(); return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const cell = e.target.closest('.cell.en');
    if (!cell || oneHandOn()) return;
    arm(cell, e.clientX, e.clientY, e.pointerId);
  }, true);

  document.addEventListener('pointermove', (e) => {
    if (!state || e.pointerId !== state.pointerId) return;
    if (Math.hypot(e.clientX - state.x, e.clientY - state.y) > MOVE_CANCEL) clearState();
  }, true);

  document.addEventListener('pointerup', (e) => {
    if (!state || e.pointerId !== state.pointerId) return;
    const { cell, ready } = state;
    clearTimeout(state.timer);
    state = null;
    if (ready && !oneHandOn()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      finish(cell);
    } else {
      cell.classList.remove('copy-ready');
    }
  }, true);

  document.addEventListener('pointercancel', () => clearState(), true);
  window.addEventListener('blur', () => clearState(), true);

  document.addEventListener('contextmenu', (e) => {
    if (!oneHandOn() && e.target.closest('.cell.en')) e.preventDefault();
  }, true);

  document.addEventListener('click', (e) => {
    const button = e.target.closest('.desktop-copy-hotspot');
    if (button && desktopCopyOn()) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const cell = button.closest('.cell.en');
      if (!cell) return;
      finish(cell);
      button.classList.add('copied');
      button.innerHTML = '<span aria-hidden="true">✓</span>';
      setTimeout(() => {
        button.classList.remove('copied');
        button.innerHTML = '<span aria-hidden="true">⧉</span>';
      }, 650);
      return;
    }
    if (Date.now() < suppressClickUntil && e.target.closest('.cell.en')) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('literature:rendered', installDesktopHotspots);
  window.addEventListener('resize', installDesktopHotspots, {passive:true});
  installDesktopHotspots();
})();
