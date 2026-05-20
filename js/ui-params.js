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

  function buildArOptions() {
    arSel.innerHTML = '';

    var presets = [
      { l: T.arPresets[0], v: 19.5 / 9 },
      { l: T.arPresets[1], v: 20 / 9 },
      { l: T.arPresets[2], v: 20.5 / 9 },
      { l: T.arPresets[3], v: 19.8 / 9 }
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
        return;
      }
    } else {
      window._aspectRatio = v;
    }
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
  wSel.style.width = '70px';
  wSel.style.flex = 'none';

  (function () {
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
  })();

  wSel.onchange = function () {
    var v = parseInt(wSel.value);
    if (v < 0) {
      var pv = parseInt(prompt(T.customResPrompt, window._exportWidth));
      if (pv && pv > 0) {
        window._exportWidth = pv;
      } else {
        return;
      }
    } else {
      window._exportWidth = v;
    }
    buildSegmentUI();
    scheduleRender();
  };

  arRow.appendChild(wLb);
  arRow.appendChild(wSel);
  gcBody.appendChild(arRow);

  // Export size display
  var szRow = document.createElement('div');
  szRow.className = 'export-size';
  szRow.textContent =
    T.exportSize + window._exportWidth + '×' +
    Math.round(window._exportWidth * window._aspectRatio);
  gcBody.appendChild(szRow);

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
  buildSegmentUI();
  renderPreview(window._viewStrip);
  applyZoom();
}

function randomizeAll() {
  genRandom();
  buildSegmentUI();
  renderPreview(window._viewStrip);
  applyZoom();
}

function importJSON() {
  document.getElementById('importFile').click();
}

function doImport(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var data = JSON.parse(ev.target.result);

      if (data.colors) {
        ACTIVE_COLORS = data.colors.map(function (c) {
          return Array.isArray(c) ? c : c.match(/\d+/g).map(Number);
        });
        ACTIVE_N = ACTIVE_COLORS.length;
        updateColorMeta();
      }

      if (data.strips && data.strips[0]) {
        var s0 = data.strips[0].segments;
        if (s0) {
          for (var g = 0; g < Math.min(CONFIG.NG, s0.length); g++) {
            var sg = s0[g];
            if (sg.centerY != null) _baseP0[g].cy = sg.centerY;
            if (sg.centerX != null) _baseP0[g].cx = sg.centerX;
            if (sg.sigmaY != null) _baseP0[g].sy = sg.sigmaY;
            if (sg.sigmaX_ratio != null) _baseP0[g].sxr = sg.sigmaX_ratio;
            if (sg.angle != null) _baseP0[g].ang = sg.angle;
            if (sg.sharpness != null) _baseP0[g].p = sg.sharpness;
          }
        }
      }

      if (data.leftSeq) {
        LSEQ.splice(0, LSEQ.length, ...data.leftSeq.slice(0, CONFIG.NG));
      }
      if (data.rightSeq) {
        RSEQ.splice(0, RSEQ.length, ...data.rightSeq.slice(0, CONFIG.NG));
      }

      if (data.steps) {
        for (var g = 0; g < Math.min(CONFIG.NG, data.steps.length); g++) {
          if (data.steps[g].dcy != null) step[g].dcy = data.steps[g].dcy;
          if (data.steps[g].dsy != null) step[g].dsy = data.steps[g].dsy;
        }
      }

      updateColorMeta();
      deriveAll();
      buildSegmentUI();
      buildColorUI();
      scheduleRender();
    } catch (ex) {
      alert('JSON error: ' + ex.message);
    }
  };

  reader.readAsText(file);
  e.target.value = '';
}

