function buildStripTabs(){document.getElementById('tabs').innerHTML='';}

function buildSegmentUI(){
  const container=document.getElementById('params');container.innerHTML='';
  const gc=document.createElement('div');
  gc.className='card';
  const gcHead=document.createElement('div');gcHead.className='card-header clk';gcHead.textContent='▾ '+T.globalCtl;
  const gcBody=document.createElement('div');
  gcHead.onclick=()=>{const s=gcBody.style.display==='none';gcBody.style.display=s?'':'none';gcHead.textContent=(s?'▾':'▸')+' '+T.globalCtl;gc.classList.toggle('collapsed');};
  gc.appendChild(gcHead);gc.appendChild(gcBody);
  [{k:'p',lbl:T.fullness,min:0.6,max:4,step:0.02,val:P[0][0].p,fmt:v=>v.toFixed(2),on:(v)=>{for(let s=0;s<CONFIG.NS;s++)for(let g=0;g<CONFIG.NG;g++)P[s][g].p=v;}},
   {k:'vsc',lbl:T.vScale,min:0.75,max:2,step:0.01,val:window._vScale,fmt:v=>v.toFixed(2),on:(v)=>{window._vScale=v;deriveAll();}},
   {k:'offs',lbl:T.globalOffs,min:-20,max:20,step:0.5,val:window._globalOffset,fmt:v=>v.toFixed(1)+'%',on:(v)=>{window._globalOffset=v;deriveAll();}},
   {k:'stag',lbl:T.stagger,min:-20,max:20,step:0.5,val:window._stagger,fmt:v=>v.toFixed(1)+'%',on:(v)=>{window._stagger=v;deriveAll();}},
  ].forEach(cfg=>{
    const pg=document.createElement('div');pg.className='param';
    const lb=document.createElement('label'),ve=document.createElement('em');ve.textContent=cfg.fmt(cfg.val);
    lb.appendChild(document.createTextNode(cfg.lbl+' '));lb.appendChild(ve);
    const sl=document.createElement('input');sl.type='range';sl.min=cfg.min;sl.max=cfg.max;sl.step=cfg.step;sl.value=cfg.val;
    sl.addEventListener('input',()=>{const v=parseFloat(sl.value);ve.textContent=cfg.fmt(v);cfg.on(v);scheduleRender();});
    pg.appendChild(lb);pg.appendChild(sl);gcBody.appendChild(pg);
  });
  const symRow=document.createElement('div');symRow.className='control-row';
  const symLb=document.createElement('label');symLb.className='control-label';symLb.textContent=T.symMode;
  const segDiv=document.createElement('div');segDiv.className='seg-control';
  T.symOpt.forEach((l,i)=>{const btn=document.createElement('button');btn.textContent=l;if(i===window._symMode)btn.className='on';btn.onclick=()=>{segDiv.querySelectorAll('button').forEach(b=>b.className='');btn.className='on';window._symMode=i;deriveAll();scheduleRender();};segDiv.appendChild(btn);});
  symRow.appendChild(symLb);symRow.appendChild(segDiv);gcBody.appendChild(symRow);
  const arRow=document.createElement('div');arRow.className='control-row';
  const arLb=document.createElement('label');arLb.className='control-label';arLb.textContent=T.aspectRatio+' ';const arEm=document.createElement('em');arLb.appendChild(arEm);
  const arSel=document.createElement('select');
  function buildArOptions(){arSel.innerHTML='';const presets=[{l:T.arPresets[0],v:19.5/9},{l:T.arPresets[1],v:20/9},{l:T.arPresets[2],v:20.5/9},{l:T.arPresets[3],v:19.8/9}];let matched=false;presets.forEach(o=>{const opt=document.createElement('option');opt.value=o.v;opt.textContent=o.l;if(Math.abs(o.v-window._aspectRatio)<0.001){opt.selected=true;matched=true;}arSel.appendChild(opt);});if(!matched){const opt=document.createElement('option');opt.value=window._aspectRatio;opt.textContent=(window._aspectRatio).toFixed(2);opt.selected=true;arSel.appendChild(opt);}const cOpt=document.createElement('option');cOpt.value=-1;cOpt.textContent=T.custom;arSel.appendChild(cOpt);}
  buildArOptions();arSel.onchange=()=>{let v=parseFloat(arSel.value);if(v<0){const pv=parseFloat(prompt(T.customARPrompt,window._aspectRatio));if(pv&&pv>0){window._aspectRatio=pv;}else{return;}}else{window._aspectRatio=v;}buildSegmentUI();scheduleRender();};arRow.appendChild(arLb);arRow.appendChild(arSel);
  const wLb=document.createElement('label');wLb.className='control-label';wLb.textContent=T.resolution+' ';const wEm=document.createElement('em');wLb.appendChild(wEm);
  const wSel=document.createElement('select');wSel.style.width='70px';wSel.style.flex='none';
  (function(){const presets=[{l:'1080',v:1080},{l:'1170',v:1170},{l:'1206',v:1206},{l:'1290',v:1290},{l:'1320',v:1320},{l:'1440',v:1440}];let matched=false;presets.forEach(o=>{const opt=document.createElement('option');opt.value=o.v;opt.textContent=o.l;if(o.v===window._exportWidth){opt.selected=true;matched=true;}wSel.appendChild(opt);});if(!matched){const opt=document.createElement('option');opt.value=window._exportWidth;opt.textContent=String(window._exportWidth);opt.selected=true;wSel.appendChild(opt);}const cOpt=document.createElement('option');cOpt.value=-1;cOpt.textContent=T.custom;wSel.appendChild(cOpt);})();
  wSel.onchange=()=>{let v=parseInt(wSel.value);if(v<0){const pv=parseInt(prompt(T.customResPrompt,window._exportWidth));if(pv&&pv>0){window._exportWidth=pv;}else{return;}}else{window._exportWidth=v;}buildSegmentUI();scheduleRender();};arRow.appendChild(wLb);arRow.appendChild(wSel);gcBody.appendChild(arRow);
  const szRow=document.createElement('div');szRow.className='export-size';szRow.textContent=T.exportSize+window._exportWidth+'×'+Math.round(window._exportWidth*window._aspectRatio);gcBody.appendChild(szRow);
  container.appendChild(gc);

  const segSection=document.createElement('div');segSection.className='card';
  const segHeader=document.createElement('div');segHeader.className='card-header clk';segHeader.textContent='▸ '+T.advanced;
  segHeader.onclick=()=>{const body=segHeader.nextElementSibling;const show=body.style.display==='none';body.style.display=show?'':'none';segHeader.textContent=(show?'▾':'▸')+' '+T.advanced;segHeader.closest('.card').classList.toggle('collapsed');};
  segSection.appendChild(segHeader);const segBody=document.createElement('div');segBody.style.display='none';segSection.appendChild(segBody);segSection.classList.add('collapsed');container.appendChild(segSection);

  for(let g=0;g<CONFIG.NG;g++){
    const ciL=CONFIG.LSEQ[g],ciR=CONFIG.RSEQ[g],seg=_baseP0[g],st=step[g];
    const div=document.createElement('div');div.className='segpanel s'+(g%6);
    const hd=document.createElement('div');hd.className='seghead';
    const dotL=document.createElement('span');dotL.className='dot';dotL.style.background=hx(ACTIVE_COLORS[ciL]);hd.appendChild(dotL);
    const dotR=document.createElement('span');dotR.className='dot';dotR.style.background=hx(ACTIVE_COLORS[ciR]);hd.appendChild(dotR);
    hd.appendChild(document.createTextNode(T.segment+(g+1)));
    const isoBtn=document.createElement('button');isoBtn.className='btn-tiny';isoBtn.textContent=T.isolate;isoBtn.title=T.isolate;
    isoBtn.onclick=(e)=>{e.stopPropagation();isolateSegment(g);};hd.appendChild(isoBtn);div.appendChild(hd);
    PARAM_DEFS.forEach(pd=>{
      const isStep=(pd.k==='dcy'||pd.k==='dsy'),src=isStep?st:seg;
      const pg=document.createElement('div');pg.className='param';
      const lb=document.createElement('label'),ve=document.createElement('em');ve.textContent=pd.fmt(src[pd.k]);
      lb.appendChild(document.createTextNode(pd.lbl+' '));lb.appendChild(ve);
      const sl=document.createElement('input');sl.type='range';sl.min=pd.min;sl.max=pd.max;sl.step=pd.step;sl.value=src[pd.k];
      sl.addEventListener('input',()=>{const newVal=parseFloat(sl.value);src[pd.k]=newVal;ve.textContent=pd.fmt(newVal);if(!isStep)_baseP0[g][pd.k]=newVal;deriveAll();scheduleRender();});
      pg.appendChild(lb);pg.appendChild(sl);div.appendChild(pg);
    });
    segBody.appendChild(div);
  }
}

