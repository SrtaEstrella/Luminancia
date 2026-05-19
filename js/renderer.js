const RULER_W=42;
function pctToY(pct,ph){return Math.round(((pct+50)/200)*ph);}
function yToPct(y,ph){return ((y/ph)*200-50);}

function getTrimPct(){
  const ar=(window._aspectRatio||19.5/9),ew=(window._exportWidth||CONFIG.OW);
  const outH=Math.round(ew*ar);                    // 导出高度(由分辨率+长宽比决定)
  const previewH=Math.round(CONFIG.OW*ar);          // 预览裁切高度(固定渲染宽度)
  const span=previewH/CONFIG.OH*100;
  return {top:50-span/2,bot:50+span/2,outH,ew};
}

function renderToCanvas(canvas,viewStrip){
  let cw;if(viewStrip>=0){cw=Math.round(CONFIG.SW*CONFIG.RENDER_SCALE);}else{cw=CONFIG.PW;}
  const ph=CONFIG.PH,tw=cw+RULER_W;canvas.width=tw;canvas.height=ph;
  const ctx=canvas.getContext('2d'),imageData=ctx.createImageData(tw,ph),d=imageData.data;
  for(let i=0;i<tw*ph*4;i+=4){d[i]=0;d[i+1]=0;d[i+2]=0;d[i+3]=255;}
  const strips=(viewStrip>=0)?[viewStrip]:[0,1,2,3,4,5];
  for(const s of strips){
    let x0,x1;if(viewStrip>=0){x0=RULER_W;x1=tw;}else{x0=RULER_W+Math.round(s*CONFIG.SW*CONFIG.RENDER_SCALE);x1=RULER_W+Math.round((s+1)*CONFIG.SW*CONFIG.RENDER_SCALE);}
    const stripCX=(x0+x1)/2,segs=P[s];
    for(let x=Math.max(RULER_W,Math.floor(x0));x<Math.min(tw,Math.ceil(x1));x++){
      for(let y=0;y<ph;y++){let twgt=0,r=0,g=0,b=0;
        for(let gidx=0;gidx<CONFIG.NG;gidx++){if(window._isolatedSeg!=null&&gidx!==window._isolatedSeg)continue;
          const seg=segs[gidx],bc=CONFIG.COLORS[colorIdx(s,gidx)];
          const effCX=stripCX+seg.cx*((x1-x0)/2),dxPx=x-effCX;
          const cyPx=((seg.cy+50)/200)*ph,dyPx=y-cyPx;
          const rad=seg.ang*Math.PI/180,cosA=Math.cos(-rad),sinA=Math.sin(-rad);
          const u=dxPx*cosA-dyPx*sinA,v=dxPx*sinA+dyPx*cosA;
          const sigmaYPx=(seg.sy/200)*ph,sigmaXPx=sigmaYPx*seg.sxr;
          const dist=Math.sqrt((u*u)/(sigmaXPx*sigmaXPx)+(v*v)/(sigmaYPx*sigmaYPx));
          const wgt=Math.exp(-Math.pow(dist,seg.p)*4.5);
          twgt+=wgt;r+=wgt*bc[0];g+=wgt*bc[1];b+=wgt*bc[2];
        }
        const idx=(y*tw+x)*4;if(twgt>0.001){d[idx]=Math.round(r/twgt);d[idx+1]=Math.round(g/twgt);d[idx+2]=Math.round(b/twgt);}d[idx+3]=255;
      }
    }
  }
  ctx.putImageData(imageData,0,0);
}

function drawRuler(canvas){
  const ctx=canvas.getContext('2d'),tw=canvas.width,ph=canvas.height,R=RULER_W;
  ctx.fillStyle='#080812';ctx.fillRect(0,0,R,ph);
  ctx.font='bold 11px Inter,-apple-system,BlinkMacSystemFont,sans-serif';ctx.textBaseline='middle';
  for(let pct=-50;pct<=150;pct+=5){const y=pctToY(pct,ph),is10=(pct%10===0),isMajor=(pct%50===0),isTrim=(pct===0||pct===100);const tickStart=is10?(isMajor?0:6):16;ctx.strokeStyle=isTrim?'#ff5555':(is10?'#ddd':'#777');ctx.lineWidth=isMajor?1.5:(is10?1:0.6);ctx.beginPath();ctx.moveTo(tickStart,y);ctx.lineTo(R,y);ctx.stroke();if(is10){ctx.fillStyle=isTrim?'#ff5555':'#ccc';ctx.fillText(pct+'%',3,y);}}
  ctx.strokeStyle='#555';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(R-0.5,0);ctx.lineTo(R-0.5,ph);ctx.stroke();
}