function doExport() {
  var out = {
    model: 'anisotropic_gaussian_mixture',
    colors: ACTIVE_COLORS,
    leftSeq: LSEQ.slice(),
    rightSeq: RSEQ.slice(),
    steps: step.map(function (s) { return { dcy: s.dcy, dsy: s.dsy }; }),
    strips: exportParamsJSON()
  };

  var json = JSON.stringify(out, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var u = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = u;
  a.download = 'luminance-scheme.json';
  a.click();
  URL.revokeObjectURL(u);
}

function hx(c) {
  return '#' + c.map(function (v) {
    return v.toString(16).padStart(2, '0');
  }).join('');
}

function buildColorUI() {
  var ch = document.getElementById('colorHeader');
  var collapsed = ch.closest('.card').classList.contains('collapsed');
  ch.textContent = (collapsed ? '▸' : '▾') + ' ' + T.colorCustom;

  document.getElementById('colorCountLabel').textContent = T.colorCount;
  document.getElementById('randColorBtn').textContent = T.randColor;
  document.getElementById('randSeqBtn').textContent = T.randSeq;
  document.getElementById('paletteHint').textContent = T.paletteHint;
  document.getElementById('leftSeqLabel').textContent = T.leftSeq;
  document.getElementById('rightSeqLabel').textContent = T.rightSeq;

  var nc = document.getElementById('nColors');
  nc.innerHTML = '';
  for (var i = 2; i <= 12; i++) {
    var o = document.createElement('option');
    o.value = i;
    o.textContent = i;
    if (i === ACTIVE_N) {
      o.selected = true;
    }
    nc.appendChild(o);
  }

  buildActiveColors();
  buildSeqSlots();
}

function buildActiveColors() {
  var g = document.getElementById('activeColors');
  g.innerHTML = '';

  ACTIVE_COLORS.forEach(function (c, i) {
    var s = document.createElement('span');
    s.className = 'active-color-tag';
    s.innerHTML = '<span style="background:' + hx(c) + '"></span>#' + (i + 1);
    s.onclick = function (e) {
      e.stopPropagation();
      showPalettePopup(s, i);
    };
    s.oncontextmenu = function (e) {
      e.preventDefault();
      e.stopPropagation();
      showPalettePopup(s, i);
    };
    g.appendChild(s);
  });
}

function showPalettePopup(anchor, slotIdx) {
  var pop = document.getElementById('palettePopup');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'palettePopup';
    pop.className = 'popup';
    pop.style.position = 'fixed';
    pop.style.zIndex = '100';
    pop.style.maxWidth = '264px';
    document.body.appendChild(pop);

    document.addEventListener('click', function () {
      pop.style.display = 'none';
    }, { once: false });
  }

  pop.innerHTML = '<div class="popup-title">' + T.replaceColor + (slotIdx + 1) +
    '<div class="popup-title-right">' +
    '<span class="hex-hash">#</span>' +
    '<input class="hex-input" maxlength="6" value="' + hx(ACTIVE_COLORS[slotIdx]).replace('#', '') + '">' +
    '<button class="eyedropper-btn">' + T.eyedropper + '</button></div></div>';

  var hexInput = pop.querySelector('.hex-input');
  hexInput.oninput = function () {
    var v = hexInput.value.replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(v)) {
      var r = parseInt(v.slice(0, 2), 16);
      var g = parseInt(v.slice(2, 4), 16);
      var b = parseInt(v.slice(4, 6), 16);
      ACTIVE_COLORS[slotIdx] = [r, g, b];
      updateColorMeta();
      buildActiveColors();
      buildSeqSlots();
      updateSegmentDots();
      deriveAll();
      scheduleRender();
    }
  };
  hexInput.onkeydown = function (e) {
    if (e.key === 'Enter') {
      pop.style.display = 'none';
    }
  };
  hexInput.onclick = function (e) {
    e.stopPropagation();
  };

  var eyedropBtn = pop.querySelector('.eyedropper-btn');
  eyedropBtn.onclick = function (e) {
    e.stopPropagation();
    pop.style.display = 'none';
    window._pickingSlot = slotIdx;
    document.body.style.cursor = 'crosshair';
  };

  PALETTE.forEach(function (c, i) {
    var isSel = ACTIVE_COLORS[slotIdx] &&
      c[0] === ACTIVE_COLORS[slotIdx][0] &&
      c[1] === ACTIVE_COLORS[slotIdx][1] &&
      c[2] === ACTIVE_COLORS[slotIdx][2];

    var s = document.createElement('span');
    s.className = 'popup-swatch' + (isSel ? ' on' : '');
    s.style.background = hx(c);
    s.title = hx(c);

    s.onclick = function (e) {
      e.stopPropagation();
      ACTIVE_COLORS[slotIdx] = c;
      updateColorMeta();
      buildActiveColors();
      buildSeqSlots();
      updateSegmentDots();
      deriveAll();
      scheduleRender();
      pop.style.display = 'none';
    };

    pop.appendChild(s);
  });

  var r = anchor.getBoundingClientRect();
  pop.style.left = Math.min(r.left, window.innerWidth - 250) + 'px';
  pop.style.top = (r.bottom + 4) + 'px';
  pop.style.display = '';
}