function resetAll(){genDefaults();buildSegmentUI();renderPreview(window._viewStrip);applyZoom();}
function randomizeAll(){genRandom();buildSegmentUI();renderPreview(window._viewStrip);applyZoom();}

function importJSON(){document.getElementById('importFile').click();}
function doImport(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=function(ev){try{const data=JSON.parse(ev.target.result);if(data.colors){ACTIVE_COLORS=data.colors.map(c=>Array.isArray(c)?c:c.match(/\d+/g).map(Number));ACTIVE_N=ACTIVE_COLORS.length;updateColorMeta();}if(data.strips&&data.strips[0]){const s0=data.strips[0].segments;if(s0)for(let g=0;g<Math.min(CONFIG.NG,s0.length);g++){const sg=s0[g];if(sg.centerY!=null)_baseP0[g].cy=sg.centerY;if(sg.centerX!=null)_baseP0[g].cx=sg.centerX;if(sg.sigmaY!=null)_baseP0[g].sy=sg.sigmaY;if(sg.sigmaX_ratio!=null)_baseP0[g].sxr=sg.sigmaX_ratio;if(sg.angle!=null)_baseP0[g].ang=sg.angle;if(sg.sharpness!=null)_baseP0[g].p=sg.sharpness;}}if(data.leftSeq)LSEQ.splice(0,LSEQ.length,...data.leftSeq.slice(0,CONFIG.NG));if(data.rightSeq)RSEQ.splice(0,RSEQ.length,...data.rightSeq.slice(0,CONFIG.NG));if(data.steps)for(let g=0;g<Math.min(CONFIG.NG,data.steps.length);g++){if(data.steps[g].dcy!=null)step[g].dcy=data.steps[g].dcy;if(data.steps[g].dsy!=null)step[g].dsy=data.steps[g].dsy;}updateColorMeta();deriveAll();buildSegmentUI();buildColorUI();scheduleRender();}catch(ex){alert('JSON error: '+ex.message);}};reader.readAsText(file);e.target.value='';}

