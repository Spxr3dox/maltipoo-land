(() => {
  // ====== Theme handling ======
  const THEME_KEY = 'maltipoo-theme';
  const root = document.body;
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored);
  } else {
    applyTheme(sysDark.matches ? 'dark' : 'light');
  }

  sysDark.addEventListener('change', e => {
    if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
  });

  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // ====== Mobile menu ======
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        menuBtn.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
        nav.classList.remove('open');
        menuBtn.classList.remove('open');
      }
    });
  }

  // ====== Intersection Observer reveal ======
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ====== FAQ accordion ======
  document.querySelectorAll('.faq-item .faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      const group = item.parentElement;
      group.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ====== Image fallback ======
  document.querySelectorAll('.photo img').forEach(img => {
    img.addEventListener('error', () => { img.style.display = 'none'; });
    if (!img.loading) img.loading = 'lazy';
    img.decoding = 'async';
  });

  // ====== Header shadow on scroll ======
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 6) header.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      else header.style.boxShadow = 'none';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ====== Lightbox / gallery viewer ======
  const grid = document.getElementById('gallery-grid');
  const lb = document.getElementById('lightbox');
  if (!grid || !lb) return;

  const lbImg = document.getElementById('lb-image');
  const stage = document.getElementById('lb-stage');
  const counter = document.getElementById('lb-counter');
  const caption = document.getElementById('lb-caption');
  const dl = document.getElementById('lb-download');
  const spinner = document.getElementById('lb-spinner');

  const photoEls = Array.from(grid.querySelectorAll('.photo'));
  const slides = photoEls.map(el => ({
    src: el.dataset.full || el.querySelector('img').src,
    alt: el.querySelector('img').alt,
    caption: el.dataset.caption || (el.querySelector('.caption') ? el.querySelector('.caption').textContent : '')
  }));

  let idx = 0;
  let scale = 1, tx = 0, ty = 0;
  const MIN_S = 1, MAX_S = 4;

  function applyTransform() {
    lbImg.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ')';
    lbImg.classList.toggle('zoomed', scale > 1.01);
  }
  function resetTransform() { scale = 1; tx = 0; ty = 0; applyTransform(); }

  function show(i) {
    if (!slides.length) return;
    idx = (i + slides.length) % slides.length;
    const s = slides[idx];
    lbImg.classList.add('loading');
    spinner.classList.add('active');
    resetTransform();
    const probe = new Image();
    probe.onload = () => {
      lbImg.src = s.src;
      lbImg.alt = s.alt;
      lbImg.classList.remove('loading');
      spinner.classList.remove('active');
    };
    probe.onerror = () => {
      spinner.classList.remove('active');
      lbImg.classList.remove('loading');
    };
    probe.src = s.src;
    counter.textContent = (idx + 1) + ' / ' + slides.length;
    caption.textContent = s.caption;
    dl.href = s.src;
    const safe = (s.caption || 'maltipoo').replace(/[^\p{L}\d_-]+/gu, '_').slice(0, 40) || ('photo-' + (idx + 1));
    dl.setAttribute('download', 'maltipoo-' + safe + '.jpg');
  }

  function openAt(i) {
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-locked');
  }
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lb-locked');
    resetTransform();
  }
  function next() { show(idx + 1); }
  function prev() { show(idx - 1); }

  function zoomAt(delta, cx, cy) {
    const old = scale;
    const target = Math.min(MAX_S, Math.max(MIN_S, scale + delta));
    if (target === old) return;
    if (cx != null && cy != null) {
      const rect = lbImg.getBoundingClientRect();
      const ix = cx - (rect.left + rect.width / 2);
      const iy = cy - (rect.top + rect.height / 2);
      const k = target / old;
      tx = (tx - ix) * k + ix;
      ty = (ty - iy) * k + iy;
    }
    scale = target;
    if (scale <= MIN_S + 0.01) { tx = 0; ty = 0; scale = MIN_S; }
    applyTransform();
  }

  grid.addEventListener('click', e => {
    const el = e.target.closest('.photo');
    if (!el) return;
    const i = photoEls.indexOf(el);
    if (i >= 0) openAt(i);
  });

  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-prev').addEventListener('click', e => { e.stopPropagation(); prev(); });
  document.getElementById('lb-next').addEventListener('click', e => { e.stopPropagation(); next(); });
  document.getElementById('lb-zoom-in').addEventListener('click', e => { e.stopPropagation(); zoomAt(0.5, null, null); });
  document.getElementById('lb-zoom-out').addEventListener('click', e => {
    e.stopPropagation();
    scale = Math.max(MIN_S, scale - 0.5);
    if (scale <= MIN_S + 0.01) { tx = 0; ty = 0; scale = MIN_S; }
    applyTransform();
  });

  stage.addEventListener('click', e => {
    if (e.target === lbImg) return;
    close();
  });

  lbImg.addEventListener('dblclick', e => {
    e.preventDefault();
    if (scale > 1.01) resetTransform();
    else zoomAt(1, e.clientX, e.clientY);
  });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === '+' || e.key === '=') zoomAt(0.5, null, null);
    else if (e.key === '-' || e.key === '_') { scale = Math.max(MIN_S, scale - 0.5); if (scale <= MIN_S + 0.01) { tx = 0; ty = 0; scale = MIN_S; } applyTransform(); }
    else if (e.key === '0') resetTransform();
  });

  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0025;
    zoomAt(delta, e.clientX, e.clientY);
  }, { passive: false });

  // Mouse pan when zoomed
  let dragging = false, lastX = 0, lastY = 0;
  lbImg.addEventListener('mousedown', e => {
    if (scale <= 1.01) return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    lbImg.classList.add('dragging');
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; lbImg.classList.remove('dragging'); }
  });

  // Touch: swipe to nav + pan when zoomed + pinch
  let touchCount = 0;
  let pinchStart = 0, scaleStart = 1;
  let swipeX0 = 0, swipeY0 = 0, swipeMoved = false;
  let panX0 = 0, panY0 = 0, panTX0 = 0, panTY0 = 0;

  function dist(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }

  stage.addEventListener('touchstart', e => {
    touchCount = e.touches.length;
    if (touchCount === 2) {
      pinchStart = dist(e.touches[0], e.touches[1]);
      scaleStart = scale;
    } else if (touchCount === 1) {
      if (scale > 1.01) {
        panX0 = e.touches[0].clientX;
        panY0 = e.touches[0].clientY;
        panTX0 = tx; panTY0 = ty;
      } else {
        swipeX0 = e.touches[0].clientX;
        swipeY0 = e.touches[0].clientY;
        swipeMoved = false;
      }
    }
  }, { passive: true });

  stage.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = dist(e.touches[0], e.touches[1]);
      let ns = Math.min(MAX_S, Math.max(MIN_S, scaleStart * (d / pinchStart)));
      scale = ns;
      if (scale <= MIN_S + 0.01) { tx = 0; ty = 0; scale = MIN_S; }
      applyTransform();
    } else if (e.touches.length === 1) {
      if (scale > 1.01) {
        e.preventDefault();
        tx = panTX0 + (e.touches[0].clientX - panX0);
        ty = panTY0 + (e.touches[0].clientY - panY0);
        applyTransform();
      } else {
        const dx = e.touches[0].clientX - swipeX0;
        const dy = e.touches[0].clientY - swipeY0;
        if (Math.abs(dx) > 8 || swipeMoved) {
          swipeMoved = true;
          lbImg.classList.add('swiping');
          lbImg.style.transform = 'translate3d(' + dx + 'px,' + (dy * 0.3) + 'px,0) scale(1)';
        }
      }
    }
  }, { passive: false });

  stage.addEventListener('touchend', e => {
    if (touchCount === 1 && scale <= 1.01 && swipeMoved) {
      const t = e.changedTouches[0];
      const dx = t ? (t.clientX - swipeX0) : 0;
      const dy = t ? (t.clientY - swipeY0) : 0;
      lbImg.classList.remove('swiping');
      if (Math.abs(dy) > 120 && Math.abs(dy) > Math.abs(dx)) close();
      else if (dx > 60) prev();
      else if (dx < -60) next();
      else applyTransform();
    }
    touchCount = 0;
    swipeMoved = false;
  });
})();
