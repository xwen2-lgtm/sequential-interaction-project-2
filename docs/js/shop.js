/* The shop counter that steps 2 and 3 share: where the bouquet and bell stand at each step,
   and the till drawer that rises from behind the counter to open and sinks back to close. */
(function () {
  'use strict';
  var R = window.RPC;

  /* positions in the 900x850 counter drawing. Both stand on the counter top (y 468):
     bell x is the middle of its base; bouquet x is the left edge of its box, w its width.
     While the till is open they move into the two corners the drawer leaves free. */
  var COUNTER = 468;
  var PLACES = {
    ring:    { bouquet: { x: 80,  w: 300 }, bell: { x: 600, y: COUNTER, s: 1.6 } },
    collect: { bouquet: { x: 62,  w: 205 }, bell: { x: 740, y: COUNTER, s: 0.8 } },
    end:     { bouquet: { x: 140, w: 300 }, bell: { x: 630, y: COUNTER, s: 1.3 } }
  };
  var RATIO = 280 / 380;    // bouquet box height / width (380x280 in basket units)
  var TILL_DOWN = 440;      // drawer offset when closed (hidden behind the counter top)

  R.createShop = function (svg) {
    function byId(id) { return document.getElementById(id); }
    var till = byId('till'), bouquetG = byId('bouquet');
    var bell = R.createBell({ place: byId('bellPlace'), hit: byId('bellHit'), swing: byId('swing'), btn: byId('btn'), glint: byId('glint') });
    var money = R.createMoney(svg, {
      fx: byId('slotsFx'), stacks: byId('stacks'), landed: byId('landed'), items: byId('items'), drag: byId('drag')
    });
    var cap = 0.56, colors = [], bq = { x: 80, w: 300 }, tillY = TILL_DOWN;

    function renderBouquet() {
      bouquetG.innerHTML = '<g transform="translate(40 20)">' +
        R.flora.bouquet(R.flora.palettes(R.theme(), R.settings.get()), cap, 8, colors) + '</g>';
    }
    function setBouquet(q) {
      bq = { x: q.x, w: q.w };
      bouquetG.setAttribute('transform', 'translate(' + q.x.toFixed(2) + ' ' + (COUNTER - q.w * RATIO).toFixed(2) +
        ') scale(' + (q.w / 380).toFixed(4) + ')');
    }
    function setTill(y) {
      tillY = y;
      till.setAttribute('transform', 'translate(0 ' + y.toFixed(2) + ')');
    }
    R.onTheme(function () { if (bouquetG.innerHTML) renderBouquet(); });

    /* table controls: wood colours for the counter top, cabinet and edges (a little darker in dark mode),
       and the tree-ring grain overlay */
    var T = R.tableSettings;
    var WOOD_VARS = { '--c-surf-a': ['top', 0], '--c-surf-b': ['top', 1], '--c-front-a': ['front', 0], '--c-front-b': ['front', 1],
                      '--c-panel-a': ['panel', 0], '--c-panel-b': ['panel', 1], '--c-rail': ['rail'], '--c-base': ['rail'],
                      '--wood-grain': ['grain'] };
    function applyTable() {
      var v = T.get(), w = T.WOODS[v.wood], dark = R.theme() === 'dark';
      Object.keys(WOOD_VARS).forEach(function (name) {
        var src = WOOD_VARS[name];
        if (!w.hex) { svg.style.removeProperty(name); return; }
        var c = src.length > 1 ? w[src[0]][src[1]] : w[src[0]];
        svg.style.setProperty(name, dark ? R.flora.mix(c, '#000000', 0.3) : c);
      });
      svg.classList.toggle('grain-on', !!w.hex && v.grain);
      /* the till drawer takes its colours from the shop background; in dark mode the
         compartments go dark and their labels light, like the original dark till */
      var till = T.BACKDROPS[v.backdrop].till;
      ['body', 'interior', 'comp', 'label', 'lip', 'pull', 'pullhi'].forEach(function (k) {
        var name = '--t-' + k;
        if (!till) { svg.style.removeProperty(name); return; }
        var c = till[k];
        if (dark) {
          if (k === 'comp') c = R.flora.mix(till.comp, till.interior, 0.7);
          else if (k === 'label') c = till.comp;
          else c = R.flora.mix(c, '#000000', 0.3);
        }
        svg.style.setProperty(name, c);
      });
      /* shop background picture behind the counter (set inline so the path is relative to the page) */
      var bg = document.getElementById('shopBg');
      bg.style.backgroundImage = v.backdrop === 'none' ? '' : 'url("assets/backgrounds/' + v.backdrop + '.svg")';
    }
    T.onChange(applyTable);
    R.onTheme(applyTable);
    applyTable();

    function toClient(x, y, w, h) {
      var m = svg.getScreenCTM(), pt = svg.createSVGPoint();
      pt.x = x; pt.y = y;
      var a = pt.matrixTransform(m);
      pt.x = x + w; pt.y = y + h;
      var b = pt.matrixTransform(m);
      return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
    }

    function reset() {
      bell.reset();
      bell.setActive(false);
      bell.setPlace(PLACES.ring.bell);
      money.reset();
      setTill(TILL_DOWN);
      bouquetG.innerHTML = '';
      bouquetG.style.visibility = 'hidden';
      setBouquet(PLACES.ring.bouquet);
    }
    reset();

    return {
      bell: bell,
      money: money,
      reset: reset,
      setBouquet: function (c, cols) { cap = c; colors = cols || []; renderBouquet(); },
      showBouquet: function (on) { bouquetG.style.visibility = on ? 'visible' : 'hidden'; },
      bouquetClientRect: function () { return toClient(bq.x, COUNTER - bq.w * RATIO, bq.w, bq.w * RATIO); },
      /* slide the bell and bouquet to the arrangement for a step */
      moveTo: function (name, dur, guard) {
        var b0 = bell.place(), q0 = bq, t = PLACES[name];
        return R.tween(dur, R.ease.inOutCubic, function (e) {
          bell.setPlace({ x: b0.x + (t.bell.x - b0.x) * e, y: b0.y + (t.bell.y - b0.y) * e, s: b0.s + (t.bell.s - b0.s) * e });
          setBouquet({ x: q0.x + (t.bouquet.x - q0.x) * e, w: q0.w + (t.bouquet.w - q0.w) * e });
        }, guard);
      },
      openTill: function (dur, guard) {
        var y0 = tillY;
        return R.tween(dur, R.ease.outCubic, function (e) { setTill(y0 * (1 - e)); }, guard);
      },
      closeTill: function (dur, guard) {
        var y0 = tillY;
        return R.tween(dur, R.ease.inCubic, function (e) { setTill(y0 + (TILL_DOWN - y0) * e); }, guard);
      }
    };
  };
})();