function buildSeqSlots() {
  var pairs = [['lseqSlots', LSEQ], ['rseqSlots', RSEQ]];
  pairs.forEach(function (pair) {
    var id = pair[0];
    var seq = pair[1];
    var g = document.getElementById(id);
    g.innerHTML = '';

    seq.forEach(function (v, i) {
      var w = document.createElement('span');
      w.className = 'seq-slot';
      w.style.background = hx(ACTIVE_COLORS[v]);
      w.title = T.segTooltip + (i + 1) + ': #' + (v + 1);

      w.onclick = function (e) {
        e.stopPropagation();
        var cur = seq[i];
        var next = (cur + 1) % ACTIVE_N;
        seq[i] = next;
        updateColorMeta();
        w.style.background = hx(ACTIVE_COLORS[next]);
        w.title = T.segTooltip + (i + 1) + ': #' + (next + 1);
        updateSegmentDots();
        deriveAll();
        scheduleRender();
      };

      w.oncontextmenu = function (e) {
        e.preventDefault();
        e.stopPropagation();
        showSeqPopup(w, i, seq);
      };

      g.appendChild(w);
    });
  });
}

function showSeqPopup(anchor, slotIdx, seq) {
  var pop = document.getElementById('seqPopup');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'seqPopup';
    pop.className = 'popup';
    pop.style.position = 'fixed';
    pop.style.zIndex = '100';
    document.body.appendChild(pop);

    document.addEventListener('click', function () {
      pop.style.display = 'none';
    }, { once: false });
  }

  pop.innerHTML = '';

  ACTIVE_COLORS.forEach(function (_, j) {
    var s = document.createElement('span');
    s.className = 'popup-swatch' + (seq[slotIdx] === j ? ' on' : '');
    s.style.background = hx(ACTIVE_COLORS[j]);

    s.onclick = function (e) {
      e.stopPropagation();
      seq[slotIdx] = j;
      updateColorMeta();
      buildSeqSlots();
      updateSegmentDots();
      deriveAll();
      scheduleRender();
      pop.style.display = 'none';
    };

    pop.appendChild(s);
  });

  var r = anchor.getBoundingClientRect();
  pop.style.left = Math.min(r.left, window.innerWidth - 200) + 'px';
  pop.style.top = (r.bottom + 4) + 'px';
  pop.style.display = '';
}

function randomizeColors() {
  for (var i = 0; i < ACTIVE_N; i++) {
    ACTIVE_COLORS[i] = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }
  updateColorMeta();
  buildActiveColors();
  buildSeqSlots();
  updateSegmentDots();
  deriveAll();
  scheduleRender();
}

function onNColorsChange() {
  var n = parseInt(document.getElementById('nColors').value);

  if (n > ACTIVE_N) {
    while (ACTIVE_COLORS.length < n) {
      ACTIVE_COLORS.push(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    }
  } else {
    ACTIVE_COLORS.length = n;
  }

  ACTIVE_N = n;

  [LSEQ, RSEQ].forEach(function (seq) {
    seq.forEach(function (v, i) {
      if (v >= n) {
        seq[i] = Math.floor(Math.random() * n);
      }
    });
  });

  updateColorMeta();
  buildActiveColors();
  buildSeqSlots();
  updateSegmentDots();
  deriveAll();
  scheduleRender();
  randomizeSeq();
}

function randomizeSeq() {
  [LSEQ, RSEQ].forEach(function (seq) {
    var n = ACTIVE_N;
    var len = CONFIG.NG;
    var arr = [];

    for (var i = 0; i < n; i++) {
      arr.push(i);
    }

    while (arr.length < len) {
      arr.push(Math.floor(Math.random() * n));
    }

    // Fisher-Yates shuffle
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }

    // Break runs of 3 identical adjacent values
    for (var pass = 0; pass < 5; pass++) {
      for (var i = 2; i < len; i++) {
        if (arr[i] === arr[i - 1] && arr[i] === arr[i - 2]) {
          var candidates = [];
          for (var j = 0; j < len; j++) {
            if (arr[j] !== arr[i]) {
              candidates.push(j);
            }
          }
          if (candidates.length) {
            var j = candidates[Math.floor(Math.random() * candidates.length)];
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
          }
        }
      }
    }

    for (var i = 0; i < len; i++) {
      seq[i] = arr[i];
    }
  });

  updateColorMeta();
  buildSeqSlots();
  deriveAll();
  scheduleRender();
}

// Wrapper to ensure buildColorUI runs after strip tabs are built
var _origBuildTabs = buildStripTabs;
buildStripTabs = function () {
  _origBuildTabs();
  buildColorUI();
};
