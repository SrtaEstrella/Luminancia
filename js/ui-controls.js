function buildStripTabs() {
  document.getElementById('tabs').innerHTML = '';
}

function updateSegmentDots() {
  var dots = document.querySelectorAll('.segpanel .dot');
  for (var i = 0; i < dots.length; i++) {
    var g = Math.floor(i / 2);
    var isRight = i % 2 === 1;
    var ci = isRight ? CONFIG.RSEQ[g] : CONFIG.LSEQ[g];
    dots[i].style.background = hx(ACTIVE_COLORS[ci]);
  }
}

function buildSegmentUI() {
  var container = document.getElementById('params');
  container.innerHTML = '';

  /* ---- Global Controls Card ---- */
  var gc = document.createElement('div');
  gc.className = 'card';

  var gcHead = document.createElement('div');
  gcHead.className = 'card-header clk';
  gcHead.textContent = '▾ ' + T.globalCtl;

  var gcBody = document.createElement('div');

  gcHead.onclick = function () {
    var s = gcBody.style.display === 'none';
    gcBody.style.display = s ? '' : 'none';
    gcHead.textContent = (s ? '▾' : '▸') + ' ' + T.globalCtl;
    gc.classList.toggle('collapsed');
  };

  gc.appendChild(gcHead);
  gc.appendChild(gcBody);

  var globalConfigs = [
    {
      k: 'p',
      lbl: T.fullness,
      min: 0.6,
      max: 4,
      step: 0.02,
      val: P[0][0].p,
      fmt: function (v) { return v.toFixed(2); },
      on: function (v) {
        for (var s = 0; s < CONFIG.NS; s++) {
          for (var g = 0; g < CONFIG.NG; g++) {
            P[s][g].p = v;
          }
        }
      }
    },
    {
      k: 'grn',
      lbl: T.grain,
      min: 0,
      max: 12,
      step: 0.5,
      val: window._grainAmount,
      fmt: function (v) { return v < 1 ? 'Off' : v.toFixed(1); },
      on: function (v) { window._grainAmount = v; }
    },
    {
      k: 'vsc',
      lbl: T.vScale,
      min: 0.75,
      max: 2,
      step: 0.01,
      val: window._vScale,
      fmt: function (v) { return v.toFixed(2); },
      on: function (v) { window._vScale = v; deriveAll(); }
    },
    {
      k: 'offs',
      lbl: T.globalOffs,
      min: -20,
      max: 20,
      step: 0.5,
      val: window._globalOffset,
      fmt: function (v) { return v.toFixed(1) + '%'; },
      on: function (v) { window._globalOffset = v; deriveAll(); }
    },
    {
      k: 'stag',
      lbl: T.stagger,
      min: -20,
      max: 20,
      step: 0.5,
      val: window._stagger,
      fmt: function (v) { return v.toFixed(1) + '%'; },
      on: function (v) { window._stagger = v; deriveAll(); }
    }
  ];

  globalConfigs.forEach(function (cfg) {
    var pg = document.createElement('div');
    pg.className = 'param';

    var lb = document.createElement('label');
    var ve = document.createElement('em');
    ve.textContent = cfg.fmt(cfg.val);
    lb.appendChild(document.createTextNode(cfg.lbl + ' '));
    lb.appendChild(ve);

    var sl = document.createElement('input');
    sl.type = 'range';
    sl.min = cfg.min;
    sl.max = cfg.max;
    sl.step = cfg.step;
    sl.value = cfg.val;
    sl.setAttribute('data-key', cfg.k);
    sl.setAttribute('data-seg', 0);

    sl.addEventListener('input', function () {
      var v = parseFloat(sl.value);
      ve.textContent = cfg.fmt(v);
      cfg.on(v);
      scheduleRender();
    });

    pg.appendChild(lb);
    pg.appendChild(sl);
    gcBody.appendChild(pg);
  });

  // Symmetry mode segmented control
  var symRow = document.createElement('div');
  symRow.className = 'control-row';

  var symLb = document.createElement('label');
  symLb.className = 'control-label';
  symLb.textContent = T.symMode;

  var segDiv = document.createElement('div');
  segDiv.className = 'seg-control';

  T.symOpt.forEach(function (l, i) {
    var btn = document.createElement('button');
    btn.textContent = l;
    if (i === window._symMode) {
      btn.className = 'on';
    }
    btn.onclick = function () {
      segDiv.querySelectorAll('button').forEach(function (b) { b.className = ''; });
      btn.className = 'on';
      window._symMode = i;
      deriveAll();
      scheduleRender();
    };
    segDiv.appendChild(btn);
  });

  symRow.appendChild(symLb);
  symRow.appendChild(segDiv);
  gcBody.appendChild(symRow);

  // Aspect ratio selector
  var arRow = document.createElement('div');
  arRow.className = 'control-row';

  var arLb = document.createElement('label');
  arLb.className = 'control-label';
  arLb.textContent = T.aspectRatio + ' ';
  var arEm = document.createElement('em');
  arLb.appendChild(arEm);

  var arSel = document.createElement('select');
  arSel.id = 'arSelect';

  function buildArOptions() {
    arSel.innerHTML = '';

    var presets = [
      { l: T.arPresets[0], v: 19.5 / 9 },
      { l: T.arPresets[1], v: 20 / 9 },
      { l: T.arPresets[2], v: 20.5 / 9 },
      { l: T.arPresets[3], v: 19.8 / 9 },
      { l: T.arPresets[4], v: 18 / 9 },
      { l: T.arPresets[5], v: 16 / 9 },
      { l: T.arPresets[6], v: 4 / 3 }
    ];

    var matched = false;
    presets.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.l;
      if (Math.abs(o.v - window._aspectRatio) < 0.001) {
        opt.selected = true;
        matched = true;
      }
      arSel.appendChild(opt);
    });

    if (!matched) {
      var opt = document.createElement('option');
      opt.value = window._aspectRatio;
      opt.textContent = window._aspectRatio.toFixed(2);
      opt.selected = true;
      arSel.appendChild(opt);
    }

    var cOpt = document.createElement('option');
    cOpt.value = -1;
    cOpt.textContent = T.custom;
    arSel.appendChild(cOpt);
  }

  buildArOptions();

  arSel.onchange = function () {
    var v = parseFloat(arSel.value);
    if (v < 0) {
      var pv = parseFloat(prompt(T.customARPrompt, window._aspectRatio));
      if (pv && pv > 0) {
        window._aspectRatio = pv;
      } else {
        buildArOptions();
        return;
      }
    } else {
      window._aspectRatio = v;
    }
    updateExportBtnText();
    buildSegmentUI();
    scheduleRender();
  };

  arRow.appendChild(arLb);
  arRow.appendChild(arSel);

  // Resolution selector
  var wLb = document.createElement('label');
  wLb.className = 'control-label';
  wLb.textContent = T.resolution + ' ';
  var wEm = document.createElement('em');
  wLb.appendChild(wEm);

  var wSel = document.createElement('select');
  wSel.id = 'resSelect';
  wSel.style.width = '70px';
  wSel.style.flex = 'none';

  function buildResOptions() {
    wSel.innerHTML = '';
    var presets = [
      { l: '1080', v: 1080 },
      { l: '1170', v: 1170 },
      { l: '1206', v: 1206 },
      { l: '1290', v: 1290 },
      { l: '1320', v: 1320 },
      { l: '1440', v: 1440 }
    ];

    var matched = false;
    presets.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.l;
      if (o.v === window._exportWidth) {
        opt.selected = true;
        matched = true;
      }
      wSel.appendChild(opt);
    });

    if (!matched) {
      var opt = document.createElement('option');
      opt.value = window._exportWidth;
      opt.textContent = String(window._exportWidth);
      opt.selected = true;
      wSel.appendChild(opt);
    }

    var cOpt = document.createElement('option');
    cOpt.value = -1;
    cOpt.textContent = T.custom;
    wSel.appendChild(cOpt);
  }

  buildResOptions();

  wSel.onchange = function () {
    var v = parseInt(wSel.value);
    if (v < 0) {
      var pv = parseInt(prompt(T.customResPrompt, window._exportWidth));
      if (pv && pv > 0) {
        window._exportWidth = pv;
      } else {
        buildResOptions();
        return;
      }
    } else {
      window._exportWidth = v;
    }
    updateExportBtnText();
    buildSegmentUI();
    scheduleRender();
  };

  arRow.appendChild(wLb);
  arRow.appendChild(wSel);
  gcBody.appendChild(arRow);


  container.appendChild(gc);

  /* ---- Fine Tuning Card (collapsed by default) ---- */
  var segSection = document.createElement('div');
  segSection.className = 'card';

  var segHeader = document.createElement('div');
  segHeader.className = 'card-header clk';
  segHeader.textContent = '▸ ' + T.advanced;

  segHeader.onclick = function () {
    var body = segHeader.nextElementSibling;
    var show = body.style.display === 'none';
    body.style.display = show ? '' : 'none';
    segHeader.textContent = (show ? '▾' : '▸') + ' ' + T.advanced;
    segHeader.closest('.card').classList.toggle('collapsed');
  };

  segSection.appendChild(segHeader);

  var segBody = document.createElement('div');
  segBody.style.display = 'none';
  segSection.appendChild(segBody);
  segSection.classList.add('collapsed');
  container.appendChild(segSection);

  // Per-segment parameter panels
  for (var g = 0; g < CONFIG.NG; g++) {
    var ciL = CONFIG.LSEQ[g];
    var ciR = CONFIG.RSEQ[g];
    var seg = _baseP0[g];
    var st = step[g];

    var div = document.createElement('div');
    div.className = 'segpanel s' + (g % 6);

    var hd = document.createElement('div');
    hd.className = 'seghead';

    var dotL = document.createElement('span');
    dotL.className = 'dot';
    dotL.style.background = hx(ACTIVE_COLORS[ciL]);
    hd.appendChild(dotL);

    var dotR = document.createElement('span');
    dotR.className = 'dot';
    dotR.style.background = hx(ACTIVE_COLORS[ciR]);
    hd.appendChild(dotR);

    hd.appendChild(document.createTextNode(T.segment + (g + 1)));

    var isoBtn = document.createElement('button');
    isoBtn.className = 'btn-tiny';
    isoBtn.textContent = T.isolate;
    isoBtn.title = T.isolate;
    isoBtn.onclick = function (idx) {
      return function (e) {
        e.stopPropagation();
        isolateSegment(idx);
      };
    }(g);
    hd.appendChild(isoBtn);

    div.appendChild(hd);

    PARAM_DEFS.forEach(function (pd) {
      var isStep = (pd.k === 'dcy' || pd.k === 'dsy');
      var src = isStep ? st : seg;

      var pg = document.createElement('div');
      pg.className = 'param';

      var lb = document.createElement('label');
      var ve = document.createElement('em');
      ve.textContent = pd.fmt(src[pd.k]);
      lb.appendChild(document.createTextNode(pd.lbl + ' '));
      lb.appendChild(ve);

      var sl = document.createElement('input');
      sl.type = 'range';
      sl.min = pd.min;
      sl.max = pd.max;
      sl.step = pd.step;
      sl.value = src[pd.k];
      sl.setAttribute('data-key', pd.k);
      sl.setAttribute('data-seg', g);

      sl.addEventListener('input', function (isStep, src, pd, seg, g) {
        return function () {
          var newVal = parseFloat(sl.value);
          src[pd.k] = newVal;
          ve.textContent = pd.fmt(newVal);
          if (!isStep) {
            _baseP0[g][pd.k] = newVal;
          }
          deriveAll();
          scheduleRender();
        };
      }(isStep, src, pd, seg, g));

      pg.appendChild(lb);
      pg.appendChild(sl);
      div.appendChild(pg);
    });

    segBody.appendChild(div);
  }
}