function drawGuides(canvas,viewStrip){
  const ctx=canvas.getContext('2d'),tw=canvas.width,ph=canvas.height;
  const trim=getTrimPct(),trimT=pctToY(trim.top,ph),trimB=pctToY(trim.bot,ph);
  drawRuler(canvas);
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(RULER_W,0,tw-RULER_W,trimT);ctx.fillRect(RULER_W,trimB,tw-RULER_W,ph-trimB);
  if(window._markerPct!=null){const my=pctToY(window._markerPct,ph);ctx.strokeStyle='#4a80c0';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.beginPath();ctx.moveTo(RULER_W,my);ctx.lineTo(tw,my);ctx.stroke();ctx.setLineDash([]);const txt=window._markerPct.toFixed(1)+'%';ctx.font='bold 11px Inter,-apple-system,BlinkMacSystemFont,sans-serif';ctx.fillStyle='#4a80c0';ctx.textBaseline='bottom';ctx.fillText(txt,tw-60,my-4);}
  ctx.strokeStyle='rgba(255,60,60,.75)';ctx.lineWidth=1;ctx.setLineDash([8,5]);ctx.beginPath();ctx.moveTo(RULER_W,trimT);ctx.lineTo(tw,trimT);ctx.stroke();ctx.beginPath();ctx.moveTo(RULER_W,trimB);ctx.lineTo(tw,trimB);ctx.stroke();ctx.setLineDash([]);
  if(viewStrip<0){ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=0.5;for(let s=1;s<CONFIG.NS;s++){const sx=RULER_W+Math.round(s*(tw-RULER_W)/CONFIG.NS);ctx.beginPath();ctx.moveTo(sx,0);ctx.lineTo(sx,ph);ctx.stroke();}}
}

function renderPreview(viewStrip){const cv=document.getElementById('cv');renderToCanvas(cv,viewStrip);drawGuides(cv,viewStrip);document.getElementById('cv-col').style.width=cv.width+'px';}

function exportWallpaper(){
  const fw=CONFIG.OW,frh=CONFIG.RH,d=new Uint8ClampedArray(fw*frh*4);for(let i=0;i<d.length;i+=4){d[i]=0;d[i+1]=0;d[i+2]=0;d[i+3]=255;}
  const strips=[0,1,2,3,4,5];let si=0,xi=0,totalCols=0;for(const s of strips)totalCols+=Math.round((s+1)*CONFIG.SW)-Math.round(s*CONFIG.SW);
  const progress=document.createElement('div');progress.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a3a;color:#ccc;padding:12px 24px;border-radius:8px;z-index:99;font:13px Inter,sans-serif';progress.textContent=T.exportProgress0;document.body.appendChild(progress);
  function renderChunk(){
    if(si>=strips.length){finish();return;}
    const s=strips[si],x0=Math.round(s*CONFIG.SW),x1=Math.round((s+1)*CONFIG.SW),stripCX=(x0+x1)/2,segs=P[s],end=Math.min(x1,xi+30);
    for(let x=xi;x<end;x++){const dxPx=x-stripCX;for(let y=0;y<frh;y++){let tw=0,r=0,g=0,b=0;
      for(let gidx=0;gidx<CONFIG.NG;gidx++){const seg=segs[gidx],bc=CONFIG.COLORS[colorIdx(s,gidx)];const effCX=stripCX+seg.cx*((x1-x0)/2),dx2=x-effCX;const cyPx=((seg.cy+50)/200)*frh,dy=y-cyPx;const rad=seg.ang*Math.PI/180,cosA=Math.cos(-rad),sinA=Math.sin(-rad);const u=dx2*cosA-dy*sinA,v=dx2*sinA+dy*cosA;const sYPx=(seg.sy/200)*frh,sXPx=sYPx*seg.sxr;const dist=Math.sqrt((u*u)/(sXPx*sXPx)+(v*v)/(sYPx*sYPx));const wgt=Math.exp(-Math.pow(dist,seg.p)*4.5);tw+=wgt;r+=wgt*bc[0];g+=wgt*bc[1];b+=wgt*bc[2];}
      const idx=(y*fw+x)*4;if(tw>0.001){d[idx]=Math.round(r/tw);d[idx+1]=Math.round(g/tw);d[idx+2]=Math.round(b/tw);}d[idx+3]=255;
    }}
    xi=end;let doneCols=0;for(let ss=0;ss<si;ss++)doneCols+=Math.round((ss+1)*CONFIG.SW)-Math.round(ss*CONFIG.SW);doneCols+=xi-Math.round(s*CONFIG.SW);progress.textContent=T.exportProgress+Math.round(doneCols/totalCols*100)+'%';
    if(xi>=x1){si++;if(si<strips.length)xi=Math.round(strips[si]*CONFIG.SW);}setTimeout(renderChunk,0);
  }
  function finish(){
    const offC=document.createElement('canvas');offC.width=fw;offC.height=frh;offC.getContext('2d').putImageData(new ImageData(d,fw,frh),0,0);
    const trim=getTrimPct(),srcY=Math.round(((trim.top+50)/200)*CONFIG.RH);
    const outC=document.createElement('canvas');outC.width=trim.ew;outC.height=trim.outH;
    outC.getContext('2d').drawImage(offC,0,srcY,CONFIG.OW,trim.outH,0,0,trim.ew,trim.outH);
    outC.toBlob(blob=>{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='luminance-wallpaper.png';a.click();URL.revokeObjectURL(u);progress.remove();});
  }
  renderChunk();
}
