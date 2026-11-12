/* ELEK SOLAR — site interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header state */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Mobile drawer */
  const drawer = $('.drawer');
  $$('[data-drawer-open]').forEach(b => b.addEventListener('click', () => { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; }));
  $$('[data-drawer-close]').forEach(b => b.addEventListener('click', () => { drawer.classList.remove('open'); document.body.style.overflow = ''; }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && drawer) { drawer.classList.remove('open'); document.body.style.overflow = ''; } });

  /* Reveal on scroll */
  const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal,.reveal-3d,.stat').forEach(el => io.observe(el));

  /* Counters */
  const cio = new IntersectionObserver((ents) => ents.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const t0 = performance.now(), dur = reduced ? 1 : 2000;
    const step = (now) => { const p = Math.min(1, (now - t0) / dur), v = to * (1 - Math.pow(1 - p, 3)); el.textContent = v.toFixed(dec); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* 3D tilt cards */
  if (!reduced && matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach(card => {
      if (!card.querySelector('.glare')) card.insertAdjacentHTML('beforeend', '<span class="glare"></span>');
      const max = parseFloat(card.dataset.tilt || 10);
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(1000px) rotateX(${(.5 - y) * max}deg) rotateY(${(x - .5) * max}deg) translateZ(0)`;
        card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%');
        card.style.setProperty('--px', (.5 - x) * 22 + 'px'); card.style.setProperty('--py', (.5 - y) * 22 + 'px');
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; card.style.setProperty('--px', '0px'); card.style.setProperty('--py', '0px'); });
    });
  }

  /* Missing images fade out gracefully */
  $$('img').forEach(img => img.addEventListener('error', () => img.classList.add('img-missing')));

  /* Scroll-driven 3D photo ring */
  $$('.ring3d-wrap').forEach(wrap => {
    const ring = $('.ring3d', wrap), bars = $$('.ring3d-progress i', wrap);
    let mx = 0;
    wrap.addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5) * 20; upd(); });
    const upd = () => {
      const r = wrap.getBoundingClientRect(), tot = r.height - innerHeight;
      const p = tot > 0 ? Math.min(1, Math.max(0, -r.top / tot)) : ((innerHeight - r.top) / (innerHeight + r.height));
      ring.style.setProperty('--rot', (-p * 300 + mx) + 'deg');
      bars.forEach((b, i) => b.style.setProperty('--f', Math.min(1, Math.max(0, p * bars.length - i))));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  });

  /* Process line + lit steps */
  $$('.process').forEach(pr => {
    const line = pr.querySelector('.process__line'), steps = $$('.step', pr);
    const upd = () => {
      const r = pr.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .75 - r.top) / (r.height + innerHeight * .2)));
      if (line) line.style.setProperty('--p', p);
      steps.forEach((s, i) => s.classList.toggle('lit', p > (i + .3) / steps.length));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  });

  /* Testimonials coverflow */
  $$('.coverflow').forEach(cf => {
    const cards = $$('.tcard', cf), dots = cf.parentElement.querySelector('.cf-dots');
    let i = 0, timer;
    if (dots) dots.innerHTML = cards.map(() => '<i></i>').join('');
    const render = () => {
      const narrow = innerWidth < 700;
      cards.forEach((c, k) => {
        let o = k - i; const n = cards.length;
        if (o > n / 2) o -= n; if (o < -n / 2) o += n;
        const a = Math.abs(o);
        c.style.transform = narrow
          ? `translateX(${o * 105}%) scale(${1 - a * .1})`
          : `translateX(${o * 62}%) translateZ(${-a * 260}px) rotateY(${-o * 32}deg)`;
        c.style.opacity = a > (narrow ? 0 : 1.5) ? 0 : 1 - a * .35;
        c.style.zIndex = 10 - a; c.style.filter = a ? 'saturate(.6)' : 'none';
        c.style.pointerEvents = a > 1.5 ? 'none' : 'auto';
      });
      if (dots) $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i));
    };
    const go = (d) => { i = (i + d + cards.length) % cards.length; render(); };
    cards.forEach((c, k) => c.addEventListener('click', () => { i = k; render(); }));
    const wrap = cf.parentElement;
    wrap.querySelector('[data-prev]')?.addEventListener('click', () => go(-1));
    wrap.querySelector('[data-next]')?.addEventListener('click', () => go(1));
    let sx = null; cf.addEventListener('pointerdown', e => sx = e.clientX);
    cf.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 40) go(e.clientX < sx ? 1 : -1); sx = null; });
    const auto = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => go(1), 6000); };
    cf.addEventListener('pointerenter', () => clearInterval(timer)); cf.addEventListener('pointerleave', auto);
    addEventListener('resize', render); render(); auto();
  });

  /* FAQ search */
  const fq = $('#faq-q');
  if (fq) fq.addEventListener('input', () => {
    const q = fq.value.trim().toLowerCase(); let shown = 0;
    $$('.faq details').forEach(d => { const m = !q || d.textContent.toLowerCase().includes(q); d.style.display = m ? '' : 'none'; if (m) shown++; });
    $('.faq-empty').style.display = shown ? 'none' : 'block';
  });

  /* Blog filter */
  const filters = $('.filters');
  if (filters) {
    const apply = (cat) => {
      $$('button', filters).forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
      $$('.posts .post').forEach(p => p.classList.toggle('hide', cat !== 'all' && !p.dataset.cats.split('|').includes(cat)));
    };
    filters.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; apply(b.dataset.cat); try { history.replaceState(null, '', b.dataset.cat === 'all' ? '#' : '#' + b.dataset.cat); } catch (_) { } });
    const fromHash = () => { const h = location.hash.slice(1); apply($$('button', filters).some(b => b.dataset.cat === h) ? h : 'all'); };
    addEventListener('hashchange', fromHash); fromHash();
  }

  /* Forms (front-end validation + success state).
     To connect a CRM / email service, set data-endpoint="https://..." on the <form>. */
  const validate = (form, scope = form) => {
    let ok = true;
    $$('input,select,textarea', scope).forEach(f => {
      const wrap = f.closest('.field'); if (!wrap) return;
      let bad = f.required && !f.value.trim();
      if (!bad && f.type === 'email' && f.value) bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value);
      if (!bad && f.type === 'tel' && f.value) bad = f.value.replace(/\D/g, '').length < 10;
      wrap.classList.toggle('invalid', bad); if (bad) ok = false;
    });
    const radios = $$('input[type=radio][required]', scope);
    if (radios.length && !radios.some(r => r.checked)) {
      ok = false; const q = scope.querySelector('.q'); if (q) { q.style.color = '#d93025'; setTimeout(() => q.style.color = '', 2000); }
    }
    return ok;
  };
  $$('form[data-form]').forEach(form => {
    form.setAttribute('novalidate', '');
    form.addEventListener('input', e => e.target.closest('.field')?.classList.remove('invalid'));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate(form)) { form.querySelector('.invalid input,.invalid select,.invalid textarea')?.focus(); return; }
      const ep = form.dataset.endpoint;
      if (ep) { try { await fetch(ep, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }); } catch (_) { } }
      form.classList.add('sent');
    });
  });

  /* Multi-step savings form */
  $$('form[data-steps]').forEach(form => {
    const steps = $$('.fstep', form), bars = $$('.stepper i', form); let s = 0;
    const show = () => { steps.forEach((st, k) => st.classList.toggle('on', k === s)); bars.forEach((b, k) => b.classList.toggle('on', k <= s)); };
    form.addEventListener('click', e => {
      if (e.target.closest('[data-next-step]')) { e.preventDefault(); if (validate(form, steps[s])) { s = Math.min(steps.length - 1, s + 1); show(); } }
      if (e.target.closest('[data-prev-step]')) { e.preventDefault(); s = Math.max(0, s - 1); show(); }
    });
    const bill = $('#bill', form), billOut = $('#bill-out', form);
    if (bill) { const u = () => { billOut.textContent = '$' + bill.value; bill.style.setProperty('--fill', ((bill.value - bill.min) / (bill.max - bill.min) * 100) + '%'); }; bill.addEventListener('input', u); u(); }
    show();
  });

  /* Solar cost calculator */
  const calc = $('#calc');
  if (calc) {
    const STATES = { FL: { sun: 5.2, rate: .15 }, GA: { sun: 4.8, rate: .14 }, SC: { sun: 4.9, rate: .14 }, OT: { sun: 4.6, rate: .16 } };
    const SHADE = { full: 1, partial: .86, heavy: .72 };
    const st = { state: 'FL', shade: 'full' };
    const el = (id) => $('#' + id);
    const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
    const seg = (name) => $$(`[data-seg="${name}"] button`).forEach(b => b.addEventListener('click', () => {
      st[name] = b.dataset.v; $$(`[data-seg="${name}"] button`).forEach(x => x.classList.toggle('on', x === b));
      if (name === 'state') el('c-rate').value = STATES[b.dataset.v].rate.toFixed(2);
      run();
    }));
    seg('state'); seg('shade');
    const viz = el('c-viz'); viz.innerHTML = '<i></i>'.repeat(48);
    const barsEl = el('c-bars'); barsEl.innerHTML = '<i></i>'.repeat(25);
    const run = () => {
      const bill = +el('c-bill').value, rate = Math.max(.05, +el('c-rate').value || .15), ppw = Math.max(1, +el('c-ppw').value || 2.85);
      const credit = Math.min(60, Math.max(0, +el('c-credit').value || 0)) / 100, esc = Math.max(0, +el('c-esc').value || 0) / 100;
      const offset = +el('c-offset').value / 100;
      el('c-bill-out').textContent = '$' + bill; el('c-offset-out').textContent = Math.round(offset * 100) + '%';
      ['c-bill', 'c-offset'].forEach(id => { const r = el(id); r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); });
      const kwhYr = bill / rate * 12 * offset;
      const prodPerKw = STATES[st.state].sun * 365 * .8 * SHADE[st.shade];
      const kw = kwhYr / prodPerKw;
      const panels = Math.ceil(kw * 1000 / 410);
      const gross = kw * 1000 * ppw, net = gross * (1 - credit);
      const yr1 = kwhYr * rate;
      let total = 0, pay = null, cum = 0; const yearly = [];
      for (let y = 0; y < 25; y++) { const v = yr1 * Math.pow(1 + esc, y) * Math.pow(.995, y); total += v; cum += v; yearly.push(v); if (pay === null && cum >= net) pay = y + 1 - (cum - net) / v; }
      el('c-size').textContent = kw.toFixed(1) + ' kW';
      el('c-panels').textContent = panels;
      el('c-gross').textContent = money(gross);
      el('c-net').textContent = money(net);
      el('c-yr1').textContent = money(yr1);
      el('c-total').textContent = money(total - net);
      el('c-pay').textContent = pay ? pay.toFixed(1) + ' yrs' : '25+ yrs';
      el('c-co2').textContent = (kwhYr * .000417).toFixed(1) + ' t';
      const on = Math.min(48, Math.round(panels / Math.max(48, panels) * 48 * (panels > 48 ? 1 : 1)));
      $$('i', viz).forEach((c, k) => c.classList.toggle('on', k < Math.min(48, panels)));
      el('c-viz-note').textContent = panels > 48 ? `${panels} panels (showing 48)` : `${panels} panels`;
      let c2 = -net; const mx = Math.max(...yearly.map((_, k) => Math.abs(yearly.slice(0, k + 1).reduce((a, b) => a + b, 0) - net)), 1);
      $$('i', barsEl).forEach((b, k) => { c2 += yearly[k]; b.style.height = Math.max(3, Math.abs(c2) / mx * 100) + '%'; b.style.opacity = c2 < 0 ? .35 : 1; });
    };
    $$('input', calc).forEach(i => i.addEventListener('input', run));
    run();
  }

  /* Footer year */
  $$('[data-year]').forEach(e => e.textContent = new Date().getFullYear());
})();
