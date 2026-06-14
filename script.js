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
      // Close siblings inside the same .faq group
      const group = item.parentElement;
      group.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ====== Image fallback ======
  // If an image fails to load, hide it so the gradient + emoji fallback shows.
  document.querySelectorAll('.photo img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
    });
    // Lazy hint
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
})();
