/* Step 2, Ring: the Ring The Bell study, now standing on the shop counter.
   The springs, metallic shiver and synthesized ding are unchanged. Changes: the bell can be placed and
   scaled on the counter, it only responds while its step is active, and it reports when it has been rung
   and its wobble has settled. The bell controls (js/settings.js) set volume, sound mood, colour,
   shine, swing size and time to rest; their defaults reproduce the study. */
(function () {
  'use strict';
  var R = window.RPC;

  R.createBell = function (el) { // el: { place, hit, swing, btn, glint }
    var reduce = R.reduce();
    var S = R.bellSettings;
    var DEG = 180 / Math.PI;

    /* ---------- Motion: three damped springs (slide, tilt, button) plus a metallic shiver ---------- */
    var x = 0, vx = 0;      // slide, in bell units (negative is left)
    var th = 0, w = 0;      // tilt about the base, in radians (negative is counterclockwise)
    var p = 0, vp = 0;      // button press depth, 0..PRESS
    var PRESS = 9;
    var KX = 150, CX = 5.5;
    var KT = 130, CT = 4.6;
    var KP = 420, CP = 16;
    var tr = 9;             // seconds since the strike
    var SETTLE0 = 2.15;     // how long the study's bell takes to settle, in seconds
    var raf = 0, last = 0;

    var active = false, rang = false, onSettle = null;
    var place = { x: 450, y: 468, s: 1 };

    /* the bell's own drawing is 240x160 units; (150, 172) is the middle of its base */
    function setPlace(q) {
      place = { x: q.x, y: q.y, s: q.s };
      el.place.setAttribute('transform', 'translate(' + (q.x - 150 * q.s).toFixed(2) + ' ' +
        (q.y - 172 * q.s).toFixed(2) + ') scale(' + q.s.toFixed(4) + ')');
    }

    function render() {
      var shake = reduce ? 0 : 1.6 * Math.sin(tr * 6.2832 * 38) * Math.exp(-tr * 9);
      el.swing.setAttribute('transform',
        'translate(' + (x + shake).toFixed(2) + ' 0) rotate(' + (th * DEG).toFixed(2) + ' 150 150)');
      el.btn.setAttribute('transform', 'translate(0 ' + p.toFixed(2) + ')');
      /* metallic shine: a glint sweeps across the dome in the 0.6 s after each strike */
      if (el.glint) {
        var g = S.get().shine && !reduce && tr < 0.6 ? tr / 0.6 : -1;
        el.glint.setAttribute('opacity', g < 0 ? '0' : (0.85 * Math.sin(g * Math.PI)).toFixed(3));
        el.glint.setAttribute('x', (40 + Math.max(g, 0) * 200).toFixed(1));
      }
    }

    function frame(now) {
      var dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      var n = 4, h = dt / n;
      /* time to return to rest: the study settles in about 2.2 s; damping scales inversely with the time chosen */
      var k = SETTLE0 / S.get().settle, cx = CX * k, ct = CT * k;
      for (var i = 0; i < n; i++) {
        vx += (-KX * x - cx * vx) * h;
        x += vx * h;
        w += (-KT * th - ct * w) * h;
        th += w * h;
        vp += (-KP * p - CP * vp) * h;
        p += vp * h;
        if (p < 0) { p = 0; if (vp < 0) vp = -vp * 0.3; }
      }
      tr += dt;
      if (Math.abs(x) < 0.02 && Math.abs(vx) < 0.2 && Math.abs(th) < 0.0008 && Math.abs(w) < 0.01 &&
          Math.abs(p) < 0.02 && Math.abs(vp) < 0.2 && tr > 0.6) {
        x = vx = th = w = p = vp = 0;
        render();
        raf = 0;
        if (rang && onSettle) { var f = onSettle; onSettle = null; f(); }
        return;
      }
      render();
      raf = requestAnimationFrame(frame);
    }

    /* ---------- Sound: hard click, then a bright inharmonic ding, through a compressor ---------- */
    var ctx = null, comp = null, bus = null, noise = null;
    var PARTIALS = [
      [1, 1, 2.2], [2.0, 0.55, 1.2], [2.76, 0.7, 1.4], [4.07, 0.35, 0.8],
      [5.4, 0.45, 0.9], [8.9, 0.22, 0.45], [11.3, 0.14, 0.3]
    ];

    function newBus() {
      bus = ctx.createGain();
      bus.gain.value = 1;
      bus.connect(comp);
    }

    function audio() {
      var c = R.audio.unlock();
      if (!c) return null;
      if (c !== ctx) {
        ctx = c;
        comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.knee.value = 6;
        comp.ratio.value = 8;
        comp.attack.value = 0.001;
        comp.release.value = 0.15;
        var master = ctx.createGain();
        master.gain.value = 0.95;
        comp.connect(master);
        master.connect(R.audio.out());
        newBus();
        var len = Math.floor(ctx.sampleRate * 0.035);
        noise = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = noise.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      }
      return ctx;
    }

    /* sound moods: base pitch, partials [ratio, level, decay s], click noise, filters,
       and what follows the strike (the study's hammer rebound, or a second note) */
    var MOODS = {
      original: { f0: 2350, parts: PARTIALS, noise: 1.1, hp: 3000, rebound: 0.4 },
      stinging: { f0: 3300, parts: [[1, 1, 2.6], [1.004, 0.7, 2.6], [2.01, 0.8, 1.8], [2.76, 0.9, 2.0], [4.07, 0.6, 1.4],
                                    [5.4, 0.7, 1.2], [8.9, 0.5, 0.9], [11.3, 0.4, 0.7]], noise: 1.8, hp: 4500, rebound: 0.6 },
      happy:    { f0: 1568, parts: [[1, 1, 1.2], [1.26, 0.7, 1.0], [1.5, 0.6, 1.0], [2, 0.4, 0.7], [3, 0.15, 0.4]],
                  noise: 0.6, hp: 3000, echo: { delay: 110, ratio: 1.26, level: 0.75 } },
      sad:      { f0: 740, parts: [[1, 1, 2.8], [1.19, 0.6, 2.4], [1.5, 0.35, 1.8], [2, 0.2, 1.2]],
                  noise: 0.25, hp: 2000, lp: 2400, drop: 0.97, rebound: 0.3 },
      dull:     { f0: 820, parts: [[1, 1, 0.35], [2.3, 0.4, 0.18], [3.1, 0.2, 0.1]], noise: 0.5, hp: 800, lp: 1400 },
      bored:    { f0: 560, parts: [[1, 1, 0.7], [2, 0.25, 0.4]], noise: 0.15, hp: 1500, lp: 2000, drop: 0.92, gain: 0.7 },
      cute:     { f0: 2900, parts: [[1, 1, 0.45], [2, 0.35, 0.25], [3, 0.12, 0.15]], noise: 0.3, hp: 5000, glide: 0.8,
                  echo: { delay: 80, ratio: 1.5, level: 0.6 } }
    };

    function strike(level, ratio) {
      var c = audio();
      if (!c) return;
      var m = MOODS[S.get().mood];
      var now = c.currentTime;
      var f0 = m.f0 * (ratio || 1) * (1 + (Math.random() - 0.5) * 0.004);
      var out = c.createGain();
      out.gain.value = level * 0.34 * (m.gain || 1) * S.get().volume / 100;
      if (m.lp) {
        var lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = m.lp;
        out.connect(lp);
        lp.connect(bus);
      } else out.connect(bus);
      m.parts.forEach(function (q) {
        var o = c.createOscillator();
        o.type = 'sine';
        var f = f0 * q[0];
        if (m.glide) {
          o.frequency.setValueAtTime(f * m.glide, now);
          o.frequency.exponentialRampToValueAtTime(f, now + 0.04);
        } else o.frequency.setValueAtTime(f, now);
        if (m.drop) o.frequency.exponentialRampToValueAtTime(f * m.drop, now + q[2]);
        var e = c.createGain();
        e.gain.setValueAtTime(0, now);
        e.gain.linearRampToValueAtTime(q[1], now + 0.001);
        e.gain.exponentialRampToValueAtTime(0.0001, now + q[2]);
        o.connect(e);
        e.connect(out);
        o.start(now);
        o.stop(now + q[2] + 0.05);
      });
      var n = c.createBufferSource();
      n.buffer = noise;
      var hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = m.hp;
      var ng = c.createGain();
      ng.gain.value = m.noise;
      n.connect(hp);
      hp.connect(ng);
      ng.connect(out);
      n.start(now);
    }

    /* ---------- Interaction ---------- */
    var timer = 0;

    function ring() {
      var m = MOODS[S.get().mood];
      strike(1);
      clearTimeout(timer);
      if (m.rebound) timer = setTimeout(function () { strike(m.rebound); }, 62);   // hammer rebound
      else if (m.echo) timer = setTimeout(function () { strike(m.echo.level, m.echo.ratio); }, m.echo.delay);
      var big = (reduce ? 0.25 : 1) * S.get().swing / 100;
      vx = Math.min(vx, 0) - 95 * big;       // first move is to the left
      w += -1.3 * big;                       // small tilt so the dome never touches the base
      p = PRESS;
      vp = 0;
      tr = 0;
      rang = true;
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    function reset() {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      x = vx = th = w = p = vp = 0;
      tr = 9;
      rang = false;
      onSettle = null;
      render();
      if (ctx) {
        var old = bus;
        old.gain.setTargetAtTime(0, ctx.currentTime, 0.008);
        setTimeout(function () { old.disconnect(); }, 120);
        newBus();
      }
    }

    el.hit.addEventListener('pointerdown', function (e) {
      if (!active) return;
      if (e.button !== undefined && e.button > 0) return;
      ring();
    });
    el.hit.addEventListener('keydown', function (e) {
      if (!active || e.repeat) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ring(); }
    });

    function setActive(on) {
      active = on;
      el.hit.classList.toggle('off', !on);
      el.hit.setAttribute('tabindex', on ? '0' : '-1');
      el.hit.setAttribute('aria-disabled', on ? 'false' : 'true');
      if (!on && document.activeElement === el.hit) el.hit.blur();
    }

    /* bell controls "Reset state": stop the bell and its sound and put it at rest,
       counting it as settled if it had been rung */
    function calm() {
      var wasRung = rang, cb = onSettle;
      reset();
      if (!cb) return;
      if (wasRung) cb();
      else onSettle = cb;   // not rung yet: still waiting for the first ring
    }

    /* colour and shine */
    var LOOK = ['base', 'dome', 'hi', 'plunger'];
    function applyLook() {
      var v = S.get(), c = S.COLORS[v.color];
      LOOK.forEach(function (k) {
        if (c[k]) el.hit.style.setProperty('--' + k, c[k]);
        else el.hit.style.removeProperty('--' + k);
      });
      if (c.edge) el.hit.style.setProperty('--bell-edge', c.edge);
      else el.hit.style.removeProperty('--bell-edge');
      el.hit.classList.toggle('flat', !v.shine);
      render();
    }
    S.onChange(applyLook);
    applyLook();

    setActive(false);
    render();

    return {
      setActive: setActive,
      reset: reset,
      calm: calm,
      setPlace: setPlace,
      place: function () { return place; },
      /* calls cb once the bell has been rung and has come to rest */
      whenRungAndSettled: function (cb) { rang = false; onSettle = cb; }
    };
  };
})();
