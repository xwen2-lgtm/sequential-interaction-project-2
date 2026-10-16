/* Step 3, Collect: the Collect Money study. Drag each bill and coin into its slot in the till.
   Dragging, slot glow, hints, the "nope" return, stacking, sounds and the completion lights are unchanged.
   Changes: one round only (the study dealt a new pile after finishing; here finishing ends the step),
   shared audio and mute, and a drawer-closing sound used by the ending. */
(function () {
  'use strict';
  var R = window.RPC;
  var NS = 'http://www.w3.org/2000/svg';

  R.createMoney = function (svg, L) { // L: { fx, stacks, landed, items, drag }
    var RM = R.reduce();

    /* ---------- sound (synthesized, nothing to load) ---------- */
    var sfx = (function () {
      var ctx = null, master = null, noiseBuf = null;
      function unlock() {
        var c = R.audio.unlock();
        if (!c) return;
        if (c !== ctx) {
          ctx = c;
          noiseBuf = null;
          master = ctx.createGain();
          master.gain.value = 0.7;
          master.connect(R.audio.out());
        }
      }
      function live() { return !!ctx; }
      function tone(f, at, dur, type, g, to) {
        var o = ctx.createOscillator(), a = ctx.createGain(), t = ctx.currentTime + at;
        o.type = type;
        o.frequency.setValueAtTime(f, t);
        if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
        a.gain.setValueAtTime(0.0001, t);
        a.gain.exponentialRampToValueAtTime(g, t + 0.006);
        a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(a); a.connect(master);
        o.start(t); o.stop(t + dur + 0.03);
      }
      function puff(at, dur, type, f, q, g, toF) {
        if (!noiseBuf) {
          noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
          var d = noiseBuf.getChannelData(0);
          for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        var s = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), a = ctx.createGain(), t = ctx.currentTime + at;
        s.buffer = noiseBuf;
        flt.type = type; flt.Q.value = q;
        flt.frequency.setValueAtTime(f, t);
        if (toF) flt.frequency.exponentialRampToValueAtTime(toF, t + dur);
        a.gain.setValueAtTime(0.0001, t);
        a.gain.exponentialRampToValueAtTime(g, t + 0.008);
        a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(flt); flt.connect(a); a.connect(master);
        s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.03);
      }
      var STEPS = [0, 2, 4, 7, 9];
      var NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      return {
        unlock: unlock,
        pick: function (s) {
          if (!live()) return;
          if (s.kind === 'bill') puff(0, 0.09, 'bandpass', 2600, 0.9, 0.12);
          else { tone(2200, 0, 0.05, 'sine', 0.05); puff(0, 0.03, 'highpass', 5000, 0.7, 0.06); }
        },
        land: function (s, n) {
          if (!live()) return;
          var semis = STEPS[n % 5] + (n >= 5 ? 12 : 0);
          var step = Math.pow(2, semis / 12);
          if (s.kind === 'bill') {
            puff(0, 0.14, 'bandpass', 1500, 0.8, 0.22, 700);
            tone(150, 0, 0.12, 'sine', 0.18, 90);
            tone(660 * step, 0.03, 0.4, 'sine', 0.05);
            tone(1320 * step, 0.03, 0.25, 'sine', 0.02);
          } else {
            var f = (s.d === 'dime' ? 2400 : 1700) * Math.pow(2, STEPS[n % 5] / 12);
            tone(f, 0, 0.28, 'triangle', 0.1);
            tone(f * 1.5, 0, 0.2, 'sine', 0.05);
            tone(f * 2.4, 0, 0.12, 'sine', 0.03);
            puff(0, 0.02, 'highpass', 6000, 0.7, 0.08);
          }
        },
        nope: function () { if (live()) tone(330, 0, 0.2, 'sine', 0.07, 220); },
        note: function (i) {
          if (!live()) return;
          var f = NOTES[Math.min(i, NOTES.length - 1)];
          tone(f, 0, 0.55, 'sine', 0.12);
          tone(f * 2, 0, 0.35, 'sine', 0.04);
        },
        shimmer: function () {
          if (!live()) return;
          for (var k = 0; k < 5; k++) tone(2093 * (1 + k * 0.12), k * 0.05, 0.6, 'sine', 0.03);
        },
        whoosh: function () { if (live()) puff(0, 0.45, 'bandpass', 500, 0.7, 0.07, 2500); },
        /* the till drawer shutting: a soft thud, then a quiet two-note chime */
        close: function () {
          unlock();
          if (!live()) return;
          tone(150, 0, 0.14, 'sine', 0.16, 85);
          puff(0, 0.1, 'bandpass', 900, 0.8, 0.08, 400);
          tone(NOTES[0] * 2, 0.08, 0.9, 'sine', 0.05);
          tone(NOTES[3] * 2, 0.2, 1.1, 'sine', 0.035);
        }
      };
    })();

    /* ---------- data ---------- */
    var SLOTS = [
      { id: 'b1',    kind: 'bill', d: '1',   x: 105, y: 65,  w: 160, h: 150, rx: 185, ry: 128 },
      { id: 'b5',    kind: 'bill', d: '5',   x: 278, y: 65,  w: 160, h: 150, rx: 358, ry: 128 },
      { id: 'b20',   kind: 'bill', d: '20',  x: 451, y: 65,  w: 160, h: 150, rx: 531, ry: 128 },
      { id: 'b100',  kind: 'bill', d: '100', x: 624, y: 65,  w: 160, h: 150, rx: 704, ry: 128 },
      { id: 'penny', kind: 'coin', d: 'penny', x: 278, y: 230, w: 160, h: 110, rx: 368, ry: 272 },
      { id: 'dime',  kind: 'coin', d: 'dime',  x: 451, y: 230, w: 160, h: 110, rx: 541, ry: 272 }
    ];
    var slotById = {};
    SLOTS.forEach(function (s) { slotById[s.id] = s; });

    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    /* A random pile: 2-3 of each bill, 3-4 of each coin, scattered on the counter. */
    function makeRound() {
      var list = [], i, j, t;
      ['1', '5', '20', '100'].forEach(function (d) { for (var n = rnd(2, 3); n > 0; n--) list.push({ slot: 'b' + d }); });
      ['penny', 'dime'].forEach(function (c) { for (var n = rnd(3, 4); n > 0; n--) list.push({ slot: c }); });
      for (i = list.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = list[i]; list[i] = list[j]; list[j] = t; }
      var placed = [];
      list.forEach(function (p) {
        var s = slotById[p.slot], hw = s.kind === 'bill' ? 70 : 27, hh = s.kind === 'bill' ? 30 : 27;
        var x = 0, y = 0, ok = false;
        for (var tries = 0; tries < 60 && !ok; tries++) {
          x = 100 + Math.random() * 700;
          y = 490 + Math.random() * 120;
          var f = 1 - tries / 80;
          ok = placed.every(function (q) {
            return Math.abs(q.x - x) > (q.hw + hw) * 0.62 * f || Math.abs(q.y - y) > (q.hh + hh) * 0.9 * f;
          });
        }
        p.x = x; p.y = y;
        p.r = s.kind === 'bill' ? Math.random() * 20 - 10 : 0;
        placed.push({ x: x, y: y, hw: hw, hh: hh });
      });
      return list;
    }

    /* ---------- art ---------- */
    function billArt(d) {
      /* each bill has its own soft colour: f fill, t ink (text, borders) */
      var P = {
        '1':   { f: '#DCEFD3', t: '#2F5A2A' },   // sage green
        '5':   { f: '#E9DDF5', t: '#4B2F72' },   // lilac
        '20':  { f: '#FBE6C2', t: '#6E4A12' },   // apricot
        '100': { f: '#D6E6F7', t: '#1F3F66' }    // pale blue
      }[d];
      var inner = '';
      if (d === '1') inner = '<rect x="-64" y="-24" width="128" height="48" rx="3" fill="none" stroke="' + P.t + '" stroke-width="1"/>';
      if (d === '5') inner = '<rect x="-65" y="-25" width="130" height="50" rx="3" fill="none" stroke="' + P.t + '" stroke-width="1.5"/><rect x="-60" y="-20" width="120" height="40" rx="2" fill="none" stroke="' + P.t + '" stroke-width="1"/>';
      if (d === '20') inner = '<rect x="-64" y="-24" width="128" height="48" rx="3" fill="none" stroke="' + P.t + '" stroke-width="2"/><rect x="-58" y="-18" width="116" height="36" rx="2" fill="none" stroke="' + P.t + '" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>';
      if (d === '100') inner = '<rect x="-63" y="-23" width="126" height="46" rx="3" fill="none" stroke="' + P.t + '" stroke-width="1.5"/><g fill="' + P.t + '"><circle cx="-56" cy="-17" r="3.5"/><circle cx="56" cy="-17" r="3.5"/><circle cx="-56" cy="17" r="3.5"/><circle cx="56" cy="17" r="3.5"/></g>';
      var fs = d === '100' ? 17 : 22;
      return '<rect x="-70" y="-30" width="140" height="60" rx="5" fill="' + P.f + '" stroke="#1a1a1a" stroke-width="1.8"/>' +
        inner +
        '<ellipse rx="14" ry="19" fill="' + P.t + '" fill-opacity=".18" stroke="' + P.t + '" stroke-opacity=".6" stroke-width="1.5"/>' +
        '<g font-family="Georgia, serif" font-weight="bold" text-anchor="middle" fill="' + P.t + '" font-size="' + fs + '">' +
        '<text x="-44" y="7">$' + d + '</text><text x="44" y="7">$' + d + '</text></g>' +
        '<path d="M-68 -30 H68 Q70 -30 70 -28 V-4 Q0 8 -70 -4 V-28 Q-70 -30 -68 -30 Z" fill="url(#glossB)"/>';
    }
    function coinArt(k) {
      if (k === 'penny') {
        return '<circle r="26.7" fill="#4a4a4a" stroke="#000" stroke-width="2"/>' +
          '<circle r="19" fill="none" stroke="#9a9a9a" stroke-width="2"/>' +
          '<circle r="3" fill="#bdbdbd"/>' +
          '<ellipse cx="-8" cy="-11" rx="13" ry="7" transform="rotate(-30 -8 -11)" fill="#fff" fill-opacity=".3"/>';
      }
      return '<circle r="25.1" fill="#f4f4f4" stroke="#000" stroke-width="2"/>' +
        '<circle r="21" fill="none" stroke="#444" stroke-width="5" stroke-dasharray="1.5 2.5"/>' +
        '<circle r="13" fill="none" stroke="#777" stroke-width="1.5"/>' +
        '<ellipse cx="-8" cy="-10" rx="12" ry="6.5" transform="rotate(-30 -8 -10)" fill="#fff" fill-opacity=".7"/>';
    }
    function art(slot) { return slot.kind === 'bill' ? billArt(slot.d) : coinArt(slot.d); }
    function el(tag, attrs, html) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (html) n.innerHTML = html;
      return n;
    }

    /* ---------- state ---------- */
    var items = [], fx = {}, counts = {}, timers = [], round = 0;
    var count = 0, drag = null, hintT = 0, hintIt = null;
    var active = false, onDone = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function setT(it) {
      it.el.setAttribute('transform', 'translate(' + it.x.toFixed(2) + ' ' + it.y.toFixed(2) + ') rotate(' + it.r.toFixed(2) + ') scale(' + it.s.toFixed(3) + ')');
    }
    function easeOutBack(k) { var c1 = 1.5, c3 = c1 + 1, p = k - 1; return 1 + c3 * p * p * p + c1 * p * p; }
    function easeOutCubic(k) { return 1 - Math.pow(1 - k, 3); }
    function tween(it, to, dur, ease, done) {
      var f = { x: it.x, y: it.y, r: it.r, s: it.s };
      var t0 = performance.now();
      var d = RM ? 1 : dur;
      if (it.anim) cancelAnimationFrame(it.anim);
      function step(now) {
        var k = Math.min(1, (now - t0) / d), e = ease(k);
        it.x = f.x + (to.x - f.x) * e;
        it.y = f.y + (to.y - f.y) * e;
        it.r = f.r + (to.r - f.r) * e;
        it.s = f.s + (to.s - f.s) * e;
        setT(it);
        if (k < 1) it.anim = requestAnimationFrame(step);
        else { it.anim = 0; if (done) done(); }
      }
      it.anim = requestAnimationFrame(step);
    }

    /* ---------- build ---------- */
    function clear() {
      clearTimeout(hintT); clearTimers();
      items.forEach(function (it) { if (it.anim) cancelAnimationFrame(it.anim); });
      round += 1;
      hintIt = null; drag = null; count = 0; items = []; fx = {};
      active = false;
      SLOTS.forEach(function (s) { counts[s.id] = 0; });
      svg.classList.remove('done'); svg.classList.remove('clearing');
      L.items.classList.remove('arriving');
      Object.keys(L).forEach(function (k) { L[k].innerHTML = ''; });
    }

    function init() {
      clear();
      active = true;

      SLOTS.forEach(function (s) {
        var g = el('g', { 'class': 'slot' });
        g.appendChild(el('rect', { 'class': 'halo', x: s.x - 4, y: s.y - 4, width: s.w + 8, height: s.h + 8, rx: 8 }));
        g.appendChild(el('rect', { 'class': 'lit', x: s.x, y: s.y, width: s.w, height: s.h, rx: 5 }));
        L.fx.appendChild(g);
        fx[s.id] = g;
      });

      makeRound().forEach(function (p, i) {
        var s = slotById[p.slot];
        var hit = s.kind === 'bill'
          ? '<rect x="-76" y="-36" width="152" height="72" fill="transparent"/>'
          : '<circle r="40" fill="transparent"/>';
        var g = el('g', { 'class': 'item idle', 'data-i': i }, hit + art(s));
        g.style.animationDelay = (i * 0.35) + 's';
        var it = { slot: p.slot, x: p.x, y: p.y, r: p.r, s: 1, el: g, landed: false, home: { x: p.x, y: p.y, r: p.r }, anim: 0 };
        g.__it = it;
        setT(it);
        L.items.appendChild(g);
        items.push(it);
      });
      sfx.unlock();
      sfx.whoosh();
      void L.items.getBoundingClientRect();
      L.items.classList.add('arriving');
      scheduleHint(900);
    }

    /* ---------- hint ---------- */
    function clearHint() {
      clearTimeout(hintT);
      if (hintIt) {
        hintIt.el.classList.remove('hint');
        fx[hintIt.slot].classList.remove('hint');
        hintIt = null;
      }
    }
    function scheduleHint(ms) { clearTimeout(hintT); hintT = setTimeout(showHint, ms); }
    function showHint() {
      var left = items.filter(function (i) { return !i.landed; });
      var it = left[left.length - 1];
      if (!it) return;
      hintIt = it;
      it.el.classList.add('hint');
      fx[it.slot].classList.add('hint');
    }

    /* ---------- pointer ---------- */
    function toScene(e) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var m = svg.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function inside(s, x, y, pad) {
      return x > s.x - pad && x < s.x + s.w + pad && y > s.y - pad && y < s.y + s.h + pad;
    }

    svg.addEventListener('pointerdown', function (e) {
      if (!active) return;
      sfx.unlock();
      var g = e.target.closest ? e.target.closest('.item') : null;
      if (!g || !g.__it || g.__it.landed || drag) return;
      e.preventDefault();
      var it = g.__it;
      clearHint();
      sfx.pick(slotById[it.slot]);
      if (it.anim) { cancelAnimationFrame(it.anim); it.anim = 0; }
      var p = toScene(e);
      drag = { id: e.pointerId, it: it, dx: it.x - p.x, dy: it.y - p.y };
      it.home = { x: it.x, y: it.y, r: it.r };
      it.s = 1.08;
      L.drag.appendChild(g);
      g.classList.remove('idle');
      g.classList.add('drag');
      setT(it);
      fx[it.slot].classList.add('hot');
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    });

    svg.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var p = toScene(e), it = drag.it;
      it.x = clamp(p.x + drag.dx, 30, 870);
      it.y = clamp(p.y + drag.dy, 30, 820);
      setT(it);
    });

    function release(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var it = drag.it, g = it.el, s = slotById[it.slot];
      drag = null;
      try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
      g.classList.remove('drag');
      L.items.appendChild(g);

      if (inside(s, it.x, it.y, 28)) {
        land(it, s);
        return;
      }
      fx[it.slot].classList.remove('hot');
      var wrong = SLOTS.some(function (o) { return o.id !== it.slot && inside(o, it.x, it.y, 0); });
      if (wrong) {
        sfx.nope();
        tween(it, { x: it.home.x, y: it.home.y, r: it.home.r, s: 1 }, 380, easeOutBack, function () { g.classList.add('idle'); });
      } else {
        tween(it, { x: it.x, y: it.y, r: it.r, s: 1 }, 200, easeOutCubic, function () { g.classList.add('idle'); });
      }
      scheduleHint(4500);
    }
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);

    /* ---------- landing ---------- */
    function land(it, s) {
      it.landed = true;
      it.el.classList.remove('idle');
      it.el.classList.add('landed');
      L.landed.appendChild(it.el);
      var rd = round;
      var n = counts[s.id]++, k = Math.min(n, 6), tx, ty, tr = 0;
      if (s.kind === 'bill') { tx = s.rx; ty = s.ry + 8 - 5 * k; tr = n ? (n % 2 ? 1.5 : -1.5) : 0; }
      else { tx = s.rx - 14 + 4 * k; ty = s.ry + 12 - 3 * k; }
      later(function () { sfx.land(s, n); }, 170);
      tween(it, { x: tx, y: ty, r: tr, s: 1 }, 340, easeOutBack, function () {
        if (rd !== round) return;
        var f = fx[s.id];
        f.classList.remove('hot');
        f.classList.remove('pop');
        void f.getBoundingClientRect();
        f.classList.add('pop');
        count += 1;
        if (count === items.length) complete();
        else scheduleHint(4500);
      });
    }

    function complete() {
      clearHint();
      active = false;
      svg.classList.add('done');
      SLOTS.forEach(function (s, i) {
        later(function () {
          fx[s.id].classList.add('hot');
          sfx.note(i);
          later(function () { fx[s.id].classList.remove('hot'); }, 420);
        }, 250 + i * 130);
      });
      later(sfx.shimmer, 250 + SLOTS.length * 130);
      /* the study cleared the pile here and dealt a new one; the sequence moves on instead */
      later(function () { if (onDone) onDone(); }, 3200);
    }

    return {
      start: function (cb) { onDone = cb; init(); },
      reset: clear,
      closeSound: sfx.close
    };
  };
})();
