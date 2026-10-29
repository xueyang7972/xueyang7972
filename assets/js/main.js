/* =========================================================
   薛杨 · 个人主页 — interactions
   Vanilla JS · no dependencies · motion-aware
   ========================================================= */
(function () {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- 1. hero title split ---------- */
  function splitTitle() {
    const nodes = doc.querySelectorAll('[data-split]');
    let global = 0;
    nodes.forEach((el) => {
      const text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      const frag = doc.createDocumentFragment();
      let i = global;
      for (const ch of text) {
        if (ch === ' ') {
          frag.appendChild(doc.createTextNode(' '));
          continue;
        }
        const span = doc.createElement('span');
        span.className = 'ch';
        span.style.setProperty('--i', i++);
        span.textContent = ch;
        frag.appendChild(span);
      }
      global = i;
      el.textContent = '';
      el.appendChild(frag);
    });
  }

  /* ---------- 2. scroll reveal ---------- */
  const revealTargets = [];
  function initReveal() {
    const nodes = doc.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(n => n.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    nodes.forEach(n => io.observe(n));
  }

  /* ---------- 3. counters ---------- */
  function initCounters() {
    const nums = doc.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const dur = 1900;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 4);
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const val = target * ease(p);
        el.textContent = decimals ? val.toFixed(decimals) : String(Math.round(val));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = decimals ? target.toFixed(decimals) : String(target);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (reduce.matches) {
            const t = parseFloat(e.target.dataset.count);
            const d = parseInt(e.target.dataset.decimals || '0', 10);
            e.target.textContent = d ? t.toFixed(d) : String(t);
          } else {
            e.target.textContent = '0';
            run(e.target);
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- 4. nav state / progress / active link ---------- */
  function initNav() {
    const nav = doc.getElementById('nav');
    const bar = doc.getElementById('progressBar');
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const h = doc.documentElement.scrollHeight - window.innerHeight;

      if (nav) {
        nav.classList.toggle('is-solid', y > 40);
        const down = y > lastY && y > 380;
        nav.classList.toggle('is-hidden', down && !doc.body.classList.contains('menu-open'));
        if (y <= 40) nav.classList.remove('is-hidden');
      }
      if (bar && h > 0) {
        const p = Math.min(1, Math.max(0, y / h));
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      }
      lastY = y;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();

    // active section
    const links = Array.from(doc.querySelectorAll('.nav__links a'));
    const map = new Map();
    links.forEach(a => {
      const id = a.getAttribute('href');
      const sec = id && id.length > 1 ? doc.querySelector(id) : null;
      if (sec) map.set(sec, a);
    });
    if ('IntersectionObserver' in window && map.size) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            links.forEach(l => l.classList.remove('is-active'));
            const a = map.get(e.target);
            if (a) a.classList.add('is-active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      map.forEach((_, sec) => io.observe(sec));
    }
  }

  /* ---------- 5. parallax ---------- */
  function initParallax() {
    const items = Array.from(doc.querySelectorAll('[data-parallax]'));
    if (!items.length || reduce.matches || window.innerWidth < 900) return;

    let raf = null;
    const run = () => {
      const vh = window.innerHeight;
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.setProperty('--py', offset.toFixed(2) + 'px');
      });
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    run();
  }

  /* ---------- 5b. hero scroll fade ---------- */
  function initHeroScroll() {
    const hero = doc.querySelector('.hero');
    if (!hero) return;
    const inner = hero.querySelector('.hero__inner');
    const cue = hero.querySelector('.hero__scroll');
    if (!inner || reduce.matches) return;

    let raf = null;
    const run = () => {
      const y = window.scrollY;
      const h = hero.offsetHeight || window.innerHeight;
      if (y <= h) {
        inner.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0)';
        inner.style.opacity = String(Math.max(0, 1 - y / (h * 0.92)));
        if (cue) cue.style.opacity = String(Math.max(0, 1 - y / 320));
      }
      raf = null;
    };
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(run);
    }, { passive: true });
    run();
  }

  /* ---------- 5c. image sliders ---------- */
  function initSliders() {
    const sliders = doc.querySelectorAll('[data-slider]');
    if (!sliders.length) return;

    sliders.forEach((el) => {
      const imgs = Array.from(el.querySelectorAll('.slider__stage img'));
      if (imgs.length < 2) return;

      const dotsWrap = el.querySelector('.slider__dots');
      const label = el.querySelector('[data-slide-label]');
      const interval = parseInt(el.dataset.autoplay || '0', 10);
      let index = 0;
      let timer = null;
      let paused = false;
      let visible = true;

      const dots = imgs.map((img, i) => {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'slider__dot' + (i === 0 ? ' is-active' : '');
        b.setAttribute('aria-label', '第 ' + (i + 1) + ' 张：' + (img.dataset.label || ''));
        b.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        b.addEventListener('click', () => { go(i); restart(); });
        if (dotsWrap) dotsWrap.appendChild(b);
        return b;
      });

      function go(i) {
        index = (i + imgs.length) % imgs.length;
        imgs.forEach((img, k) => img.classList.toggle('is-active', k === index));
        dots.forEach((d, k) => {
          d.classList.toggle('is-active', k === index);
          d.setAttribute('aria-current', k === index ? 'true' : 'false');
        });
        if (label) label.textContent = imgs[index].dataset.label || '';
      }

      function tick() {
        if (paused || !visible || doc.hidden) return;
        go(index + 1);
      }

      function restart() {
        clearInterval(timer);
        timer = null;
        if (interval > 0 && !reduce.matches) timer = setInterval(tick, interval);
      }

      el.addEventListener('pointerenter', () => { paused = true; });
      el.addEventListener('pointerleave', () => { paused = false; });
      el.addEventListener('focusin', () => { paused = true; });
      el.addEventListener('focusout', () => { paused = false; });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((e) => { visible = e.isIntersecting; });
        }, { threshold: 0.2 }).observe(el);
      }

      go(0);
      restart();
    });
  }

  /* ---------- 6. mobile menu ---------- */
  function initMenu() {
    const btn = doc.getElementById('menuBtn');
    const menu = doc.getElementById('mobileMenu');
    if (!btn || !menu) return;

    const setOpen = (open) => {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      menu.classList.toggle('is-open', open);
      doc.body.classList.toggle('menu-open', open);
      doc.body.style.overflow = open ? 'hidden' : '';
    };

    btn.addEventListener('click', () => {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && btn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  }

  /* ---------- 7. copy email + toast ---------- */
  function initCopy() {
    const toast = doc.getElementById('toast');
    let timer = null;
    const show = (msg) => {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('is-show');
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove('is-show'), 2200);
    };

    const btn = doc.getElementById('copyMail');
    if (btn) {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy || '';
        try {
          await navigator.clipboard.writeText(text);
          show('邮箱已复制 · ' + text);
        } catch (err) {
          const ta = doc.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          doc.body.appendChild(ta);
          ta.select();
          try { doc.execCommand('copy'); show('邮箱已复制 · ' + text); }
          catch (e2) { show('邮箱：' + text); }
          doc.body.removeChild(ta);
        }
      });
    }
  }

  /* ---------- 8. image lightbox (certs / photos / proof) ---------- */
  function initLightbox() {
    const box = doc.getElementById('lightbox');
    const img = doc.getElementById('lightboxImg');
    const cap = doc.getElementById('lightboxCap');
    const closeBtn = doc.getElementById('lightboxClose');
    if (!box || !img || !closeBtn) return;

    let lastFocus = null;

    const open = (src, alt, label) => {
      lastFocus = doc.activeElement;
      img.src = src;
      img.alt = alt || '';
      if (cap) cap.textContent = label || '';
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      doc.body.style.overflow = 'hidden';
      closeBtn.focus({ preventScroll: true });
    };

    const close = () => {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      doc.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };

    const labelOf = (el, inner) => {
      const attr = el.getAttribute('data-caption');
      if (attr) return attr;
      if (!inner) return '';
      const t = el.querySelector('.shot__title');
      if (t) {
        const s = el.querySelector('.shot__sub');
        return t.textContent + (s ? ' · ' + s.textContent : '');
      }
      const fig = el.querySelector('figcaption');
      return fig ? fig.textContent.replace(/\s+/g, ' ').trim() : '';
    };

    const triggers = doc.querySelectorAll('.cert, .shot, [data-lightbox]');
    triggers.forEach((el) => {
      const inner = el.querySelector('img');
      const direct = el.getAttribute('data-lightbox');
      if (!inner && !direct) return;
      const trigger = () => {
        const src = direct || (inner ? (inner.currentSrc || inner.src) : '');
        if (!src) return;
        const label = labelOf(el, inner);
        open(src, inner ? inner.alt : label, label);
      };
      if (el.tagName !== 'BUTTON') {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
      }
      el.addEventListener('click', trigger);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          trigger();
        }
      });
    });

    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box.classList.contains('is-open')) close();
    });
  }

  /* ---------- 9. anchor offset for in-page links ---------- */
  function initAnchors() {
    doc.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = doc.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: Math.max(0, top), behavior: reduce.matches ? 'auto' : 'smooth' });
        try { if (history.pushState) history.pushState(null, '', id); } catch (err) { /* file:// */ }
      });
    });
  }

  /* ---------- 10. subtle pointer tilt on project cards ---------- */
  function initTilt() {
    if (isTouch || reduce.matches) return;
    doc.querySelectorAll('.project').forEach(card => {
      const media = card.querySelector('.project__media');
      if (!media) return;
      let raf = null;
      card.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          media.style.transform = 'perspective(1000px) rotateY(' + (x * 2.2).toFixed(2) + 'deg) rotateX(' + (-y * 2).toFixed(2) + 'deg)';
          raf = null;
        });
      });
      card.addEventListener('pointerleave', () => {
        media.style.transform = '';
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    root.classList.add('js');
    splitTitle();
    initReveal();
    initCounters();
    initNav();
    initParallax();
    initHeroScroll();
    initSliders();
    initMenu();
    initCopy();
    initLightbox();
    initAnchors();
    initTilt();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
