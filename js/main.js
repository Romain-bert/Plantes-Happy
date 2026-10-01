/* =========================================================
   Plantes Happy – scénario de défilement
   1. L'arche s'ouvre        4. Hôtellerie (parallaxe)
   2. La plante (texte qui s'allume)   5. Bio (repères interactifs)
   3. Le rituel (anneau) puis la gamme (défilement horizontal)   6. Contact
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMQ = matchMedia('(max-width:860px)');

  /* ---------- Éléments ---------- */
  const header = $('.site-header');
  const progressBar = $('.progress i');
  const hero = $('#accueil');
  const heroStage = $('.hero-stage');
  const heroHead = $('.hero-head');
  const hint = $('.scroll-hint');
  const arch = $('#arch');
  const archImg = $('img', arch);
  const archDim = $('.arch-dim');
  const archLines = $$('.arch-copy span');
  const sections = $$('main > section, .site-footer');
  const navLinks = $$('[data-nav]');
  const scrubEl = $('#scrub');
  const ringFill = $('#ringFill');
  const ringTime = $('#ringTime');
  const steps = $$('[data-step]');
  const hs = $('#gamme');
  const hTrack = $('#hTrack');
  const parallax = $$('[data-speed]');

  let vw = innerWidth, vh = innerHeight;
  let w0 = 400, h0 = 400, b0 = 30, hMax = 0;
  let lenis = null;

  /* ---------- Texte « qui s'allume » ---------- */
  let words = [];
  if (scrubEl) {
    const text = scrubEl.textContent.trim().split(/\s+/);
    scrubEl.setAttribute('aria-label', text.join(' '));
    scrubEl.innerHTML = text.map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    words = $$('.w', scrubEl);
  }

  /* ---------- Mesures ---------- */
  function measure() {
    vw = innerWidth;
    vh = heroStage.clientHeight || innerHeight;
    b0 = vh * .04;
    w0 = Math.min(420, vw * .74);
    h0 = clamp(vh - heroHead.offsetHeight - b0 - 18, 220, vh * .56);

    if (mobileMQ.matches || reduce) {
      hs.style.height = '';
      hTrack.style.transform = '';
      hMax = 0;
    } else {
      const arc = parseFloat(getComputedStyle(hs).paddingBottom) || 0;
      hMax = Math.max(0, hTrack.scrollWidth - vw);
      hs.style.height = (hMax + vh + arc) + 'px';
    }
    update();
  }

  /* ---------- Mise à jour au défilement ---------- */
  let ticking = false;
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };

  function update() {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.transform = `scaleX(${docH > 0 ? clamp(y / docH) : 0})`;

    /* 1. Accueil : l'arche s'ouvre */
    const hr = hero.getBoundingClientRect();
    const total = hero.offsetHeight - vh;
    const p = reduce ? 0 : clamp(-hr.top / total);

    if (!reduce) {
      const e = easeInOut(clamp(p / .68));
      const w = lerp(w0, vw, e);
      const h = lerp(h0, vh, e);
      const r = (w / 2) * Math.pow(1 - e, 1.8);
      arch.style.width = w + 'px';
      arch.style.height = h + 'px';
      arch.style.marginBottom = lerp(b0, 0, e) + 'px';
      arch.style.borderRadius = `${r}px ${r}px 0 0`;
      archImg.style.transform = `scale(${lerp(1.16, 1, e)})`;
      archDim.style.opacity = clamp((p - .3) / .4);

      heroHead.style.opacity = 1 - clamp(p / .22);
      heroHead.style.transform = `translate3d(0,${-p * 140}px,0)`;
      if (hint) hint.style.opacity = 1 - clamp(p / .05);

      const t = clamp((p - .6) / .32);
      archLines.forEach((el, i) => {
        const v = clamp((t - i * .24) / .46);
        el.style.opacity = v;
        el.style.transform = `translate3d(0,${(1 - v) * 28}px,0)`;
      });
    }

    /* En-tête : thème selon la section survolée */
    let current = sections[0];
    for (const s of sections) { if (s.getBoundingClientRect().top <= 36) current = s; }
    let theme = current.dataset.theme || 'light';
    const inHero = current === hero;
    if (inHero) theme = p > .72 ? 'dark' : 'light';
    header.dataset.theme = theme;
    const compact = !(inHero && p < .3);
    header.classList.toggle('solid', compact && !(inHero && p > .72));
    header.classList.toggle('show-brand', compact);

    /* Navigation active */
    let activeId = '';
    for (const s of sections) {
      if (!s.id || s === hero) continue;
      const r = s.getBoundingClientRect();
      if (r.top <= vh * .4 && r.bottom > vh * .4) activeId = s.id;
    }
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.nav === activeId));

    /* 2. La plante : les mots s'allument */
    if (words.length && !reduce) {
      const r = scrubEl.getBoundingClientRect();
      const prog = clamp((vh * .85 - r.top) / (vh * .3 + r.height));
      const n = words.length;
      words.forEach((w, i) => w.classList.toggle('lit', i / n < prog * 1.04));
    }

    /* 3a. Le rituel : anneau et étapes */
    if (steps.length) {
      const mid = vh * .6;
      const rects = steps.map(s => s.getBoundingClientRect());
      const c0 = rects[0].top + rects[0].height / 2;
      const cN = rects[rects.length - 1].top + rects[rects.length - 1].height / 2;
      const pr = clamp((mid - c0) / (cN - c0));
      ringFill.style.strokeDashoffset = 942.48 * (1 - (.1 + .9 * pr));
      let best = 0, bestD = Infinity;
      rects.forEach((r, i) => {
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      steps.forEach((s, i) => s.classList.toggle('on', i === best));
      if (ringTime) ringTime.textContent = ['1 sachet', '200 ml d\u2019eau', '5 à 8 minutes'][best] || '';
    }

    /* 3b. La gamme : défilement horizontal */
    if (hMax > 0) {
      const r = hs.getBoundingClientRect();
      const hp = clamp(-r.top / hMax);
      hTrack.style.transform = `translate3d(${-hp * hMax}px,0,0)`;
    }

    /* 4. Parallaxe douce */
    if (!reduce) {
      parallax.forEach(img => {
        const f = img.parentElement.getBoundingClientRect();
        if (f.bottom < -100 || f.top > vh + 100) return;
        const speed = parseFloat(img.dataset.speed) || 0;
        const maxT = f.height * .07;
        const ty = clamp(-(f.top + f.height / 2 - vh / 2) * speed, -maxT, maxT);
        img.style.transform = `translate3d(0,${ty}px,0) scale(1.15)`;
      });
    }
  }

  /* ---------- Défilement fluide (Lenis) ---------- */
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .085, wheelMultiplier: .95, touchMultiplier: 1.3 });
    lenis.on('scroll', update);
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } else {
    addEventListener('scroll', schedule, { passive: true });
  }

  /* ---------- Ancres ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', ev => {
      const id = a.getAttribute('href');
      const target = id === '#accueil' ? document.body : $(id);
      if (!target) return;
      ev.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(id === '#accueil' ? 0 : target, { duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4) });
      else (id === '#accueil' ? scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
      if (id !== '#accueil') target.setAttribute('tabindex', '-1');
    });
  });

  /* ---------- Menu mobile ---------- */
  const burger = $('#burger');
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (lenis) (open ? lenis.stop() : lenis.start());
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Apparitions ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
  $$('.rv, .rv-lines, .rv-arch-soft').forEach(el => io.observe(el));

  /* Les cadres en arche sont masqués (clip-path) : on observe leur conteneur */
  const archIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      $$('.rv-arch', en.target).forEach((el, i) => setTimeout(() => el.classList.add('in'), i * 220));
      archIO.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  new Set($$('.rv-arch').map(el => el.parentElement)).forEach(c => archIO.observe(c));

  /* ---------- Repères sur la boîte (bio) ---------- */
  const hotData = [
    ['Ingrédients', 'Tous les ingrédients sont issus de l\u2019agriculture biologique. La composition complète figure sur chaque boîte.'],
    ['Certifié AB', 'Le label Agriculture Biologique garantit des plantes cultivées dans le respect du cahier des charges bio.'],
    ['Conseils d\u2019utilisation', 'Infuser 1 sachet dans 200 ml d\u2019eau frémissante pendant 5 à 8 minutes.'],
    ['Conservation', 'À conserver à l\u2019abri de la chaleur et de l\u2019humidité.'],
    ['Pensez au tri', 'L\u2019étui en carton se recycle. Le sachet se jette.']
  ];
  const hots = $$('.hot'), panel = $('.bio-panel'), hTitle = $('#hotTitle'), hText = $('#hotText');
  hots.forEach(btn => btn.addEventListener('click', () => {
    const [t, d] = hotData[+btn.dataset.hot];
    hots.forEach(b => b.classList.toggle('on', b === btn));
    hTitle.textContent = t; hText.textContent = d;
    panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
  }));
  if (hots[0]) hots[0].classList.add('on');

  /* ---------- Formulaire ---------- */
  const form = $('#contactForm'), note = $('#formNote');
  const CONTACT_EMAIL = 'contact@plantes-happy.fr'; // à remplacer par l'adresse réelle
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    const f = new FormData(form);
    let ok = true;
    ['nom', 'email', 'message'].forEach(k => {
      const el = form.elements[k];
      const bad = !String(f.get(k) || '').trim() || (k === 'email' && !/^\S+@\S+\.\S+$/.test(f.get(k)));
      el.setAttribute('aria-invalid', bad); if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Merci de renseigner votre nom, un e-mail valide et votre message.'; return; }
    const body = `${f.get('message')}\n\n${f.get('nom')}\n${f.get('email')}\n(${f.get('profil')})`;
    note.textContent = 'Votre messagerie s\u2019ouvre avec votre message prêt à envoyer.';
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Demande Plantes Happy')}&body=${encodeURIComponent(body)}`;
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Démarrage ---------- */
  addEventListener('resize', measure);
  mobileMQ.addEventListener('change', measure);
  measure();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(measure);

  const start = () => { document.documentElement.classList.add('ready'); measure(); };
  if (document.readyState === 'complete') start();
  else { addEventListener('load', start); setTimeout(start, 3000); }
})();