function resetAll() {
  genDefaults();
  syncSlidersFromState();
  syncDropdownsFromState();
  buildColorUI();
  scheduleRender();
}

function syncDropdownsFromState() {
  var arSel = document.getElementById('arSelect');
  if (arSel) {
    var ar = window._aspectRatio;
    for (var i = 0; i < arSel.options.length; i++) {
      if (Math.abs(parseFloat(arSel.options[i].value) - ar) < 0.001) {
        arSel.selectedIndex = i;
        break;
      }
    }
  }
  var resSel = document.getElementById('resSelect');
  if (resSel) {
    var ew = window._exportWidth;
    for (var i = 0; i < resSel.options.length; i++) {
      if (parseInt(resSel.options[i].value) === ew) {
        resSel.selectedIndex = i;
        break;
      }
    }
  }
  updateExportBtnText();
}

function updateExportBtnText() {
  var btn = document.getElementById('exportImgBtn');
  if (btn) {
    var h = Math.round(window._exportWidth * window._aspectRatio);
    btn.textContent = T.exportImg + ' (' + window._exportWidth + '×' + h + ')';
  }
}

function syncSlidersFromState() {
  var sliders = document.querySelectorAll('#params input[type=range]');
  for (var i = 0; i < sliders.length; i++) {
    var sl = sliders[i];
    var k = sl.getAttribute('data-key');
    var s = parseInt(sl.getAttribute('data-seg'));
    var v;
    if (k === 'grn') { v = window._grainAmount; }
    else if (k === 'vsc') { v = window._vScale; }
    else if (k === 'offs') { v = window._globalOffset; }
    else if (k === 'p') { v = _baseP0[0].p; }
    else {
      var src = (k === 'dcy' || k === 'dsy') ? step[s] : _baseP0[s];
      v = src && src[k] != null ? src[k] : 0;
    }
    if (v != null && !isNaN(v)) {
      sl.value = v;
      var em = sl.parentNode.querySelector('em');
      if (em) {
        if (k === 'grn') { em.textContent = v < 1 ? 'Off' : v.toFixed(1); }
        else if (k === 'p' || k === 'vsc') { em.textContent = v.toFixed(2); }
        else if (k === 'sxr' || k === 'cx') { em.textContent = v.toFixed(2); }
        else if (k === 'ang') { em.textContent = v.toFixed(1) + '°'; }
        else { em.textContent = v.toFixed(1) + '%'; }
      }
    }
  }
}