function doExport(){const out={model:'anisotropic_gaussian_mixture',outputSize:{w:CONFIG.OW,h:CONFIG.OH},renderHeight:CONFIG.RH,stripCount:CONFIG.NS,segmentsPerStrip:CONFIG.NG,colors:ACTIVE_COLORS,leftSeq:LSEQ.slice(),rightSeq:RSEQ.slice(),steps:step.map(s=>({dcy:s.dcy,dsy:s.dsy})),strips:exportParamsJSON()};const json=JSON.stringify(out,null,2);document.getElementById('jsonout').textContent=json;document.getElementById('jsonout').classList.add('show');const blob=new Blob([json],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='luminance-gmm-params.json';a.click();URL.revokeObjectURL(u);}

function hx(c){return'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');}

function buildColorUI(){const ch=document.getElementById('colorHeader');ch.textContent=(ch.closest('.card').classList.contains('collapsed')?'▸':'▾')+' '+T.colorCustom;document.getElementById('colorCountLabel').textContent=T.colorCount;document.getElementById('randColorBtn').textContent=T.randColor;document.getElementById('randSeqBtn').textContent=T.randSeq;document.getElementById('paletteHint').textContent=T.paletteHint;document.getElementById('leftSeqLabel').textContent=T.leftSeq;document.getElementById('rightSeqLabel').textContent=T.rightSeq;const nc=document.getElementById('nColors');nc.innerHTML='';for(let i=2;i<=12;i++){const o=document.createElement('option');o.value=i;o.textContent=i;i===ACTIVE_N&&(o.selected=true);nc.appendChild(o);}buildActiveColors();buildSeqSlots();}

function buildActiveColors(){const g=document.getElementById('activeColors');g.innerHTML='';ACTIVE_COLORS.forEach((c,i)=>{const s=document.createElement('span');s.className='active-color-tag';s.innerHTML='<span style="background:'+hx(c)+'"></span>#'+(i+1);s.onclick=(e)=>{e.stopPropagation();showPalettePopup(s,i);};g.appendChild(s);});}

