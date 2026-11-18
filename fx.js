/* Visuele effecten voor Rift Companion (geen externe bibliotheken).
   Respecteert 'minder beweging' en pauzeert zware animaties buiten beeld. */
'use strict';
window.RC_FX = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  let io = null, mo = null, heroStop = null, raf = 0;

  /* ---------- globaal: scrollbalk, header, spotlight, ripple ---------- */
  function init() {
    const bar = document.createElement('div'); bar.id = 'scrollbar'; document.body.appendChild(bar);
    const top = $('.top');
    const onScroll = () => {
      const h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
      bar.style.transform = `scaleX(${p})`;
      top?.classList.toggle('scrolled', h.scrollTop > 24);
      const st = $('.stepper'); if (st) { const r = st.getBoundingClientRect(); st.style.setProperty('--p', Math.max(0, Math.min(1, (innerHeight * .8 - r.top) / (r.height + 160))).toFixed(3)); }
    };
    addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(onScroll); }, { passive: true }); onScroll();

    if (fine && !reduce) {
      const spot = document.createElement('div'); spot.id = 'spot'; document.body.appendChild(spot);
      let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, ticking = false;
      const loop = () => { x += (tx - x) * .14; y += (ty - y) * .14; spot.style.transform = `translate(${x}px,${y}px)`; if (Math.abs(tx - x) + Math.abs(ty - y) > .5) requestAnimationFrame(loop); else ticking = false; };
      addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; spot.classList.add('on'); if (!ticking) { ticking = true; requestAnimationFrame(loop); } }, { passive: true });
      document.addEventListener('mouseleave', () => spot.classList.remove('on'));

      /* 3D-tilt via event-delegation: werkt ook voor later toegevoegde kaarten */
      let cur = null;
      document.addEventListener('mousemove', e => {
        const el = e.target.closest?.('.tilt'); if (cur && cur !== el) { cur.style.removeProperty('--rx'); cur.style.removeProperty('--ry'); }
        cur = el; if (!el) return;
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((.5 - py) * 9).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }, { passive: true });
      document.addEventListener('mouseout', e => { const el = e.target.closest?.('.tilt'); if (el && !el.contains(e.relatedTarget)) { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); } });
    }
    document.addEventListener('click', e => {
      const b = e.target.closest?.('.btn'); if (!b || reduce) return;
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
      s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s); setTimeout(() => s.remove(), 650);
    });

    /* nieuwe inhoud in #app automatisch decoreren (async pagina's zoals champion-detail) */
    const app = $('#app'); let pend = 0;
    mo = new MutationObserver(() => { clearTimeout(pend); pend = setTimeout(decorate, 40); });
    mo.observe(app, { childList: true });
  }

  /* ---------- onthullen bij scrollen ---------- */
  const SEL = '.prose h2,.prose .note,.panel,.card,.feat,.step,.lane-card,.stat,.adv,.sug,.rt-tree,.faq details,.tile,.showcase,.bignums,.band2,.stepper .st,.sec2,.glass,.toolbar,.tabs,.hero-search';
  function decorate() {
    const app = $('#app'); if (!app) return;
    if (!io) io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    const groups = new Map();
    $$(SEL, app).forEach(el => {
      if (el.dataset.fx || el.closest('.hero3')) return; el.dataset.fx = '1';
      const parent = el.parentElement, n = (groups.get(parent) || 0); groups.set(parent, n + 1);
      if (reduce) { el.classList.add('in'); return; }
      el.classList.add('reveal'); el.style.setProperty('--d', Math.min(n, 8) * 70 + 'ms');
      if (el.matches('.card,.feat,.lane-card,.tile')) el.classList.add('tilt');
      io.observe(el);
    });
    /* vangnet: staat een element al in beeld terwijl de observer nog niet heeft gevuurd (bijv. achtergrondtab), toon het alsnog */
    setTimeout(() => $$('.reveal:not(.in)', app).forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { el.classList.add('in'); io?.unobserve(el); } }), 700);
    $$('[data-count]', app).forEach(counter);
    $$('.faq details', app).forEach(accordion);
  }

  /* ---------- tellers ---------- */
  function counter(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    const to = +el.dataset.count, suf = el.dataset.suffix || '', fmt = n => Math.round(n).toLocaleString('nl-NL') + suf;
    if (reduce) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    const o = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; o.disconnect(); const t0 = performance.now(), d = 1600;
      const step = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
    o.observe(el);
  }

  /* ---------- vloeiende FAQ ---------- */
  function accordion(d) {
    if (d.dataset.acc) return; d.dataset.acc = '1';
    const sum = $('summary', d), body = document.createElement('div'); body.className = 'ans';
    while (sum.nextSibling) body.appendChild(sum.nextSibling); d.appendChild(body);
    sum.addEventListener('click', e => {
      e.preventDefault(); if (reduce) { d.open = !d.open; return; }
      if (d.open) { body.style.height = body.scrollHeight + 'px'; requestAnimationFrame(() => { body.style.transition = 'height .4s cubic-bezier(.2,.7,.2,1)'; body.style.height = '0px'; }); setTimeout(() => { d.open = false; body.style.height = ''; body.style.transition = ''; }, 400); }
      else { d.open = true; body.style.height = '0px'; body.style.transition = 'height .4s cubic-bezier(.2,.7,.2,1)'; requestAnimationFrame(() => body.style.height = body.scrollHeight + 'px'); setTimeout(() => { body.style.height = ''; body.style.transition = ''; }, 420); }
    });
  }

  /* ---------- hero: slideshow, deeltjes, parallax, rollend woord ---------- */
  function hero(opts) {
    if (heroStop) { heroStop(); heroStop = null; }
    const root = $('#hero3'); if (!root) return;
    const stops = [];
    /* slideshow met champion-art */
    const slides = $$('.hero-slide', root), art = opts.art || [], chip = $('#nowshow', root);
    let idx = 0, on = 0, timer = 0;
    const load = u => new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = u; });
    const show = async n => {
      const a = art[n]; if (!a || !slides.length) return; if (!await load(a.url)) return;
      const next = slides[(on + 1) % slides.length]; next.style.backgroundImage = `url(${a.url})`;
      next.classList.remove('on'); void next.offsetWidth; next.classList.add('on'); slides[on].classList.remove('on'); on = (on + 1) % slides.length;
      if (chip) { chip.href = a.href; $('img', chip).src = a.icon; $('span', chip).textContent = a.name; }
    };
    if (art.length) { show(0); if (!reduce) { timer = setInterval(() => { idx = (idx + 1) % art.length; show(idx); }, 7500); } }
    stops.push(() => clearInterval(timer));

    /* rollend woord */
    const roll = $('.roll > span', root);
    if (roll && !reduce) { let k = 0; const n = roll.children.length; const t = setInterval(() => { k = (k + 1) % (n + 1); roll.style.transition = k === 0 ? 'none' : ''; roll.style.transform = `translateY(-${k * 1.12}em)`; if (k === n) setTimeout(() => { roll.style.transition = 'none'; roll.style.transform = 'translateY(0)'; k = 0; }, 720); }, 2300); stops.push(() => clearInterval(t)); }

    /* parallax */
    if (fine && !reduce) {
      const mv = e => { const r = root.getBoundingClientRect(); root.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3)); root.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3)); };
      root.addEventListener('mousemove', mv, { passive: true }); stops.push(() => root.removeEventListener('mousemove', mv));
    }

    /* deeltjes-netwerk op canvas */
    const cv = $('#fxCanvas', root);
    if (cv && !reduce) {
      const ctx = cv.getContext('2d'); let w = 0, h = 0, P = [], run = true, visible = true, mx = -999, my = -999, id = 0;
      const dpr = Math.min(2, devicePixelRatio || 1);
      const size = () => { w = root.clientWidth; h = root.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.min(110, Math.round(w / 16)); P = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .28, vy: -.1 - Math.random() * .35, r: .6 + Math.random() * 1.8, g: Math.random() < .6, t: Math.random() * 6.28 })); };
      size(); const ro = new ResizeObserver(size); ro.observe(root);
      const pm = e => { const r = root.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }; root.addEventListener('mousemove', pm, { passive: true });
      const draw = () => {
        id = requestAnimationFrame(draw); if (!run || !visible) return;
        ctx.clearRect(0, 0, w, h);
        for (const p of P) {
          const dx = mx - p.x, dy = my - p.y, d2 = dx * dx + dy * dy; if (d2 < 26000) { p.vx += dx * 1e-5; p.vy += dy * 1e-5; }
          p.x += p.vx; p.y += p.vy; p.t += .03; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; } if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
          p.vx *= .995; ctx.globalAlpha = .35 + .4 * Math.sin(p.t) ** 2; ctx.fillStyle = p.g ? '#e8c880' : '#35e6d4'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        }
        ctx.lineWidth = .6;
        for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const a = P[i], b = P[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy; if (d < 9000) { ctx.globalAlpha = (1 - d / 9000) * .22; ctx.strokeStyle = '#7fe9de'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
      };
      draw();
      const vis = new IntersectionObserver(es => visible = es[0].isIntersecting); vis.observe(root);
      const vc = () => run = !document.hidden; document.addEventListener('visibilitychange', vc);
      stops.push(() => { cancelAnimationFrame(id); ro.disconnect(); vis.disconnect(); root.removeEventListener('mousemove', pm); document.removeEventListener('visibilitychange', vc); });
    }
    heroStop = () => stops.forEach(f => f());
  }

  /* wordt na elke paginarender aangeroepen */
  function onRoute() {
    const app = $('#app'); if (!app) return;
    if (!$('#hero3', app) && heroStop) { heroStop(); heroStop = null; }
    app.classList.remove('page-enter'); void app.offsetWidth; if (!reduce) app.classList.add('page-enter');
    decorate();
  }
  return { init, onRoute, hero, decorate };
})();
