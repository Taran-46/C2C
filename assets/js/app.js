/* ============================================================
   CODE2CHILL — interaction engine
   ============================================================ */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOUCH = matchMedia('(hover: none)').matches || innerWidth < 900;

  const raf = (fn) => requestAnimationFrame(fn);

  document.documentElement.classList.remove('no-js');

  /* ══════════════════════════════════════════════════════════
     0. THEME — night by default, "chill" on request
     ══════════════════════════════════════════════════════════ */
  const THEME_KEY = 'c2c-theme';
  const root = document.documentElement;
  const modeBtn = $('#modeBtn');
  const cmdTheme = $('#cmdTheme');
  const PAL = {};
  let theme = 'night';

  function readPaletteColors() {
    const cs = getComputedStyle(document.documentElement);
    ['--bg','--ink','--ink-2','--blue','--blue-lt','--blue-ice','--panel'].forEach((k) => {
      PAL[k.replace('--','')] = cs.getPropertyValue(k).trim();
    });
  }

  const readTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  };

  const applyTheme = (mode, fx) => {
    theme = mode === 'light' ? 'light' : 'night';
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');

    if (modeBtn) {
      modeBtn.setAttribute('aria-pressed', String(theme === 'light'));
      modeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to night mode' : 'Switch to light mode');
    }
    if (cmdTheme) cmdTheme.textContent = theme;
    if (typeof window.__setGLTheme === 'function') window.__setGLTheme(theme === 'light' ? 1 : 0);
    readPaletteColors();
    if (fx) runWipe(fx);
  };

  const runWipe = (from) => {
    if (RM || !document.body) { return; }
    const w = document.createElement('div');
    w.className = 'theme-wipe';
    w.style.setProperty('--wx', from.x + 'px');
    w.style.setProperty('--wy', from.y + 'px');
    w.style.setProperty('--wipe-c', theme === 'light' ? '#f5f2e9' : '#0a1020');
    document.body.appendChild(w);
    const r = Math.hypot(Math.max(from.x, innerWidth - from.x), Math.max(from.y, innerHeight - from.y));
    w.animate(
      [{ clipPath: 'circle(0px)' }, { clipPath: `circle(${r}px)` }],
      { duration: 760, easing: 'cubic-bezier(.55,0,.2,1)', fill: 'forwards' }
    ).finished.then(() => {
      w.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: 'forwards' })
        .finished.then(() => w.remove());
    }).catch(() => w.remove());
  };

  applyTheme(readTheme(), null);

  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      const r = modeBtn.getBoundingClientRect();
      const next = theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, next === 'light' ? 'light' : 'dark'); } catch (e) {}
      applyTheme(next, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
  }

  /* ══════════════════════════════════════════════════════════
     1. PRELOADER
     ══════════════════════════════════════════════════════════ */
  const pl = $('#pl');
  const plPct = $('#plPct');
  const plBar = $('#plBar');
  const plTicker = $('#plTicker');

  const bootLines = [
    'initialising build club',
    'loading night schedule',
    'warming the deploy pipeline',
    'brewing chai',
    'closing laptops at 21:30',
    'done — come on in',
  ];
  let bootIdx = 0;

  const setBootMsg = () => {
    if (!plTicker) return;
    plTicker.style.opacity = 0;
    setTimeout(() => {
      plTicker.textContent = bootLines[bootIdx % bootLines.length];
      bootIdx++;
      plTicker.style.opacity = 1;
    }, 200);
  };
  if (plTicker) {
    plTicker.textContent = bootLines[0];
    plTicker.style.transition = 'opacity .25s';
  }

  let pct = 0;
  let done = false;
  const tickBoot = () => {
    if (done) return;
    pct = Math.min(100, pct + Math.random() * 9 + 2.5);
    if (plPct) plPct.textContent = String(Math.floor(pct)).padStart(3, '0');
    if (plBar) plBar.style.width = pct + '%';
    if (pct >= 100) {
      done = true;
      setTimeout(finishBoot, 340);
    } else {
      setTimeout(tickBoot, 90 + Math.random() * 130);
    }
  };
  setInterval(() => { if (!done) setBootMsg(); }, 620);

  function finishBoot() {
    if (!pl) return;
    pl.classList.add('done');
    document.body.classList.remove('lock');
    document.documentElement.classList.remove('lock');
    document.body.classList.add('ready');
    startHero();
    setTimeout(() => { pl.style.display = 'none'; }, 1300);
  }

  if (pl && RM) {
    // reduced motion: don't make anyone sit through a fake boot sequence
    pl.style.display = 'none';
    document.body.classList.add('ready');
    startHero();
  } else if (pl) {
    document.body.classList.add('lock');
    setTimeout(tickBoot, 180);
    setTimeout(() => { if (!done) { done = true; finishBoot(); } }, 4200);
  } else {
    document.body.classList.add('ready');
    startHero();
  }

  /* ══════════════════════════════════════════════════════════
     2. CUSTOM CURSOR
     ══════════════════════════════════════════════════════════ */
  const cursor = $('#cursor');
  const cLabel = $('#cursor span');

  if (cursor && !TOUCH) {
    let mx = innerWidth / 2, my = innerHeight / 2;
    let cx = mx, cy = my, dx = mx, dy = my;
    let visible = false;

    addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; cx = mx; cy = my; cursor.classList.add('on'); }
    }, { passive: true });

    addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      cursor.classList.remove('hov', 'lbl');
      if (!t) return;
      const mode = t.dataset.cursor;
      if (mode === 'link') cursor.classList.add('hov');
      else if (mode === 'drag') {
        cursor.classList.add('lbl');
        cLabel.textContent = 'drag';
      }
    }, { passive: true });

    addEventListener('pointerdown', () => cursor.classList.add('down'));
    addEventListener('pointerup', () => cursor.classList.remove('down'));

    const loopCursor = () => {
      cx = lerp(cx, mx, 0.18);
      cy = lerp(cy, my, 0.18);
      dx = lerp(dx, mx, 0.42);
      dy = lerp(dy, my, 0.42);
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      const dot = cursor.firstElementChild;
      if (dot) dot.style.transform = `translate3d(${dx - cx}px,${dy - cy}px,0)`;
      raf(loopCursor);
    };
    raf(loopCursor);
  }

  /* ══════════════════════════════════════════════════════════
     3. MAGNETIC BUTTONS
     ══════════════════════════════════════════════════════════ */
  if (!TOUCH && !RM) {
    $$('[data-magnetic]').forEach((el) => {
      let tx = 0, ty = 0, x = 0, y = 0, active = false;
      const R = 0.32;

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * R;
        ty = (e.clientY - (r.top + r.height / 2)) * R;
        active = true;
      });
      el.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

      const anim = () => {
        x = lerp(x, tx, 0.16);
        y = lerp(y, ty, 0.16);
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
          el.style.transform = `translate3d(${x}px,${y}px,0)`;
        } else if (active) {
          el.style.transform = '';
        }
        raf(anim);
      };
      raf(anim);
    });
  }

  /* ══════════════════════════════════════════════════════════
     3b. FOCUS TRAP — shared by every modal overlay
     ══════════════════════════════════════════════════════════ */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

  const trapFocus = (root) => {
    if (!root) return () => {};
    const prev = document.activeElement;

    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const items = $$(FOCUSABLE, root).filter((el) => el.offsetParent !== null || el === root);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };

    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('keydown', onKey);
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
  };

  /* ══════════════════════════════════════════════════════════
     4. NAV
     ══════════════════════════════════════════════════════════ */
  const nav = $('#nav');
  const burger = $('#burger');
  const mmenu = $('#mobileMenu');
  const navProg = $('#navProgress');
  let lastY = 0;

  const onScrollNav = () => {
    const y = scrollY;
    if (nav) {
      nav.classList.toggle('solid', y > 40);
      if (y > 420 && y > lastY + 6 && !mmenu?.classList.contains('open')) nav.classList.add('hide');
      else if (y < lastY - 6 || y < 420) nav.classList.remove('hide');
    }
    if (navProg) {
      const max = document.documentElement.scrollHeight - innerHeight;
      navProg.style.transform = `scaleX(${clamp(max > 0 ? y / max : 0, 0, 1).toFixed(4)})`;
    }
    lastY = y;
  };
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  if (burger && mmenu) {
    mmenu.inert = true;
    const toggleMenu = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      mmenu.classList.toggle('open', open);
      mmenu.setAttribute('aria-hidden', String(!open));
      mmenu.inert = !open;
      document.documentElement.classList.toggle('lock', open);
    };
    burger.addEventListener('click', () => {
      toggleMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', mmenu).forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        toggleMenu(false);
        burger.focus();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     5. WEBGL HERO — liquid silk shader
     ══════════════════════════════════════════════════════════ */
  const glCanvas = $('#gl');
  let glActive = false;
  let heroStart = () => {};

  function initGL() {
    if (!glCanvas) return false;
    const gl = glCanvas.getContext('webgl', {
      alpha: false, antialias: false, powerPreference: 'high-performance',
      premultipliedAlpha: false, preserveDrawingBuffer: false,
    });
    if (!gl) return false;

    const vert = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos,0.,1.); }`;

    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2  uRes;
      uniform float uTime;
      uniform vec2  uMouse;
      uniform float uIntro;
      uniform float uTheme;

      float hash(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * f * (f * (f * 6. - 15.) + 10.);
        float a = hash(i), b = hash(i + vec2(1.,0.));
        float c = hash(i + vec2(0.,1.)), d = hash(i + vec2(1.,1.));
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
      }
      float fbm(vec2 p){
        float s = 0., a = .55;
        for(int i=0;i<3;i++){ s += a * vnoise(p); p *= 2.11; a *= .48; }
        return s;
      }

      // a soft band centred on 0 with controllable width
      float band(float x, float w){
        float d = abs(x) / w;
        return exp(-d * d * 2.6);
      }

      void main(){
        vec2 uv = vUv;
        float aspect = uRes.x / uRes.y;
        vec2 p = (uv - .5) * vec2(aspect, 1.);
        p.y += .04;
        p *= 1.7;

        float t = uTime * .045;
        vec2 m = (uMouse - .5) * vec2(aspect, 1.);

        vec2 q = p - m * .3;

        // very low frequency warp — long lazy folds, no crackle
        float w1 = fbm(q * .58 + vec2(t * 1.10, -t * .50)) - .5;
        float w2 = fbm(q * .88 - vec2(t * .38, t * .72) + w1 * .85) - .5;

        // the silk sheet — skewed so the folds sweep up to the right,
        // leaving the top-left of the frame quiet for the headline
        float field = q.y * 1.28
                    + q.x * .30
                    - .10
                    + w2 * .78
                    + w1 * .34
                    + sin(q.x * .40 + t * 1.35) * .18;

        // five receding ribbons — layered silk
        float b1 = band(field + .72, .150);
        float b2 = band(field + .30, .085);
        float b3 = band(field - .10, .055);
        float b4 = band(field - .50, .034);
        float b5 = band(field - .92, .022);

        float halo = band(field + .72, .60) * .26
                   + band(field + .30, .46) * .19;
        float glowSheet = band(field + .10, 1.25) * .12;

        float body = b1 * .52 + b2 * .72 + b3 * .85 + b4 * .95 + b5 * 1.0;

        // depth glow behind everything
        float d = length(q * vec2(.82, 1.12));
        float glow = smoothstep(1.40, .02, d);

        // colours — one blue family for night, paper ink for day
        vec3 col;
        if (uTheme < 0.002) {
          vec3 deep = vec3(0.009, 0.015, 0.034);
          vec3 navy = vec3(0.038, 0.082, 0.265);
          vec3 mid  = vec3(0.085, 0.180, 0.545);
          vec3 ice  = vec3(0.610, 0.770, 1.000);

          col = deep;
          col += navy * glow * .95;
          col += navy * glowSheet;
          col += mid  * halo * .90;
          col += mid  * body * 1.00;
          col += ice  * pow(body, 2.3) * 1.05;
          col += ice  * pow(body, 6.0) * .95;
          col += vec3(.24,.40,.94) * smoothstep(1.20, .05, length(p - vec2(0., -1.32))) * .26;

          float vig = smoothstep(1.98, .28, length(p * vec2(.68, .92)));
          col *= mix(.24, 1., vig);
        } else {
          // daylight: warm paper with soft blue silk — mix toward blue, never subtract
          vec3 paper = vec3(0.960, 0.949, 0.914);
          vec3 lilac = vec3(0.880, 0.902, 0.980);
          vec3 peri  = vec3(0.660, 0.720, 0.950);
          vec3 ink   = vec3(0.230, 0.330, 0.760);

          float bn = clamp(body, 0., 1.);
          col = paper;
          col = mix(col, lilac, clamp(glow * .40 + glowSheet * .55, 0., .85));
          col = mix(col, peri,  clamp(halo * .30 + bn * .40, 0., .90));
          col = mix(col, ink,   pow(clamp(bn - .55, 0., 1.) * 1.9, 2.0) * .42);

          // keep the paper edge clean instead of grey
          float vig = 1.0 - smoothstep(.55, 1.75, length(p * vec2(.62, .90)));
          col = mix(vec3(.945,.933,.898), col, mix(.66, 1., vig));
        }

        // very light grain
        float g = hash(uv * uRes + fract(uTime) * 137.);
        col += (g - .5) * .018;

        col *= uIntro;

        gl_FragColor = vec4(col, 1.);
      }`;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uIntro = gl.getUniformLocation(prog, 'uIntro');
    const uTheme = gl.getUniformLocation(prog, 'uTheme');

    let dpr = Math.min(devicePixelRatio || 1, 1.75);
    const resize = () => {
      const w = glCanvas.clientWidth || innerWidth;
      const h = glCanvas.clientHeight || innerHeight;
      dpr = Math.min(devicePixelRatio || 1, w > 1400 ? 1.5 : 1.75);
      glCanvas.width = Math.max(1, Math.floor(w * dpr));
      glCanvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      gl.uniform2f(uRes, glCanvas.width, glCanvas.height);
    };
    resize();
    addEventListener('resize', resize, { passive: true });

    let mx = 0.5, my = 0.5, smx = 0.5, smy = 0.5;
    addEventListener('pointermove', (e) => {
      mx = e.clientX / innerWidth;
      my = 1 - e.clientY / innerHeight;
    }, { passive: true });

    let time = 0, intro = 0, running = true;
    let themeTarget = 0, themeMix = 0;
    const t0 = performance.now();

    const vis = new IntersectionObserver(([en]) => { running = en.isIntersecting; }, { threshold: 0 });
    vis.observe(glCanvas);

    // exposed so the theme switch can re-grade the silk
    window.__setGLTheme = (v) => { themeTarget = v; };

    const frame = (now) => {
      raf(frame);
      if (!running) return;
      time = now / 1000;
      intro = lerp(intro, 1, 0.02);
      themeMix = lerp(themeMix, themeTarget, 0.045);
      smx = lerp(smx, mx, 0.05);
      smy = lerp(smy, my, 0.05);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, smx, smy);
      gl.uniform1f(uIntro, intro);
      gl.uniform1f(uTheme, themeMix);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf(frame);

    glActive = true;
    heroStart = () => { intro = 0; };
    return true;
  }

  /* fallback: static CSS gradient if no WebGL */
  if (!initGL() && glCanvas) {
    glCanvas.style.display = 'none';
    const hero = $('.hero');
    if (hero) hero.style.background =
      'radial-gradient(110% 75% at 50% 18%, #10255c 0%, #081226 38%, #05070c 78%)';
  }

  /* ══════════════════════════════════════════════════════════
     6. DUST PARTICLES
     ══════════════════════════════════════════════════════════ */
  (() => {
    const cv = $('#dust');
    if (!cv || RM) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1;
    let parts = [];

    const make = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w / 22, 26, 88));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.35,
        vy: -(Math.random() * 0.22 + 0.05),
        vx: (Math.random() - 0.5) * 0.12,
        a: Math.random() * 0.55 + 0.12,
        ph: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.02 + 0.006,
      }));
    };
    make();
    addEventListener('resize', make, { passive: true });

    let run = true;
    new IntersectionObserver(([e]) => { run = e.isIntersecting; }, { threshold: 0 }).observe(cv);

    const draw = () => {
      raf(draw);
      if (!run) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.ph) * 0.15;
        p.ph += p.sp;
        if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;
        const al = p.a * (0.55 + 0.45 * Math.sin(p.ph * 1.7));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,205,255,${al.toFixed(3)})`;
        ctx.fill();
      }
    };
    raf(draw);
  })();

  /* ══════════════════════════════════════════════════════════
     7. WORD / LINE REVEAL
     ══════════════════════════════════════════════════════════ */
  // split into line masks by measuring rendered word positions
  const splitLines = (el) => {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';

    // 1. collect words and their <em> group in reading order
    const items = [];
    let emId = 0;
    const walk = (node, em) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { items.push({ space: true }); return; }
            items.push({ word: part, em });
          });
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') { items.push({ br: true }); return; }
          if (c.tagName === 'EM' && !c.dataset.em) c.dataset.em = 'e' + (++emId);
          walk(c, c.tagName === 'EM' ? c : em);
        }
      });
    };
    walk(el, null);

    // 2. rebuild inline (keeping <em> wrappers) so real line breaks can be measured
    el.innerHTML = '';
    const words = [];
    let openEm = null;
    items.forEach((it) => {
      if (it.space) {
        (openEm || el).appendChild(document.createTextNode(' '));
        return;
      }
      if (it.br) { openEm = null; el.appendChild(document.createElement('br')); return; }
      let host = el;
      if (it.em) {
        if (!openEm || openEm.dataset.em !== it.em.dataset.em) {
          openEm = document.createElement('em');
          openEm.dataset.em = it.em.dataset.em;
          el.appendChild(openEm);
        }
        host = openEm;
      } else {
        openEm = null;
      }
      const s = document.createElement('span');
      s.className = 'w';
      s.dataset.em = it.em ? it.em.dataset.em : '';
      s.textContent = it.word;
      host.appendChild(s);
      words.push(s);
    });

    // 3. group words into lines using a tolerance, since the italic <em>
    //    runs at a slightly larger size and sits a few px off the baseline
    const baseTop = el.getBoundingClientRect().top;
    const measured = words
      .map((w) => {
        const r = w.getClientRects()[0];
        return r ? { w, top: r.top - baseTop, left: r.left } : null;
      })
      .filter(Boolean)
      .sort((a, b) => (a.top - b.top) || (a.left - b.left));

    const rows = [];
    let row = null;
    measured.forEach((m) => {
      if (!row || Math.abs(m.top - row.top) > 18) {
        row = { top: m.top, items: [] };
        rows.push(row);
      }
      row.items.push(m);
    });
    rows.forEach((r) => r.items.sort((a, b) => a.left - b.left));

    // capture what we need before wiping the DOM
    const lines = rows.map((r) => r.items.map((m) => ({
      text: m.w.textContent,
      em: m.w.dataset.em || '',
    })));

    el.innerHTML = '';
    lines.forEach((ws, i) => {
      const ln = document.createElement('span');
      ln.className = 'ln';
      const inner = document.createElement('span');
      inner.style.transitionDelay = (i * 90) + 'ms';

      let em = null, emKey = null;
      const flush = () => {
        if (em) inner.appendChild(em);
        em = null; emKey = null;
      };

      ws.forEach((w, j) => {
        const key = w.em;
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = w.text;

        if (key) {
          if (emKey !== key) {
            flush();
            if (j) inner.appendChild(document.createTextNode(' '));
            em = document.createElement('em');
            emKey = key;
          } else {
            em.appendChild(document.createTextNode(' '));
          }
          em.appendChild(s);
        } else {
          flush();
          if (j) inner.appendChild(document.createTextNode(' '));
          inner.appendChild(s);
        }
      });
      flush();

      ln.appendChild(inner);
      el.appendChild(ln);
    });
  };

  /* split every [data-lines] block into line masks once webfonts have
     settled, so the measured line breaks are the real ones */
  const splitAll = () => {
    $$('[data-lines]').forEach((el) => {
      delete el.dataset.split;
      splitLines(el);
    });
  };
  const fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  let splitDone = false;
  const doSplit = () => {
    if (splitDone) return;
    splitDone = true;
    splitAll();
    // let listeners that measured before the split re-read the new nodes
    dispatchEvent(new Event('scroll'));
  };
  fontsReady.then(doSplit).catch(doSplit);
  setTimeout(doSplit, 1200);

  /* ══════════════════════════════════════════════════════════
     8. SCROLL REVEALS
     ══════════════════════════════════════════════════════════ */
  const revObs = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

  $$('[data-lines], .join, .reveal, .card, .quote, .stat, .night, .wall__stats').forEach((el) => revObs.observe(el));
  const mfBig = $('.mf__big');
  if (mfBig) revObs.observe(mfBig);

  /* hero watermark + marquees parallax */
  const wm = $('[data-drift]');
  addEventListener('scroll', () => {
    const y = scrollY;
    if (wm && y < innerHeight * 1.4 && !RM) {
      wm.style.transform = `translate(-50%, calc(-50% + ${y * 0.14}px)) scale(${1 + y * 0.00012})`;
    }
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════
     9. THE LOOP — scroll choreography
     ══════════════════════════════════════════════════════════ */
  (() => {
    const pin = $('.loop__pin');
    const arc = $('#loopArc');
    const nodesBox = $('#loopNodes');
    const numEl = $('#loopNum');
    const nameEl = $('#loopName');
    const descEl = $('#loopDesc');
    const bars = $$('.loop__track i');
    if (!pin || !arc) return;

    const STEPS = [
      { n: 'Learn',  d: 'A twenty-minute teardown. One concept, no slide longer than a hand.' },
      { n: 'Build',  d: 'Paired seats, one brief, a hard stop at 21:00. Nobody builds alone.' },
      { n: 'Review', d: 'Three people read your diff out loud. Kind, specific, no applause needed.' },
      { n: 'Ship',   d: 'It goes live before the room empties. The URL is the only trophy.' },
      { n: 'Chill',  d: 'Laptops shut, chai out. Frameworks are a banned topic after 21:30.' },
    ];

    // ticks around the arc
    const svgNS = 'http://www.w3.org/2000/svg';
    const ticks = $('#loopTicks');
    if (ticks) {
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const r1 = 250, r2 = i % 5 === 0 ? 258 : 254;
        const ln = document.createElementNS(svgNS, 'line');
        ln.setAttribute('x1', 300 + Math.cos(a) * r1);
        ln.setAttribute('y1', 300 + Math.sin(a) * r1);
        ln.setAttribute('x2', 300 + Math.cos(a) * r2);
        ln.setAttribute('y2', 300 + Math.sin(a) * r2);
        ln.setAttribute('opacity', i % 5 === 0 ? '.55' : '.22');
        ticks.appendChild(ln);
      }
    }

    // nodes
    const nodeEls = [];
    if (nodesBox) {
      STEPS.forEach((s, i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const b = document.createElement('b');
        b.textContent = String(i + 1).padStart(2, '0') + ' ' + s.n;
        b.style.left = (50 + Math.cos(a) * 39.666) + '%';
        b.style.top  = (50 + Math.sin(a) * 39.666) + '%';
        nodesBox.appendChild(b);
        nodeEls.push(b);
      });
    }

    const CIRC = 2 * Math.PI * 238;
    arc.style.strokeDasharray = `0 ${CIRC}`;
    arc.style.transformOrigin = '300px 300px';
    arc.style.transform = 'rotate(-90deg)';

    // glowing head that rides the arc
    const head = document.createElementNS(svgNS, 'circle');
    head.setAttribute('r', '4.5');
    head.setAttribute('fill', '#c3d6ff');
    head.setAttribute('filter', 'drop-shadow(0 0 10px #6f95ff)');
    arc.parentNode.appendChild(head);

    let cur = 0;
    let raf1 = false;

    const update = () => {
      raf1 = false;
      const r = pin.getBoundingClientRect();
      const total = pin.offsetHeight - innerHeight;
      const p = clamp(-r.top / Math.max(total, 1), 0, 1);

      const raw = p * 5;
      const idx = Math.min(4, Math.floor(raw));
      const eased = clamp((raw - idx) / 0.18, 0, 1); // snap-ish
      const prog = (idx + eased) / 5;

      arc.style.strokeDasharray = `${(prog * CIRC).toFixed(1)} ${CIRC}`;

      const a = -Math.PI / 2 + prog * Math.PI * 2;
      head.setAttribute('cx', 300 + Math.cos(a) * 238);
      head.setAttribute('cy', 300 + Math.sin(a) * 238);

      if (idx !== cur) {
        cur = idx;
        numEl.textContent = String(idx + 1).padStart(2, '0');
        nameEl.textContent = STEPS[idx].n;
        descEl.textContent = STEPS[idx].d;
        bars.forEach((b, i) => b.classList.toggle('on', i <= idx));
        nodeEls.forEach((b, i) => b.classList.toggle('on', i <= idx));
        nameEl.animate(
          [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
        );
        descEl.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 700, easing: 'ease-out', fill: 'both' }
        );
      }
    };

    const onScroll = () => {
      if (!raf1) { raf1 = true; raf(update); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    update();
  })();

  /* ══════════════════════════════════════════════════════════
     10. RITUALS — draggable rail
     ══════════════════════════════════════════════════════════ */
  (() => {
    const vp = $('.rit__viewport');
    const track = $('#ritTrack');
    if (!vp || !track) return;

    let x = 0, target = 0, min = 0, max = 0;
    let dragging = false, startX = 0, startTarget = 0, lastX = 0, vel = 0;
    let moved = false;

    const measure = () => {
      const pad = parseFloat(getComputedStyle(vp).paddingLeft) || 0;
      max = 0;
      min = -(track.scrollWidth - vp.clientWidth + pad * 2);
      if (min > 0) min = 0;
      target = clamp(target, min, 0);
    };
    measure();
    addEventListener('resize', measure, { passive: true });
    setTimeout(measure, 600);

    vp.addEventListener('pointerdown', (e) => {
      dragging = true; moved = false;
      startX = lastX = e.clientX;
      startTarget = target;
      vel = 0;
      vp.classList.add('dragging');
      vp.setPointerCapture?.(e.pointerId);
    });

    vp.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      target = clamp(startTarget + dx, min, 0);
      vel = e.clientX - lastX;
      lastX = e.clientX;
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      vp.classList.remove('dragging');
      target = clamp(target + vel * 7, min, 0);
      vel = 0;
    };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    vp.addEventListener('pointerleave', end);

    // prevent link clicks after drags
    vp.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    // horizontal wheel support
    vp.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        target = clamp(target - e.deltaX, min, 0);
      } else if (e.shiftKey) {
        e.preventDefault();
        target = clamp(target - e.deltaY, min, 0);
      }
    }, { passive: false });

    const loop = () => {
      raf(loop);
      if (!dragging) {
        x = lerp(x, target, 0.14);
      } else {
        x = lerp(x, target, 0.4);
      }
      if (Math.abs(x - target) < 0.05) x = target;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    };
    raf(loop);
  })();

  /* ══════════════════════════════════════════════════════════
     11. NIGHTS — hover poster
     ══════════════════════════════════════════════════════════ */
  (() => {
    const poster = $('#poster');
    const list = $('#nightsList');
    if (!poster || !list || TOUCH) return;

    const asciiEl = $('#posterAscii');
    const noEl = $('#posterNo');
    const nameEl = $('#posterName');
    const grad = $('.poster__grad');

    const GRADS = [
      'radial-gradient(90% 70% at 50% 0%,rgba(61,107,255,.42),transparent 62%),radial-gradient(60% 50% at 20% 100%,rgba(255,184,120,.16),transparent 70%)',
      'radial-gradient(80% 70% at 60% 10%,rgba(125,157,255,.5),transparent 60%),radial-gradient(70% 60% at 10% 90%,rgba(61,107,255,.22),transparent 70%)',
      'radial-gradient(85% 60% at 50% 90%,rgba(94,224,160,.22),transparent 65%),radial-gradient(80% 80% at 20% 10%,rgba(61,107,255,.34),transparent 70%)',
      'radial-gradient(90% 90% at 50% 100%,rgba(255,184,120,.34),transparent 62%),radial-gradient(60% 50% at 30% 0%,rgba(61,107,255,.26),transparent 70%)',
    ];
    const ASCII = [
      `      .%+\n     .##.\n     -@#::..\n   .:=%%%%#=\n :---==#%#*#:\n.---:    ..      =%#*+-   :--:.\n.=##***##-           ##*  :+##***#*.\n:##-     :           -##- -#*:    ..\n+#.   ..           .+*+: .*+  :. :\n+*. ..: .        .=*=:   .+=  :. -\n:*=.           .-+=.      -+-\n .=+=-::-=:  .-=+=:::::::  :==-:::--.\n   .:---:.   :--:-------:    .:--::.`,
      `   .·:;+=xX$@  ·:;+=xX\n  ·:;+=xX$@#%@@xX$@#\n ·:;+=xX$@#%@@##%@@xX$@\n·:;+=xX$@#%@@####@@xX$@#\n :;+=xX$@#%@@##@@xX$@#%@@\n  :=xX$@#%@@#xX$@#%@@#%@@\n   ·:;+=xX$@#%@@#xX$@#%@@#\n     ·:;+=xX$@#%@@#xX$@#%@@\n        ·:;+=xX$@#%@@#xX$@#%@@\n           ·:;+=xX$@#%@@#xX$@#%@@`,
      `      ▓▓░\n     ▒█▒\n    ░██░\n    ░█████▓\n░▒▒▓▓████▓██\n░░     ░▓████▓░\n▒▓████▓▒░            ▓██▓░░  ▒▓████▓▒\n▒██▓▒░░▒▓█░            ▓██▓  ▒██▓▒░░▒▓█░\n▓█▓                    ▒██▓  ▓█▓\n░██   ░ ░ ░           ▒███░  ░██   ▒  ▒\n░██    ░            ▒██▓░     ██░  ▒  ░\n ▒██░             ░██▓        ▒██░\n  ░▓██▓▓▒▓██▒   ▒███▓▒▒▒▒▒▒▒░  ░▓█▓▓▒▒▒▓▓░\n     ░▒▓▒▒░    ░▓▓▒▒▒▓▓▒▒▒▒▒░     ░▒▒▒▒░`,
      `        ·:::·\n      ·:@#@@@#:\n    ·@#@$X@@@$#@·\n   @#$X@%@@%@@$X@\n  @#@$X@@%@@%@@$X@@\n @#@$X@@%@@@@%@@$X@@\n·@#@$X@@@%@%@@@$X@@@·\n @#@$X@@%@@@@%@@$X@@\n  @#@$X@@%@@%@@$X@@\n   @#$X@%@@%@@$X@\n    ·@#@$X@@@$#@·\n      ·:@#@@@#:\n        ·:::·`,
    ];

    let px = 0, py = 0, tx = 0, ty = 0, on = false;

    addEventListener('pointermove', (e) => { tx = e.clientX + 38; ty = e.clientY - 20; }, { passive: true });

    const loop = () => {
      raf(loop);
      px = lerp(px, tx, 0.12);
      py = lerp(py, ty, 0.12);
      if (on) poster.style.left = px + 'px', poster.style.top = py + 'px';
    };
    raf(loop);

    $$('.night', list).forEach((li, i) => {
      li.addEventListener('pointerenter', () => {
        const k = i % 4;
        asciiEl.textContent = ASCII[k];
        grad.style.background = GRADS[k];
        noEl.textContent = $('.night__no', li).textContent;
        nameEl.textContent = $('.night__name', li).textContent;
        on = true;
        poster.classList.add('on');
        px = tx; py = ty;
      });
      li.addEventListener('pointerleave', () => {
        on = false;
        poster.classList.remove('on');
      });
    });
  })();

  /* ══════════════════════════════════════════════════════════
     12. TERMINAL — typed constitution
     ══════════════════════════════════════════════════════════ */
  (() => {
    const codeEl = $('#termCode');
    const gut = $('#termGutter');
    const win = $('#termWin');
    if (!codeEl || !win) return;

    // token stream: [class, text]
    const LINES = [
      [['c', '// code2chill · constitution.js']],
      [['k', 'export const'], ['p', ' club '], ['p', '= '], ['p', '{']],
      [['p', '  name: '], ['s', '"Code2Chill"'], ['p', ',']],
      [['p', '  purpose: '], ['s', '"ship real things, together"'], ['p', ',']],
      [['p', '  members: '], ['n', '240'], ['p', ',']],
      [['p', '  cities: '], ['p', '['], ['s', '"BLR"'], ['p', ', '], ['s', '"HYD"'], ['p', ', '], ['s', '"PUN"'], ['p', ', '], ['s', '"DEL"'], ['p', '],']],
      [['p', '  cadence: '], ['s', '"every friday"'], ['p', ',']],
      [['p', '  start: '], ['n', '19'], ['p', ':'], ['n', '00'], ['p', ',']],
      [['p', '  stop: '], ['n', '21'], ['p', ':'], ['n', '30'], ['p', ', '], ['c', '// hard stop']],
      [['p', '  meetings: '], ['n', '0'], ['p', ',']],
      [['p', '  laptops: '], ['s', '"closed after ship"'], ['p', ',']],
      [['p', '  vibes: '], ['s', '"lo-fi + chai"'], ['p', ',']],
      [['p', '};']],
      [],
      [['k', 'function'], ['f', ' join'], ['p', '('], ['p', 'you'], ['p', ') {']],
      [['p', '  '], ['k', 'if'], ['p', ' ('], ['p', '!you'], ['p', '.curious) '], ['k', 'return'], ['p', ' '], ['s', '"come back in a year"'], ['p', ';']],
      [['p', '  '], ['k', 'return'], ['p', ' club.'], ['f', 'build'], ['p', '('], ['p', 'you'], ['p', ', '], ['s', '"a laptop"'], ['p', ');']],
      [['p', '}']],
      [],
      [['c', '// no tiers. no lanyards. no status meetings.']],
      [['p', 'club.'], ['f', 'deploy'], ['p', '(); '], ['c', '// → passing']],
    ];

    const buildHTML = (uptoLine, uptoToken, uptoChar) => {
      let html = '';
      for (let i = 0; i < uptoLine; i++) {
        html += LINES[i].map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join('') + '\n';
      }
      if (uptoLine < LINES.length) {
        const line = LINES[uptoLine];
        let part = '';
        for (let j = 0; j < uptoToken && j < line.length; j++) {
          part += `<span class="${line[j][0]}">${esc(line[j][1])}</span>`;
        }
        if (uptoToken < line.length) {
          part += `<span class="${line[uptoToken][0]}">${esc(line[uptoToken][1].slice(0, uptoChar))}</span>`;
        }
        html += part;
      }
      return html;
    };
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // line numbers
    if (gut) gut.textContent = LINES.map((_, i) => i + 1).join('\n');

    let line = 0, tok = 0, ch = 0, typing = false, started = false;

    const step = () => {
      if (line >= LINES.length) {
        typing = false;
        return;
      }
      const ln = LINES[line];
      if (!ln.length || tok >= ln.length) {
        line++; tok = 0; ch = 0;
        codeEl.innerHTML = buildHTML(line, 0, 0);
        setTimeout(step, 60);
        return;
      }
      const txt = ln[tok][1];
      ch++;
      codeEl.innerHTML = buildHTML(line, tok, ch);
      if (ch >= txt.length) {
        tok++; ch = 0;
        var delay = 22 + Math.random() * 26;
        if (tok >= ln.length) delay = 90;
      } else {
        delay = 9 + Math.random() * 14;
      }
      setTimeout(step, delay);
    };

    const start = () => {
      if (started) return;
      started = true;
      typing = true;
      setTimeout(step, 260);
    };

    new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { start(); } });
    }, { threshold: 0.4 }).observe(win);
  })();

  /* ══════════════════════════════════════════════════════════
     13. COUNTERS
     ══════════════════════════════════════════════════════════ */
  (() => {
    const els = $$('[data-count]');
    if (!els.length) return;

    const run = (el) => {
      const to = parseFloat(el.dataset.count);
      const dur = 1500;
      const t0 = performance.now();
      const fmt = (n) => (to >= 1000 ? Math.round(n).toLocaleString('en-US') : Math.round(n));
      const tick = (now) => {
        const p = clamp((now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e);
        if (p < 1) raf(tick);
        else el.textContent = fmt(to);
      };
      raf(tick);
    };

    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting && !e.target.dataset.done) {
          e.target.dataset.done = '1';
          run(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    els.forEach((e) => obs.observe(e));
  })();

  /* ══════════════════════════════════════════════════════════
     14. VOICES — parallax rows
     ══════════════════════════════════════════════════════════ */
  (() => {
    const rows = $$('.vrow');
    if (!rows.length || RM) return;

    const state = rows.map((r) => ({ el: r, inner: $('.vrow__in', r), base: 0 }));

    const measure = () => {
      state.forEach((s) => {
        if (!s.inner) return;
        const w = s.inner.scrollWidth / 2;
        s.base = -w * 0.25;
        s.inner.style.transform = `translate3d(${s.base}px,0,0)`;
      });
    };
    measure();
    addEventListener('resize', measure, { passive: true });
    setTimeout(measure, 800);

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      rows.forEach((r, i) => {
        const s = state[i];
        if (!s.inner) return;
        const rect = r.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const off = (mid - vh / 2) / vh; // -1..1
        const dir = i % 2 === 0 ? 1 : -1;
        const x = s.base + off * dir * 90;
        s.inner.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; raf(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    update();
  })();

  /* ══════════════════════════════════════════════════════════
     15. CLOCK
     ══════════════════════════════════════════════════════════ */
  (() => {
    const el = $('#clock');
    if (!el) return;
    const upd = () => {
      const now = new Date();
      const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
      el.textContent = [ist.getHours(), ist.getMinutes(), ist.getSeconds()]
        .map((n) => String(n).padStart(2, '0')).join(':');
    };
    upd();
    setInterval(upd, 1000);
  })();

  /* ══════════════════════════════════════════════════════════
     16. ACTIVE NAV LINK
     ══════════════════════════════════════════════════════════ */
  (() => {
    const links = $$('.nav__links a');
    if (!links.length) return;
    const map = new Map();
    const currPath = location.pathname.split('/').pop() || 'index.html';

    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        try {
          const t = document.querySelector(href);
          if (t) map.set(t, a);
        } catch (e) {}
      } else {
        const targetPage = href.split('/').pop();
        if (targetPage === currPath || (currPath === '' && targetPage === 'index.html')) {
          a.setAttribute('aria-current', 'page');
          a.classList.add('active');
        }
      }
    });

    if (map.size > 0) {
      const obs = new IntersectionObserver((ents) => {
        ents.forEach((e) => {
          const a = map.get(e.target);
          if (!a) return;
          if (e.isIntersecting) {
            links.forEach((l) => l.removeAttribute('aria-current'));
            a.setAttribute('aria-current', 'page');
          }
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      map.forEach((_, t) => obs.observe(t));
    }
  })();

  /* ══════════════════════════════════════════════════════════
     17. JOIN FORM
     ══════════════════════════════════════════════════════════ */
  (() => {
    const form = $('#joinForm');
    if (!form) return;
    const input = $('#email', form);
    const btn = $('button', form);
    const label = $('.btn__label', form);
    const fine = $('.join__fine');

    input.addEventListener('input', () => {
      form.style.borderColor = '';
      input.setAttribute('aria-invalid', 'false');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

      if (!ok) {
        form.style.borderColor = 'rgba(255,120,120,.6)';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        const shake = form.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' },
           { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' },
           { transform: 'translateX(0)' }],
          { duration: 380, easing: 'ease-in-out' }
        );
        shake.finished.catch(() => {});
        return;
      }

      btn.disabled = true;
      if (label) label.textContent = 'Sending…';

      setTimeout(() => {
        if (label) label.textContent = 'Seat requested ✓';
        btn.style.background = 'var(--blue)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--blue)';
        input.value = '';
        input.placeholder = 'See you on Friday';
        if (fine) {
          fine.textContent = "You're on the list — we'll reply from hello@code2chill.club within 48 hours.";
          fine.style.color = 'var(--blue-lt)';
        }
        setTimeout(() => {
          btn.disabled = false;
          if (label) label.textContent = 'Request a seat';
          btn.style.cssText = '';
        }, 3200);
      }, 900);
    });
  })();

  /* ══════════════════════════════════════════════════════════
     18. SMOOTH ANCHORS
     ══════════════════════════════════════════════════════════ */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + scrollY - (id === '#top' ? 0 : 0);
      window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ══════════════════════════════════════════════════════════
     19. TICKER speed on scroll
     ══════════════════════════════════════════════════════════ */
  (() => {
    const row = $('#tickerRow');
    if (!row || RM) return;
    row.style.animation = 'none';
    let x = 0, v = 0.55, last = scrollY;
    const loop = () => {
      raf(loop);
      const dy = scrollY - last;
      last = scrollY;
      v = lerp(v, 0.55 + Math.abs(dy) * 0.05, 0.08);
      x -= v;
      const half = row.scrollWidth / 2;
      if (x <= -half) x += half;
      row.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    };
    raf(loop);
  })();

  /* ══════════════════════════════════════════════════════════
     19b. PALETTE COLOURS
     ══════════════════════════════════════════════════════════ */
  readPaletteColors();

  /* ══════════════════════════════════════════════════════════
     19c. MANIFESTO — word-by-word illumination
     ══════════════════════════════════════════════════════════ */
  (() => {
    const big = $('.mf__big');
    if (!big) return;
    let words = $$('.w', big);

    let ticking = false;
    const update = () => {
      ticking = false;
      if (!words.length) words = $$('.w', big);
      if (!words.length) return;
      const r = big.getBoundingClientRect();
      const vh = innerHeight;
      // 0 when the block first enters at 82% viewport, 1 when it passes 30%
      const p = clamp((vh * 0.84 - r.top) / (r.height + vh * 0.30), 0, 1);
      const n = Math.round(p * words.length * 1.06);
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  })();

  /* ══════════════════════════════════════════════════════════
     19d. SCROLL RAIL
     ══════════════════════════════════════════════════════════ */
  (() => {
    const rail = $('.rail');
    const fill = $('#railFill');
    const dot = $('#railDot');
    const num = $('#railNum');
    const label = $('#railLabel');
    if (!rail) return;

    const STOPS = [
      { id: 'top', label: 'Top' },
      { id: 'team', label: 'Team' },
      { id: 'events', label: 'Events' },
      { id: 'projects', label: 'Projects' },
      { id: 'gallery', label: 'Gallery' },
      { id: 'contact', label: 'Contact' },
    ].map((s) => ({ ...s, el: document.getElementById(s.id) })).filter((s) => s.el);

    let ticking = false;
    const update = () => {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - innerHeight;
      const p = clamp(max > 0 ? scrollY / max : 0, 0, 1);
      const track = rail.querySelector('.rail__track');
      const h = track ? track.offsetHeight : 200;

      if (fill) fill.style.height = (p * h).toFixed(1) + 'px';

      let active = STOPS[0];
      STOPS.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        if (r.top <= innerHeight * 0.5) active = s;
      });
      if (dot) dot.style.top = (p * h).toFixed(1) + 'px';
      if (num) num.textContent = String(STOPS.indexOf(active) + 1).padStart(2, '0');
      if (label) label.textContent = active.label;
      rail.classList.toggle('on', scrollY > innerHeight * 0.4);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  })();

  /* ══════════════════════════════════════════════════════════
     19e. COMMAND PALETTE
     ══════════════════════════════════════════════════════════ */
  (() => {
    const box = $('#cmd');
    const input = $('#cmdInput');
    const list = $('#cmdList');
    const empty = $('#cmdEmpty');
    const cmdBtn = $('#cmdBtn');
    if (!box || !input || !list) return;

    const ITEMS = [
      { n: 'Team', s: '01 · student leadership & coordinators', h: '#team', k: 'team leadership coordinators lakshay jiya samanyu bhupinder chitkara' },
      { n: 'Events', s: '02 · workshops & hackathons schedule', h: '#events', k: 'events schedule workshops hackathons sessions archive calendar next' },
      { n: 'Projects', s: '03 · student software showcase', h: '#projects', k: 'projects devpulse peernotes campusnav software code apps' },
      { n: 'Gallery', s: '04 · event archives & memories', h: '#gallery', k: 'gallery photos albums archives chillhack nextjs memories' },
      { n: 'Contact', s: '05 · connect & direct inquiries', h: '#contact', k: 'contact message inquiries chitkara support reach out' },
      { n: 'Top', s: '00 · back to top', h: '#top', k: 'top hero home' },
      { n: 'Focus room', s: 'deep work · 25 minutes timer', act: 'room', k: 'timer pomodoro focus deep work session room' },
      { n: 'Instagram', s: 'Official channel · @code2chill.osl', h: 'https://www.instagram.com/code2chill.osl/', k: 'instagram social stories updates' },
      { n: 'LinkedIn', s: 'Official page · Code2Chill', h: 'https://www.linkedin.com/company/code2chill/posts/', k: 'linkedin network company' },
      { n: 'Chitkara University', s: 'Official university portal', h: 'https://chitkara.edu.in', k: 'chitkara university campus punjab' },
      { n: 'Light mode', s: 'switch between night and chill mode', act: 'theme', k: 'theme day bright colors light dark night' },
    ];

    let results = ITEMS.slice();
    let sel = 0;
    let open = false;

    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    const render = () => {
      list.innerHTML = results.map((it, i) => `
        <li class="cmd__item" role="option" data-i="${i}" aria-selected="${i === sel}">
          <span class="cmd__idx">${String(i + 1).padStart(2, '0')}</span>
          <span class="cmd__txt"><span class="cmd__name">${esc(it.n)}</span><span class="cmd__sub">${esc(it.s)}</span></span>
          <svg class="cmd__go" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 13 3M6 3h7v7"/></svg>
        </li>`).join('');
      if (empty) empty.hidden = results.length > 0;
      const active = list.querySelector('[aria-selected="true"]');
      if (active) active.scrollIntoView({ block: 'nearest' });
    };

    const filter = (q) => {
      q = q.trim().toLowerCase();
      if (!q) { results = ITEMS.slice(); }
      else {
        const scored = ITEMS.map((it) => {
          const hay = (it.n + ' ' + it.s + ' ' + (it.k || '')).toLowerCase();
          const inName = it.n.toLowerCase().includes(q);
          const idx = hay.indexOf(q);
          let score = -1;
          if (inName) score = 100 - it.n.toLowerCase().indexOf(q);
          else if (idx >= 0) score = 40 - Math.min(idx, 30);
          // loose subsequence match
          if (score < 0) {
            let a = 0;
            for (let i = 0; i < hay.length && a < q.length; i++) if (hay[i] === q[a]) a++;
            if (a === q.length) score = 10;
          }
          return { it, score };
        }).filter((x) => x.score >= 0);
        scored.sort((a, b) => b.score - a.score);
        results = scored.map((x) => x.it);
      }
      sel = 0;
      render();
    };

    const choose = (i) => {
      const it = results[i];
      if (!it) return;
      close();
      if (it.act === 'theme') {
        const next = theme === 'light' ? 'dark' : 'light';
        try { localStorage.setItem(THEME_KEY, next === 'light' ? 'light' : 'dark'); } catch (e) {}
        applyTheme(next, { x: innerWidth / 2, y: innerHeight * 0.4 });
        return;
      }
      if (it.act === 'mail') { location.href = 'contact.html'; return; }
      if (it.act === 'room') { if (typeof openRoom === 'function') openRoom(); return; }
      if (it.h) {
        if (it.h.startsWith('http')) {
          window.open(it.h, '_blank', 'noopener,noreferrer');
          return;
        }
        if (it.h.startsWith('#')) {
          const t = document.querySelector(it.h);
          if (t) {
            window.scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: RM ? 'auto' : 'smooth' });
            history.replaceState(null, '', it.h);
          } else {
            location.href = 'index.html' + it.h;
          }
        } else if (it.h.includes('#')) {
          const [pg, hash] = it.h.split('#');
          const currPg = location.pathname.split('/').pop() || 'index.html';
          if (currPg === pg) {
            const t = document.querySelector('#' + hash);
            if (t) {
              window.scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: RM ? 'auto' : 'smooth' });
              history.replaceState(null, '', '#' + hash);
            }
          } else {
            location.href = it.h;
          }
        } else {
          location.href = it.h;
        }
      }
    };

    let releaseTrap = null;
    const openPal = () => {
      open = true;
      box.classList.add('open');
      box.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('lock');
      input.value = '';
      filter('');
      setTimeout(() => input.focus(), 40);
      releaseTrap = trapFocus($('.cmd__box', box) || box);
    };
    const close = () => {
      open = false;
      box.classList.remove('open');
      box.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('lock');
      input.blur();
      if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    };

    addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); open ? close() : openPal(); return; }
      if (!open) {
        if (e.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName || '')) {
          e.preventDefault(); openPal();
        }
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
    });

    input.addEventListener('input', () => filter(input.value));
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.cmd__item');
      if (li) choose(Number(li.dataset.i));
    });
    list.addEventListener('pointermove', (e) => {
      const li = e.target.closest('.cmd__item');
      if (li) {
        const i = Number(li.dataset.i);
        if (i !== sel) { sel = i; render(); }
      }
    }, { passive: true });
    $$('[data-cmd-close]', box).forEach((el) => el.addEventListener('click', close));
    if (cmdBtn) cmdBtn.addEventListener('click', openPal);
  })();

  /* ══════════════════════════════════════════════════════════
     20. THE MARK — dot-matrix logo, 2,800 particles
     ══════════════════════════════════════════════════════════ */
  (() => {
    const cv = $('#markCanvas');
    const sec = $('.mark');
    if (!cv || !sec) return;

    // logo sampled from assets/img/mark.png → 56 × 19 luminance grid
    const MASK = [
      '000000000000000000000000000000000fd5000000000000000000000000000',
      '00000000000000000000000000000000df6000000000000000000000000000',
      '0000000000000000000000000000000bf90010000000000000000000000000',
      '0000000000000000000000000000000efc100034000000000000000000000',
      '0000000000000000000000000000000efffecdb9000000000000000000000',
      '00000000000000000000000000003579fffffedf600000000000000000000',
      '000000000000000000000000037aaaabcefffd8de1000000000000000000',
      '0000000000000000000000156310000026efffdcd7300000000000000000',
      '000000135777642000002100000000003efffb88500013677764200000',
      '00005aeffffffffd700000000000000008fffb00005aeffffffffc600',
      '002bffe9533347cc50000000000000000bfef9002bffe9533347cb400',
      '02dff81000000000000000000000007fffc102dff810000000000000',
      '0bff700000032000000000000000003bfff9100aff80006402700000',
      '0fff100471381650000000000000029fffa40000efe1002b100a4000',
      '0eff30023161032000000000000017effa3000000cff3001920182000',
      '06ffc1000000000000000000006dffa3000000005ffb100110120000',
      '007ffd610000004610000005cff92000000000006ffc510000014300',
      '0003afffca99adff910003bfffd8899888888500039deda8889bdc50',
      '0000037bdffedb84100018efedeeffeedddccd700000269bccba9631',
    ];

    const ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let CX = 0, CY = 0;
    let parts = [];
    let tgtX = 0.5, tgtY = 0.5, mX = 0.5, mY = 0.5;
    let burst = [];
    let running = true;
    let light = () => theme === 'light';

    const build = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      CX = W / 2; CY = H * 0.5;

      const cols = MASK[0].length, rows = MASK.length;
      // the mark lives upper-right, large and quiet, clear of the headline
      const wide = W > 900;
      const cellW = wide ? (W * 0.78) / cols : (W * 0.9) / cols;
      const cellH = wide ? (H * 0.62) / rows : (H * 0.34) / rows;
      const cell = Math.min(cellW, cellH);
      const step = cell < 5 ? 2 : 1;
      const ox = (wide ? CX + W * 0.03 : CX) - (cols * cell) / 2 + cell / 2;
      const oy = (wide ? H * 0.38 : H * 0.32) - (rows * cell) / 2 + cell / 2;

      const list = [];
      for (let y = 0; y < rows; y += step) {
        for (let x = 0; x < cols; x += step) {
          const ch = MASK[y][x];
          const v = parseInt(ch, 16) / 15;
          if (v < 0.14) continue;
          const hx = ox + x * cell;
          const hy = oy + y * cell;
          list.push({
            hx, hy,
            x: hx + (Math.random() - 0.5) * W * 0.9,
            y: hy + (Math.random() - 0.5) * H * 1.2,
            vx: 0, vy: 0,
            r: Math.max(1.1, cell * 0.30 * (0.66 + v * 0.6)),
            a: 0.16 + v * 0.95,
            ph: Math.random() * Math.PI * 2,
            sp: 0.4 + Math.random() * 1.5,
            d: 0.035 + Math.random() * 0.05,
            amp: 0.5 + Math.random() * 2.2,
          });
        }
      }
      parts = list;
      seed();
    };

    // stagger the intro so it assembles from noise
    const seed = () => {
      parts.forEach((p) => {
        p.x = p.hx + (Math.random() - 0.5) * W * 1.1;
        p.y = p.hy + (Math.random() - 0.5) * H * 1.3;
        p.vx = p.vy = 0;
      });
    };

    let started = false;
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (e.isIntersecting && !started) { started = true; build(); }
    }, { threshold: 0 });
    io.observe(sec);

    addEventListener('resize', () => {
      clearTimeout(build._t);
      build._t = setTimeout(build, 220);
    }, { passive: true });

    sec.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      tgtX = (e.clientX - r.left) / Math.max(r.width, 1);
      tgtY = (e.clientY - r.top) / Math.max(r.height, 1);
    }, { passive: true });

    sec.addEventListener('pointerdown', (e) => {
      const r = cv.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      burst.push({ x: px, y: py, t: 0 });
      parts.forEach((p) => {
        const dx = p.x - px, dy = p.y - py;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / (Math.min(W, H) * 0.55));
        p.vx += (dx / d) * f * 26;
        p.vy += (dy / d) * f * 26;
      });
    });

    const draw = (now) => {
      raf(draw);
      if (!running || !parts.length) return;

      mX = lerp(mX, tgtX, 0.055);
      mY = lerp(mY, tgtY, 0.055);

      const px = mX * W, py = mY * H;
      const R = Math.min(W, H) * 0.30;

      ctx.clearRect(0, 0, W, H);

      const day = light();
      const baseRGB = day ? '16,30,70' : '196,216,255';
      const hotRGB = day ? '35,68,221' : '142,175,255';
      const t = now * 0.001;

      // soft pointer bloom
      const g = ctx.createRadialGradient(px, py, 0, px, py, R * 1.5);
      if (day) {
        g.addColorStop(0, 'rgba(35,68,221,0.11)');
        g.addColorStop(0.45, 'rgba(35,68,221,0.05)');
        g.addColorStop(1, 'rgba(35,68,221,0)');
      } else {
        g.addColorStop(0, 'rgba(70,120,255,0.16)');
        g.addColorStop(0.45, 'rgba(60,105,255,0.07)');
        g.addColorStop(1, 'rgba(40,80,220,0)');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];

        // gentle idle breathing around the home position
        const bx = p.hx + Math.sin(t * p.sp + p.ph) * p.amp;
        const by = p.hy + Math.cos(t * p.sp * 0.86 + p.ph) * p.amp;

        // repulsion from the pointer
        const dx = p.x - px, dy = p.y - py;
        const d2 = dx * dx + dy * dy;
        let fx = 0, fy = 0;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R);
          const s = f * f * 30;
          fx += (dx / d) * s;
          fy += (dy / d) * s;
        }

        // spring back to the shape
        fx += (bx - p.x) * p.d * 26;
        fy += (by - p.y) * p.d * 26;

        p.vx = (p.vx + fx * 0.016) * 0.90;
        p.vy = (p.vy + fy * 0.016) * 0.90;
        p.x += p.vx;
        p.y += p.vy;

        // displacement drives brightness + size
        const off = Math.min(1, Math.hypot(p.x - bx, p.y - by) / 90);
        const near = 1 - Math.min(1, Math.sqrt(d2) / R);
        const lum = p.a * (0.42 + near * 0.95);
        const rr = p.r * (1 + off * 0.9 + near * 0.7);

        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, 6.2832);
        if (near > 0.34) {
          ctx.fillStyle = `rgba(${hotRGB},${(lum * (0.55 + near * 0.5)).toFixed(3)})`;
        } else {
          ctx.fillStyle = `rgba(${baseRGB},${(lum * 0.9).toFixed(3)})`;
        }
        ctx.fill();
      }

      // shockwave rings from taps
      burst = burst.filter((b) => (b.t += 0.022) < 1);
      burst.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.t * Math.min(W, H) * 0.62, 0, 6.2832);
        ctx.strokeStyle = day
          ? `rgba(35,68,221,${(0.3 * (1 - b.t)).toFixed(3)})`
          : `rgba(150,180,255,${(0.34 * (1 - b.t)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };
    raf(draw);
  })();

  /* ══════════════════════════════════════════════════════════
     20b. COUNTDOWN — to the next Friday night
     ══════════════════════════════════════════════════════════ */
  (() => {
    const D = $('#cdD'), H = $('#cdH'), M = $('#cdM'), S = $('#cdS');
    if (!D) return;

    // next Friday, 19:00 local
    const target = (() => {
      const n = new Date();
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 19, 0, 0);
      const day = d.getDay();               // 0 Sun … 5 Fri
      let add = (5 - day + 7) % 7;
      if (add === 0 && n.getTime() > d.getTime()) add = 7;
      d.setDate(d.getDate() + add);
      return d.getTime();
    })();

    const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
    const upd = () => {
      let ms = Math.max(0, target - Date.now());
      const s = Math.floor(ms / 1000);
      D.textContent = pad(Math.floor(s / 86400));
      H.textContent = pad(Math.floor(s / 3600) % 24);
      M.textContent = pad(Math.floor(s / 60) % 60);
      S.textContent = pad(s % 60);
    };
    upd();
    setInterval(upd, 1000);

    // keep the written dates honest: derive them from the same target
    const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const stamp = (d) => `${d.getDate()} ${MON[d.getMonth()]}`;
    const next = new Date(target);
    const nd = $('#nextDate');
    if (nd) nd.textContent = `${DAY[next.getDay()]} ${stamp(next)}`;

    // schedule rows step forward weekly from the same anchor
    $$('[data-night]').forEach((el) => {
      const d = new Date(target);
      d.setDate(d.getDate() + Number(el.dataset.night) * 7);
      el.textContent = stamp(d);
    });
  })();

  /* ══════════════════════════════════════════════════════════
     20c. CHILL.FM — generative lo-fi, synthesised in-browser
     ══════════════════════════════════════════════════════════ */
  (() => {
    const sec = $('#radio');
    const btn = $('#radioPlay');
    if (!sec || !btn) return;

    const cv = $('#radioCv');
    const range = $('#radioRange');
    const mute = $('#radioMute');
    const nowEl = $('#radioNow');
    const trackEl = $('#radioTrack');
    const bpmEl = $('#radioBpm');
    const keyEl = $('#radioKey');
    const chBtns = $$('#radioChannels button');

    const MUTE_ICON_ON = 'Mute';

    /* ── channels: each a mood, a tempo, a set of chords ── */
    const CH = [
      {
        name: 'Night Shift',
        track: 'night shift · take 001',
        bpm: 72,
        key: 'Fmaj7',
        wave: 'triangle',
        cutoff: 1500,
        rain: 0.0,
        chords: [
          [53, 57, 60, 64],   // Fmaj7
          [55, 59, 62, 65],   // G7sus
          [52, 55, 59, 62],   // Em7
          [57, 60, 64, 67],   // Am7
        ],
      },
      {
        name: 'Rain on Glass',
        track: 'rain on glass · take 004',
        bpm: 64,
        key: 'Dbmaj9',
        wave: 'sine',
        cutoff: 950,
        rain: 0.10,
        chords: [
          [49, 53, 56, 60],   // Dbmaj7
          [51, 55, 58, 61],   // Ebm7
          [44, 49, 53, 56],   // Abmaj7
          [46, 51, 55, 58],   // Bbm7
        ],
      },
      {
        name: 'Last Commit',
        track: 'last commit · take 011',
        bpm: 80,
        key: 'Amin9',
        wave: 'sawtooth',
        cutoff: 1250,
        rain: 0.035,
        chords: [
          [57, 60, 64, 67],   // Am7
          [53, 57, 60, 64],   // Fmaj7
          [48, 55, 60, 64],   // Cmaj7
          [55, 59, 62, 65],   // G7
        ],
      },
    ];

    let ch = 0;
    let ctx = null, master = null, filter = null, analyser = null, delay = null;
    let playing = false;
    let volume = 0.58;
    let muted = false;
    let nextNote = 0, step = 0, timer = null;

    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

    /* ── a small reverb-ish send built from a decaying noise impulse ── */
    const makeImpulse = (duration, decay) => {
      const rate = ctx.sampleRate;
      const len = Math.floor(rate * duration);
      const buf = ctx.createBuffer(2, len, rate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
      }
      return buf;
    };

    /* ── rain bed ── */
    let rainGain = null, rainSrc = null;
    const buildRain = () => {
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;      // brown-ish
        d[i] = last * 3.2;
      }
      rainSrc = ctx.createBufferSource();
      rainSrc.buffer = buf;
      rainSrc.loop = true;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 420;

      rainGain = ctx.createGain();
      rainGain.gain.value = 0;

      rainSrc.connect(hp).connect(rainGain).connect(master);
      rainSrc.start();
    };

    const build = () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();

      master = ctx.createGain();
      master.gain.value = volume;

      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = CH[0].cutoff;
      filter.Q.value = 0.4;

      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;

      delay = ctx.createConvolver();
      delay.buffer = makeImpulse(2.6, 2.4);
      const dGain = ctx.createGain();
      dGain.gain.value = 0.42;

      filter.connect(master);
      filter.connect(delay);
      delay.connect(dGain);
      dGain.connect(master);
      master.connect(analyser);
      analyser.connect(ctx.destination);

      buildRain();
      return true;
    };

    /* ── one pad chord ── */
    const playChord = (notes, t, dur) => {
      const c = CH[ch];
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(filter);

      // gentle swell
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.085, t + 0.55);
      g.gain.linearRampToValueAtTime(0.062, t + dur * 0.62);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      notes.forEach((n, i) => {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : c.wave;
        o.frequency.value = mtof(n);
        o.detune.value = (Math.random() - 0.5) * 9;

        const og = ctx.createGain();
        og.gain.value = i === 0 ? 0.5 : 0.26 / (1 + i * 0.12);

        // soft stereo spread
        const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan) pan.pan.value = (i / Math.max(1, notes.length - 1) - 0.5) * 0.55;

        o.connect(og);
        if (pan) { og.connect(pan); pan.connect(g); } else og.connect(g);

        o.start(t);
        o.stop(t + dur + 0.1);
      });
    };

    /* ── a soft melodic bell on top, occasionally ── */
    const playBell = (t) => {
      const c = CH[ch];
      const pool = c.chords[step % c.chords.length];
      const n = pool[Math.floor(Math.random() * pool.length)] + 12;
      if (Math.random() > 0.42) return;

      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = mtof(n);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.055, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);

      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.pan.value = (Math.random() - 0.5) * 0.9;

      o.connect(g);
      if (pan) { g.connect(pan); pan.connect(filter); } else g.connect(filter);

      o.start(t);
      o.stop(t + 2.8);
    };

    const beat = () => 60 / CH[ch].bpm;

    const schedule = () => {
      if (!ctx) return;
      const look = 0.7;
      while (nextNote < ctx.currentTime + look) {
        const c = CH[ch];
        const barLen = beat() * 4;
        const chord = c.chords[step % c.chords.length];
        playChord(chord, nextNote, barLen * 1.08);
        playBell(nextNote + barLen * 0.5);
        nextNote += barLen;
        step++;

        // occasional shimmer of a high octave chord
        if (step % 4 === 0) {
          playChord(chord.map((n) => n + 12), nextNote - barLen * 0.5, barLen * 0.7);
        }
      }
    };

    const startClock = () => {
      if (timer) return;
      nextNote = ctx.currentTime + 0.08;
      step = 0;
      schedule();
      timer = setInterval(schedule, 240);
    };
    const stopClock = () => { clearInterval(timer); timer = null; };

    /* ── visualiser ── */
    let rafId = 0, bars = [], W = 0, H = 0, dpr = 1;
    const initBars = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = W * dpr; cv.height = H * dpr;
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(28, Math.min(72, Math.round(W / 11)));
      bars = Array.from({ length: n }, (_, i) => ({
        v: 0.06,
        ph: (i / n) * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.2,
      }));
    };

    const drawViz = (now) => {
      rafId = raf(drawViz);
      if (!cv) return;
      const c = cv.getContext('2d');
      if (!c) return;
      const t = now * 0.001;
      const day = theme === 'light';

      c.clearRect(0, 0, W, H);

      let data = null;
      if (analyser && playing) {
        data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
      }

      // horizon glow
      const gr = c.createRadialGradient(W * 0.5, H * 1.05, 0, W * 0.5, H * 1.05, H * 1.15);
      gr.addColorStop(0, day ? 'rgba(35,68,221,.16)' : 'rgba(61,107,255,.24)');
      gr.addColorStop(0.5, day ? 'rgba(35,68,221,.05)' : 'rgba(61,107,255,.07)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr;
      c.fillRect(0, 0, W, H);

      const n = bars.length;
      const gap = W / n;
      const bw = Math.min(gap * 0.52, 7);
      const mid = H * 0.62;

      for (let i = 0; i < n; i++) {
        const b = bars[i];
        let target = playing ? 0.12 + Math.abs(Math.sin(t * b.sp + b.ph)) * 0.16 : 0.05;

        if (data) {
          const fi = Math.floor((i / n) * (data.length * 0.42));
          target = Math.max(target, (data[fi] / 255) * 1.15);
        }

        b.v += (target - b.v) * (playing ? 0.14 : 0.05);

        const h = b.v * H * 0.42;
        const x = i * gap + gap / 2 - bw / 2;

        const g2 = c.createLinearGradient(0, mid - h, 0, mid + h);
        g2.addColorStop(0, day ? 'rgba(35,68,221,.85)' : 'rgba(195,214,255,.95)');
        g2.addColorStop(0.5, day ? 'rgba(47,82,240,.5)' : 'rgba(125,157,255,.6)');
        g2.addColorStop(1, day ? 'rgba(35,68,221,.05)' : 'rgba(61,107,255,.06)');

        c.fillStyle = g2;
        const r = Math.min(bw / 2, 3);
        c.beginPath();
        c.roundRect ? c.roundRect(x, mid - h, bw, h * 2, r) : c.rect(x, mid - h, bw, h * 2);
        c.fill();
      }

      // a travelling sine ribbon across the middle
      c.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const a = (data ? data[Math.floor((x / W) * data.length * 0.5)] / 255 : 0);
        const y = mid + Math.sin(x * 0.014 + t * 0.9) * (8 + a * 46);
        x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.strokeStyle = day ? 'rgba(35,68,221,.32)' : 'rgba(195,214,255,.34)';
      c.lineWidth = 1.2;
      c.stroke();
    };

    /* ── state ── */
    const setPlaying = (on) => {
      playing = on;
      sec.classList.toggle('playing', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? 'Pause Chill.fm' : 'Play Chill.fm');
      if (on) {
        if (!ctx && !build()) { nowEl.textContent = 'Audio is not available in this browser'; return; }
        ctx.resume();
        if (rainGain) rainGain.gain.setTargetAtTime(CH[ch].rain, ctx.currentTime, 0.6);
        startClock();
        nowEl.textContent = 'Live · generated in your browser';
      } else {
        stopClock();
        if (ctx) {
          if (rainGain) rainGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
          ctx.suspend();
        }
        nowEl.textContent = 'Paused — press play to tune in';
      }
    };

    btn.addEventListener('click', () => setPlaying(!playing));

    const applyChannel = (i) => {
      ch = i;
      const c = CH[i];
      chBtns.forEach((b, k) => b.setAttribute('aria-checked', String(k === i)));
      trackEl.textContent = c.track;
      bpmEl.textContent = c.bpm;
      keyEl.textContent = c.key;
      if (ctx && filter) filter.frequency.setTargetAtTime(c.cutoff, ctx.currentTime, 0.3);
      if (ctx && rainGain && playing) rainGain.gain.setTargetAtTime(c.rain, ctx.currentTime, 0.8);
    };

    chBtns.forEach((b) => b.addEventListener('click', () => applyChannel(Number(b.dataset.ch))));

    if (range) {
      range.addEventListener('input', () => {
        volume = Number(range.value) / 100;
        if (master && !muted) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
      });
    }
    if (mute) {
      mute.addEventListener('click', () => {
        muted = !muted;
        mute.setAttribute('aria-pressed', String(muted));
        mute.setAttribute('aria-label', muted ? 'Unmute' : MUTE_ICON_ON);
        if (master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.06);
      });
    }

    // pause when the section leaves the viewport for a long time
    let leaveT = 0;
    new IntersectionObserver(([e]) => {
      if (!playing) return;
      if (!e.isIntersecting) {
        leaveT = setTimeout(() => setPlaying(false), 12000);
      } else {
        clearTimeout(leaveT);
      }
    }, { threshold: 0 }).observe(sec);

    if (cv) {
      initBars();
      addEventListener('resize', () => { clearTimeout(initBars._t); initBars._t = setTimeout(initBars, 180); }, { passive: true });
      raf(drawViz);
    }
  })();

  /* ══════════════════════════════════════════════════════════
     20d. FOCUS ROOM — a silent room with one timer
     ══════════════════════════════════════════════════════════ */
  const room = $('#room');
  let openRoom = () => {};
  (() => {
    if (!room) return;

    const timeEl = $('#roomTime');
    const stateEl = $('#roomState');
    const toggle = $('#roomToggle');
    const toggleTxt = $('#roomToggleTxt');
    const reset = $('#roomReset');
    const prog = $('#roomProg');
    const exit = $('#roomExit');
    const lens = $$('.room__lens button');
    const noEl = $('#roomNo');
    const sessionsEl = $('#roomSessions');

    const CIRC = 2 * Math.PI * 168;

    let total = 25 * 60;
    let left = total;
    let running = false;
    let tick = null;
    let last = 0;
    let finished = 0;
    let opened = false;

    const fmt = (s) => {
      const t = Math.max(0, Math.ceil(s));
      const m = Math.floor(t / 60);
      const sec = t % 60;
      return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    };

    const paint = () => {
      timeEl.textContent = fmt(left);
      const p = 1 - left / total;
      prog.style.strokeDasharray = `${(p * CIRC).toFixed(1)} ${CIRC}`;
      const a = -Math.PI / 2 + p * Math.PI * 2;
      const head = $('#roomHead');
      if (head) {
        head.setAttribute('cx', 200 + Math.cos(a) * 168);
        head.setAttribute('cy', 200 + Math.sin(a) * 168);
      }
      const dial = $('.room__dial');
      if (dial) dial.classList.toggle('live', left < total && left > 0);
    };

    const setState = () => {
      room.classList.toggle('running', running);
      toggleTxt.textContent = running ? 'Pause' : (left === total ? 'Start focusing' : 'Resume');
      toggle.setAttribute('aria-pressed', String(running));
      if (running) stateEl.textContent = 'In progress. Stay here.';
      else if (left === total) stateEl.textContent = 'Breathe in. The room is quiet.';
      else if (left === 0) stateEl.textContent = 'Session complete. Go touch grass.';
      else stateEl.textContent = 'Paused. No rush.';
    };

    const beep = () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const c = new AC();
        const g = c.createGain();
        g.gain.value = 0.0001;
        g.connect(c.destination);
        g.gain.exponentialRampToValueAtTime(0.1, c.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.6);

        [523.25, 659.25, 783.99].forEach((f, i) => {
          const o = c.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          o.connect(g);
          o.start(c.currentTime + i * 0.16);
          o.stop(c.currentTime + 1.8);
        });
        setTimeout(() => c.close(), 2400);
      } catch (e) {}
    };

    const run = () => {
      if (tick) return;
      last = performance.now();
      tick = setInterval(() => {
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        left = Math.max(0, left - dt);
        paint();
        if (left <= 0) {
          clearInterval(tick); tick = null;
          running = false;
          finished++;
          if (sessionsEl) sessionsEl.textContent = finished;
          setState();
          beep();
          if (document.hidden) document.title = 'session done · Code2Chill';
        }
      }, 250);
    };

    const pause = () => { clearInterval(tick); tick = null; running = false; setState(); };

    let releaseRoomTrap = null;
    openRoom = () => {
      room.classList.add('open');
      room.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('lock');
      if (!opened) { opened = true; paint(); }
      noEl.textContent = String(finished + 1).padStart(2, '0');
      exit.focus();
      if (!releaseRoomTrap) releaseRoomTrap = trapFocus($('.room__inner', room) || room);
    };

    const closeRoom = () => {
      room.classList.remove('open');
      room.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('lock');
      if (!running) pause();
      if (releaseRoomTrap) { releaseRoomTrap(); releaseRoomTrap = null; }
    };

    toggle.addEventListener('click', () => {
      if (running) { pause(); return; }
      if (left <= 0.5) { left = total; }
      running = true;
      setState();
      run();
    });

    reset.addEventListener('click', () => {
      pause();
      left = total;
      paint();
      setState();
    });

    lens.forEach((b) => b.addEventListener('click', () => {
      lens.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      total = Number(b.dataset.min) * 60;
      left = total;
      if (running) { clearInterval(tick); tick = null; run(); }
      paint();
      setState();
    }));

    exit.addEventListener('click', closeRoom);
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && room.classList.contains('open')) closeRoom();
    });

    // keep the document title honest while focusing in another tab
    let baseTitle = document.title;
    setInterval(() => {
      if (!running) return;
      if (document.hidden) {
        document.title = fmt(Math.ceil(left)) + ' · deep work';
      } else if (document.title !== baseTitle) {
        document.title = baseTitle;
      }
    }, 1000);

    const roomBtn = $('#roomBtn');
    if (roomBtn) roomBtn.addEventListener('click', openRoom);
  })();

  /* ══════════════════════════════════════════════════════════
     20e. THE NIGHT WALL — 32 nights, one square each
     ══════════════════════════════════════════════════════════ */
  (() => {
    const grid = $('#wallGrid');
    const axis = $('#wallAxis');
    const pop = $('#wpop');
    if (!grid) return;

    // one entry per build night, oldest → newest.
    // v = how loud the ship was (drives the square's fill), tags = stack used.
    const NIGHTS = [
      { n: 1,  p: 'hello-world',        d: '14 Jun 2024', v: .18, t: ['html', 'css'] },
      { n: 2,  p: 'chai.counter',       d: '21 Jun 2024', v: .22, t: ['js', 'localStorage'] },
      { n: 3,  p: 'git-blame-poetry',   d: '28 Jun 2024', v: .3,  t: ['python'] },
      { n: 4,  p: 'seat-map',           d: '05 Jul 2024', v: .34, t: ['react', 'svg'] },
      { n: 5,  p: 'deploy-bell',        d: '12 Jul 2024', v: .28, t: ['node', 'webhooks'] },
      { n: 6,  p: 'dark-mode-only',     d: '19 Jul 2024', v: .2,  t: ['css'] },
      { n: 7,  p: 'standup-bot',        d: '26 Jul 2024', v: .4,  t: ['python', 'slack'] },
      { n: 8,  p: 'diff-viz',           d: '02 Aug 2024', v: .52, t: ['d3', 'ts'] },
      { n: 9,  p: 'lofi-radio',         d: '09 Aug 2024', v: .46, t: ['webaudio'] },
      { n: 10, p: 'ascii-cam',          d: '16 Aug 2024', v: .58, t: ['canvas', 'wasm'] },
      { n: 11, p: 'chai-meter',         d: '23 Aug 2024', v: .36, t: ['iot', 'esp32'] },
      { n: 12, p: 'nightlog',           d: '30 Aug 2024', v: .44, t: ['next', 'sqlite'] },
      { n: 13, p: 'keyboard-golf',      d: '06 Sep 2024', v: .3,  t: ['js'] },
      { n: 14, p: 'mono-theme',         d: '13 Sep 2024', v: .24, t: ['css', 'tokens'] },
      { n: 15, p: 'pr-title-gpt',       d: '20 Sep 2024', v: .62, t: ['llm', 'github'] },
      { n: 16, p: 'room-noise',         d: '27 Sep 2024', v: .5,  t: ['webaudio'] },
      { n: 17, p: 'deploy-or-die',      d: '04 Oct 2024', v: .7,  t: ['go', 'k8s'] },
      { n: 18, p: 'seat-finder',        d: '11 Oct 2024', v: .42, t: ['svelte'] },
      { n: 19, p: 'blame-timeline',     d: '18 Oct 2024', v: .55, t: ['d3', 'git'] },
      { n: 20, p: 'chai-runner',        d: '25 Oct 2024', v: .48, t: ['canvas'] },
      { n: 21, p: 'edge-clock',         d: '01 Nov 2024', v: .38, t: ['edge', 'ts'] },
      { n: 22, p: 'index-forum',        d: '08 Nov 2024', v: .66, t: ['postgres', 'next'] },
      { n: 23, p: 'css-only-charts',    d: '15 Nov 2024', v: .34, t: ['css'] },
      { n: 24, p: 'merge-confetti',     d: '22 Nov 2024', v: .4,  t: ['canvas', 'webhooks'] },
      { n: 25, p: 'cold-start',         d: '29 Nov 2024', v: .6,  t: ['rust', 'wasm'] },
      { n: 26, p: 'room-temperature',   d: '06 Dec 2024', v: .44, t: ['iot'] },
      { n: 27, p: 'typed-css',          d: '13 Dec 2024', v: .32, t: ['ts', 'css'] },
      { n: 28, p: 'ship-log',           d: '20 Dec 2024', v: .52, t: ['next', 'sqlite'] },
      { n: 29, p: 'one-more-commit',    d: '27 Dec 2024', v: .74, t: ['git', 'cli'] },
      { n: 30, p: 'quiet-mode',         d: '03 Jan 2025', v: .26, t: ['css', 'a11y'] },
      { n: 31, p: 'spreadsheet-db',     d: '10 Jan 2025', v: .58, t: ['go', 'sheets'] },
      { n: 32, p: 'chill.fm',           d: '17 Jan 2025', v: .82, t: ['webaudio', 'canvas'] },
    ];

    const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

    // axis label row
    if (axis) {
      axis.innerHTML = '<span>Nº01 · jun 2024</span><span>Nº16</span><span>Nº32 · now</span>';
    }

    grid.innerHTML = NIGHTS.map((k) => `
      <div class="wall__cell" data-i="${k.n - 1}" style="--v:${k.v}" tabindex="0"
           role="button" aria-label="Night ${k.n}: ${esc(k.p)}, shipped ${esc(k.d)}">
        <i></i>
      </div>`).join('');

    const cells = $$('.wall__cell', grid);

    // reveal in sequence as the board enters
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (!e.isIntersecting) return;
        cells.forEach((c, i) => setTimeout(() => c.classList.add('in'), 22 * i));
        io.disconnect();
      });
    }, { threshold: 0.2 });
    io.observe(grid);

    // hover log card
    const noEl = $('#wpopNo'), nameEl = $('#wpopName'), metaEl = $('#wpopMeta'), tagsEl = $('#wpopTags');
    const wrNo = $('#wrNo'), wrName = $('#wrName'), wrMeta = $('#wrMeta');
    let px = 0, py = 0, tx = 0, ty = 0, on = false;

    addEventListener('pointermove', (e) => { tx = e.clientX + 34; ty = e.clientY - 24; }, { passive: true });
    const loop = () => {
      raf(loop);
      px = lerp(px, tx, 0.14);
      py = lerp(py, ty, 0.14);
      if (on) { pop.style.left = px + 'px'; pop.style.top = py + 'px'; }
    };
    raf(loop);

    // fill both the hover card and the readout with one night's facts
    const paint = (k) => {
      noEl.textContent = 'Nº' + String(k.n).padStart(2, '0');
      nameEl.textContent = k.p;
      metaEl.textContent = k.d + ' · ' + (k.v > .6 ? 'big ship' : k.v > .35 ? 'shipped' : 'small ship');
      tagsEl.innerHTML = k.t.map((t) => `<li>${esc(t)}</li>`).join('');

      // the same facts, written out for touch + keyboard + screen readers
      if (wrNo) wrNo.textContent = 'Nº' + String(k.n).padStart(2, '0');
      if (wrName) wrName.textContent = k.p;
      if (wrMeta) wrMeta.textContent = k.d + ' · ' + k.t.join(' / ');
    };

    const show = (i) => {
      const k = NIGHTS[i];
      if (!k) return;
      paint(k);
      on = true;
      px = tx; py = ty;
      pop.classList.add('on');
    };

    const hide = () => { on = false; pop.classList.remove('on'); };

    cells.forEach((c) => {
      const i = Number(c.dataset.i);
      c.addEventListener('pointerenter', () => show(i));
      c.addEventListener('pointerleave', hide);
      c.addEventListener('click', () => { paint(NIGHTS[i]); });
      c.addEventListener('focus', () => {
        const r = c.getBoundingClientRect();
        tx = r.left + r.width / 2; ty = r.top - 16;
        show(i);
      });
      c.addEventListener('blur', hide);
    });

    // seed the readout so it never starts empty — text only, no floating card
    if (wrNo) paint(NIGHTS[NIGHTS.length - 1]);
  })();

  /* ══════════════════════════════════════════════════════════
     21. HERO intro hook
     ══════════════════════════════════════════════════════════ */
  function startHero() {
    heroStart();
  }
  if (document.readyState === 'complete' && !pl) startHero();

})();
