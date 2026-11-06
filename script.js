/* ----- Bruno ConOps stepper (works with reduced motion too) ----- */
(function () {
  const img = document.getElementById('conops-img');
  if (!img) return;
  const cap = document.getElementById('conops-cap');
  const btns = [...document.querySelectorAll('.conops-steps button')];
  const steps = [
    ['Start. Arms folded up in a fully predictable pose, which is why the first cycle can run on autopilot.', 'starting zone'],
    ['Excavate. Arms lower in place and the drums spin in. 60 seconds.', 'excavate'],
    ['Traverse. The arms rise while driving, saving 20 seconds every single cycle.', 'traverse'],
    ['Construct. Dump one side, back up, turn 180 degrees, dump the other.', 'construct']
  ];
  steps.forEach((s, i) => { const p = new Image(); p.src = 'assets/pdf/conops-' + (i + 1) + '.png'; });
  let cur = 0;
  function show(i) {
    cur = (i + steps.length) % steps.length;
    img.src = 'assets/pdf/conops-' + (cur + 1) + '.png';
    img.alt = "Bruno's concept of operations, step " + (cur + 1) + ': ' + steps[cur][1];
    cap.textContent = steps[cur][0];
    btns.forEach((b, k) => b.classList.toggle('on', k === cur));
  }
  btns.forEach((b, k) => b.addEventListener('click', () => show(k)));
  document.getElementById('conops-frame').addEventListener('click', () => show(cur + 1));
  show(0);
})();

/* ----- Projects dropdown ----- */
(function () {
  const dd = document.getElementById('dd');
  if (!dd) return;
  const btn = dd.querySelector('.dd-btn');
  const set = o => { dd.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!dd.classList.contains('open')); });
  document.addEventListener('click', e => { if (!dd.contains(e.target)) set(false); });
  dd.querySelectorAll('.dd-menu a').forEach(a => a.addEventListener('click', () => { set(false); a.blur(); dd.classList.add('closing'); setTimeout(() => dd.classList.remove('closing'), 400); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { set(false); btn.blur(); } });
})();

/* ----- NASA photo carousel ----- */
(function () {
  const track = document.getElementById('car-track');
  if (!track) return;
  const slides = [...track.children];
  const prev = document.getElementById('car-prev'), next = document.getElementById('car-next'), count = document.getElementById('car-count');
  const step = () => slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
  const idx = () => Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / step())));
  function update() {
    const i = idx(), vis = Math.max(1, Math.round((track.clientWidth - 28) / step()));
    const last = Math.min(slides.length, i + vis);
    count.textContent = (last > i + 1 ? (i + 1) + '-' + last : (i + 1)) + ' / ' + slides.length;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  }
  const go = i => track.scrollTo({ left: Math.max(0, Math.min(slides.length - 1, i)) * step(), behavior: 'smooth' });
  prev.addEventListener('click', () => go(idx() - 1));
  next.addEventListener('click', () => go(idx() + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); }
  });
  addEventListener('resize', update);
  update();
})();

