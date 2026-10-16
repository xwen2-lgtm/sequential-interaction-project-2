/* Adjustable properties for the control panels: flower controls (Pick step) and bell controls (Ring step).
   Each panel, its defaults, "Restore defaults" and its copied prompt are all built from one list here.
   Values are remembered in this browser between visits. Defaults reproduce the original studies. */
(function () {
  'use strict';
  var R = window.RPC = window.RPC || {};

  /* type: range | toggle | choice. `when` names a toggle that must be on for the control to apply.
     `swatch` shows colour dots next to a choice. */
  function makeSettings(storeKey, DEFS, prompt) {
    function defaults() {
      var o = {};
      DEFS.forEach(function (d) { o[d.key] = d.def; });
      return o;
    }
    function valid(d, v) {
      if (d.type === 'range') return typeof v === 'number' && v >= d.min && v <= d.max;
      if (d.type === 'toggle') return typeof v === 'boolean';
      return Object.prototype.hasOwnProperty.call(d.options, v);
    }

    var values = defaults();
    try {
      var saved = JSON.parse(localStorage.getItem(storeKey) || '{}');
      DEFS.forEach(function (d) { if (valid(d, saved[d.key])) values[d.key] = saved[d.key]; });
    } catch (e) {}

    var listeners = [];
    function save() { try { localStorage.setItem(storeKey, JSON.stringify(values)); } catch (e) {} }
    function emit(keys) { listeners.forEach(function (cb) { cb(keys); }); }

    return {
      DEFS: DEFS,
      get: function () { return values; },
      set: function (key, v) {
        var d = DEFS.filter(function (x) { return x.key === key; })[0];
        if (!d || !valid(d, v) || values[key] === v) return;
        values[key] = v;
        save();
        emit([key]);
      },
      restoreDefaults: function () {
        values = defaults();
        save();
        emit(DEFS.map(function (d) { return d.key; }));
      },
      onChange: function (cb) { listeners.push(cb); },
      format: function (d, v) {
        if (d.type === 'toggle') return v ? 'on' : 'off';
        if (d.type === 'range') return (d.step < 1 ? v.toFixed(1) : String(v)) + ' ' + d.unit;
        var o = d.options[v];
        return typeof o === 'string' ? o : o.label;
      },
      prompt: function () { return prompt(values); }
    };
  }

  /* ---------- flower controls (Pick step) ---------- */
  var GRASS = {
    original: { label: 'Original (gray)' },
    lime:     { label: 'Lime green',    hex: '#32CD32' },
    yellow:   { label: 'Yellow green',  hex: '#9ACD32' },
    peacock:  { label: 'Peacock green', hex: '#00A693' },
    olive:    { label: 'Olive green',   hex: '#708238' },
    apple:    { label: 'Apple green',   hex: '#8DB600' }
  };
  var SCHEMES = {
    original: { label: 'Original (gray)' },
    spring:   { label: 'Spring', colors: [['Light pink', '#FFB6C1'], ['Butter yellow', '#FFEF96']] },
    summer:   { label: 'Summer', colors: [['Turquoise', '#40E0D0'], ['Bright magenta', '#FF1DCE']] },
    fall:     { label: 'Fall',   colors: [['Brown', '#8B5A2B'], ['Light red', '#FF7F7F']] },
    winter:   { label: 'Winter', colors: [['Light mint', '#C1F2D6'], ['Pale lilac', '#DCD0FF']] }
  };
  var MOTIONS = {
    linear: 'Linear',
    in:     'Ease In',
    out:    'Ease Out',
    inout:  'Ease In-Out',
    spring: 'Spring/Bounce'
  };

  R.settings = makeSettings('rpc-flower-settings', [
    { key: 'size',      group: 'Flowers', label: 'Flower size',   type: 'range', min: 60, max: 160, step: 5, unit: '%', def: 100 },
    { key: 'wind',      group: 'Wind',    label: 'Wind',          type: 'toggle', def: false },
    { key: 'windSpeed', group: 'Wind',    label: 'Wind strength', type: 'range', min: 5, max: 60, step: 1, unit: 'km/h', def: 20, when: 'wind' },
    { key: 'wiggle',    group: 'Wiggle',  label: 'Wiggle',        type: 'toggle', def: false },
    { key: 'wiggleAmt', group: 'Wiggle',  label: 'Wiggle amount', type: 'range', min: 1, max: 15, step: 1, unit: '°', def: 5, when: 'wiggle' },
    { key: 'wiggleHz',  group: 'Wiggle',  label: 'Wiggle speed',  type: 'range', min: 0.5, max: 4, step: 0.1, unit: 'Hz', def: 1.5, when: 'wiggle' },
    { key: 'grass',     group: 'Colour',  label: 'Grass',         type: 'choice', options: GRASS, def: 'original', swatch: true },
    { key: 'scheme',    group: 'Colour',  label: 'Flowers',       type: 'choice', options: SCHEMES, def: 'original', swatch: true },
    { key: 'motion',    group: 'Motion',  label: 'Flight easing', type: 'choice', options: MOTIONS, def: 'inout' },
    { key: 'flight',    group: 'Motion',  label: 'Flight time',   type: 'range', min: 300, max: 2000, step: 50, unit: 'ms', def: 900 }
  ], function (v) {
    var lines = [];
    lines.push('Update the Pick Flowers step (first interaction) of the Flower Shop prototype with these settings:');
    lines.push('- Flower size: ' + v.size + '% of the original size');
    lines.push('- Wind blowing the flowers: ' + (v.wind ? 'on, ' + v.windSpeed + ' km/h' : 'off'));
    lines.push('- Flower wiggle: ' + (v.wiggle ? 'on, ' + v.wiggleAmt + '° at ' + v.wiggleHz.toFixed(1) + ' Hz' : 'off'));
    var g = GRASS[v.grass];
    lines.push('- Grass colour: ' + (g.hex ? g.label.toLowerCase() + ' (' + g.hex + ')' : 'original gray'));
    var s = SCHEMES[v.scheme];
    lines.push('- Flower colour scheme: ' + (s.colors
      ? s.label.toLowerCase() + ': ' + s.colors.map(function (c) { return c[0].toLowerCase() + ' (' + c[1] + ')'; }).join(' and ')
      : 'original gray'));
    lines.push('- Flight into the basket: ' + MOTIONS[v.motion] + ' easing, ' + v.flight + ' ms');
    return lines.join('\n');
  });
  R.settings.GRASS = GRASS;
  R.settings.SCHEMES = SCHEMES;
  R.settings.MOTIONS = MOTIONS;

  /* ---------- bell controls (Ring step) ---------- */
  /* base, dome, highlight and plunger colours for each finish; `original` uses the theme's grays */
  var BELL_COLORS = {
    original: { label: 'Original (gray)' },
    green:    { label: 'Green',  hex: '#3F8F5A', base: '#2B5E3C', dome: '#3F8F5A', hi: '#BFE6CB', plunger: '#22472E' },
    purple:   { label: 'Purple', hex: '#7D4FA6', base: '#553372', dome: '#7D4FA6', hi: '#DCC6F0', plunger: '#42275A' },
    silver:   { label: 'Silver', hex: '#C0C4C8', base: '#8E9399', dome: '#C0C4C8', hi: '#FFFFFF', plunger: '#6F747A' },
    gold:     { label: 'Gold',   hex: '#D4A537', base: '#9C7420', dome: '#D4A537', hi: '#FFF1C2', plunger: '#7A5A17' },
    white:    { label: 'White',  hex: '#F6F6F4', base: '#D2D2CF', dome: '#F6F6F4', hi: '#FFFFFF', plunger: '#B8B8B5', edge: '#A9A9A6' }
  };
  var MOODS = {
    original: 'Original (service bell)',
    stinging: 'Stinging',
    happy:    'Happy',
    sad:      'Sad',
    dull:     'Dull',
    bored:    'Bored',
    cute:     'Cute'
  };
  var MOOD_TEXT = {
    original: 'original service-bell ding',
    stinging: 'stinging (high, piercing, with a harsh shimmer)',
    happy:    'happy (bright major chord with a quick rising second note)',
    sad:      'sad (low minor chord that sags in pitch and rings long)',
    dull:     'dull (low, muffled clunk with almost no ring)',
    bored:    'bored (low, quiet, short and sighing downwards)',
    cute:     'cute (high toy-like ping that springs up, with a tiny echo)'
  };

  R.bellSettings = makeSettings('rpc-bell-settings', [
    { key: 'volume', group: 'Sound', label: 'Volume',     type: 'range', min: 0, max: 150, step: 5, unit: '%', def: 100 },
    { key: 'mood',   group: 'Sound', label: 'Sound mood', type: 'choice', options: MOODS, def: 'original' },
    { key: 'color',  group: 'Look',  label: 'Bell colour', type: 'choice', options: BELL_COLORS, def: 'original', swatch: true },
    { key: 'shine',  group: 'Look',  label: 'Metallic shine', type: 'toggle', def: true },
    { key: 'swing',  group: 'Motion', label: 'Swing size', type: 'range', min: 25, max: 200, step: 5, unit: '%', def: 100 },
    { key: 'settle', group: 'Motion', label: 'Time to return to rest', type: 'range', min: 0.8, max: 5, step: 0.1, unit: 's', def: 2.2 }
  ], function (v) {
    var c = BELL_COLORS[v.color];
    return [
      'Update the Ring step (second interaction) of the Flower Shop prototype with these bell settings:',
      '- Bell volume: ' + v.volume + '% of the original',
      '- Sound mood: ' + MOOD_TEXT[v.mood],
      '- Bell colour: ' + (c.hex ? c.label.toLowerCase() + ' (' + c.hex + ')' : 'original gray'),
      '- Metallic shine: ' + (v.shine ? 'on (highlight on the dome and a glint that sweeps across it when struck)' : 'off (flat colour, no highlight)'),
      '- Swing size: ' + v.swing + '% of the original',
      '- Time for the bell to return to rest: ' + v.settle.toFixed(1) + ' s'
    ].join('\n');
  });
  R.bellSettings.COLORS = BELL_COLORS;
})();
