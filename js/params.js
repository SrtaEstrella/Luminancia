let P = [];
let step = [];
let _baseP0 = [];

function presetAsDefault() {
  P = [];
  for (let s = 0; s < CONFIG.NS; s++) {
    P[s] = [];
  }

  const spec = [
    { cy: -50, L: 20 },
    { cy: -10, L: 34 },
    { cy: 15, L: 56 },
    { cy: 45, L: 44 },
    { cy: 75, L: 52 },
    { cy: 100, L: 36 },
    { cy: 150, L: 28 }
  ];

  const p = 2.0;

  const segCx = spec.map(function () {
    return (Math.random() - 0.5) * 1.0;
  });

  const segSxr = spec.map(function () {
    return 2.5 + Math.random() * 2.5;
  });

  const segAng = spec.map(function (_, g) {
    const m = 20 + Math.random() * 40;
    if (g <= 2) return -m;
    if (g >= 4) return m;
    return Math.random() < 0.5 ? -m : m;
  });

  step = [
    { dcy: 15, dsy: 2 },
    { dcy: 14, dsy: 6 },
    { dcy: 12, dsy: -4 },
    { dcy: 5,  dsy: -3 },
    { dcy: -5, dsy: -4 },
    { dcy: -6, dsy: 4 },
    { dcy: -15, dsy: 2 }
  ];

  _baseP0 = [];
  for (let g = 0; g < CONFIG.NG; g++) {
    _baseP0[g] = {
      cy: spec[g].cy,
      cx: segCx[g],
      sy: spec[g].L / 2,
      sxr: segSxr[g],
      ang: segAng[g],
      p: p
    };
  }

  // End segments: stronger side bias and horizontal stretch
  _baseP0[0].cx = -(0.5 + Math.random() * 0.5);
  _baseP0[0].ang = -(60 + Math.random() * 20);
  _baseP0[0].sxr = 4.0 + Math.random() * 1.0;

  _baseP0[6].cx = -(0.5 + Math.random() * 0.5);
  _baseP0[6].ang = 60 + Math.random() * 20;
  _baseP0[6].sxr = 4.0 + Math.random() * 1.0;

  window._globalOffset = 0;
  window._stagger = 0;
  window._grainAmount = 6;
  window._aspectRatio = 19.5 / 9;
  window._vScale = 1;
  window._exportWidth = 1290;
  window._symMode = 0;

  deriveAll();
}

