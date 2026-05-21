// Expose global functions to inline onclick handlers
window.resetAll = resetAll;
window.doExport = doExport;
window.importJSON = importJSON;
window.doImport = doImport;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomFit = zoomFit;
window.zoom100 = zoom100;
window.onViewChange = onViewChange;
window.loadRef = loadRef;
window.clearRef = clearRef;
window.onGlobalP = onGlobalP;
window.clearMarker = clearMarker;
window.isolateSegment = isolateSegment;
window.clearIsolation = clearIsolation;
window.exportWallpaper = exportWallpaper;
window.onNColorsChange = onNColorsChange;
window.randomizeSeq = randomizeSeq;
window.toggleTheme = toggleTheme;
window.toggleLang = toggleLang;
window.randomizeColors = randomizeColors;

function init() {
  // Set initial language
  switchLang('en');
  _lang = 'en';
  document.getElementById('langBtn').textContent = 'EN';

  // Set title from locale
  document.title = T.title;
  document.querySelector('.sidebar h2').textContent = T.title;

  // Light theme by default
  document.documentElement.classList.add('light');
  document.getElementById('themeBtn').textContent = T.themeLight;

  // Set button and label text from locale
  document.getElementById('resetBtn').textContent = T.reset;
  document.getElementById('exportJsonBtn').textContent = T.exportJSON;
  document.getElementById('importJsonBtn').textContent = T.importJSON;
  document.getElementById('schemeLabel').textContent = T.schemeLabel;
  document.getElementById('fitBtn').textContent = T.fitBtn;
  document.getElementById('zoomOutBtn').title = T.zoomOut;
  document.getElementById('zoomInBtn').title = T.zoomIn;
  document.getElementById('fitBtn').title = T.zoomFitTitle;
  document.getElementById('clearMarkerBtn').textContent = T.clearMarkerBtn;
  document.getElementById('clearMarkerBtn').title = T.clearMarkerTitle;
  document.getElementById('uploadBtn').textContent = T.upload;
  document.getElementById('clearRefBtn').textContent = T.clear;
  document.getElementById('footer').textContent = T.footer;
  document.getElementById('previewLabel').textContent = T.preview;
  document.getElementById('refImageLabel').textContent = T.refImage;

  // Build UI
  buildViewMode();
  initRulerDOM();
  genDefaults();
  updateExportBtnText();
  buildStripTabs();
  buildSegmentUI();
  renderPreview(window._viewStrip);
  applyZoom();

  // Re-render overlay once fonts are loaded (canvas text)
  document.fonts.ready.then(function () {
    renderGuidesOverlay(window._viewStrip);
  });

  // Canvas click to place marker
  document.getElementById('cv').addEventListener('click', function (e) {
    onCanvasClick(e, 'cv');
  });
  document.getElementById('refCv').addEventListener('click', function (e) {
    onCanvasClick(e, 'refCv');
  });

  // Ctrl+wheel zoom on the scrollable area
  document.getElementById('scrollWrap').addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, { passive: false });

  // Sidebar resize via drag handle (outside scroll container)
  var sidebar = document.querySelector('.sidebar');
  var handle = document.createElement('div');
  handle.className = 'resize-handle';
  document.body.appendChild(handle);

  var resizing = false;
  var startX = 0;
  var startW = 0;

  function updateHandlePos() {
    var r = sidebar.getBoundingClientRect();
    handle.style.top = r.top + 'px';
    handle.style.left = (r.right - 4) + 'px';
    handle.style.height = r.height + 'px';
  }
  updateHandlePos();
  window.addEventListener('resize', updateHandlePos);
  sidebar.addEventListener('scroll', updateHandlePos);

  handle.addEventListener('mousedown', function (e) {
    resizing = true;
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    updateHandlePos();
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    updateHandlePos();
    if (resizing) {
      var w = Math.max(320, startW + e.clientX - startX);
      sidebar.style.width = w + 'px';
      sidebar.style.minWidth = w + 'px';
    }
  });

  document.addEventListener('mouseup', function () {
    resizing = false;
  });
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