function showPalettePopup(anchor,slotIdx){let pop=document.getElementById('palettePopup');if(!pop){pop=document.createElement('div');pop.id='palettePopup';pop.className='popup';pop.style.position='fixed';pop.style.zIndex='100';pop.style.maxWidth='240px';document.body.appendChild(pop);document.addEventListener('click',()=>{pop.style.display='none';},{once:false});}pop.innerHTML='<div class="popup-title">'+T.replaceColor+(slotIdx+1)+'</div>';PALETTE.forEach((c,i)=>{const isSel=ACTIVE_COLORS[slotIdx]&&c[0]===ACTIVE_COLORS[slotIdx][0]&&c[1]===ACTIVE_COLORS[slotIdx][1]&&c[2]===ACTIVE_COLORS[slotIdx][2];const s=document.createElement('span');s.className='popup-swatch'+(isSel?' on':'');s.style.background=hx(c);s.title=hx(c);s.onclick=e=>{e.stopPropagation();ACTIVE_COLORS[slotIdx]=c;updateColorMeta();buildActiveColors();buildSeqSlots();deriveAll();scheduleRender();pop.style.display='none';};pop.appendChild(s);});const r=anchor.getBoundingClientRect();pop.style.left=Math.min(r.left,window.innerWidth-250)+'px';pop.style.top=(r.bottom+4)+'px';pop.style.display='';}

function buildSeqSlots(){[['lseqSlots',LSEQ],['rseqSlots',RSEQ]].forEach(([id,seq])=>{const g=document.getElementById(id);g.innerHTML='';seq.forEach((v,i)=>{const w=document.createElement('span');w.className='seq-slot';w.style.background=hx(ACTIVE_COLORS[v]);w.title=T.segTooltip+(i+1)+': #'+(v+1);w.onclick=(e)=>{e.stopPropagation();const cur=seq[i];const next=(cur+1)%ACTIVE_N;seq[i]=next;updateColorMeta();w.style.background=hx(ACTIVE_COLORS[next]);w.title=T.segTooltip+(i+1)+': #'+(next+1);deriveAll();scheduleRender();};w.oncontextmenu=(e)=>{e.preventDefault();e.stopPropagation();showSeqPopup(w,i,seq);};g.appendChild(w);});});}

function showSeqPopup(anchor,slotIdx,seq){let pop=document.getElementById('seqPopup');if(!pop){pop=document.createElement('div');pop.id='seqPopup';pop.className='popup';pop.style.position='fixed';pop.style.zIndex='100';document.body.appendChild(pop);document.addEventListener('click',()=>{pop.style.display='none';},{once:false});}pop.innerHTML='';ACTIVE_COLORS.forEach((_,j)=>{const s=document.createElement('span');s.className='popup-swatch'+(seq[slotIdx]===j?' on':'');s.style.background=hx(ACTIVE_COLORS[j]);s.onclick=e=>{e.stopPropagation();seq[slotIdx]=j;updateColorMeta();buildSeqSlots();deriveAll();scheduleRender();pop.style.display='none';};pop.appendChild(s);});const r=anchor.getBoundingClientRect();pop.style.left=Math.min(r.left,window.innerWidth-200)+'px';pop.style.top=(r.bottom+4)+'px';pop.style.display='';}

function randomizeColors(){for(let i=0;i<ACTIVE_N;i++)ACTIVE_COLORS[i]=PALETTE[Math.floor(Math.random()*PALETTE.length)];updateColorMeta();buildActiveColors();buildSeqSlots();deriveAll();scheduleRender();}

function onNColorsChange(){const n=parseInt(document.getElementById('nColors').value);if(n>ACTIVE_N){while(ACTIVE_COLORS.length<n)ACTIVE_COLORS.push(PALETTE[Math.floor(Math.random()*PALETTE.length)]);}else{ACTIVE_COLORS.length=n;}ACTIVE_N=n;[LSEQ,RSEQ].forEach(seq=>seq.forEach((v,i)=>{if(v>=n)seq[i]=Math.floor(Math.random()*n);}));updateColorMeta();buildActiveColors();buildSeqSlots();deriveAll();scheduleRender();randomizeSeq();}

function randomizeSeq(){
  [LSEQ,RSEQ].forEach(seq=>{
    const n=ACTIVE_N,len=CONFIG.NG;
    const arr=[];
    for(let i=0;i<n;i++)arr.push(i);
    while(arr.length<len)arr.push(Math.floor(Math.random()*n));
    for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
    for(let pass=0;pass<5;pass++){for(let i=2;i<len;i++){if(arr[i]===arr[i-1]&&arr[i]===arr[i-2]){const candidates=[];for(let j=0;j<len;j++)if(arr[j]!==arr[i])candidates.push(j);if(candidates.length){const j=candidates[Math.floor(Math.random()*candidates.length)];[arr[i],arr[j]]=[arr[j],arr[i]];}}}}
    for(let i=0;i<len;i++)seq[i]=arr[i];
  });
  updateColorMeta();buildSeqSlots();deriveAll();scheduleRender();
}

const _origBuildTabs=buildStripTabs;buildStripTabs=function(){_origBuildTabs();buildColorUI();};