function deriveAll() {
  const offs = window._globalOffset || 0;
  const stag = window._stagger || 0;
  const vs = window._vScale || 1;

  const scy = function (v) {
    return clamp(50 + (v - 50) * vs, -50, 150);
  };

  const ssy = function (v) {
    return clamp(v * vs, 3, 60);
  };

  const N = CONFIG.NG;
  const mode = window._symMode || 0;

  // Left group: strips 0-2
  for (let g = 0; g < N; g++) {
    P[0][g] = {
      ..._baseP0[g],
      cy: clamp(scy(_baseP0[g].cy) + offs, -50, 150),
      sy: ssy(_baseP0[g].sy)
    };
  }

  for (let off = 1; off <= 2; off++) {
    for (let g = 0; g < N; g++) {
      const b = _baseP0[g];
      P[off][g] = {
        cy: clamp(scy(b.cy) + step[g].dcy * off + offs, -50, 150),
        cx: b.cx,
        sy: clamp(ssy(b.sy) + step[g].dsy * off, 3, 60),
        sxr: b.sxr,
        ang: b.ang,
        p: b.p
      };
    }
  }

  // Right group: derived from left group via symmetry mode
  // Color sequence is always determined by RSEQ; deriveAll handles shape only

  if (mode === 0) {
    // X-Symmetry: 0->5, 1->4, 2->3, cx negated, angle negated
    for (let g = 0; g < N; g++) {
      P[5][g] = {
        ..._baseP0[g],
        cx: -_baseP0[g].cx,
        ang: -_baseP0[g].ang,
        cy: clamp(scy(_baseP0[g].cy) + offs + stag, -50, 150),
        sy: ssy(_baseP0[g].sy)
      };
      P[4][g] = {
        ...P[1][g],
        cx: -P[1][g].cx,
        ang: -P[1][g].ang,
        cy: clamp(P[1][g].cy + stag, -50, 150)
      };
      P[3][g] = {
        ...P[2][g],
        cx: -P[2][g].cx,
        ang: -P[2][g].ang,
        cy: clamp(P[2][g].cy + stag, -50, 150)
      };
    }
  } else if (mode === 1) {
    // Translate: 0->3, 1->4, 2->3, angle preserved
    for (let g = 0; g < N; g++) {
      P[3][g] = { ...P[0][g], cy: clamp(P[0][g].cy + stag, -50, 150) };
      P[4][g] = { ...P[1][g], cy: clamp(P[1][g].cy + stag, -50, 150) };
      P[5][g] = { ...P[2][g], cy: clamp(P[2][g].cy + stag, -50, 150) };
    }
  } else if (mode === 2) {
    // Y-Symmetry: 0->3, 1->4, 2->5, segment order reversed, cy flipped, angle negated
    for (let off = 0; off <= 2; off++) {
      for (let g = 0; g < N; g++) {
        const src = P[off][N - 1 - g];
        P[3 + off][g] = {
          ...src,
          ang: -src.ang,
          cy: clamp(100 - src.cy + stag, -50, 150)
        };
      }
    }
  } else if (mode === 3) {
    // Center Symmetry: 0->5, 1->4, 2->3, segment order reversed, cx negated, cy flipped
    for (let off = 0; off <= 2; off++) {
      for (let g = 0; g < N; g++) {
        const src = P[off][N - 1 - g];
        P[5 - off][g] = {
          ...src,
          cx: -src.cx,
          cy: clamp(100 - src.cy + stag, -50, 150)
        };
      }
    }
  }
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function genDefaults() {
  presetAsDefault();
  syncSlidersFromState();
  buildColorUI();
  scheduleRender();
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
    else if (k === 'p') {
      v = _baseP0[0].p;
      if (isNaN(v)) v = 2.0;
    }
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

function genRandom() {
  P = [];
  for (let s = 0; s < CONFIG.NS; s++) {
    P[s] = [];
  }
  randomGroup(0);
  randomGroup(5, -1);
  deriveAll();
  buildSegmentUI();
  buildColorUI();
  scheduleRender();
}

function randomGroup(start, dir) {
  dir = dir || 1;

  for (let g = 0; g < CONFIG.NG; g++) {
    P[start][g] = {
      cy: -30 + g * 32 + (Math.random() - 0.5) * 16,
      cx: (Math.random() - 0.5) * 0.6,
      sy: 28 + Math.random() * 32,
      sxr: 1.8 + Math.random() * 3.0,
      ang: (Math.random() - 0.5) * 40,
      p: 1.2 + Math.random() * 1.8
    };
  }

  const sCY = (10 + Math.random() * 15) * (Math.random() < 0.5 ? -1 : 1);
  const sSY = (Math.random() - 0.5) * 36;

  for (const off of [1, 2]) {
    const si = start + dir * off;
    for (let g = 0; g < CONFIG.NG; g++) {
      const b = P[start][g];
      P[si][g] = {
        cy: clamp(b.cy + sCY * off, -50, 150),
        cx: b.cx,
        sy: clamp(b.sy + sSY * off, 10, 70),
        sxr: b.sxr,
        ang: b.ang,
        p: b.p
      };
    }
  }
}

function exportParamsJSON() {
  return P.map(function (segs, s) {
    return {
      idx: s,
      group: s < 3 ? 0 : 1,
      colorSeq: (s < 3 ? CONFIG.LSEQ : CONFIG.RSEQ)
        .map(function (i) { return CONFIG.COLOR_NAMES[i]; }),
      segments: segs.map(function (seg, g) {
        return {
          colorIdx: colorIdx(s, g),
          centerY: seg.cy,
          centerX: seg.cx,
          sigmaY: seg.sy,
          sigmaX_ratio: seg.sxr,
          angle: seg.ang,
          sharpness: seg.p
        };
      })
    };
  });
}
