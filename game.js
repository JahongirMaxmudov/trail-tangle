/* Trail Tangle — a path-drawing puzzle built for YouTube Playables.
   No external assets, no network calls. All SDK use is guarded so the game
   also runs on a plain local web server. */
(() => {
  'use strict';

  // ---------- SDK wrapper ----------
  const YT = typeof ytgame !== 'undefined' && ytgame.IN_PLAYABLES_ENV;
  const LOCAL_KEY = 'trail_tangle_save';

  // ---------- constants ----------
  const W = 100, H = 150;          // logical field size
  const R = 5;                     // critter radius
  const SPEED = 38;                // units per second
  const HOME_SNAP = 7;
  const GRAB = 10;
  const HAZ_R = 4.5;
  const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#b197fc'];
  const DARK = ['#c92a2a', '#1971c2', '#2b8a3e', '#6741d9'];

  // a: [startX,startY,homeX,homeY]  o: [x,y,w,h]  h: [x1,y1,x2,y2,speed]  s: [x,y]
  const LEVELS = [
    { a: [[50, 110, 50, 35]], s: [[50, 90], [50, 72], [50, 54]], hint: 'h1' },
    { a: [[50, 112, 50, 30]], o: [[30, 66, 40, 8]], s: [[20, 70], [20, 50], [40, 40]] },
    { a: [[25, 110, 75, 35], [75, 110, 25, 35]], s: [[50, 72], [25, 60], [75, 60]], hint: 'h3' },
    { a: [[20, 70, 80, 70], [80, 70, 20, 70]], o: [[45, 64, 10, 12]], s: [[50, 50], [50, 92], [50, 30]] },
    { a: [[50, 115, 50, 30]], o: [[0, 85, 65, 7], [35, 55, 65, 7]], s: [[82, 88], [18, 58], [50, 42]] },
    { a: [[20, 112, 80, 30], [50, 112, 50, 30], [80, 112, 20, 30]], s: [[50, 70], [30, 50], [70, 50]] },
    { a: [[50, 112, 50, 28]], h: [[15, 70, 85, 70, 30]], s: [[50, 95], [50, 50], [50, 40]], hint: 'h7' },
    { a: [[20, 110, 80, 110], [20, 35, 80, 35]], o: [[46, 10, 8, 55], [46, 85, 8, 50]], s: [[50, 75], [70, 75], [30, 75]] },
    { a: [[15, 112, 85, 30], [85, 112, 15, 30]], o: [[30, 66, 40, 8]], s: [[50, 50], [50, 95], [50, 30]] },
    { a: [[50, 112, 50, 28], [20, 70, 80, 70]], h: [[20, 50, 80, 50, 35]], s: [[50, 90], [35, 70], [65, 40]] },
    { a: [[18, 115, 50, 25], [82, 115, 18, 70], [18, 25, 82, 70], [82, 25, 50, 118]], s: [[50, 70], [35, 50], [65, 90]] },
    { a: [[50, 118, 50, 25]], o: [[0, 95, 70, 6], [30, 68, 70, 6], [0, 41, 70, 6]], s: [[85, 98], [15, 71], [85, 44]] },
    { a: [[20, 112, 20, 28], [80, 112, 80, 28]], o: [[46, 40, 8, 60]], h: [[10, 70, 90, 70, 45]], s: [[20, 55], [80, 55], [50, 115]] },
    { a: [[20, 112, 20, 30], [50, 115, 50, 28], [80, 112, 80, 30]], o: [[0, 66, 42, 8], [58, 66, 42, 8]], s: [[50, 70], [50, 50], [50, 92]] },
    { a: [[20, 112, 80, 30], [80, 112, 20, 30]], h: [[50, 25, 50, 115, 40]], s: [[50, 45], [50, 70], [50, 95]] },
    { a: [[15, 70, 85, 70], [50, 115, 50, 25], [85, 100, 15, 40]], o: [[30, 50, 10, 10], [60, 85, 10, 10]], s: [[50, 70], [30, 90], [70, 45]] },
    { a: [[50, 115, 50, 25], [20, 115, 80, 25]], h: [[10, 55, 90, 55, 40], [90, 88, 10, 88, 40]], s: [[50, 70], [25, 70], [75, 70]] },
    { a: [[20, 112, 80, 112], [80, 95, 20, 95], [20, 42, 80, 42], [80, 25, 20, 25]], s: [[50, 68], [50, 103], [50, 33]] },
    { a: [[30, 115, 70, 30], [70, 115, 30, 30]], o: [[0, 90, 40, 6], [60, 90, 40, 6], [25, 55, 50, 6]], h: [[10, 72, 90, 72, 35]], s: [[50, 100], [12, 58], [88, 58]] },
    { a: [[18, 115, 82, 25], [50, 115, 50, 25], [82, 115, 18, 25], [15, 70, 85, 70]], h: [[30, 50, 70, 50, 25]], s: [[50, 70], [30, 90], [70, 90]] },
  ];

  const STR = {
    en: { level: 'Level', h1: 'Draw a path home', h3: "Paths may cross — just don't bump!", h7: 'Watch out for the spiky ball!',
          next: 'Next', retry: 'Retry', levels: 'Levels', back: 'Back', great: 'Nice!', oops: 'Oops!',
          end1: 'All levels complete!', end2: 'New levels are coming soon.', loading: 'Loading…' },
    ru: { level: 'Уровень', h1: 'Нарисуй путь домой', h3: 'Пути могут пересекаться — главное не столкнуться!', h7: 'Берегись колючего шара!',
          next: 'Дальше', retry: 'Заново', levels: 'Уровни', back: 'Назад', great: 'Отлично!', oops: 'Ой!',
          end1: 'Все уровни пройдены!', end2: 'Скоро появятся новые.', loading: 'Загрузка…' },
    uz: { level: 'Daraja', h1: 'Uyga yo‘l chizing', h3: 'Yo‘llar kesishishi mumkin — faqat to‘qnashmang!', h7: 'Tikanli shardan ehtiyot bo‘ling!',
          next: 'Keyingi', retry: 'Qayta', levels: 'Darajalar', back: 'Orqaga', great: 'Zo‘r!', oops: 'Voy!',
          end1: 'Barcha darajalar tugadi!', end2: 'Tez orada yangilari qo‘shiladi.', loading: 'Yuklanmoqda…' },
    es: { level: 'Nivel', h1: 'Dibuja un camino a casa', h3: 'Los caminos pueden cruzarse, ¡pero no choques!', h7: '¡Cuidado con la bola de pinchos!',
          next: 'Siguiente', retry: 'Reintentar', levels: 'Niveles', back: 'Atrás', great: '¡Bien!', oops: '¡Ups!',
          end1: '¡Todos los niveles completados!', end2: 'Pronto habrá niveles nuevos.', loading: 'Cargando…' },
    tr: { level: 'Seviye', h1: 'Eve bir yol çiz', h3: 'Yollar kesişebilir — yeter ki çarpışma!', h7: 'Dikenli toptan uzak dur!',
          next: 'İleri', retry: 'Tekrar', levels: 'Seviyeler', back: 'Geri', great: 'Harika!', oops: 'Hay aksi!',
          end1: 'Tüm seviyeler tamamlandı!', end2: 'Yeni seviyeler yakında.', loading: 'Yükleniyor…' },
  };
  let T = STR.en;

  // ---------- state ----------
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  let vw = 1, vh = 1, dpr = 1, s = 1, ox = 0, oy = 0;
  let save = { v: 1, lvl: 0, stars: [] };
  let cloudLoaded = false;
  let ready = false, paused = false, raf = 0, last = 0, time = 0, hazT = 0;
  let li = 0, actors = [], stars = [], obst = [], haz = [];
  let mode = 'draw', modeT = 0, prevMode = 'draw';   // draw | ready | run | fail | win | levels | end
  let drawing = null, drawLen = 0, pointerId = null;
  let failAt = null, failed = [], wonStars = 0;
  let btns = [];
  let ac = null, audioOn = true;

  // ---------- audio ----------
  function ensureAudio() {
    if (!audioOn || paused) return;
    try {
      if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
      if (ac && ac.state === 'suspended') ac.resume();
    } catch (e) { /* audio unavailable */ }
  }
  function beep(f, d, type, vol, f2) {
    if (!audioOn || !ac || ac.state !== 'running') return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + d + 0.02);
  }
  const sfx = {
    grab: () => beep(520, 0.07, 'triangle', 0.08),
    link: () => beep(660, 0.12, 'triangle', 0.12, 990),
    star: () => beep(1100, 0.15, 'sine', 0.1, 1600),
    home: () => beep(520, 0.18, 'sine', 0.12, 780),
    fail: () => beep(220, 0.35, 'sawtooth', 0.1, 70),
    win: () => { beep(523, 0.14, 'triangle', 0.12); setTimeout(() => beep(659, 0.14, 'triangle', 0.12), 120); setTimeout(() => beep(784, 0.3, 'triangle', 0.12), 240); },
    tap: () => beep(440, 0.05, 'triangle', 0.07),
  };

  // ---------- save ----------
  function parseSave(str) {
    try {
      const d = JSON.parse(str);
      if (d && typeof d === 'object') {
        save.lvl = Math.max(0, Math.min(LEVELS.length, d.lvl | 0));
        save.stars = Array.isArray(d.stars) ? d.stars.slice(0, LEVELS.length).map(n => Math.max(0, Math.min(3, n | 0))) : [];
      }
    } catch (e) { /* empty or old save: start fresh */ }
  }
  function persist() {
    const data = JSON.stringify(save);
    if (YT) { if (cloudLoaded) ytgame.game.saveData(data).catch(() => {}); }
    else { try { localStorage.setItem(LOCAL_KEY, data); } catch (e) { /* ignore */ } }
  }
  function totalStars() { return save.stars.reduce((a, b) => a + (b || 0), 0); }

  // ---------- level ----------
  function loadLevel(i) {
    li = Math.max(0, Math.min(LEVELS.length - 1, i));
    const L = LEVELS[li];
    actors = L.a.map((a, k) => ({ k, sx: a[0], sy: a[1], x: a[0], y: a[1], hx: a[2], hy: a[3],
      path: null, done: false, arrived: false, d: 0, cum: null, seg: 0, dx: 0, dy: -1 }));
    stars = (L.s || []).map(p => ({ x: p[0], y: p[1], got: false }));
    obst = (L.o || []).map(o => ({ x: o[0], y: o[1], w: o[2], h: o[3] }));
    haz = (L.h || []).map(h => ({ x1: h[0], y1: h[1], x2: h[2], y2: h[3], sp: h[4], x: h[0], y: h[1] }));
    drawing = null; failAt = null; failed = [];
    setMode('draw');
  }
  function setMode(m) { mode = m; modeT = 0; }

  function segHitsRect(ax, ay, bx, by, r, pad) {
    const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad, y1 = r.y + r.h + pad;
    let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
    const p = [-dx, dx, -dy, dy], q = [ax - x0, x1 - ax, ay - y0, y1 - ay];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return false; }
      else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
    }
    return true;
  }
  function blocked(a, b) { for (const o of obst) if (segHitsRect(a.x, a.y, b.x, b.y, o, 3)) return true; return false; }

  function startRun() {
    for (const a of actors) {
      const c = [0];
      for (let i = 1; i < a.path.length; i++) c.push(c[i - 1] + Math.hypot(a.path[i].x - a.path[i - 1].x, a.path[i].y - a.path[i - 1].y));
      a.cum = c; a.d = 0; a.seg = 0; a.arrived = false;
    }
    setMode('run');
  }
  function along(a) {
    const p = a.path, c = a.cum, n = c.length - 1;
    if (a.d >= c[n]) return p[n];
    let i = a.seg; while (i < n - 1 && c[i + 1] < a.d) i++; a.seg = i;
    const t = (a.d - c[i]) / ((c[i + 1] - c[i]) || 1);
    return { x: p[i].x + (p[i + 1].x - p[i].x) * t, y: p[i].y + (p[i + 1].y - p[i].y) * t };
  }
  function fail(x, y, who) { failAt = { x, y }; failed = who; sfx.fail(); setMode('fail'); }
  function afterFail() {
    for (const a of failed) { a.path = null; a.done = false; }
    for (const a of actors) { a.x = a.sx; a.y = a.sy; a.d = 0; a.arrived = false; }
    for (const st of stars) st.got = false;
    failAt = null; failed = []; setMode('draw');
  }
  function win() {
    wonStars = stars.filter(st => st.got).length;
    save.stars[li] = Math.max(save.stars[li] || 0, wonStars);
    for (let i = 0; i < LEVELS.length; i++) if (save.stars[i] == null) save.stars[i] = 0;
    save.lvl = Math.max(save.lvl, li + 1);
    persist();
    if (YT) ytgame.engagement.sendScore({ value: totalStars() }).catch(() => {});
    sfx.win(); setMode('win');
  }

  // ---------- update ----------
  function update(dt) {
    time += dt; modeT += dt; hazT += dt;
    for (const h of haz) {
      const len = Math.hypot(h.x2 - h.x1, h.y2 - h.y1) || 1;
      let ph = (hazT * h.sp) % (2 * len); if (ph > len) ph = 2 * len - ph;
      h.x = h.x1 + (h.x2 - h.x1) * ph / len; h.y = h.y1 + (h.y2 - h.y1) * ph / len;
    }
    if (mode === 'ready' && modeT > 0.35) startRun();
    else if (mode === 'run') {
      for (const a of actors) {
        if (a.arrived) continue;
        a.d += SPEED * dt;
        const p = along(a);
        if (Math.hypot(p.x - a.x, p.y - a.y) > 0.01) { const m = Math.hypot(p.x - a.x, p.y - a.y); a.dx = (p.x - a.x) / m; a.dy = (p.y - a.y) / m; }
        a.x = p.x; a.y = p.y;
        for (const st of stars) if (!st.got && Math.hypot(st.x - a.x, st.y - a.y) < R + 2.5) { st.got = true; sfx.star(); }
        if (a.d >= a.cum[a.cum.length - 1]) { a.arrived = true; sfx.home(); }
      }
      for (let i = 0; i < actors.length; i++) {
        const a = actors[i]; if (a.arrived) continue;
        for (const h of haz) if (Math.hypot(h.x - a.x, h.y - a.y) < R + HAZ_R - 1) return fail(a.x, a.y, [a]);
        for (let j = i + 1; j < actors.length; j++) {
          const b = actors[j]; if (b.arrived) continue;
          if (Math.hypot(a.x - b.x, a.y - b.y) < 2 * R - 1) return fail((a.x + b.x) / 2, (a.y + b.y) / 2, [a, b]);
        }
      }
      if (actors.every(a => a.arrived)) win();
    } else if (mode === 'fail' && modeT > 0.9) afterFail();
  }

  // ---------- drawing helpers ----------
  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function txt(str, x, y, size, color, align, maxW) {
    ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    if (maxW) { const w = ctx.measureText(str).width; if (w > maxW) { size *= maxW / w; ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`; } }
    ctx.fillText(str, x, y);
  }
  function wrapTxt(str, x, y, size, color, maxW) {
    ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    const words = str.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    lines.push(cur);
    lines.forEach((l, i) => txt(l, x, y + i * size * 1.25, size, color));
  }
  function starShape(x, y, r, fill, stroke) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.46 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = r * 0.14; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function button(x, y, w, h, label, fn, primary) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; rr(x, y + 1, w, h, h / 2); ctx.fill();
    ctx.fillStyle = primary ? '#ff922b' : '#ffffff'; rr(x, y, w, h, h / 2); ctx.fill();
    txt(label, x + w / 2, y + h / 2 + 0.2, h * 0.46, primary ? '#fff' : '#34495e', 'center', w - 5);
    btns.push({ x, y, w, h, fn });
  }

  function drawHome(a) {
    const c = COLORS[a.k];
    ctx.save(); ctx.translate(a.hx, a.hy);
    ctx.globalAlpha = 0.28; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, 7.2, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.setLineDash([2.2, 1.6]); ctx.lineDashOffset = -time * 3; ctx.lineWidth = 0.8; ctx.strokeStyle = DARK[a.k];
    ctx.beginPath(); ctx.arc(0, 0, 7.2, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = DARK[a.k]; ctx.beginPath(); ctx.moveTo(-4.4, -0.6); ctx.lineTo(0, -4.6); ctx.lineTo(4.4, -0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c; rr(-3.2, -0.9, 6.4, 4.8, 0.8); ctx.fill();
    ctx.fillStyle = '#fff'; rr(-0.9, 1, 1.8, 2.9, 0.5); ctx.fill();
    ctx.restore();
  }
  function drawCritter(a) {
    if (a.arrived) return;
    const bob = mode === 'run' ? Math.sin(time * 18 + a.k) * 0.25 : Math.sin(time * 3 + a.k * 2) * 0.3;
    ctx.save(); ctx.translate(a.x, a.y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(0, R * 0.95, R * 0.8, R * 0.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = COLORS[a.k]; ctx.strokeStyle = DARK[a.k]; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(-R * 0.62, -R * 0.7, R * 0.34, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(R * 0.62, -R * 0.7, R * 0.34, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.stroke();
    const ex = a.dx * 0.7, ey = a.dy * 0.7;
    for (const sx of [-1.8, 1.8]) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, -0.8, 1.45, 0, 7); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(sx + ex, -0.8 + ey, 0.7, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = '#222'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
    ctx.beginPath(); if (mode === 'fail' && failed.includes(a)) ctx.arc(0, 2.9, 1.2, Math.PI * 1.15, Math.PI * 1.85); else ctx.arc(0, 1.3, 1.4, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.restore();
  }
  function drawPath(a) {
    if (!a.path || a.path.length < 2) return;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.path[0].x, a.path[0].y);
    for (let i = 1; i < a.path.length; i++) ctx.lineTo(a.path[i].x, a.path[i].y);
    ctx.globalAlpha = mode === 'run' ? 0.35 : 0.9;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.4; ctx.stroke();
    ctx.strokeStyle = COLORS[a.k]; ctx.lineWidth = 2.2;
    if (!a.done) ctx.setLineDash([0.1, 3.4]);
    ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  // ---------- render ----------
  function draw() {
    btns = [];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, '#3b4f7a'); g.addColorStop(1, '#24304a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);

    if (!ready) { txt(T.loading, W / 2, H / 2, 7, '#fff'); return; }

    // shake on fail
    if (mode === 'fail' && modeT < 0.35) ctx.translate(Math.sin(modeT * 90) * 0.9 * (1 - modeT / 0.35), 0);

    // field
    ctx.fillStyle = '#d8f0c2'; rr(1, 11, W - 2, 123, 5); ctx.fill();
    ctx.save(); rr(1, 11, W - 2, 123, 5); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let y = 0; y < 13; y++) for (let x = 0; x < 10; x++) if ((x + y) % 2) ctx.fillRect(x * 10, 11 + y * 10, 10, 10);

    for (const o of obst) {
      ctx.fillStyle = '#4c5a6b'; rr(o.x, o.y + 1.2, o.w, o.h, 2.5); ctx.fill();
      ctx.fillStyle = '#7b8a9c'; rr(o.x, o.y, o.w, o.h - 0.6, 2.5); ctx.fill();
    }
    for (const a of actors) drawHome(a);
    for (const a of actors) drawPath(a);
    for (const st of stars) if (!st.got) starShape(st.x, st.y + Math.sin(time * 3 + st.x) * 0.5, 3.6, '#ffd43b', '#f08c00');
    for (const h of haz) {
      ctx.globalAlpha = 0.25; ctx.strokeStyle = '#e03131'; ctx.lineWidth = 0.6; ctx.setLineDash([1.5, 1.5]);
      ctx.beginPath(); ctx.moveTo(h.x1, h.y1); ctx.lineTo(h.x2, h.y2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(time * 4);
      ctx.fillStyle = '#e03131'; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const an = i * Math.PI / 8, q = i % 2 ? HAZ_R * 0.68 : HAZ_R * 1.15; ctx.lineTo(Math.cos(an) * q, Math.sin(an) * q); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffa8a8'; ctx.beginPath(); ctx.arc(0, 0, HAZ_R * 0.4, 0, 7); ctx.fill();
      ctx.restore();
    }
    for (const a of actors) drawCritter(a);

    // tutorial hand on level 1
    if (li === 0 && mode === 'draw' && !actors[0].path) {
      const a = actors[0], t = (time % 2) / 2, e = Math.min(1, t * 1.4);
      const hx = a.sx + (a.hx - a.sx) * e, hy = a.sy + (a.hy - a.sy) * e;
      ctx.globalAlpha = 0.5; ctx.strokeStyle = COLORS[0]; ctx.lineWidth = 2; ctx.setLineDash([0.1, 3.4]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(hx, hy); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 0.9;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#34495e'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(hx + 2, hy + 2, 3, 0, 7); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (failAt) {
      const k = Math.min(1, modeT / 0.3);
      ctx.globalAlpha = 1 - k * 0.6; starShape(failAt.x, failAt.y, 4 + k * 7, '#fff', '#e03131'); ctx.globalAlpha = 1;
    }
    ctx.restore();

    // HUD
    txt(`${T.level} ${li + 1}`, W / 2, 5.6, 5.4, '#fff');
    const got = stars.filter(st => st.got).length;
    for (let i = 0; i < 3; i++) starShape(84 + i * 6, 5.6, 2.4, i < got ? '#ffd43b' : 'rgba(255,255,255,0.25)');
    const hint = LEVELS[li].hint;
    if (hint && (mode === 'draw' || mode === 'ready')) {
      ctx.fillStyle = 'rgba(36,48,74,0.8)'; rr(8, 14, 84, 9, 4.5); ctx.fill();
      txt(T[hint], W / 2, 18.6, 4, '#fff', 'center', 78);
    }
    if (mode === 'draw' || mode === 'ready' || mode === 'run' || mode === 'fail') {
      const act = mode === 'draw';
      ctx.globalAlpha = act ? 1 : 0.5;
      button(8, 137.5, 38, 10, '↻ ' + T.retry, () => { if (mode === 'draw') { sfx.tap(); loadLevel(li); } });
      button(54, 137.5, 38, 10, '▦ ' + T.levels, () => { if (mode === 'draw') { sfx.tap(); prevMode = 'draw'; setMode('levels'); } });
      ctx.globalAlpha = 1;
    }

    if (mode === 'win' && modeT > 0.4) drawWin();
    if (mode === 'levels') drawLevels();
    if (mode === 'end') drawEnd();
  }

  function panel(y, h) {
    ctx.fillStyle = 'rgba(20,28,48,0.55)'; ctx.fillRect(-ox / s, -oy / s, vw / s, vh / s);
    ctx.fillStyle = '#fffaf0'; rr(10, y, 80, h, 6); ctx.fill();
  }
  function drawWin() {
    const k = Math.min(1, (modeT - 0.4) / 0.25);
    panel(42, 62);
    txt(T.great, W / 2, 53, 8, '#34495e', 'center', 70);
    for (let i = 0; i < 3; i++) {
      const on = i < wonStars, pop = on ? Math.min(1, Math.max(0, (modeT - 0.5 - i * 0.18) / 0.2)) : 1;
      starShape(30 + i * 20, 70 - (i === 1 ? 3 : 0), 8 * (on ? 0.4 + 0.6 * pop : 1), on ? '#ffd43b' : '#e3ddd0', on ? '#f08c00' : null);
    }
    if (k < 1) return;
    const lastLevel = li >= LEVELS.length - 1;
    button(16, 86, 30, 12, '↻ ' + T.retry, () => { sfx.tap(); loadLevel(li); });
    button(52, 86, 32, 12, T.next + ' ›', nextLevel, true);
    function nextLevel() { sfx.tap(); if (lastLevel) setMode('end'); else loadLevel(li + 1); }
  }
  function drawEnd() {
    panel(40, 66);
    starShape(W / 2, 54, 8, '#ffd43b', '#f08c00');
    txt(T.end1, W / 2, 69, 6, '#34495e', 'center', 72);
    txt(T.end2, W / 2, 77, 4.2, '#6b7a8c', 'center', 72);
    txt(`★ ${totalStars()} / ${LEVELS.length * 3}`, W / 2, 85, 4.6, '#f08c00');
    button(30, 91, 40, 11, '▦ ' + T.levels, () => { sfx.tap(); prevMode = 'end'; setMode('levels'); }, true);
  }
  function drawLevels() {
    ctx.fillStyle = 'rgba(20,28,48,0.6)'; ctx.fillRect(-ox / s, -oy / s, vw / s, vh / s);
    ctx.fillStyle = '#fffaf0'; rr(5, 14, 90, 128, 6); ctx.fill();
    txt(T.levels, W / 2, 23, 6.5, '#34495e');
    txt(`★ ${totalStars()} / ${LEVELS.length * 3}`, W / 2, 30.5, 4, '#f08c00');
    for (let i = 0; i < LEVELS.length; i++) {
      const cx = 17 + (i % 4) * 22, cy = 44 + Math.floor(i / 4) * 17.5, open = i <= save.lvl;
      ctx.fillStyle = open ? (i === li ? '#ff922b' : '#4dabf7') : '#d5cfc2'; rr(cx - 9, cy - 7, 18, 14, 3.5); ctx.fill();
      txt(String(i + 1), cx, cy - 1.6, 5.4, '#fff');
      const n = save.stars[i] || 0;
      for (let k = 0; k < 3; k++) starShape(cx - 4 + k * 4, cy + 3.8, 1.6, k < n ? '#ffe066' : 'rgba(255,255,255,0.35)');
      if (open) btns.push({ x: cx - 9, y: cy - 7, w: 18, h: 14, fn: () => { sfx.tap(); loadLevel(i); } });
    }
    button(32, 128, 36, 10, '‹ ' + T.back, closeLevels);
  }
  function closeLevels() { sfx.tap(); setMode(prevMode); }

  // ---------- input ----------
  function toField(e) { return { x: (e.clientX - ox) / s, y: (e.clientY - oy) / s }; }
  function clampP(p) { return { x: Math.max(4, Math.min(W - 4, p.x)), y: Math.max(15, Math.min(130, p.y)) }; }

  cv.addEventListener('pointerdown', e => {
    if (!ready || paused) return;
    ensureAudio();
    const p = toField(e);
    for (let i = btns.length - 1; i >= 0; i--) {
      const b = btns[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.fn(); return; }
    }
    if (mode !== 'draw' || drawing) return;
    let best = null, bd = GRAB;
    for (const a of actors) { const d = Math.hypot(a.sx - p.x, a.sy - p.y); if (d < bd) { bd = d; best = a; } }
    if (!best) return;
    drawing = best; drawLen = 0; pointerId = e.pointerId;
    best.path = [{ x: best.sx, y: best.sy }]; best.done = false;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    sfx.grab();
  });
  cv.addEventListener('pointermove', e => {
    if (!drawing || e.pointerId !== pointerId || mode !== 'draw') return;
    const a = drawing, p = clampP(toField(e)), l = a.path[a.path.length - 1];
    const d = Math.hypot(p.x - l.x, p.y - l.y);
    if (d < 1.2 || drawLen > 900 || blocked(l, p)) return;
    a.path.push(p); drawLen += d;
    if (drawLen > 8 || Math.hypot(a.sx - a.hx, a.sy - a.hy) > HOME_SNAP * 2) {
      if (Math.hypot(p.x - a.hx, p.y - a.hy) < HOME_SNAP) {
        a.path.push({ x: a.hx, y: a.hy }); a.done = true; drawing = null; sfx.link();
        if (actors.every(q => q.done)) setMode('ready');
      }
    }
  });
  function endStroke(e) {
    if (!drawing || (e && e.pointerId !== pointerId)) return;
    if (!drawing.done) drawing.path = null;
    drawing = null;
  }
  cv.addEventListener('pointerup', endStroke);
  cv.addEventListener('pointercancel', endStroke);
  cv.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('keydown', e => {
    if (!ready || paused) return;
    if (e.key === 'Escape') { if (mode === 'levels') closeLevels(); return; }   // never preventDefault on Esc
    if (e.key === 'Enter' || e.key === ' ') {
      if (mode === 'win' && modeT > 0.7) { if (li >= LEVELS.length - 1) setMode('end'); else loadLevel(li + 1); }
    } else if ((e.key === 'r' || e.key === 'R') && (mode === 'draw' || mode === 'win')) loadLevel(li);
  });

  // ---------- layout & loop ----------
  function resize() {
    vw = window.innerWidth || 1; vh = window.innerHeight || 1;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    s = Math.min(vw / W, vh / H); ox = (vw - W * s) / 2; oy = (vh - H * s) / 2;
    if (!raf) draw();
  }
  window.addEventListener('resize', resize);

  function frame(t) {
    raf = 0; if (paused) return;
    const dt = Math.min(0.033, Math.max(0, (t - last) / 1000)); last = t;
    update(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function startLoop() { if (!raf && !paused) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function pause() {
    paused = true; if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (drawing) endStroke();
    if (ac && ac.state === 'running') ac.suspend();
    persist();
  }
  function resume() { paused = false; if (ac && audioOn && ac.state === 'suspended') ac.resume(); startLoop(); }

  // ---------- boot ----------
  async function boot() {
    resize();                                   // paints the loading frame
    if (YT) {
      ytgame.game.firstFrameReady();
      audioOn = ytgame.system.isAudioEnabled();
      ytgame.system.onAudioEnabledChange(on => {
        audioOn = on;
        if (ac) { if (!on) ac.suspend(); else if (!paused) ac.resume(); }
      });
      ytgame.system.onPause(pause);
      ytgame.system.onResume(resume);
      try { const lang = await ytgame.system.getLanguage(); T = STR[String(lang).slice(0, 2).toLowerCase()] || STR.en; } catch (e) { /* keep English */ }
      try { parseSave(await ytgame.game.loadData()); cloudLoaded = true; } catch (e) { cloudLoaded = false; }
    } else {
      T = STR[(navigator.language || 'en').slice(0, 2).toLowerCase()] || STR.en;
      try { parseSave(localStorage.getItem(LOCAL_KEY) || ''); } catch (e) { /* ignore */ }
    }
    loadLevel(Math.min(save.lvl, LEVELS.length - 1));
    ready = true;
    startLoop();
    if (YT) ytgame.game.gameReady();
  }
  boot();

  // test hook for local automated checks only (never present inside Playables)
  if (!YT) window.__tt = { get mode() { return mode; }, get li() { return li; }, get save() { return save; }, actors: () => actors, loadLevel, LEVELS, step: dt => { update(dt); draw(); }, field: () => ({ s, ox, oy }) };
})();
