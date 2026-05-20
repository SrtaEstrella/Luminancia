const RULER_W = 42;
const GRAIN_RGB = 6; // legacy fallback, overridden by window._grainAmount

function grain(x, y) {
  var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function clampByte(v) {
  return Math.max(0, Math.min(255, v));
}

function cssColor(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function pctToY(pct, ph) {
  return Math.round(((pct + 50) / 200) * ph);
}

function yToPct(y, ph) {
  return ((y / ph) * 200 - 50);
}

function getTrimPct() {
  const ar = (window._aspectRatio || 19.5 / 9);
  const ew = (window._exportWidth || CONFIG.OW);

  // Export height determined by resolution and aspect ratio
  const outH = Math.round(ew * ar);
  // Preview crop height at the fixed render width
  const previewH = Math.round(CONFIG.OW * ar);
  const span = previewH / CONFIG.OH * 100;

  return {
    top: 50 - span / 2,
    bot: 50 + span / 2,
    outH: outH,
    ew: ew
  };
}

function renderToCanvas(canvas, viewStrip) {
  let cw;
  if (viewStrip >= 0) {
    cw = Math.round(CONFIG.SW * CONFIG.RENDER_SCALE);
  } else {
    cw = CONFIG.PW;
  }

  const ph = CONFIG.PH;
  const tw = cw + RULER_W;
  canvas.width = tw;
  canvas.height = ph;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(tw, ph);
  const d = imageData.data;

  // Fill with black background
  for (let i = 0; i < tw * ph * 4; i += 4) {
    d[i] = 0;
    d[i + 1] = 0;
    d[i + 2] = 0;
    d[i + 3] = 255;
  }

  const strips = (viewStrip >= 0) ? [viewStrip] : [0, 1, 2, 3, 4, 5];

  for (const s of strips) {
    let x0, x1;
    if (viewStrip >= 0) {
      x0 = RULER_W;
      x1 = tw;
    } else {
      x0 = RULER_W + Math.round(s * CONFIG.SW * CONFIG.RENDER_SCALE);
      x1 = RULER_W + Math.round((s + 1) * CONFIG.SW * CONFIG.RENDER_SCALE);
    }

    const stripCX = (x0 + x1) / 2;
    const segs = P[s];

    for (let x = Math.max(RULER_W, Math.floor(x0)); x < Math.min(tw, Math.ceil(x1)); x++) {
      for (let y = 0; y < ph; y++) {
        let twgt = 0;
        let r = 0;
        let g = 0;
        let b = 0;

        for (let gidx = 0; gidx < CONFIG.NG; gidx++) {
          if (window._isolatedSeg != null && gidx !== window._isolatedSeg) {
            continue;
          }

          const seg = segs[gidx];
          const bc = CONFIG.COLORS[colorIdx(s, gidx)];

          const effCX = stripCX + seg.cx * ((x1 - x0) / 2);
          const dxPx = x - effCX;

          const cyPx = ((seg.cy + 50) / 200) * ph;
          const dyPx = y - cyPx;

          const rad = seg.ang * Math.PI / 180;
          const cosA = Math.cos(-rad);
          const sinA = Math.sin(-rad);

          const u = dxPx * cosA - dyPx * sinA;
          const v = dxPx * sinA + dyPx * cosA;

          const sigmaYPx = (seg.sy / 200) * ph;
          const sigmaXPx = sigmaYPx * seg.sxr;

          const dist = Math.sqrt(
            (u * u) / (sigmaXPx * sigmaXPx) +
            (v * v) / (sigmaYPx * sigmaYPx)
          );

          const wgt = Math.exp(-Math.pow(dist, seg.p) * 4.5);

          twgt += wgt;
          r += wgt * bc[0];
          g += wgt * bc[1];
          b += wgt * bc[2];
        }

        const idx = (y * tw + x) * 4;
        if (twgt > 0.001) {
          var gn = (grain(x, y) - 0.5) * (window._grainAmount || GRAIN_RGB);
          d[idx] = clampByte(Math.round(r / twgt + gn));
          d[idx + 1] = clampByte(Math.round(g / twgt + gn));
          d[idx + 2] = clampByte(Math.round(b / twgt + gn));
        }
        d[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ... (in exportWallpaper, same pattern — update grain line there too)

// Actually let me find and update the export path separately


function renderGuidesOverlay(viewStrip) {
  const cv = document.getElementById('cv');
  const oc = document.getElementById('guidesCv');
  if (!oc) return;

  const dpr = window.devicePixelRatio || 1;
  const Z = zoomLevel || 0.65;
  const cw = cv.width;
  const ch = cv.height;

  const cssW = cw * Z;
  const cssH = ch * Z;

  oc.width = Math.round(cssW * dpr);
  oc.height = Math.round(cssH * dpr);
  oc.style.width = cssW + 'px';
  oc.style.height = cssH + 'px';

  const ctx = oc.getContext('2d');
  ctx.scale(dpr, dpr);

  const R = RULER_W * Z;
  const cvsW = cw * Z;
  const cvsH = ch * Z;
  ctx.clearRect(0, 0, cssW, cssH);

  // Trim shadows
  const trim = getTrimPct();
  const trimT = pctToY(trim.top, ch) * Z;
  const trimB = pctToY(trim.bot, ch) * Z;
  ctx.fillStyle = cssColor('--shadow-overlay');
  ctx.fillRect(R, 0, cvsW - R, trimT);
  ctx.fillRect(R, trimB, cvsW - R, cvsH - trimB);

  // Marker line
  if (window._markerPct != null) {
    const my = pctToY(window._markerPct, ch) * Z;
    ctx.strokeStyle = '#4a80c0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(R, my);
    ctx.lineTo(cvsW, my);
    ctx.stroke();
    ctx.setLineDash([]);

    const txt = window._markerPct.toFixed(1) + '%';
    ctx.font = 'bold ' + Math.round(11 * Z) +
      'px InterVariable,Inter,-apple-system,BlinkMacSystemFont,sans-serif';
    ctx.fillStyle = '#4a80c0';
    ctx.textBaseline = 'bottom';
    ctx.fillText(txt, cvsW - 60 * Z, my - 4 * Z);
  }

  // Trim boundary lines
  ctx.strokeStyle = cssColor('--trim-line');
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(R, trimT);
  ctx.lineTo(cvsW, trimT);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(R, trimB);
  ctx.lineTo(cvsW, trimB);
  ctx.stroke();
  ctx.setLineDash([]);

  // Strip dividers
  if (viewStrip < 0) {
    ctx.strokeStyle = cssColor('--strip-line');
    ctx.lineWidth = 1;
    for (let s = 1; s < CONFIG.NS; s++) {
      const sx = R + Math.round(s * (cvsW - R) / CONFIG.NS);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, cvsH);
      ctx.stroke();
    }
  }
}

/* ---- DOM Ruler ---- */

function initRulerDOM() {
  if (document.getElementById('rulerDom')) return;

  const col = document.getElementById('cv-col');
  if (!col) return;

  const dom = document.createElement('div');
  dom.id = 'rulerDom';

  const bg = document.createElement('div');
  bg.id = 'rulerBg';
  dom.appendChild(bg);

  for (let pct = -50; pct <= 150; pct += 5) {
    const is10 = pct % 10 === 0;
    const isMajor = pct % 50 === 0;
    const isTrim = pct === 0 || pct === 100;

    let tickColor = isTrim
      ? 'var(--ruler-trim)'
      : (is10 ? 'var(--ruler-tick)' : 'var(--ruler-minor)');

    const tick = document.createElement('div');
    tick.className = 'ruler-tick';
    tick.dataset.pct = pct;
    tick.style.background = tickColor;
    tick.style.height = isMajor ? '1.5px' : '1px';
    dom.appendChild(tick);

    if (is10) {
      const lbl = document.createElement('span');
      lbl.className = 'ruler-label';
      lbl.dataset.pct = pct;
      lbl.textContent = pct + '%';
      lbl.style.color = isTrim ? 'var(--ruler-trim)' : 'var(--ruler-tick)';
      dom.appendChild(lbl);
    }
  }

  const border = document.createElement('div');
  border.id = 'rulerBorder';
  dom.appendChild(border);

  col.appendChild(dom);
}

function updateRulerDOM() {
  const dom = document.getElementById('rulerDom');
  if (!dom) return;

  const cv = document.getElementById('cv');
  if (!cv) return;

  const Z = zoomLevel || 0.65;
  const ch = cv.height;
  const R = RULER_W * Z;
  const cvsH = ch * Z;

  dom.style.width = R + 'px';
  dom.style.height = cvsH + 'px';

  const bg = document.getElementById('rulerBg');
  bg.style.cssText = 'position:absolute;left:0;top:0;width:' + R + 'px;' +
    'height:' + cvsH + 'px;transition:background .25s;background:var(--ruler-bg)';

  dom.querySelectorAll('.ruler-tick').forEach(function (el) {
    const pct = parseFloat(el.dataset.pct);
    const y0 = pctToY(pct, ch) * Z;
    const is10 = pct % 10 === 0;
    const isMajor = pct % 50 === 0;
    const th = isMajor ? 1.5 : 1;

    // Clamp the 150% tick so it does not overflow below the ruler
    const y = pct === 150 ? Math.max(y0 - th, 0) : y0;

    const ts = (is10 ? (isMajor ? 0 : 6) : 16) * Z;

    el.style.cssText = 'position:absolute;top:' + y + 'px;left:' + ts + 'px;' +
      'width:' + (R - ts) + 'px;height:' + th + 'px;' +
      'transition:background .25s;background:' +
      (pct === 0 || pct === 100 ? 'var(--ruler-trim)' :
        (is10 ? 'var(--ruler-tick)' : 'var(--ruler-minor)'));
  });

  dom.querySelectorAll('.ruler-label').forEach(function (el) {
    const pct = parseFloat(el.dataset.pct);
    const y = pctToY(pct, ch) * Z;
    const isTrim = pct === 0 || pct === 100;

    const baseStyle = 'position:absolute;right:' + (4 * Z) + 'px;' +
      'font-size:' + Math.round(11 * Z) + 'px;' +
      'font-weight:bold;white-space:nowrap;text-align:right;' +
      'font-variant-numeric:tabular-nums;' +
      'font-family:\'InterVariable\',\'Inter\',sans-serif;' +
      'transition:color .25s;color:' +
      (isTrim ? 'var(--ruler-trim)' : 'var(--ruler-tick)');

    if (pct >= 150) {
      el.style.cssText = baseStyle + ';bottom:' + (1 * Z) + 'px';
    } else {
      el.style.cssText = baseStyle + ';top:' + (y + 1 * Z) + 'px';
    }
  });

  const border = document.getElementById('rulerBorder');
  border.style.cssText = 'position:absolute;top:0;left:' + (R - 1) + 'px;' +
    'height:' + cvsH + 'px;width:1px;' +
    'transition:background .25s;background:var(--border-subtle)';
}

function renderPreview(viewStrip) {
  const cv = document.getElementById('cv');
  renderToCanvas(cv, viewStrip);
  renderGuidesOverlay(viewStrip);
  document.getElementById('cv-col').style.width = cv.width + 'px';
  updateRulerDOM();

  if (!window._initCentered) {
    window._initCentered = true;
    var wrap = document.getElementById('scrollWrap');
    var Z = zoomLevel || 0.65;
    var trim = getTrimPct();
    var centerPct = (trim.top + trim.bot) / 2;
    var centerY = ((centerPct + 50) / 200) * CONFIG.PH * Z;
    wrap.scrollTop = centerY - wrap.clientHeight / 2;
    wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
  }
}

function exportWallpaper() {
  const fw = CONFIG.OW;
  const frh = CONFIG.RH;
  const d = new Uint8ClampedArray(fw * frh * 4);

  for (let i = 0; i < d.length; i += 4) {
    d[i] = 0;
    d[i + 1] = 0;
    d[i + 2] = 0;
    d[i + 3] = 255;
  }

  const strips = [0, 1, 2, 3, 4, 5];
  let si = 0;
  let xi = 0;
  let totalCols = 0;

  for (const s of strips) {
    totalCols += Math.round((s + 1) * CONFIG.SW) - Math.round(s * CONFIG.SW);
  }

  const progress = document.createElement('div');
  progress.style.cssText =
    'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'background:#1a1a3a;color:#ccc;padding:12px 24px;border-radius:8px;' +
    'z-index:99;font:13px InterVariable,Inter,sans-serif';
  progress.textContent = T.exportProgress0;
  document.body.appendChild(progress);

  function renderChunk() {
    if (si >= strips.length) {
      finish();
      return;
    }

    const s = strips[si];
    const x0 = Math.round(s * CONFIG.SW);
    const x1 = Math.round((s + 1) * CONFIG.SW);
    const stripCX = (x0 + x1) / 2;
    const segs = P[s];
    const end = Math.min(x1, xi + 30);

    for (let x = xi; x < end; x++) {
      const dxPx = x - stripCX;

      for (let y = 0; y < frh; y++) {
        let tw = 0;
        let r = 0;
        let g = 0;
        let b = 0;

        for (let gidx = 0; gidx < CONFIG.NG; gidx++) {
          const seg = segs[gidx];
          const bc = CONFIG.COLORS[colorIdx(s, gidx)];

          const effCX = stripCX + seg.cx * ((x1 - x0) / 2);
          const dx2 = x - effCX;

          const cyPx = ((seg.cy + 50) / 200) * frh;
          const dy = y - cyPx;

          const rad = seg.ang * Math.PI / 180;
          const cosA = Math.cos(-rad);
          const sinA = Math.sin(-rad);

          const u = dx2 * cosA - dy * sinA;
          const v = dx2 * sinA + dy * cosA;

          const sYPx = (seg.sy / 200) * frh;
          const sXPx = sYPx * seg.sxr;

          const dist = Math.sqrt(
            (u * u) / (sXPx * sXPx) +
            (v * v) / (sYPx * sYPx)
          );

          const wgt = Math.exp(-Math.pow(dist, seg.p) * 4.5);

          tw += wgt;
          r += wgt * bc[0];
          g += wgt * bc[1];
          b += wgt * bc[2];
        }

        const idx = (y * fw + x) * 4;
        if (tw > 0.001) {
          var gn = (grain(x, y) - 0.5) * (window._grainAmount || GRAIN_RGB);
          d[idx] = clampByte(Math.round(r / tw + gn));
          d[idx + 1] = clampByte(Math.round(g / tw + gn));
          d[idx + 2] = clampByte(Math.round(b / tw + gn));
        }
        d[idx + 3] = 255;
      }
    }

    xi = end;

    let doneCols = 0;
    for (let ss = 0; ss < si; ss++) {
      doneCols += Math.round((ss + 1) * CONFIG.SW) - Math.round(ss * CONFIG.SW);
    }
    doneCols += xi - Math.round(s * CONFIG.SW);
    progress.textContent = T.exportProgress + Math.round(doneCols / totalCols * 100) + '%';

    if (xi >= x1) {
      si++;
      if (si < strips.length) {
        xi = Math.round(strips[si] * CONFIG.SW);
      }
    }

    setTimeout(renderChunk, 0);
  }

  function finish() {
    const offC = document.createElement('canvas');
    offC.width = fw;
    offC.height = frh;
    offC.getContext('2d').putImageData(new ImageData(d, fw, frh), 0, 0);

    const trim = getTrimPct();
    const srcY = Math.round(((trim.top + 50) / 200) * CONFIG.RH);

    const outC = document.createElement('canvas');
    outC.width = trim.ew;
    outC.height = trim.outH;

    outC.getContext('2d').drawImage(
      offC, 0, srcY, CONFIG.OW, trim.outH,
      0, 0, trim.ew, trim.outH
    );

    outC.toBlob(function (blob) {
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = 'luminance-wallpaper.png';
      a.click();
      URL.revokeObjectURL(u);
      progress.remove();
    });
  }

  renderChunk();
}
