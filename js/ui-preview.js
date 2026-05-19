let zoomLevel=0.65,refImage=null;
window._viewStrip=-1;
window._markerPct=null;

function applyZoom(){
  document.getElementById('zoomlbl').textContent=Math.round(zoomLevel*100)+'%';
  [document.getElementById('cv'),document.getElementById('refCv')].forEach(cv=>{
    cv.style.width=(cv.width*zoomLevel)+'px';
    cv.style.height=(cv.height*zoomLevel)+'px';
  });
  document.getElementById('cv-col').style.width=document.getElementById('cv').style.width;
  const oc=document.getElementById('guidesCv');
  if(oc&&oc.width){const z=zoomLevel,cv=document.getElementById('cv');oc.style.width=(cv.width*z)+'px';oc.style.height=(cv.height*z)+'px';renderGuidesOverlay(window._viewStrip);}
  updateRulerDOM();
}
function zoomIn(){zoomLevel=Math.min(1,zoomLevel*1.25);applyZoom();}
function zoomOut(){zoomLevel=Math.max(0.08,zoomLevel/1.25);applyZoom();}
function zoomFit(){zoomLevel=0.65;applyZoom();}
function zoom100(){zoomLevel=1.0;applyZoom();}

function onGlobalP(){const val=parseFloat(document.getElementById('globalP').value);document.getElementById('globalPLbl').textContent=val.toFixed(2);for(let s=0;s<CONFIG.NS;s++)for(let g=0;g<CONFIG.NG;g++)P[s][g].p=val;scheduleRender();}

function buildViewMode(){const vm=document.getElementById('viewMode');vm.className='pill-group';vm.innerHTML='';const allBtn=document.createElement('button');allBtn.textContent=T.allStrips;allBtn.dataset.v='-1';if(window._viewStrip===-1)allBtn.className='on';allBtn.onclick=()=>{vm.querySelectorAll('button').forEach(b=>b.className='');allBtn.className='on';window._viewStrip=-1;scheduleRender();};vm.appendChild(allBtn);for(let i=0;i<6;i++){const btn=document.createElement('button');btn.textContent=String(i+1);btn.dataset.v=String(i);if(window._viewStrip===i)btn.className='on';btn.onclick=(idx=>()=>{vm.querySelectorAll('button').forEach(b=>b.className='');btn.className='on';window._viewStrip=idx;scheduleRender();})(i);vm.appendChild(btn);}}
function onViewChange(){const vm=document.getElementById('viewMode'),on=vm.querySelector('.on');window._viewStrip=on?parseInt(on.dataset.v):-1;scheduleRender();}

function loadRef(e){const file=e.target.files[0];if(!file)return;document.getElementById('clearRefBtn').classList.remove('hidden');const reader=new FileReader();reader.onload=function(ev){const img=new Image();img.onload=function(){refImage=img;document.getElementById('ref-col').style.display='';updateRefCanvas();applyZoom();};img.src=ev.target.result;};reader.readAsDataURL(file);}
function clearRef(){refImage=null;document.getElementById('ref-col').style.display='none';document.getElementById('refFile').value='';document.getElementById('clearRefBtn').classList.add('hidden');}

function updateRefCanvas(){if(!refImage)return;const cv=document.getElementById('refCv'),vs=window._viewStrip,ph=CONFIG.PH;let pw;if(vs>=0){pw=Math.round(CONFIG.SW*CONFIG.RENDER_SCALE);}else{pw=CONFIG.PW;}cv.width=pw;cv.height=ph;const ctx=cv.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,pw,ph);const trimT=Math.round(CONFIG.OH*CONFIG.PAD*CONFIG.RENDER_SCALE),outH=Math.round(CONFIG.OH*CONFIG.RENDER_SCALE);if(vs>=0){const sx=Math.round((refImage.width/CONFIG.NS)*vs),sw=Math.round(refImage.width/CONFIG.NS);ctx.drawImage(refImage,sx,0,sw,refImage.height,0,trimT,pw,outH);}else{ctx.drawImage(refImage,0,0,refImage.width,refImage.height,0,trimT,pw,outH);}document.getElementById('ref-col').style.width=pw+'px';}

function showMarker(pct){window._markerPct=pct;renderPreview(window._viewStrip);if(refImage){updateRefCanvas();drawMarkerOnRefCv();applyZoom();}}
function drawMarkerOnRefCv(){const refCv=document.getElementById('refCv');if(window._markerPct==null)return;const ctx=refCv.getContext('2d'),my=pctToY(window._markerPct,refCv.height);ctx.strokeStyle='#4a80c0';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.beginPath();ctx.moveTo(0,my);ctx.lineTo(refCv.width,my);ctx.stroke();ctx.setLineDash([]);const txt=window._markerPct.toFixed(1)+'%';ctx.font='bold 11px InterVariable,Inter,-apple-system,BlinkMacSystemFont,sans-serif';ctx.fillStyle='#4a80c0';ctx.textBaseline='bottom';ctx.fillText(txt,refCv.width-60,my-4);}
function onCanvasClick(e,cvId){cvId=cvId||'cv';const cv=document.getElementById(cvId),rect=cv.getBoundingClientRect(),scaleY=cv.height/rect.height,y=(e.clientY-rect.top)*scaleY,pct=yToPct(y,cv.height);showMarker(pct);}
function clearMarker(){window._markerPct=null;renderPreview(window._viewStrip);if(refImage)updateRefCanvas();applyZoom();}

let _lang='zh';
function toggleLang(){_lang=_lang==='zh'?'en':'zh';switchLang(_lang);document.getElementById('langBtn').textContent=_lang==='zh'?'中':'EN';buildSegmentUI();buildColorUI();document.getElementById('resetBtn').textContent=T.reset;document.getElementById('exportImgBtn').textContent=T.exportImg;document.getElementById('exportJsonBtn').textContent=T.exportJSON;document.getElementById('importJsonBtn').textContent=T.importJSON;document.getElementById('fitBtn').textContent=T.fitBtn;document.getElementById('clearMarkerBtn').textContent=T.clearMarkerBtn;document.getElementById('clearMarkerBtn').title=T.clearMarkerTitle;document.getElementById('uploadBtn').textContent=T.upload;document.getElementById('clearRefBtn').textContent=T.clear;document.getElementById('footer').textContent=T.footer;document.getElementById('previewLabel').textContent=T.preview;document.getElementById('refImageLabel').textContent=T.refImage;document.getElementById('leftSeqLabel').textContent=T.leftSeq;document.getElementById('rightSeqLabel').textContent=T.rightSeq;
document.getElementById('zoomOutBtn').title=T.zoomOut;document.getElementById('zoomInBtn').title=T.zoomIn;document.getElementById('fitBtn').title=T.zoomFitTitle;
buildViewMode();scheduleRender();}
function toggleTheme(){const r=document.documentElement;r.classList.toggle("light");const isLight=r.classList.contains("light");document.getElementById("themeBtn").textContent=isLight?T.themeLight:T.themeDark;setTimeout(()=>renderGuidesOverlay(window._viewStrip),250);}
window._isolatedSeg=null;
function isolateSegment(g){if(window._isolatedSeg===g){window._isolatedSeg=null;}else{window._isolatedSeg=g;}scheduleRender();}
function clearIsolation(){window._isolatedSeg=null;scheduleRender();}

let renderTimer=null;
function scheduleRender(){clearTimeout(renderTimer);renderTimer=setTimeout(()=>{renderPreview(window._viewStrip);updateRefCanvas();drawMarkerOnRefCv();applyZoom();},40);}