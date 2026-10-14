/* Flower controls: the one list of adjustable properties for the Pick step.
   The panel, the defaults, "Restore defaults" and the copied prompt are all built from this list.
   Values are remembered in this browser between visits. */
(function () {
  'use strict';
  var R = window.RPC = window.RPC || {};
  var KEY = 'rpc-flower-settings';

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

  /* type: range | toggle | choice. `when` names a toggle that must be on for the control to apply. */
  var DEFS = [
    { key: 'size',      group: 'Flowers', label: 'Flower size',   type: 'range', min: 60, max: 160, step: 5, unit: '%', def: 100 },
    { key: 'wind',      group: 'Wind',    label: 'Wind',          type: 'toggle', def: false },
    { key: 'windSpeed', group: 'Wind',    label: 'Wind strength', type: 'range', min: 5, max: 60, step: 1, unit: 'km/h', def: 20, when: 'wind' },
    { key: 'wiggle',    group: 'Wiggle',  label: 'Wiggle',        type: 'toggle', def: false },
    { key: 'wiggleAmt', group: 'Wiggle',  label: 'Wiggle amount', type: 'range', min: 1, max: 15, step: 1, unit: '°', def: 5, when: 'wiggle' },
    { key: 'wiggleHz',  group: 'Wiggle',  label: 'Wiggle speed',  type: 'range', min: 0.5, max: 4, step: 0.1, unit: 'Hz', def: 1.5, when: 'wiggle' },
    { key: 'grass',     group: 'Colour',  label: 'Grass',         type: 'choice', options: GRASS, def: 'original' },
    { key: 'scheme',    group: 'Colour',  label: 'Flowers',       type: 'choice', options: SCHEMES, def: 'original' },
    { key: 'motion',    group: 'Motion',  label: 'Flight easing', type: 'choice', options: MOTIONS, def: 'inout' },
    { key: 'flight',    group: 'Motion',  label: 'Flight time',   type: 'range', min: 300, max: 2000, step: 50, unit: 'ms', def: 900 }
  ];

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
    var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    DEFS.forEach(function (d) { if (valid(d, saved[d.key])) values[d.key] = saved[d.key]; });
  } catch (e) {}

  var listeners = [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(values)); } catch (e) {} }
  function emit(keys) { listeners.forEach(function (cb) { cb(keys); }); }

  function fmt(d, v) {
    if (d.type === 'toggle') return v ? 'on' : 'off';
    if (d.type === 'range') return (d.step < 1 ? v.toFixed(1) : String(v)) + ' ' + d.unit;
    var o = d.options[v];
    return typeof o === 'string' ? o : o.label;
  }

  /* A plain-language description that can be pasted into a prompt. */
  function prompt() {
    var v = values, lines = [];
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
  }

  R.settings = {
    DEFS: DEFS, GRASS: GRASS, SCHEMES: SCHEMES, MOTIONS: MOTIONS,
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
    format: fmt,
    prompt: prompt
  };
})();
