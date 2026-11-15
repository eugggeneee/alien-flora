/* Alien Flora. No network calls: data comes from data.js and every picture is drawn here as SVG. */
(function () {
  'use strict';

  var PLANTS = Array.isArray(window.PLANTS) ? window.PLANTS : [];

  /* ---------- constants ---------- */
  var TYPE = { tree: 'Tree', shrub: 'Shrub', herb: 'Herb', vine: 'Vine' };
  var TYPE_ICON = { tree: 'tree', shrub: 'shrub', herb: 'leaf', vine: 'vine' };
  var RISK = {
    critical: { label: 'Critical', long: 'Critical danger', rank: 0 },
    dangerous: { label: 'Dangerous', long: 'Dangerous species', rank: 1 },
    moderate: { label: 'Moderate', long: 'Moderate danger', rank: 2 },
    watch: { label: 'Watch', long: 'Needs watching', rank: 3 },
    low: { label: 'Low', long: 'Low danger', rank: 4 }
  };
  var HABITAT = { wasteland: 'Wasteland', forest: 'Woodland and parks', water: 'Waterside', roadside: 'Roadsides', lawn: 'Lawns' };
  var PLACE_OF = { wasteland: 'wasteland', forest: 'forest', water: 'water', roadside: 'roadside', lawn: 'roadside' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SEASON_MONTHS = { spring: [4, 5], summer: [6, 7, 8], autumn: [9, 10], winter: [11, 12, 1, 2, 3] };
  var FEATURE_LABEL = { white_flowers: 'White flowers', yellow_flowers: 'Yellow flowers', pink_flowers: 'Pink or purple flowers', large_leaves: 'Large leaves', thorny: 'Thorns or spines', tall: 'Tall' };
  var METHOD = { mechanical: ['tools', 'Mechanical'], chemical: ['flask', 'Chemical'], agro: ['leaf', 'Agronomic'] };
  var PAGES = { home: 'Alien Flora | Atlas of invasive plants in Minsk', catalog: 'Catalog | Alien Flora', identify: 'Identifier | Alien Flora', act: 'What to do | Alien Flora' };

  var SWAPS = [
    ['Box elder', 'Norway maple', 'A native maple with a broad crown that copes well with city conditions.', ['Native', 'City-tolerant', 'Autumn colour']],
    ['Canadian goldenrod', 'Ox-eye daisy', 'White daisies that flower for most of the summer and feed pollinators.', ['Native', 'Long flowering', 'Pollinators']],
    ['Black locust', 'Small-leaved lime', 'A native tree with scented flowers that bees love.', ['Native', 'Fragrant', 'Bee plant']],
    ['Himalayan balsam', 'Purple loosestrife', 'Tall pink spikes for wet ground and pond edges.', ['Native', 'Likes wet soil', 'Pollinators']],
    ['Garden lupin', 'Meadow sage', 'Violet-blue flower spikes for dry sunny meadows and verges.', ['Native', 'Drought-tolerant', 'Pollinators']],
    ['Black cherry', 'European bird cherry', 'The native cherry the invader competes with, with white spring flowers.', ['Native', 'Spring flowers', 'Bird food']],
    ['Northern red oak', 'Pedunculate oak', 'The native oak, home to far more insects and birds.', ['Native', 'Long-lived', 'Wildlife value']]
  ];

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function bloomText(b) { return b[0] === b[1] ? MONTHS[b[0] - 1] : MONTHS[b[0] - 1] + ' to ' + MONTHS[b[1] - 1]; }
  function byRisk(a, b) { return RISK[a.danger].rank - RISK[b.danger].rank || a.name.localeCompare(b.name); }
  function badge(p, long) { return '<span class="badge badge--' + p.danger + '">' + esc(long ? RISK[p.danger].long : RISK[p.danger].label) + '</span>'; }
  function find(id) { return PLANTS.filter(function (p) { return p.id === id; })[0]; }

  /* ---------- illustrations (seeded, so a plant always looks the same) ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function f(n) { return n.toFixed(1); }
  var FLOWER = { white_flowers: ['#FFFDF5', '#B9B39B'], yellow_flowers: ['#F0BE2E', '#C6951A'], pink_flowers: ['#DA5C90', '#A93A68'] };
  function flowerCol(p) { for (var k in FLOWER) if (p.features.indexOf(k) > -1) return FLOWER[k]; return null; }
  function leaf(x, y, rx, ry, a, fill) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '" transform="rotate(' + f(a) + ' ' + f(x) + ' ' + f(y) + ')"/>'; }
  function bloom(x, y, r, c) {
    var s = '';
    for (var i = 0; i < 5; i++) { var a = i * 72 * Math.PI / 180; s += '<circle cx="' + f(x + Math.cos(a) * r * .9) + '" cy="' + f(y + Math.sin(a) * r * .9) + '" r="' + f(r * .62) + '" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width=".5"/>'; }
    return s + '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r * .38) + '" fill="#D99A00"/>';
  }
  function quad(t, a, b, c) { return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c; }

  function palette(R, blue) {
    var h = 95 + R() * 50;
    return {
      stem: 'hsl(' + f(h - 10) + ' 32% 30%)',
      leaf: 'hsl(' + f(h) + ' 40% 36%)', leaf2: 'hsl(' + f(h + 8) + ' 38% 42%)',
      canopy: ['hsl(' + f(h) + ' 38% 30%)', 'hsl(' + f(h + 6) + ' 40% 38%)', 'hsl(' + f(h - 6) + ' 42% 45%)'],
      conifer: blue ? ['#4E7F99', '#6C9AB0'] : ['hsl(155 34% 22%)', 'hsl(150 32% 29%)']
    };
  }

  function herb(p, R, g) {
    var fc = flowerCol(p), tall = p.features.indexOf('tall') > -1, big = p.features.indexOf('large_leaves') > -1;
    var H = tall ? 96 : 72, lean = (R() - .5) * 14, tx = 100 + lean, ty = 132 - H, s = '';
    s += '<path d="M100 132 Q' + f(100 + lean * .2) + ' ' + f(132 - H * .5) + ' ' + f(tx) + ' ' + f(ty) + '" stroke="' + g.stem + '" stroke-width="' + (big ? 4.5 : 2.6) + '" fill="none" stroke-linecap="round"/>';
    var n = big ? 5 : 7;
    for (var i = 0; i < n; i++) {
      var t = (i + .6) / (n + .6), y = 132 - H * t * .82, x = 100 + lean * t * .9, w = (big ? 22 : 13) * (1 - t * .45), h = (big ? 9 : 4.2) * (1 - t * .3);
      s += leaf(x - w * .8, y, w, h, -28 - R() * 14, g.leaf) + leaf(x + w * .8, y - 3, w, h, 28 + R() * 14, g.leaf2);
    }
    if (p.id === 'american-pokeweed') {
      for (var u = 0; u < 9; u++) { s += '<circle cx="' + f(tx + 7 + (u % 3) * 4 - 6) + '" cy="' + f(ty + 4 + u * 3.6) + '" r="2.8" fill="#3A2234"/>'; }
      s += '<path d="M' + f(tx) + ' ' + f(ty) + ' Q' + f(tx + 10) + ' ' + f(ty + 12) + ' ' + f(tx + 7) + ' ' + f(ty + 40) + '" stroke="#B5546B" stroke-width="1.4" fill="none"/>';
    } else if (big && fc) {
      for (var j = 0; j <= 8; j++) {
        var ang = Math.PI + (j / 8) * Math.PI, px = tx + Math.cos(ang) * 28, py = ty + Math.sin(ang) * 18;
        s += '<line x1="' + f(tx) + '" y1="' + f(ty) + '" x2="' + f(px) + '" y2="' + f(py) + '" stroke="' + g.stem + '" stroke-width=".8"/>';
        for (var k = 0; k < 5; k++) { var b = k * 72 * Math.PI / 180; s += '<circle cx="' + f(px + Math.cos(b) * 2.6) + '" cy="' + f(py + Math.sin(b) * 2.6) + '" r="1.7" fill="' + fc[0] + '" stroke="' + fc[1] + '" stroke-width=".3"/>'; }
      }
    } else if (fc && tall) {
      for (var m = 0; m < 9; m++) s += bloom(tx + (m % 2 ? 4.5 : -4.5), ty + 26 - m * 3.4, 3, fc);
    } else if (fc) {
      s += bloom(tx, ty, 6, fc) + bloom(tx - 11, ty + 9, 4.6, fc) + bloom(tx + 11, ty + 11, 4.6, fc);
    } else {
      for (var q = 0; q < 9; q++) {
        var dx = (q - 4) * 5, hh = 58 + R() * 34;
        s += '<path d="M' + f(100 + dx * .3) + ' 132 Q' + f(100 + dx * 1.6) + ' ' + f(132 - hh * .6) + ' ' + f(100 + dx * 2.2 + (R() - .5) * 10) + ' ' + f(132 - hh) + '" stroke="' + g.leaf + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
        s += '<ellipse cx="' + f(100 + dx * 2.2) + '" cy="' + f(132 - hh - 4) + '" rx="2" ry="6" fill="#C9B77A"/>';
      }
    }
    return s;
  }

  function shrub(p, R, g) {
    var fc = flowerCol(p), s = '', n = 7;
    for (var i = 0; i < n; i++) {
      var a = (-48 + i * (96 / (n - 1))) * Math.PI / 180, len = 58 + R() * 22;
      var ex = 100 + Math.sin(a) * len * .95, ey = 132 - Math.cos(a) * len, cx = 100 + Math.sin(a) * len * .35, cy = 132 - len * .55;
      s += '<path d="M100 132 Q' + f(cx) + ' ' + f(cy) + ' ' + f(ex) + ' ' + f(ey) + '" stroke="' + g.stem + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
      for (var k = 1; k <= 4; k++) {
        var t = k / 4.2, x = quad(t, 100, cx, ex), y = quad(t, 132, cy, ey);
        s += leaf(x - 6, y, 8, 3.6, -30 + a * 20, g.leaf) + leaf(x + 6, y - 2, 8, 3.6, 30 + a * 20, g.leaf2);
      }
      s += fc ? bloom(ex, ey, 3.8, fc) : '<circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="2.4" fill="#3B2A3A"/>';
    }
    return s;
  }

  function tree(p, R, g) {
    var fc = flowerCol(p), s = '';
    if (p.conifer) {
      s += '<rect x="97" y="116" width="6" height="16" fill="#6B5238"/>';
      for (var i = 0; i < 4; i++) {
        var base = 120 - i * 20, w = 38 - i * 8;
        s += '<polygon points="100,' + (base - 38) + ' ' + (100 - w) + ',' + base + ' ' + (100 + w) + ',' + base + '" fill="' + g.conifer[i % 2] + '"/>';
      }
      return s;
    }
    var big = p.features.indexOf('tall') > -1, spread = big ? 52 : 40;
    s += '<path d="M95 132 L97.500 84 L102.500 84 L105 132Z" fill="#6B5238"/><path d="M98 100 L84 84M102 96 L116 80" stroke="#6B5238" stroke-width="3" stroke-linecap="round"/>';
    for (var c = 0; c < 8; c++) {
      var x = 100 + (R() - .5) * spread, y = 56 + (R() - .5) * 28, r = 17 + R() * 13;
      s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + g.canopy[c % 3] + '"/>';
    }
    if (fc) for (var d = 0; d < 18; d++) s += '<circle cx="' + f(100 + (R() - .5) * (spread + 24)) + '" cy="' + f(56 + (R() - .5) * 40) + '" r="1.7" fill="' + fc[0] + '"/>';
    return s;
  }

  function vine(p, R, g) {
    var fc = flowerCol(p), s = '', pts = [], N = 36, i;
    for (i = 0; i <= N; i++) { var t = i / N; pts.push([100 + 34 * Math.sin(t * 9.5) * (1 - .2 * t), 132 - t * 112]); }
    s += '<path d="M' + pts.map(function (q) { return f(q[0]) + ' ' + f(q[1]); }).join(' L') + '" stroke="' + g.stem + '" stroke-width="2.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>';
    for (i = 2; i < N; i += 2) {
      var q = pts[i], side = (i / 2) % 2 ? 1 : -1;
      s += leaf(q[0] + side * 8, q[1], 10, 6.500, side * (30 + R() * 25), i % 4 ? g.leaf : g.leaf2);
      if (i % 6 === 4) s += '<path d="M' + f(q[0]) + ' ' + f(q[1]) + ' c' + (6 * -side) + ' -4 ' + (12 * -side) + ' 2 ' + (8 * -side) + ' 8 c' + (-2 * -side) + ' 3 ' + (-7 * -side) + ' 1 ' + (-5 * -side) + ' -2" stroke="' + g.stem + '" stroke-width="1" fill="none"/>';
      if (fc && i % 8 === 4) s += bloom(q[0] - side * 6, q[1] - 5, 3, fc);
      if (p.id === 'wild-cucumber' && i % 12 === 6) {
        s += '<circle cx="' + f(q[0] + side * 4) + '" cy="' + f(q[1] + 8) + '" r="4.500" fill="#8DB65A"/>';
        for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4; s += '<line x1="' + f(q[0] + side * 4 + Math.cos(a) * 4.500) + '" y1="' + f(q[1] + 8 + Math.sin(a) * 4.500) + '" x2="' + f(q[0] + side * 4 + Math.cos(a) * 7) + '" y2="' + f(q[1] + 8 + Math.sin(a) * 7) + '" stroke="#5E7F35" stroke-width=".8"/>'; }
      }
    }
    return s;
  }

  function plantInner(p) {
    var R = rng(hash(p.id)), g = palette(R, p.blue);
    return p.type === 'tree' ? tree(p, R, g) : p.type === 'shrub' ? shrub(p, R, g) : p.type === 'vine' ? vine(p, R, g) : herb(p, R, g);
  }
  function plantArt(p, fit) {
    return '<svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMax ' + (fit ? 'meet' : 'slice') + '" aria-hidden="true" focusable="false">' +
      '<rect x="0" y="128" width="200" height="22" fill="var(--art-ground)"/><ellipse cx="100" cy="133" rx="46" ry="5" fill="rgba(0,0,0,.09)"/>' + plantInner(p) + '</svg>';
  }
  function heroArt() {
    function at(id, x0, s) {
      var p = find(id); if (!p) return '';
      return '<g transform="translate(' + f(x0 - 100 * s) + ' ' + f(352 - 132 * s) + ') scale(' + s + ')">' + plantInner(p) + '</g>';
    }
    return '<svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<circle cx="400" cy="78" r="34" fill="var(--accent-soft)"/>' +
      '<path d="M0 320 Q120 270 240 312 T500 300 V400 H0Z" fill="var(--art-ground)" opacity=".55"/>' +
      '<rect x="0" y="350" width="500" height="50" fill="var(--art-ground)"/>' +
      at('sosnowskys-hogweed', 105, 2.2) + at('box-elder', 262, 2.1) + at('false-indigo', 392, 1.7) + '</svg>';
  }

  /* ---------- cards ---------- */
  function card(p, extra) {
    return '<a class="card" href="#/plant/' + esc(p.id) + '"><div class="card__art">' + plantArt(p) + '</div><div class="card__body">' +
      '<div class="card__top"><h3 class="card__name">' + esc(p.name) + '</h3>' + badge(p) + '</div>' +
      '<p class="latin">' + esc(p.latin) + '</p><p class="card__desc">' + esc(p.description) + '</p>' + (extra || '') +
      '<div class="meta"><span>' + icon(TYPE_ICON[p.type]) + esc(TYPE[p.type]) + '</span><span>' + icon('calendar') + esc(bloomText(p.bloom)) + '</span><span>' + icon('pin') + esc(HABITAT[p.habitat]) + '</span></div></div></a>';
  }

  /* ---------- home ---------- */
  function renderHome() {
    $('#heroArt').innerHTML = heroArt();
    var high = PLANTS.filter(function (p) { return p.danger === 'critical' || p.danger === 'dangerous'; }).length;
    var forms = {}; PLANTS.forEach(function (p) { forms[p.type] = 1; });
    $('#facts').innerHTML = [[PLANTS.length, 'species in the atlas'], [high, 'rated critical or dangerous'], [Object.keys(forms).length, 'plant forms: trees, shrubs, herbs and vines']]
      .map(function (r) { return '<div><dt>' + r[1] + '</dt><dd>' + r[0] + '</dd></div>'; }).join('');
    var list = PLANTS.slice().sort(byRisk), crit = list.filter(function (p) { return p.danger === 'critical'; }), rest = list.filter(function (p) { return p.danger !== 'critical'; });
    $('#homeCards').innerHTML = crit.concat(rest).slice(0, 3).map(function (p) { return card(p); }).join('');
  }

  /* ---------- catalog ---------- */
  var cat = { q: '', form: 'all', risk: 'all', sort: 'danger' };
  function renderCatalog() {
    var q = cat.q.trim().toLowerCase();
    var list = PLANTS.filter(function (p) {
      if (cat.form !== 'all' && p.type !== cat.form) return false;
      if (cat.risk !== 'all' && p.danger !== cat.risk) return false;
      return !q || (p.name + ' ' + p.latin + ' ' + p.description + ' ' + p.origin).toLowerCase().indexOf(q) > -1;
    });
    list.sort(cat.sort === 'name' ? function (a, b) { return a.name.localeCompare(b.name); } : byRisk);
    $('#catalogGrid').innerHTML = list.map(function (p) { return card(p); }).join('');
    $('#catalogGrid').hidden = !list.length;
    $('#empty').hidden = !!list.length;
    $('#count').textContent = 'Showing ' + list.length + ' of ' + PLANTS.length + ' species';
    $('#resetFilters').hidden = !(cat.q || cat.form !== 'all' || cat.risk !== 'all');
  }
  function syncCatalogControls() {
    $('#q').value = cat.q; $('#risk').value = cat.risk; $('#sort').value = cat.sort;
    $$('#formChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.form === cat.form)); });
  }
  function setupCatalog() {
    $('#q').addEventListener('input', function (e) { cat.q = e.target.value; renderCatalog(); });
    $('#risk').addEventListener('change', function (e) { cat.risk = e.target.value; renderCatalog(); });
    $('#sort').addEventListener('change', function (e) { cat.sort = e.target.value; renderCatalog(); });
    $('#formChips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      cat.form = b.dataset.form; syncCatalogControls(); renderCatalog();
    });
    function reset() { cat = { q: '', form: 'all', risk: 'all', sort: cat.sort }; syncCatalogControls(); renderCatalog(); }
    $('#clearFilters').addEventListener('click', reset);
    $('#resetFilters').addEventListener('click', reset);
  }

  /* ---------- identifier ---------- */
  var ID_STEPS = [
    { key: 'form', title: 'What kind of plant is it?', hint: 'Pick the closest match.', opts: [
      ['tree', 'tree', 'Tree', 'One trunk, usually taller than a person'], ['shrub', 'shrub', 'Shrub', 'Several stems from the base'],
      ['herb', 'leaf', 'Herb', 'Soft stem that dies back each year'], ['vine', 'vine', 'Vine', 'Climbs or trails over other plants'], ['any', 'search', 'Not sure', 'Skip this question']] },
    { key: 'season', title: 'When did you see it?', hint: 'We match the season against each plant\'s flowering time.', opts: [
      ['spring', 'sun', 'Spring', 'April to May'], ['summer', 'sun', 'Summer', 'June to August'], ['autumn', 'leaf', 'Autumn', 'September to October'], ['winter', 'water', 'Winter', 'November to March'], ['any', 'search', 'Not sure', 'Skip this question']] },
    { key: 'place', title: 'Where does it grow?', hint: 'Choose the nearest habitat.', opts: [
      ['wasteland', 'mountain', 'Wasteland', 'Vacant or neglected land'], ['forest', 'tree', 'Woodland or park', 'Woods, parks, forest edges'], ['water', 'water', 'Waterside', 'Rivers, lakes, ponds'], ['roadside', 'road', 'Roadside or lawn', 'Verges, lawns, hedges'], ['any', 'search', 'Not sure', 'Skip this question']] },
    { key: 'features', title: 'What stands out?', hint: 'Select everything you noticed, or none.', multi: true, opts: [
      ['white_flowers', 'swatch:#FFFDF5', 'White flowers'], ['yellow_flowers', 'swatch:#F0BE2E', 'Yellow flowers'], ['pink_flowers', 'swatch:#DA5C90', 'Pink or purple flowers'],
      ['large_leaves', 'leaf', 'Large leaves'], ['thorny', 'thorn', 'Thorns or spines'], ['tall', 'up', 'Tall']] }
  ];
  var id = { step: 1, form: null, season: null, place: null, features: [] };
  function idComplete(n) { var k = ID_STEPS[n - 1]; return !k || k.multi || id[k.key] !== null; }

  function renderIdentifier() {
    var last = ID_STEPS.length + 1;
    $$('#steps li').forEach(function (li) {
      var n = +li.dataset.s; li.classList.toggle('is-done', n < id.step); li.classList.toggle('is-current', n === id.step);
      if (n === id.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    var panel = $('#panel');
    if (id.step < last) {
      var s = ID_STEPS[id.step - 1];
      panel.innerHTML = '<h2 tabindex="-1">' + esc(s.title) + '</h2><p class="muted">' + esc(s.hint) + '</p><div class="options" role="group" aria-label="' + esc(s.title) + '">' +
        s.opts.map(function (o) {
          var pressed = s.multi ? id.features.indexOf(o[0]) > -1 : id[s.key] === o[0];
          var ic = o[1].indexOf('swatch:') === 0 ? '<span class="swatch" style="background:' + o[1].slice(7) + '"></span>' : icon(o[1]);
          return '<button type="button" class="option" data-v="' + o[0] + '" aria-pressed="' + pressed + '">' + ic + '<strong>' + esc(o[2]) + '</strong>' + (o[3] ? '<small>' + esc(o[3]) + '</small>' : '') + '</button>';
        }).join('') + '</div>';
    } else {
      panel.innerHTML = '<h2 tabindex="-1">Your shortlist</h2>' + renderResults();
    }
    $('#prev').disabled = id.step === 1;
    $('#next').hidden = id.step === last;
    $('#next').disabled = !idComplete(id.step);
    $('#next').firstChild.nodeValue = id.step === last - 1 ? 'Show results ' : 'Next ';
  }

  function renderResults() {
    var seasonOn = id.season && id.season !== 'any' && id.season !== 'winter';
    var formOn = id.form && id.form !== 'any', placeOn = id.place && id.place !== 'any';
    var max = (formOn ? 3 : 0) + (seasonOn ? 2 : 0) + (placeOn ? 2 : 0) + id.features.length;
    var note = id.season === 'winter' ? '<p class="note">Nothing in this atlas flowers in winter, so the season was left out. In winter, look at bark, buds and the overall shape instead.</p>' : '';
    if (!max) {
      return '<p class="muted">You did not narrow anything down, so these are the most dangerous species to check first.</p><div class="results">' +
        PLANTS.slice().sort(byRisk).slice(0, 6).map(function (p) { return card(p); }).join('') + '</div>' + note;
    }
    var scored = PLANTS.map(function (p) {
      var score = 0, why = [];
      if (formOn && p.type === id.form) { score += 3; why.push(TYPE[p.type]); }
      if (seasonOn) {
        var inSeason = false; for (var m = p.bloom[0]; m <= p.bloom[1]; m++) if (SEASON_MONTHS[id.season].indexOf(m) > -1) inSeason = true;
        if (inSeason) { score += 2; why.push('Flowers ' + bloomText(p.bloom)); }
      }
      if (placeOn && PLACE_OF[p.habitat] === id.place) { score += 2; why.push(HABITAT[p.habitat]); }
      id.features.forEach(function (ft) { if (p.features.indexOf(ft) > -1) { score++; why.push(FEATURE_LABEL[ft]); } });
      return { p: p, score: score, why: why };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score || byRisk(a.p, b.p); }).slice(0, 6);
    if (!scored.length) return '<div class="empty"><h3>No species match</h3><p>Try fewer details. The atlas covers 35 species, so yours may not be in it.</p></div>' + note;
    return '<p class="muted">Ranked by how many of your answers each species fits.</p><div class="results">' + scored.map(function (r) {
      var pct = Math.round(r.score / max * 100);
      return card(r.p, '<p class="match">' + pct + '% match</p><div class="why">' + r.why.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>');
    }).join('') + '</div>' + note;
  }

  function setupIdentifier() {
    $('#panel').addEventListener('click', function (e) {
      var b = e.target.closest('.option'); if (!b) return;
      var s = ID_STEPS[id.step - 1], v = b.dataset.v;
      if (s.multi) {
        var i = id.features.indexOf(v); if (i > -1) id.features.splice(i, 1); else id.features.push(v);
        b.setAttribute('aria-pressed', String(i === -1));
      } else {
        id[s.key] = v; $$('.option', $('#panel')).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      }
      $('#next').disabled = !idComplete(id.step);
    });
    function go(n) { id.step = n; renderIdentifier(); var h = $('#panel h2'); if (h) h.focus({ preventScroll: true }); $('#steps').scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); }
    $('#next').addEventListener('click', function () { if (idComplete(id.step) && id.step <= ID_STEPS.length) go(id.step + 1); });
    $('#prev').addEventListener('click', function () { if (id.step > 1) go(id.step - 1); });
    $('#reset').addEventListener('click', function () { id = { step: 1, form: null, season: null, place: null, features: [] }; go(1); });
  }

  /* ---------- what to do ---------- */
  function renderSwaps() {
    $('#swapGrid').innerHTML = SWAPS.map(function (s) {
      return '<article class="swap"><p class="swap__from">Instead of ' + esc(s[0]) + '</p><h3 class="swap__to">' + esc(s[1]) + '</h3><p class="muted">' + esc(s[2]) + '</p><div class="tags">' + s[3].map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div></article>';
    }).join('');
  }
  function setupTabs() {
    var tabs = $$('#tabs [role="tab"]');
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0]; else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  }

  /* ---------- plant dialog ---------- */
  var modal = $('#modal'), pushed = false;
  function openPlant(p) {
    var methods = p.methods.map(function (m) { var d = METHOD[m.type] || ['leaf', m.type]; return '<span class="method">' + icon(d[0]) + esc(m.name) + '</span>'; }).join('');
    $('#modalBody').innerHTML = '<div class="detail__art">' + plantArt(p, true) + '</div><div class="detail__body">' +
      '<div class="detail__head">' + badge(p, true) + '<h2 id="modalTitle">' + esc(p.name) + '</h2><p class="latin">' + esc(p.latin) + '</p></div>' +
      '<div class="detail__grid">' +
      '<section class="detail__section"><h3>Overview</h3><dl class="dl"><div><dt>Form</dt><dd>' + esc(TYPE[p.type]) + '</dd></div><div><dt>Origin</dt><dd>' + esc(p.origin) + '</dd></div><div><dt>Flowering</dt><dd>' + esc(bloomText(p.bloom)) + '</dd></div><div><dt>Habitat</dt><dd>' + esc(HABITAT[p.habitat]) + '</dd></div></dl></section>' +
      '<section class="detail__section"><h3>Why it matters</h3><dl class="dl"><div><dt>Effect on ecosystems</dt><dd>' + esc(p.impact) + '</dd></div><div><dt>Risk to people</dt><dd>' + esc(p.humanDanger) + '</dd></div><div><dt>How it spreads</dt><dd>' + esc(p.spread) + '</dd></div></dl></section>' +
      '<section class="detail__section"><h3>How to recognise it</h3><p>' + esc(p.tips) + '</p></section>' +
      '<section class="detail__section"><h3>Control</h3><div class="row">' + methods + '</div><p>' + esc(p.control) + '</p></section></div></div>';
    if (!modal.open) { modal.showModal(); document.documentElement.style.overflow = 'hidden'; }
    modal.scrollTop = 0;
  }
  function closeModalUi() { if (modal.open) modal.close(); }
  modal.addEventListener('close', function () {
    document.documentElement.style.overflow = '';
    if (location.hash.indexOf('#/plant/') === 0) { if (pushed) history.back(); else { history.replaceState(null, '', '#/catalog'); route(); } }
  });
  modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('#modalClose')) modal.close(); });

  /* ---------- router ---------- */
  var current = null;
  function reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function showPage(name, focus) {
    if (current !== name) {
      $$('.page').forEach(function (s) { s.hidden = s.dataset.page !== name; });
      $$('[data-nav]').forEach(function (a) { if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
      document.title = PAGES[name];
      window.scrollTo(0, 0);
      current = name;
    }
    if (focus) { var h = $('.page[data-page="' + name + '"] h1'); if (h) h.focus({ preventScroll: true }); }
  }
  function route() {
    var raw = location.hash.replace(/^#/, '') || '/', parts = raw.split('?'), segs = parts[0].split('/').filter(Boolean), name = segs[0] || 'home', first = current === null;
    closeMenu();
    if (name === 'plant') {
      var p = find(segs[1]);
      if (!p) { history.replaceState(null, '', '#/catalog'); return route(); }
      if (first) { showPage('catalog'); }
      openPlant(p); return;
    }
    if (modal.open) { modal.close(); }
    if (!PAGES[name]) { history.replaceState(null, '', '#/'); name = 'home'; }
    if (name === 'catalog') {
      var qs = {}; (parts[1] || '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) qs[a[0]] = decodeURIComponent(a[1] || ''); });
      if (qs.risk && RISK[qs.risk]) { cat = { q: '', form: 'all', risk: qs.risk, sort: cat.sort }; syncCatalogControls(); renderCatalog(); }
    }
    showPage(name, !first);
  }

  /* ---------- chrome: theme, menu, skip link ---------- */
  function setupChrome() {
    var root = document.documentElement, tb = $('#themeBtn');
    function label() { tb.setAttribute('aria-label', root.getAttribute('data-theme') === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
    label();
    tb.addEventListener('click', function () {
      var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', t); try { localStorage.setItem('af-theme', t); } catch (e) {} label();
      var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0D1411' : '#F5F5F0');
    });
    $('#burger').addEventListener('click', function () {
      var open = !$('#navLinks').classList.contains('is-open');
      $('#navLinks').classList.toggle('is-open', open); $('#burger').setAttribute('aria-expanded', String(open)); $('#burger').setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('#nav')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    $('.skip').addEventListener('click', function (e) { e.preventDefault(); var m = $('#main'); m.tabIndex = -1; m.focus(); });
  }
  function closeMenu() { var n = $('#navLinks'); if (n.classList.contains('is-open')) { n.classList.remove('is-open'); $('#burger').setAttribute('aria-expanded', 'false'); $('#burger').setAttribute('aria-label', 'Open menu'); } }

  /* ---------- start ---------- */
  function init() {
    setupChrome();
    if (!PLANTS.length) { $('#main').innerHTML = '<div class="wrap empty"><h1>Data failed to load</h1><p>Check that data.js sits next to index.html.</p></div>'; return; }
    renderHome(); renderCatalog(); renderIdentifier(); renderSwaps();
    setupCatalog(); setupIdentifier(); setupTabs();
    window.addEventListener('hashchange', function () { pushed = true; route(); });
    route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
