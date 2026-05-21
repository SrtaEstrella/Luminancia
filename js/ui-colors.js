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
  for (var i = ACTIVE_MIN; i <= ACTIVE_MAX; i++) {
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

  if (ACTIVE_N < ACTIVE_MAX) {
    var addBtn = document.createElement('span');
    addBtn.className = 'add-color-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Add color';
    addBtn.onclick = function (e) {
      e.stopPropagation();
      ACTIVE_COLORS.push(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      ACTIVE_N = ACTIVE_COLORS.length;
      updateColorMeta();
      buildActiveColors();
      buildColorUI();
      buildSeqSlots();
      updateSegmentDots();
      deriveAll();
      scheduleRender();
    };
    g.appendChild(addBtn);
  }
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
    '<button class="eyedropper-btn">' + T.eyedropper + '</button>' +
    '<button class="delete-btn" ' + (ACTIVE_N <= ACTIVE_MIN ? 'disabled' : '') + '>' + T.deleteColor + '</button></div></div>';

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

  var delBtn = pop.querySelector('.delete-btn');
  delBtn.onclick = function (e) {
    e.stopPropagation();
    if (ACTIVE_N <= ACTIVE_MIN) return;
    ACTIVE_COLORS.splice(slotIdx, 1);
    ACTIVE_N = ACTIVE_COLORS.length;
    [LSEQ, RSEQ].forEach(function (seq) {
      for (var i = 0; i < seq.length; i++) {
        if (seq[i] === slotIdx) {
          seq[i] = Math.floor(Math.random() * ACTIVE_N);
        } else if (seq[i] > slotIdx) {
          seq[i]--;
        }
      }
    });
    updateColorMeta();
    buildActiveColors();
    buildColorUI();
    buildSeqSlots();
    updateSegmentDots();
    deriveAll();
    scheduleRender();
    pop.style.display = 'none';
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
  } else if (n < ACTIVE_N) {
    ACTIVE_COLORS.length = n;
    [LSEQ, RSEQ].forEach(function (seq) {
      for (var i = 0; i < seq.length; i++) {
        if (seq[i] >= n) {
          seq[i] = Math.floor(Math.random() * n);
        }
      }
    });
  }

  ACTIVE_N = n;

  updateColorMeta();
  buildActiveColors();
  buildSeqSlots();
  updateSegmentDots();
  deriveAll();
  scheduleRender();
}

function randomizeSeq() {
  [LSEQ, RSEQ].forEach(function (seq) {
    // Ensure each color appears at least once, no 3 consecutive same
    for (var attempt = 0; attempt < 100; attempt++) {
      // Shuffle base pool: 0..ACTIVE_N-1 each at least once, then fill rest randomly
      var pool = [];
      for (var c = 0; c < ACTIVE_N; c++) { pool.push(c); }
      while (pool.length < seq.length) {
        pool.push(Math.floor(Math.random() * ACTIVE_N));
      }
      // Fisher-Yates shuffle
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      // Check no 3 consecutive same
      var ok = true;
      for (var i = 2; i < pool.length; i++) {
        if (pool[i] === pool[i - 1] && pool[i] === pool[i - 2]) {
          ok = false; break;
        }
      }
      if (ok) {
        for (var i = 0; i < seq.length; i++) { seq[i] = pool[i]; }
        break;
      }
    }
  });
  buildSeqSlots();
  updateSegmentDots();
  deriveAll();
  scheduleRender();
}

var _origBuildTabs = buildStripTabs;
buildStripTabs = function () {
  _origBuildTabs();
  buildColorUI();
};