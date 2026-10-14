/* The collapsible "Flower controls" panel for the Pick step. It is built from the list in js/settings.js;
   every change applies to the field straight away. */
(function () {
  'use strict';
  var R = window.RPC, S = R.settings;

  R.createPanel = function (opts) { // opts: { toggle, panel, onResetState }
    var toggle = opts.toggle, panel = opts.panel;
    var body = panel.querySelector('.panel-body'), status = panel.querySelector('.panel-status');
    var manual = panel.querySelector('.panel-manual');
    var inputs = {}, uid = 0;

    function h(tag, attrs, text) {
      var n = document.createElement(tag);
      for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      return n;
    }
    function swatch(hex) {
      var s = h('span', { 'class': 'swatch', 'aria-hidden': 'true' });
      if (hex) s.style.background = hex; else s.classList.add('gray');
      return s;
    }

    /* ---------- build ---------- */
    var groups = {};
    S.DEFS.forEach(function (d) {
      if (!groups[d.group]) {
        var fs = h('fieldset', { 'class': 'group' });
        fs.appendChild(h('legend', null, d.group));
        body.appendChild(fs);
        groups[d.group] = fs;
      }
      var fs2 = groups[d.group], id = 'fc-' + d.key + '-' + (++uid), row, input;

      if (d.type === 'toggle') {
        row = h('label', { 'class': 'ctl switch', 'for': id });
        input = h('input', { type: 'checkbox', id: id, role: 'switch' });
        row.appendChild(h('span', { 'class': 'name' }, d.label));
        row.appendChild(input);
        row.appendChild(h('span', { 'class': 'track', 'aria-hidden': 'true' }));
        input.addEventListener('change', function () { S.set(d.key, input.checked); });
      } else if (d.type === 'range') {
        row = h('div', { 'class': 'ctl range' });
        var top = h('div', { 'class': 'line' });
        top.appendChild(h('label', { 'for': id, 'class': 'name' }, d.label + ' (' + d.unit + ')'));
        var out = h('output', { 'for': id });
        top.appendChild(out);
        row.appendChild(top);
        input = h('input', { type: 'range', id: id, min: d.min, max: d.max, step: d.step });
        row.appendChild(input);
        var ends = h('div', { 'class': 'ends', 'aria-hidden': 'true' });
        ends.appendChild(h('span', null, d.min + ' ' + d.unit));
        ends.appendChild(h('span', null, d.max + ' ' + d.unit));
        row.appendChild(ends);
        input.__out = out;
        input.addEventListener('input', function () {
          var v = Number(input.value);
          out.textContent = S.format(d, v);
          S.set(d.key, v);
        });
      } else {
        row = h('div', { 'class': 'ctl choice' });
        var line = h('div', { 'class': 'line' });
        line.appendChild(h('label', { 'for': id, 'class': 'name' }, d.label));
        var sw = h('span', { 'class': 'swatches' });
        line.appendChild(sw);
        row.appendChild(line);
        input = h('select', { id: id });
        Object.keys(d.options).forEach(function (k) {
          var o = d.options[k], text = typeof o === 'string' ? o : o.label;
          if (o.colors) text += ': ' + o.colors.map(function (c) { return c[0].toLowerCase(); }).join(' + ');
          input.appendChild(h('option', { value: k }, text));
        });
        row.appendChild(input);
        input.__sw = sw;
        input.addEventListener('change', function () { S.set(d.key, input.value); });
      }
      row.__def = d;
      inputs[d.key] = { def: d, input: input, row: row };
      fs2.appendChild(row);
    });

    /* ---------- sync controls with the current values ---------- */
    function refresh() {
      var v = S.get();
      Object.keys(inputs).forEach(function (k) {
        var c = inputs[k], d = c.def, el = c.input;
        if (d.type === 'toggle') el.checked = v[k];
        else el.value = v[k];
        if (d.type === 'range') el.__out.textContent = S.format(d, v[k]);
        if (d.type === 'choice' && el.__sw) {
          el.__sw.innerHTML = '';
          var o = d.options[v[k]];
          if (o.hex) el.__sw.appendChild(swatch(o.hex));
          else if (o.colors) o.colors.forEach(function (c2) { el.__sw.appendChild(swatch(c2[1])); });
          else if (d.key !== 'motion') el.__sw.appendChild(swatch(null));
        }
        var off = d.when && !v[d.when];
        el.disabled = !!off;
        c.row.classList.toggle('off', !!off);
      });
    }
    S.onChange(refresh);
    refresh();

    /* ---------- open / close ---------- */
    var stage = panel.parentNode;
    function setOpen(on) {
      panel.hidden = !on;
      stage.classList.toggle('panel-open', on);
      toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    toggle.addEventListener('click', function () { setOpen(panel.hidden); });
    panel.querySelector('.panel-close').addEventListener('click', function () { setOpen(false); toggle.focus(); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); toggle.focus(); } });

    /* ---------- actions ---------- */
    var statusT = 0;
    function say(text) {
      status.textContent = text;
      clearTimeout(statusT);
      statusT = setTimeout(function () { status.textContent = ''; }, 2400);
    }
    panel.querySelector('[data-act="reset"]').addEventListener('click', function () {
      opts.onResetState();
      say('Field reset: new flowers, empty basket.');
    });
    panel.querySelector('[data-act="defaults"]').addEventListener('click', function () {
      S.restoreDefaults();
      say('Defaults restored.');
    });
    panel.querySelector('[data-act="copy"]').addEventListener('click', function () {
      var text = S.prompt();
      function fallback() {
        var ta = h('textarea', { readonly: '', 'aria-hidden': 'true' });
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
        if (ok) { say('Prompt copied.'); return; }
        /* copying is blocked: show the text so it can be copied by hand */
        manual.value = text;
        manual.hidden = false;
        manual.focus();
        manual.select();
        say('Copy was blocked. The prompt is selected below; copy it by hand.');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say('Prompt copied.'); }, fallback);
      } else fallback();
    });

    return { close: function () { setOpen(false); } };
  };
})();
