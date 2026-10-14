/* One AudioContext for the whole sequence. It is created on the first tap (browsers require a gesture),
   and every scene's sounds run through one master gain so the mute button covers everything. */
(function () {
  'use strict';
  var R = window.RPC = window.RPC || {};
  var ctx = null, master = null, muted = false;
  try { muted = localStorage.getItem('rpc-muted') === '1'; } catch (e) {}

  function unlock() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  R.audio = {
    unlock: unlock,
    ctx: function () { return ctx; },
    out: function () { return master; },
    isMuted: function () { return muted; },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem('rpc-muted', muted ? '1' : '0'); } catch (e) {}
      if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.015);
      return muted;
    }
  };
})();
