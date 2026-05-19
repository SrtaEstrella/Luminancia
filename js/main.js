window.resetAll=resetAll;window.randomizeAll=randomizeAll;window.doExport=doExport;window.importJSON=importJSON;window.doImport=doImport;
window.zoomIn=zoomIn;window.zoomOut=zoomOut;window.zoomFit=zoomFit;window.zoom100=zoom100;
window.onViewChange=onViewChange;window.loadRef=loadRef;window.clearRef=clearRef;
window.onGlobalP=onGlobalP;window.clearMarker=clearMarker;
window.isolateSegment=isolateSegment;window.clearIsolation=clearIsolation;window.exportWallpaper=exportWallpaper;window.onNColorsChange=onNColorsChange;window.randomizeSeq=randomizeSeq;window.toggleTheme=toggleTheme;window.toggleLang=toggleLang;window.randomizeColors=randomizeColors;

function init(){
  switchLang('en');_lang='en';const lb=document.getElementById('langBtn');lb.textContent='EN';lb.style.fontSize='12px';
  document.documentElement.classList.add('light');document.getElementById('themeBtn').textContent=T.themeLight;
  document.getElementById('resetBtn').textContent=T.reset;
  document.getElementById('exportImgBtn').textContent=T.exportImg;
  document.getElementById('exportJsonBtn').textContent=T.exportJSON;
  document.getElementById('importJsonBtn').textContent=T.importJSON;
  document.getElementById('fitBtn').textContent=T.fitBtn;
  document.getElementById('clearMarkerBtn').textContent=T.clearMarkerBtn;document.getElementById('clearMarkerBtn').title=T.clearMarkerTitle;
  document.getElementById('uploadBtn').textContent=T.upload;document.getElementById('clearRefBtn').textContent=T.clear;
  document.getElementById('footer').textContent=T.footer;
  document.getElementById('previewLabel').textContent=T.preview;
  document.getElementById('refImageLabel').textContent=T.refImage;
  const vm=document.getElementById('viewMode');
  vm.innerHTML='<option value="all">'+T.allStrips+'</option>';
  for(let i=0;i<6;i++)vm.innerHTML+='<option value="'+i+'">'+T.stripN+(i+1)+'</option>';
  genDefaults();buildStripTabs();buildSegmentUI();renderPreview(window._viewStrip);applyZoom();
  setTimeout(()=>{const wrap=document.getElementById("scrollWrap");const outputCenterY=((50+50)/200)*CONFIG.PH*zoomLevel;wrap.scrollTop=outputCenterY-wrap.clientHeight/2;wrap.scrollLeft=(wrap.scrollWidth-wrap.clientWidth)/2;},120);
  document.getElementById('cv').addEventListener('click',function(e){onCanvasClick(e,'cv');});
  document.getElementById('refCv').addEventListener('click',function(e){onCanvasClick(e,'refCv');});
  document.getElementById('scrollWrap').addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey){e.preventDefault();if(e.deltaY<0)zoomIn();else zoomOut();}},{passive:false});
  const sidebar=document.querySelector('.sidebar');let resizing=false,startX=0,startW=0;
  sidebar.addEventListener('mousedown',e=>{if(e.offsetX>sidebar.offsetWidth-8){resizing=true;startX=e.clientX;startW=sidebar.offsetWidth;e.preventDefault();}});
  document.addEventListener('mousemove',e=>{if(resizing){const w=Math.max(320,startW+e.clientX-startX);sidebar.style.width=w+'px';sidebar.style.minWidth=w+'px';}});
  document.addEventListener('mouseup',()=>{resizing=false;});
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