(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const cv = document.getElementById('world');
  const ctx = cv.getContext('2d');
  const toggleBtn = document.getElementById('toggle'), toggleLbl = toggleBtn.querySelector('.lbl'), toggleTip = document.getElementById('toggle-tip');
  const INK = '#2a2118', ORANGE = '#e8570e';
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); addEventListener('resize', resize);

  /* ----- world state (page coordinates) ----- */
  const robot = { x: 0, y: 0, th: -Math.PI / 2, v: 0, odo: 0, trail: [] };
  const person = { cx: -999, cy: -999, lcx: -999, lcy: -999, vx: 0, vy: 0, fx: 1, fy: 0, speed: 0, last: -1e9, has: false };
  const cones = [];
  let think = true, on = true, lastType = 'mouse', parkedAt = 0, lastQuip = '';

  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse) {
    const hint = document.querySelector('.play span');
    if (hint) hint.textContent = "Tap anywhere. A little robot will drive out ahead of your finger, same trick as my stroller. Tap to drop cones and watch it dodge.";
  }
  const heroEl = document.querySelector('.hero .hero-photos');
  const stations = [...document.querySelectorAll('.st')];

  function sy() { return window.scrollY || 0; }
  function dockTarget() {
    // which section is under the middle of the viewport?
    const mid = H * 0.5;
    let pick = null, best = 1e9;
    stations.forEach(s => {
      const r = s.getBoundingClientRect();
      const d = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0;
      if (d < best) { best = d; pick = s; }
    });
    const narrow = W < 900;
    const hr = (narrow ? document.querySelector('.hero h1') : heroEl).getBoundingClientRect();
    if (hr.bottom > H * 0.35 && (best > 0 || pick.getBoundingClientRect().top > H * 0.45)) {
      return { x: narrow ? W - 50 : Math.max(44, hr.left - 52), y: (narrow ? clamp(hr.top + 36, 110, H - 90) : Math.min(hr.bottom - 60, H - 90)) + sy(), quip: coarse ? 'Hi! Tap anywhere and I\'ll lead the way.' : 'Hi! Move your mouse and I\'ll go ahead of you.' };
    }
    const d = pick.querySelector('[data-dock]').getBoundingClientRect();
    let cy = d.top + d.height / 2;
    const vis = cy > 90 && cy < H - 70;
    if (!vis) cy = Math.min(Math.max(cy, 110), H - 90);
    return { x: clamp(d.left + d.width / 2, 44, W - 44), y: cy + sy(), quip: pick.dataset.quip };
  }

  // start parked at the hero
  (function init() {
    const t = dockTarget(); robot.x = t.x; robot.y = t.y;
  })();

  /* ----- input ----- */
  function onPointer(e) {
    lastType = e.pointerType || 'mouse';
    person.cx = e.clientX; person.cy = e.clientY;
    if (!person.has) { person.lcx = e.clientX; person.lcy = e.clientY; person.has = true; }
    person.last = performance.now();
  }
  addEventListener('pointermove', onPointer, { passive: true });
  addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('pointerleave', () => { person.last = -1e9; });
  document.documentElement.addEventListener('mouseleave', () => { person.last = -1e9; });

  function addCone(x, y) {
    cones.push({ x, y, born: performance.now() });
    if (cones.length > 10) cones.shift();
  }
  document.addEventListener('click', e => {
    if (!on) return;
    if (e.target.closest('a, button, input, video, .ui, nav, .car-track')) return;
    addCone(e.clientX + scrollX, e.clientY + sy());
  });
  const clearBtn = document.getElementById('clear');
  clearBtn.addEventListener('click', e => { e.stopPropagation(); cones.length = 0; if (e.detail) clearBtn.blur(); });

  // robot on/off (button or Esc). Off = nothing drawn, nothing follows the mouse.
  function setOn(v) {
    on = v;
    if (!on) { cones.length = 0; person.last = -1e9; ctx.clearRect(0, 0, W, H); }
    else { prev = performance.now(); const t = dockTarget(); if (Math.hypot(t.x - robot.x, t.y - robot.y) > 1600) { robot.x = t.x; robot.y = t.y; } }
    toggleBtn.setAttribute('aria-pressed', on);
    toggleLbl.textContent = 'robot: ' + (on ? 'on' : 'off');
    toggleTip.innerHTML = on ? '<kbd>Esc</kbd> turn the robot off' : 'click to bring the robot back';
    clearBtn.disabled = !on;
  }
  toggleBtn.addEventListener('click', e => { e.stopPropagation(); setOn(!on); if (e.detail) toggleBtn.blur(); });

  // keyboard shortcuts: Esc = robot off, Space = clear cones (only when there are cones, so Space still scrolls the page normally)
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea, select, button, a, [contenteditable], .car-track')) { if (e.key !== 'Escape') return; }
    if (e.key === 'Escape' && on) setOn(false);
    else if ((e.key === ' ' || e.code === 'Space') && on && cones.length) { e.preventDefault(); cones.length = 0; }
  });

  /* ----- simulation ----- */
  let prev = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (!on) { requestAnimationFrame(frame); return; }
    const scrollY = sy();
    const active = person.has && now - person.last < 2200;

    // person velocity (screen space, so scrolling doesn't count as walking)
    if (person.has) {
      const ivx = (person.cx - person.lcx) / Math.max(dt, 1e-3), ivy = (person.cy - person.lcy) / Math.max(dt, 1e-3);
      person.lcx = person.cx; person.lcy = person.cy;
      const k = 1 - Math.exp(-dt / 0.18);
      person.vx += (ivx - person.vx) * k; person.vy += (ivy - person.vy) * k;
      person.speed = Math.hypot(person.vx, person.vy);
      if (person.speed > 70) {
        const k2 = 1 - Math.exp(-dt / 0.22);
        person.fx += (person.vx / person.speed - person.fx) * k2; person.fy += (person.vy / person.speed - person.fy) * k2;
        const n = Math.hypot(person.fx, person.fy) || 1; person.fx /= n; person.fy /= n;
      }
    }
    const px = person.cx + scrollX, py = person.cy + scrollY;

    // choose a goal
    let tx, ty, parked = false, lead = 0;
    if (active) {
      lead = clamp(86 + person.speed * 0.09, 86, 190);
      tx = px + person.fx * lead; ty = py + person.fy * lead;
    } else {
      const d = dockTarget(); tx = d.x; ty = d.y; parked = true;
      if (d.quip !== lastQuip) { lastQuip = d.quip; parkedAt = now; }
    }

    // teleport if far away (long scroll)
    if (Math.hypot(tx - robot.x, ty - robot.y) > 1600) {
      robot.x = tx; robot.y = ty + (robot.y < ty ? -700 : 700);
    }

    // desired velocity + obstacle push
    let ux = (tx - robot.x) * 3.0, uy = (ty - robot.y) * 3.0;
    const toTx = tx - robot.x, toTy = ty - robot.y;
    const push = (ox, oy, R, gain) => {
      const dx = robot.x - ox, dy = robot.y - oy, d = Math.hypot(dx, dy) || 1;
      if (d >= R) return;
      const m = (R - d) / R, nx = dx / d, ny = dy / d;
      const side = Math.sign(toTx * ny - toTy * nx) || 1; // swirl to slip past instead of getting stuck
      ux += (nx * gain + (-ny * side) * gain * .75) * m;
      uy += (ny * gain + (nx * side) * gain * .75) * m;
    };
    cones.forEach(c => push(c.x, c.y, 88, 1300));
    if (active) push(px, py, 62, 1100);

    const mag = Math.hypot(ux, uy), vmax = parked ? 380 : 620;
    if (mag > vmax) { ux *= vmax / mag; uy *= vmax / mag; }
    const m2 = Math.hypot(ux, uy);
    let want = m2 > 12 ? Math.atan2(uy, ux) : robot.th;
    if (parked && m2 < 18) want = -Math.PI / 2;
    const diff = wrap(want - robot.th);
    const turn = clamp(diff, -7 * dt, 7 * dt);
    robot.th += turn;
    const align = Math.max(0, Math.cos(wrap(want - robot.th)));
    const vt = m2 > 12 ? m2 * align * align : 0;
    robot.v += (vt - robot.v) * Math.min(1, dt * 9);
    robot.x += Math.cos(robot.th) * robot.v * dt;
    robot.y += Math.sin(robot.th) * robot.v * dt;
    robot.odo += robot.v * dt;
    if (robot.v >= 12 || active) parkedAt = now; // bubble timer starts once it has actually stopped
    if (!robot.trail.length || Math.hypot(robot.x - robot.trail[robot.trail.length - 1][0], robot.y - robot.trail[robot.trail.length - 1][1]) > 9) {
      robot.trail.push([robot.x, robot.y]); if (robot.trail.length > 34) robot.trail.shift();
    }

    draw(now, scrollY, px, py, tx, ty, active, parked, lead);
    requestAnimationFrame(frame);
  }

  /* ----- drawing ----- */
  function draw(now, scrollY, px, py, tx, ty, active, parked, lead) {
    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.translate(-scrollX, -scrollY);

    // robot trail
    ctx.lineCap = 'round';
    robot.trail.forEach((p, i, a) => {
      const k = i / a.length;
      ctx.fillStyle = 'rgba(42,33,24,' + (0.05 + k * 0.22).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(p[0], p[1], 1.5 + k * 2, 0, 7); ctx.fill();
    });

    // cones
    cones.forEach(c => {
      const age = Math.min(1, (now - c.born) / 220), s = 0.6 + 0.4 * (1 - Math.pow(1 - age, 3)) + (age < 1 ? 0.25 * Math.sin(age * Math.PI) : 0);
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-14, -12, 30, 30);
      ctx.fillStyle = ORANGE; ctx.fillRect(-16, -16, 32, 32);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill();
      ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(-16, -16, 32, 32);
      ctx.restore();
      if (think) { ctx.strokeStyle = 'rgba(232,87,14,.35)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(c.x, c.y, 88, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    });

    // person + thinking overlay
    if (active) {
      const nx = -person.fy, ny = person.fx;
      if (think) {
        ctx.strokeStyle = 'rgba(232,87,14,.55)'; ctx.fillStyle = 'rgba(232,87,14,.07)'; ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(px, py, 62, 0, 7); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        // lead line + target
        ctx.strokeStyle = 'rgba(42,33,24,.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 5]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, 7, 0, 7); ctx.moveTo(tx - 12, ty); ctx.lineTo(tx + 12, ty); ctx.moveTo(tx, ty - 12); ctx.lineTo(tx, ty + 12); ctx.stroke();
        // shoulder line + normal arrow
        ctx.strokeStyle = INK; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px + nx * 18, py + ny * 18); ctx.lineTo(px - nx * 18, py - ny * 18); ctx.stroke();
        ctx.fillStyle = INK;
        [1, -1].forEach(s => { ctx.beginPath(); ctx.arc(px + nx * 18 * s, py + ny * 18 * s, 4.5, 0, 7); ctx.fill(); });
        ctx.strokeStyle = ORANGE; ctx.lineWidth = 2.5;
        const ax = px + person.fx * 40, ay = py + person.fy * 40;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ax, ay);
        ctx.moveTo(ax, ay); ctx.lineTo(ax - person.fx * 9 + nx * 6, ay - person.fy * 9 + ny * 6);
        ctx.moveTo(ax, ay); ctx.lineTo(ax - person.fx * 9 - nx * 6, ay - person.fy * 9 - ny * 6); ctx.stroke();
        ctx.font = '500 11px "DM Mono", monospace'; ctx.fillStyle = INK;
        ctx.fillText('lead ' + Math.round(lead / 60 * 10) / 10 + ' m', tx + 14, ty - 10);
      }
    }

    drawRobot(now);

    // speech bubble when parked and arrived
    if (parked && robot.v < 12) {
      const text = lastQuip, t = now - parkedAt - 500, n = Math.min(text.length, Math.floor(t / 28));
      const fade = t > 4200 ? Math.max(0, 1 - (t - 4200) / 500) : 1;
      if (n > 0 && fade > 0) { ctx.globalAlpha = fade; bubble(text.slice(0, n), text, robot.x, robot.y - 50, scrollY); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  }

  function bubble(shown, full, x, y, scrollY) {
    ctx.font = '700 17px Gaegu, cursive';
    const w = ctx.measureText(full).width + 24, h = 32;
    let bx = x - w / 2; bx = clamp(bx, scrollX + 10, scrollX + W - w - 10);
    const by = Math.max(y - h, scrollY + 60);
    ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(bx, by, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, by + h - 1); ctx.lineTo(x, by + h + 9); ctx.lineTo(x + 7, by + h - 1); ctx.fillStyle = '#fffdf6'; ctx.fill();
    ctx.fillStyle = INK; ctx.textBaseline = 'middle'; ctx.fillText(shown, bx + 12, by + h / 2 + 1); ctx.textBaseline = 'alphabetic';
  }

  function drawRobot(now) {
    ctx.save(); ctx.translate(robot.x, robot.y); ctx.rotate(robot.th);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(3, 6, 34, 24, 0, 0, 7); ctx.fill();
    // wheels
    ctx.fillStyle = '#1d1a17';
    [[-18, -24], [-18, 16], [14, -24], [14, 16]].forEach(([x, y]) => { ctx.beginPath(); ctx.roundRect(x - 8, y, 18, 9, 3); ctx.fill(); });
    // chassis
    ctx.fillStyle = '#c9cdd0'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-26, -16, 40, 32, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3f6f78'; ctx.fillRect(-22, -9, 8, 18); // electronics box
    // drum (axis along robot's y, ribs scroll with distance travelled)
    const dx0 = 4, dw = 26;
    ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.roundRect(dx0, -19, dw, 38, 4); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(dx0, -19, dw, 38); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
    const off = (robot.odo * 0.6) % 9;
    for (let x = dx0 - 9 + off; x < dx0 + dw + 9; x += 9) { ctx.beginPath(); ctx.moveTo(x, -19); ctx.lineTo(x, 19); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(dx0, -19, dw, 38, 4); ctx.stroke();
    // status LED
    ctx.fillStyle = Math.floor(now / 500) % 2 ? '#7dff9a' : '#2b6a3d';
    ctx.beginPath(); ctx.arc(-24, 0, 2.6, 0, 7); ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(t => { prev = t; frame(t); });
})();
