/* Shared helpers: motion preferences, theme, tweening, and the flower/basket art used by both the field and the shop. */
(function () {
  'use strict';
  var R = window.RPC = window.RPC || {};

  function mq(q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; }
  function listen(m, cb) {
    if (m.addEventListener) m.addEventListener('change', cb);
    else if (m.addListener) m.addListener(cb);
  }

  R.reduce = function () { return mq('(prefers-reduced-motion: reduce)').matches; };

  R.theme = function () {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return mq('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  R.onTheme = function (cb) {
    listen(mq('(prefers-color-scheme: dark)'), cb);
    new MutationObserver(cb).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  };

  R.ease = {
    inOutCubic: function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    outCubic: function (k) { return 1 - Math.pow(1 - k, 3); },
    inCubic: function (k) { return k * k * k; }
  };

  /* Runs step(e) every frame for dur ms. Resolves when done; if guard() turns false it stops and never resolves. */
  R.tween = function (dur, ease, step, guard) {
    return new Promise(function (res) {
      var t0 = performance.now();
      function f(now) {
        if (guard && !guard()) return;
        var k = dur > 0 ? Math.min(1, (now - t0) / dur) : 1;
        step(ease(k));
        if (k < 1) requestAnimationFrame(f);
        else res();
      }
      requestAnimationFrame(f);
    });
  };

  /* ---------- flower, grass and basket art (from the Pick Flowers study) ---------- */
  var PAL = {
    light: { grass: '#dcdcdc', tuft: '#bcbcbc', petal: '#8f8f8f', core: '#f7f7f7', stem: '#6f6f6f', leaf: '#9b9b9b',
             bBody: '#cacaca', bLine: '#7b7b7b', bRim: '#aaaaaa', shadow: 'rgba(70,70,70,0.20)' },
    dark:  { grass: '#2c2c2c', tuft: '#464646', petal: '#bdbdbd', core: '#3a3a3a', stem: '#8a8a8a', leaf: '#717171',
             bBody: '#4a4a4a', bLine: '#9a9a9a', bRim: '#5e5e5e', shadow: 'rgba(0,0,0,0.35)' }
  };

  function flowerSVG(p) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="200" height="300">' +
      '<path d="M100 120 V280" stroke="' + p.stem + '" stroke-width="6" fill="none"/>' +
      '<path d="M100 220 Q140 200 150 170 Q110 180 100 220 Z" fill="' + p.leaf + '"/>' +
      '<g fill="' + p.petal + '"><circle cx="100" cy="60" r="28"/><circle cx="100" cy="120" r="28"/>' +
      '<circle cx="70" cy="90" r="28"/><circle cx="130" cy="90" r="28"/></g>' +
      '<circle cx="100" cy="90" r="20" fill="' + p.core + '"/></svg>';
  }
  function grassSVG(p) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 130 400 120" width="400" height="120">' +
      '<rect y="130" width="400" height="120" fill="' + p.grass + '"/>' +
      '<g stroke="' + p.tuft + '" stroke-width="3" stroke-linecap="round" fill="none">' +
      '<path d="M40 200 l-4 -14 M40 200 l4 -14"/><path d="M110 170 l-3 -10 M110 170 l3 -10"/>' +
      '<path d="M180 215 l-4 -14 M180 215 l4 -14"/><path d="M250 175 l-3 -10 M250 175 l3 -10"/>' +
      '<path d="M320 205 l-4 -14 M320 205 l4 -14"/><path d="M370 160 l-3 -10 M370 160 l3 -10"/></g></svg>';
  }
  function basketSVG(p) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 260" width="300" height="260">' +
      '<path d="M70 160 C70 40 230 40 230 160" stroke="' + p.bLine + '" stroke-width="8" fill="none" stroke-linecap="round"/>' +
      '<path d="M60 160 H240 L215 240 H85 Z" fill="' + p.bBody + '" stroke="' + p.bLine + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<g stroke="' + p.bLine + '" stroke-width="2" opacity="0.7"><path d="M68 185 H232"/><path d="M76 212 H224"/>' +
      '<path d="M110 160 L100 240"/><path d="M150 160 V240"/><path d="M190 160 L200 240"/></g>' +
      '<rect x="55" y="152" width="190" height="14" rx="6" fill="' + p.bRim + '" stroke="' + p.bLine + '" stroke-width="3"/></svg>';
  }
  function svgURL(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

  /* basket slots (a loose, fanned bouquet) */
  function slotParam(i) {
    return {
      a: (((i * 0.618034) % 1) - 0.5) * 0.9,
      l: (i * 0.3819 + 0.2) % 1,
      ox: (((i * 0.7548) % 1) - 0.5) * 70
    };
  }

  function mix(hex, to, t) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16), out = '#';
    [16, 8, 0].forEach(function (sh) {
      var c = Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t);
      out += (c < 16 ? '0' : '') + c.toString(16);
    });
    return out;
  }

  /* The colours in use: the study's grayscale palette, with the grass and flower colours
     from the flower controls laid over it. Seasonal schemes have two flowers: A has petals
     in the first colour and a centre in the second, B the other way round. */
  function palettes(theme, s) {
    var base = PAL[theme], dark = theme === 'dark';
    var g = R.settings.GRASS[s.grass], sc = R.settings.SCHEMES[s.scheme];
    var out = { grass: base.grass, tuft: base.tuft, shadow: base.shadow, basket: base, flowers: [base, base] };
    if (g.hex) {
      out.grass = dark ? mix(g.hex, '#000000', 0.55) : g.hex;
      out.tuft = dark ? mix(g.hex, '#000000', 0.3) : mix(g.hex, '#000000', 0.25);
    }
    if (sc.colors) {
      var stem = dark ? '#6f8f58' : '#4f7942', leaf = dark ? '#5c7a48' : '#7da35e';
      var c0 = sc.colors[0][1], c1 = sc.colors[1][1];
      out.flowers = [
        { petal: c0, core: c1, stem: stem, leaf: leaf },
        { petal: c1, core: c0, stem: stem, leaf: leaf }
      ];
    }
    return out;
  }

  /* The finished basket as SVG markup, in basket units (basket at 0,0 300x260). cap is the
     largest flower scale relative to the basket, taken from the field so the bouquet looks identical.
     colors[slot] is which of the two flower palettes the flower in that slot uses. */
  function bouquet(pals, cap, n, colors) {
    var fImg = pals.flowers.map(function (p) { return svgURL(flowerSVG(p)); });
    var bImg = svgURL(basketSVG(pals.basket));
    var list = [];
    for (var i = 0; i < n; i++) list.push(i);
    list.sort(function (a, b) { return slotParam(b).l - slotParam(a).l; });
    var out = '';
    list.forEach(function (i) {
      var s = slotParam(i), r = Math.min(0.44 + 0.12 * s.l, cap);
      out += '<g transform="translate(' + (150 + s.ox).toFixed(2) + ' 205) rotate(' + (s.a * 180 / Math.PI).toFixed(2) + ')">' +
        '<image href="' + fImg[(colors && colors[i]) || 0] + '" x="' + (-100 * r).toFixed(2) + '" y="' + (-280 * r).toFixed(2) +
        '" width="' + (200 * r).toFixed(2) + '" height="' + (300 * r).toFixed(2) + '"/></g>';
    });
    return out + '<image href="' + bImg + '" x="0" y="0" width="300" height="260"/>';
  }

  /* ease curves for the flight into the basket (flower controls) */
  var FLIGHT = {
    linear: function (t) { return t; },
    in: function (t) { return t * t * t; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    inout: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; },   // the study's curve
    spring: function (t) { return t >= 1 ? 1 : 1 - Math.exp(-6 * t) * Math.cos(t * 3.5 * Math.PI); }
  };

  R.flora = {
    PAL: PAL, flowerSVG: flowerSVG, grassSVG: grassSVG, basketSVG: basketSVG,
    svgURL: svgURL, slotParam: slotParam, bouquet: bouquet, palettes: palettes, FLIGHT: FLIGHT, mix: mix
  };
})();
