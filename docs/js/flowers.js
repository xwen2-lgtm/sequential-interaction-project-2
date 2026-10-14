/* Step 1, Pick: the Pick Flowers study. Pull each of eight flowers up out of the grass; it flies into the basket.
   Physics, thresholds and sound are unchanged from the study. Changes: no reset button, shared audio,
   and a callback when the eighth flower lands so the sequence can carry the basket into the shop.
   The flower controls (js/settings.js, js/panel.js) adjust size, wind, wiggle, colours and the flight;
   their defaults reproduce the study exactly. */
(function () {
  'use strict';
  var R = window.RPC, F = R.flora, S = R.settings;
  var N = 8;
  var BASE_X = 100, BASE_Y = 280;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand() { return Math.random(); }

  R.createFlowers = function (box) {
    var cv = document.createElement('canvas');
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', 'Flowers in the grass and an empty basket beside them');
    box.appendChild(cv);
    var ctx = cv.getContext('2d');

    var W = 0, H = 0, dpr = 1;
    var L = null, IMG = null;
    var flowers = [], slotColors = [];
    var active = null, slotCounter = 0, done = false;
    var time = 0, last = 0, bob = 0, bobV = 0;
    var live = false, raf = 0, onDone = null, hideBasket = false;

    var rm = R.reduce();

    /* ---------- grayscale assets ---------- */
    function loadImg(svg) {
      return new Promise(function (res) {
        var i = new Image();
        i.onload = function () { res(i); };
        i.onerror = function () { res(i); };
        i.src = F.svgURL(svg);
      });
    }
    var build = 0;
    function buildAssets() {
      var n = ++build;
      var p = F.palettes(R.theme(), S.get());
      return Promise.all([loadImg(F.flowerSVG(p.flowers[0])), loadImg(F.flowerSVG(p.flowers[1])),
                          loadImg(F.grassSVG(p)), loadImg(F.basketSVG(p.basket))]).then(function (r) {
        if (n === build) IMG = { f: [r[0], r[1]], g: r[2], b: r[3], p: p };
      });
    }
    buildAssets();
    R.onTheme(buildAssets);
    S.onChange(function (keys) {
      if (keys.indexOf('grass') >= 0 || keys.indexOf('scheme') >= 0) buildAssets();
      if (keys.indexOf('size') >= 0 && W && H) L = computeLayout();
    });

    /* ---------- layout ---------- */
    function computeLayout() {
      var g, b;
      if (W > H) {
        var colW = Math.max(150, Math.min(W * 0.3, 360));
        var gap = 16;
        g = { x: 0, y: 0, w: Math.max(120, W - colW - gap), h: H };
        var bw = Math.min(colW, 320, H * 0.55 * 300 / 260);
        b = { w: bw, h: bw * 260 / 300 };
        b.x = g.x + g.w + gap + (colW - bw) / 2;
        b.y = H - b.h;
      } else {
        var bw2 = Math.min(W * 0.5, 320, H * 0.28 * 300 / 260);
        var bh = bw2 * 260 / 300;
        g = { x: 0, y: 0, w: W, h: Math.max(120, H - bh - 16) };
        b = { w: bw2, h: bh, x: (W - bw2) / 2, y: H - bh };
      }
      b.sc = b.w / 300;
      var fH = clamp(Math.sqrt(g.w * g.h / (N * 1.5)), 44, 120) * S.get().size / 100;
      var padX = fH * 0.28, topPad = fH * 0.9, botPad = 14;
      return {
        g: g, b: b, fH: fH, f: fH / 300,
        padX: padX, topPad: topPad, botPad: botPad,
        ux: Math.max(20, g.w - 2 * padX),
        uy: Math.max(20, g.h - topPad - botPad)
      };
    }

    function groundPos(f) {
      return { x: L.g.x + L.padX + f.u * L.ux, y: L.g.y + L.topPad + f.v * L.uy };
    }

    function makeFlowers() {
      flowers = [];
      var tries = 0, relax = 1;
      var fW = L.fH * 0.667;
      while (flowers.length < N) {
        var u = rand(), v = rand();
        var px = u * L.ux, py = v * L.uy, ok = true;
        for (var i = 0; i < flowers.length; i++) {
          var e = flowers[i];
          var dx = (px - e.u * L.ux) / (fW * 0.75 * relax);
          var dy = (py - e.v * L.uy) / (L.fH * 0.28 * relax);
          if (dx * dx + dy * dy < 1) { ok = false; break; }
        }
        tries++;
        if (tries % 40 === 0) relax *= 0.92;
        if (ok) {
          flowers.push({ u: u, v: v, c: flowers.length % 2, phase: rand() * 6.28, st: 'ground', ang: 0, angV: 0, lift: 0, liftV: 0,
                         ox: 0, oxV: 0, ps: 0, pulling: false, fly: null, slot: -1 });
        }
      }
    }

    function slotAnchor(i) {
      var p = F.slotParam(i), b = L.b, sc = b.sc;
      return {
        x: b.x + (150 + p.ox) * sc,
        y: b.y + 205 * sc,
        a: p.a,
        fb: Math.min(sc * (0.44 + 0.12 * p.l), L.f * 1.1),
        l: p.l
      };
    }

    /* ---------- interaction ---------- */
    function pos(e) {
      var r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function pullDist() { return Math.max(40, L.fH * 0.62); }

    function hitTest(px, py) {
      var order = flowers.filter(function (f) { return f.st === 'ground'; })
        .sort(function (a, b) { return groundPos(b).y - groundPos(a).y; });
      for (var i = 0; i < order.length; i++) {
        var f = order[i], gp = groundPos(f), s = L.f;
        var bx = gp.x + f.ox, by = gp.y - f.lift;
        var cx = bx + Math.sin(f.ang) * 190 * s, cy = by - Math.cos(f.ang) * 190 * s;
        var dx = px - cx, dy = py - cy, rad = 62 * s + 10;
        if (dx * dx + dy * dy <= rad * rad) return f;
        if (Math.abs(px - (bx + cx) / 2) <= 6 * s + 10 + Math.abs(cx - bx) / 2 && py >= cy && py <= by + 6) return f;
      }
      return null;
    }

    /* ---------- sound: a soft, rising pluck, one pentatonic step per flower ---------- */
    var SCALE = [0, 2, 4, 7, 9];
    function pluckSound(n) {
      var ac = R.audio.unlock();
      if (!ac) return;
      var now = ac.currentTime;
      var semis = SCALE[n % 5] + 12 * (Math.floor(n / 5) % 2);
      var f0 = 523.25 * Math.pow(2, semis / 12);
      var master = ac.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      master.connect(R.audio.out());
      [[1, 1], [2, 0.25]].forEach(function (part) {
        var o = ac.createOscillator();
        var g = ac.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f0 * part[0] * 0.8, now);
        o.frequency.exponentialRampToValueAtTime(f0 * part[0], now + 0.06);
        g.gain.value = part[1];
        o.connect(g);
        g.connect(master);
        o.start(now);
        o.stop(now + 0.5);
      });
    }

    function pluck(f) {
      var gp = groundPos(f);
      f.pulling = false;
      pluckSound(slotCounter);
      f.st = 'fly';
      f.slot = slotCounter++;
      slotColors[f.slot] = f.c;
      f.fly = { t: 0, dur: rm ? 0.3 : S.get().flight / 1000 + rand() * 0.15, x0: gp.x + f.ox, y0: gp.y - f.lift,
                a0: f.ang, s0: L.f, x: gp.x, y: gp.y - f.lift, a: f.ang, s: L.f };
    }
    function release(f) {
      f.angV += (rand() < 0.5 ? -1 : 1) * (rm ? 0.5 : 3.2) * f.ps;
      f.pulling = false;
    }

    cv.addEventListener('pointerdown', function (e) {
      if (!live || active || !IMG || !L) return;
      var pt = pos(e);
      var hit = hitTest(pt.x, pt.y);
      if (!hit) return;
      R.audio.unlock();
      cv.setPointerCapture(e.pointerId);
      active = { f: hit, id: e.pointerId, sx: pt.x, sy: pt.y, x: pt.x, y: pt.y, ly: pt.y, lt: e.timeStamp, vy: 0, p: 0 };
      e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
      if (!active || e.pointerId !== active.id) return;
      var pt = pos(e);
      var dt = e.timeStamp - active.lt;
      if (dt > 0) { active.vy = (pt.y - active.ly) / dt; active.ly = pt.y; active.lt = e.timeStamp; }
      active.x = pt.x; active.y = pt.y;
      var dy = active.sy - pt.y;
      if (dy > 4) active.f.pulling = true;
      active.p = active.f.pulling ? clamp(dy / pullDist(), 0, 1) : 0;
      if (active.p >= 1) {
        pluck(active.f);
        active = null;
      }
    });
    function endPointer(e) {
      if (!active || e.pointerId !== active.id) return;
      var a = active;
      active = null;
      if (a.f.st !== 'ground') return;
      var vy = (e.timeStamp - a.lt) < 90 ? a.vy : 0;
      if (e.type !== 'pointercancel' && a.f.pulling && (a.p > 0.55 || (a.p > 0.12 && vy < -1.0))) pluck(a.f);
      else release(a.f);
    }
    cv.addEventListener('pointerup', endPointer);
    cv.addEventListener('pointercancel', endPointer);

    /* ---------- simulation ---------- */
    function spring(o, key, vkey, target, k, c, dt) {
      o[vkey] += (-k * (o[key] - target) - c * o[vkey]) * dt;
      o[key] += o[vkey] * dt;
    }

    function land(f) {
      f.st = 'basket';
      f.fly = null;
      bobV += 2.2;
      var all = flowers.every(function (x) { return x.st === 'basket'; });
      if (all && !done) {
        done = true;
        live = false;
        if (onDone) onDone();
      }
    }

    /* wind and wiggle from the flower controls, as an extra lean (radians) for a flower in the grass.
       Wind: a steady lean downwind plus gusts that travel across the field from left to right.
       Wiggle: each flower's own small, quick sway. */
    function breeze(f) {
      var o = S.get(), a = 0;
      if (o.wind) {
        var amp = o.windSpeed / 60 * 0.35;           // 60 km/h leans about 20 degrees
        var gust = 0.5 + 0.5 * Math.sin(time * 1.6 - f.u * 4);
        a += amp * (0.35 + 0.65 * gust) + amp * 0.25 * Math.sin(time * 5.1 + f.phase);
      }
      if (o.wiggle) a += o.wiggleAmt * Math.PI / 180 * Math.sin(time * 6.2832 * o.wiggleHz + f.phase);
      return rm ? a * 0.3 : a;
    }

    function update(dt) {
      var A = active;
      for (var i = 0; i < flowers.length; i++) {
        var f = flowers[i];
        if (f.st === 'ground') {
          var isA = A && A.f === f;
          var isP = isA && f.pulling;
          f.ps += ((isP ? A.p : 0) - f.ps) * (1 - Math.exp(-dt * 14));
          var lean = isP ? clamp((A.x - A.sx) / L.fH, -0.8, 0.8) * 0.35 : 0;
          var wob = isP ? Math.sin(time * 13 + f.phase) * 0.13 * f.ps * (rm ? 0.3 : 1) : 0;
          var tl = isP ? L.fH * 0.3 * (1 - (1 - f.ps) * (1 - f.ps)) : 0;
          var tx = isP ? clamp((A.x - A.sx) * 0.22, -L.fH * 0.25, L.fH * 0.25) : 0;
          var sway = isP ? 0 : breeze(f);
          spring(f, 'ang', 'angV', lean + wob + sway, 80, 6, dt);
          spring(f, 'lift', 'liftV', tl, 140, 11, dt);
          spring(f, 'ox', 'oxV', tx, 100, 10, dt);
        } else if (f.st === 'fly') {
          var fl = f.fly;
          fl.t = Math.min(1, fl.t + dt / fl.dur);
          var t = fl.t;
          var e = rm ? t : F.FLIGHT[S.get().motion](t);
          var sa = slotAnchor(f.slot);
          var cx = (fl.x0 + sa.x) / 2;
          var cy = Math.min(fl.y0, sa.y) - (rm ? 0 : L.fH * 1.1);
          var u = 1 - e;
          fl.x = u * u * fl.x0 + 2 * u * e * cx + e * e * sa.x;
          fl.y = u * u * fl.y0 + 2 * u * e * cy + e * e * sa.y;
          fl.a = fl.a0 * u + sa.a * e + (rm ? 0 : Math.sin(t * Math.PI * 2.5) * 0.18 * u);
          fl.s = fl.s0 * u + sa.fb * e;
          if (t >= 1) land(f);
        }
      }
      bobV += (-120 * bob - 8 * bobV) * dt;
      bob += bobV * dt;
    }

    /* ---------- drawing ---------- */
    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function drawFlower(x, y, s, a, c) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.drawImage(IMG.f[c || 0], -BASE_X * s, -BASE_Y * s, 200 * s, 300 * s);
      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var g = L.g, b = L.b, i, f;

      /* grass */
      ctx.save();
      rr(g.x, g.y, g.w, g.h, 28);
      ctx.clip();
      var tw = Math.max(200, Math.min(400, g.w / 3)), th = tw * 0.3, row = 0;
      for (var y = g.y; y < g.y + g.h; y += th, row++) {
        for (var x = g.x - (row % 2) * tw * 0.37; x < g.x + g.w; x += tw) {
          ctx.drawImage(IMG.g, x, y, tw + 1, th + 1);
        }
      }
      ctx.restore();

      /* flowers still in the grass, back to front, pulled one last */
      var ground = flowers.filter(function (q) { return q.st === 'ground'; })
        .sort(function (p, q) {
          var pa = active && active.f === p ? 1 : 0, qa = active && active.f === q ? 1 : 0;
          if (pa !== qa) return pa - qa;
          return groundPos(p).y - groundPos(q).y;
        });
      for (i = 0; i < ground.length; i++) {
        f = ground[i];
        var gp = groundPos(f);
        var lf = clamp(f.lift / (L.fH * 0.3), 0, 1);
        var rx = L.fH * 0.11 * (1 - 0.3 * lf);
        ctx.fillStyle = IMG.p.shadow;
        ctx.globalAlpha = 1 - lf * 0.6;
        ctx.beginPath();
        ctx.ellipse(gp.x, gp.y + 2, rx, rx * 0.3, 0, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (i = 0; i < ground.length; i++) {
        f = ground[i];
        var p2 = groundPos(f);
        drawFlower(p2.x + f.ox, p2.y - f.lift, L.f, f.ang, f.c);
      }

      /* basket layer: flowers inside it, then the basket in front of their stems.
         Hidden while the sequence carries the finished basket into the shop. */
      if (!hideBasket) {
        var items = [];
        for (i = 0; i < flowers.length; i++) {
          f = flowers[i];
          if (f.st === 'basket') {
            var sa = slotAnchor(f.slot);
            items.push({ x: sa.x, y: sa.y, a: sa.a, s: sa.fb, l: sa.l, c: f.c });
          } else if (f.st === 'fly' && f.fly.t > 0.82) {
            items.push({ x: f.fly.x, y: f.fly.y, a: f.fly.a, s: f.fly.s, l: F.slotParam(f.slot).l, c: f.c });
          }
        }
        items.sort(function (p, q) { return q.l - p.l; });
        ctx.save();
        var bcx = b.x + b.w / 2, bby = b.y + b.h;
        ctx.translate(bcx, bby);
        ctx.scale(1 + bob * 0.1, 1 - bob * 0.18);
        ctx.translate(-bcx, -bby);
        for (i = 0; i < items.length; i++) drawFlower(items[i].x, items[i].y, items[i].s, items[i].a, items[i].c);
        ctx.drawImage(IMG.b, b.x, b.y, b.w, b.h);
        ctx.restore();
      }

      /* flowers in flight */
      for (i = 0; i < flowers.length; i++) {
        f = flowers[i];
        if (f.st === 'fly' && f.fly.t <= 0.82) drawFlower(f.fly.x, f.fly.y, f.fly.s, f.fly.a, f.c);
      }
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (!IMG || !L) return;
      var dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
      last = ts;
      time += dt;
      update(dt);
      draw();
    }

    /* ---------- sizing ---------- */
    function resize() {
      W = box.clientWidth;
      H = box.clientHeight;
      if (!W || !H) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      L = computeLayout();
      if (!flowers.length) makeFlowers();
    }
    new ResizeObserver(resize).observe(box);
    resize();

    return {
      /* new field of flowers, empty basket */
      reset: function () {
        active = null;
        slotCounter = 0;
        slotColors = [];
        done = false;
        live = false;
        hideBasket = false;
        bob = 0; bobV = 0;
        if (L) makeFlowers(); else flowers = [];
      },
      start: function (cb) {
        onDone = cb;
        live = true;
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      },
      stop: function () {
        live = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      setHideBasket: function (on) { hideBasket = on; },
      /* flower controls "Reset state": a fresh field and an empty basket, still mid-step */
      restartPick: function () {
        if (!onDone || done) return;
        active = null;
        slotCounter = 0;
        slotColors = [];
        bob = 0; bobV = 0;
        if (L) makeFlowers();
        live = true;
      },
      slotColors: function () { return slotColors.slice(); },
      /* largest flower scale relative to the basket, so the shop's copy of the bouquet matches */
      cap: function () { return L ? L.f * 1.1 / L.b.sc : 0.56; },
      /* the bouquet box (basket units -40..340 x -20..260) in client pixels */
      bouquetRect: function () {
        var r = cv.getBoundingClientRect(), b = L.b;
        return { x: r.left + b.x - 40 * b.sc, y: r.top + b.y - 20 * b.sc, w: 380 * b.sc, h: 280 * b.sc };
      }
    };
  };
})();
