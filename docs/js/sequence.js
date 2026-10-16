/* The linear sequence: begin → pick → ring → collect → closing tableau.
   Each step only becomes available after the previous one is complete. The restart button (always there)
   and the replay button (at the end) both return to the "tap to begin" screen. */
(function () {
  'use strict';
  var R = window.RPC;
  function $(id) { return document.getElementById(id); }

  var stage = $('stage');
  var intro = $('intro'), fieldLayer = $('fieldLayer'), shopLayer = $('shopLayer');
  var carry = $('carry'), replay = $('replay'), restart = $('restart'), mute = $('mute');
  var EASE = 'cubic-bezier(0.65, 0, 0.25, 1)';

  var flowers = R.createFlowers($('fieldFit'));
  var shop = R.createShop($('scene'));
  var panel = R.createPanel({
    toggle: $('panelToggle'),
    panel: $('flowerPanel'),
    settings: R.settings,
    openClass: 'panel-open',
    resetMessage: 'Field reset: new flowers, empty basket.',
    onResetState: function () { if (step === 'pick') flowers.restartPick(); }
  });
  /* While the bell controls are open the bell can be tried freely; the story continues
     once the panel is closed (if the bell has been rung by then). */
  var heldRing = false;
  var bellPanel = R.createPanel({
    toggle: $('bellToggle'),
    panel: $('bellPanel'),
    settings: R.bellSettings,
    openClass: 'bellpanel-open',
    resetMessage: 'Bell stopped and back at rest.',
    onResetState: function () { shop.bell.calm(); },
    onClose: function () { if (heldRing && step === 'ring') { heldRing = false; rung(); } }
  });
  function bellDone() {
    if (bellPanel.isOpen()) heldRing = true;
    else rung();
  }

  /* every restart starts a new generation; timers and tweens from an older one stop quietly */
  var gen = 0, timers = [], step = 'intro';
  function guard() { var g = gen; return function () { return g === gen; }; }
  function later(fn, ms) {
    var ok = guard();
    timers.push(setTimeout(function () { if (ok()) fn(); }, ms));
  }
  function wait(ms) { return new Promise(function (res) { later(res, ms); }); }
  function setStep(s) { step = s; stage.setAttribute('data-step', s); }

  /* ---------- layer visibility ---------- */
  function showNow(el, on) {
    el.style.transition = 'none';
    el.style.opacity = on ? '1' : '0';
    el.style.visibility = on ? 'visible' : 'hidden';
  }
  function fade(el, on, ms) {
    var ok = guard();
    el.style.transition = 'none';
    if (on) { el.style.visibility = 'visible'; el.style.opacity = '0'; }
    void el.offsetWidth;
    el.style.transition = 'opacity ' + ms + 'ms ease';
    el.style.opacity = on ? '1' : '0';
    if (!on) later(function () { if (ok()) el.style.visibility = 'hidden'; }, ms);
  }

  /* expanding rings, as in the connected draft's scene change */
  function rings(x, y) {
    if (R.reduce()) return;
    var W = stage.clientWidth, H = stage.clientHeight;
    var rad = Math.sqrt(Math.pow(Math.max(x, W - x), 2) + Math.pow(Math.max(y, H - y), 2)) + 8;
    [0, 170, 340].forEach(function (delay, i) {
      var r = document.createElement('div');
      r.className = 'ring';
      r.style.left = (x - rad) + 'px';
      r.style.top = (y - rad) + 'px';
      r.style.width = r.style.height = (2 * rad) + 'px';
      stage.appendChild(r);
      r.animate([{ transform: 'scale(0)', opacity: 0.9 }, { transform: 'scale(1)', opacity: 0 }],
        { duration: 1500 + i * 200, delay: delay, easing: EASE, fill: 'both' })
        .finished.then(function () { r.remove(); }, function () { r.remove(); });
    });
  }

  /* ---------- start state ---------- */
  function toIntro() {
    gen++;
    timers.forEach(clearTimeout);
    timers = [];
    stage.querySelectorAll('.ring').forEach(function (r) { r.remove(); });
    heldRing = false;
    panel.close();
    bellPanel.close();
    flowers.stop();
    flowers.reset();
    shop.reset();
    carry.style.visibility = 'hidden';
    carry.innerHTML = '';
    showNow(fieldLayer, false);
    showNow(shopLayer, false);
    showNow(replay, false);
    showNow(intro, true);
    setStep('intro');
  }

  /* ---------- begin → pick ---------- */
  function begin(x, y) {
    if (step !== 'intro') return;
    R.audio.unlock();
    setStep('pick');
    rings(x, y);
    fade(intro, false, 600);
    fade(fieldLayer, true, R.reduce() ? 300 : 900);
    flowers.start(picked);
  }
  intro.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button > 0) return;
    begin(e.clientX, e.clientY);
  });
  intro.addEventListener('click', function (e) {
    if (e.detail === 0) {   // keyboard activation; pointer begins on contact
      var r = intro.getBoundingClientRect();
      begin(r.left + r.width / 2, r.top + r.height / 2);
    }
  });

  /* ---------- pick → ring: the finished basket is carried onto the counter ---------- */
  function picked() {
    panel.close();
    setStep('to-ring');
    later(carryBouquet, 1100);   // let the basket's bounce settle, as in the connected draft
  }

  function carryBouquet() {
    var ok = guard();
    var reduce = R.reduce();
    var from = flowers.bouquetRect();
    var cap = flowers.cap(), cols = flowers.slotColors();

    shop.reset();
    shop.setBouquet(cap, cols);
    shop.showBouquet(false);

    carry.innerHTML = '<g transform="translate(40 20)">' +
      R.flora.bouquet(R.flora.palettes(R.theme(), R.settings.get()), cap, 8, cols) + '</g>';
    flowers.setHideBasket(true);

    fade(fieldLayer, false, reduce ? 300 : 800);
    fade(shopLayer, true, reduce ? 300 : 800);

    var to = shop.bouquetClientRect();
    carry.style.left = to.x + 'px';
    carry.style.top = to.y + 'px';
    carry.style.width = to.w + 'px';
    carry.style.height = to.h + 'px';
    carry.style.visibility = 'visible';
    var k = from.w / to.w;
    var a = carry.animate([
      { transform: 'translate(' + (from.x - to.x) + 'px,' + (from.y - to.y) + 'px) scale(' + k + ')' },
      { transform: 'translate(0,0) scale(1)' }
    ], { duration: reduce ? 300 : 1100, easing: EASE, fill: 'both' });

    a.finished.then(function () {
      if (!ok()) return;
      shop.showBouquet(true);
      carry.style.visibility = 'hidden';
      a.cancel();
      flowers.stop();
      setStep('ring');
      shop.bell.setActive(true);
      shop.bell.whenRungAndSettled(bellDone);
    }, function () {});
  }

  /* ---------- ring → collect: the bell slides aside and the till rises open ---------- */
  function rung() {
    var ok = guard();
    bellPanel.close();
    setStep('to-collect');
    shop.bell.setActive(false);
    var reduce = R.reduce();
    wait(300).then(function () {
      shop.moveTo('collect', reduce ? 1 : 900, ok);
      return wait(reduce ? 0 : 250);
    }).then(function () {
      return shop.openTill(reduce ? 1 : 900, ok);
    }).then(function () {
      if (!ok()) return;
      setStep('collect');
      shop.money.start(paid);
    });
  }

  /* ---------- collect → closing tableau ---------- */
  function paid() {
    var ok = guard();
    var reduce = R.reduce();
    setStep('ending');
    shop.closeTill(reduce ? 1 : 800, ok).then(function () {
      shop.money.closeSound();
      return wait(reduce ? 0 : 350);
    }).then(function () {
      return shop.moveTo('end', reduce ? 1 : 1000, ok);
    }).then(function () {
      if (!ok()) return;
      setStep('end');
      fade(replay, true, 600);
    });
  }

  /* ---------- controls ---------- */
  replay.addEventListener('click', toIntro);
  restart.addEventListener('click', toIntro);

  function syncMute() { mute.setAttribute('aria-pressed', R.audio.isMuted() ? 'false' : 'true'); }
  mute.addEventListener('click', function () {
    R.audio.unlock();
    R.audio.toggle();
    syncMute();
  });
  syncMute();

  toIntro();
})();
