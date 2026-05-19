let P=[],step=[],_baseP0=[];

function presetAsDefault(){
  P=[];for(let s=0;s<CONFIG.NS;s++)P[s]=[];
  const spec=[{cy:-50,L:20},{cy:-10,L:34},{cy:15,L:56},{cy:45,L:44},{cy:75,L:52},{cy:100,L:36},{cy:150,L:28}];
  const p=1.6+Math.random()*0.8;
  const segCx=spec.map(()=>(Math.random()-0.5)*1.0);
  const segSxr=spec.map(()=>2.5+Math.random()*2.5);
  const segAng=spec.map((_,g)=>{const m=20+Math.random()*40;if(g<=2)return -m;if(g>=4)return m;return Math.random()<0.5?-m:m;});
  step=[{dcy:15,dsy:2},{dcy:14,dsy:6},{dcy:12,dsy:-4},{dcy:5,dsy:-3},{dcy:-5,dsy:-4},{dcy:-6,dsy:4},{dcy:-15,dsy:2}];
  _baseP0=[];for(let g=0;g<CONFIG.NG;g++)_baseP0[g]={cy:spec[g].cy,cx:segCx[g],sy:spec[g].L/2,sxr:segSxr[g],ang:segAng[g],p};
  window._globalOffset=0;window._stagger=0;window._aspectRatio=19.5/9;window._vScale=1;window._exportWidth=1290;window._symMode=0;
  deriveAll();
}

function deriveAll(){
  const offs=window._globalOffset||0,stag=window._stagger||0,vs=window._vScale||1;
  const scy=v=>clamp(50+(v-50)*vs,-50,150);
  const ssy=v=>clamp(v*vs,3,60);
  const N=CONFIG.NG,mode=window._symMode||0;
  // 左组 strip0~2
  for(let g=0;g<N;g++)P[0][g]={..._baseP0[g],cy:clamp(scy(_baseP0[g].cy)+offs,-50,150),sy:ssy(_baseP0[g].sy)};
  for(let off=1;off<=2;off++)for(let g=0;g<N;g++){
    const b=_baseP0[g];
    P[off][g]={cy:clamp(scy(b.cy)+step[g].dcy*off+offs,-50,150),cx:b.cx,sy:clamp(ssy(b.sy)+step[g].dsy*off,3,60),sxr:b.sxr,ang:b.ang,p:b.p};
  }
  // 右组: 依对称模式 (色序始终由 RSEQ 决定, deriveAll 仅处理形状)
  if(mode===0){ // X对称: 0→5, 1→4, 2→3  ang反号
    for(let g=0;g<N;g++){
      P[5][g]={..._baseP0[g],ang:-_baseP0[g].ang,cy:clamp(scy(_baseP0[g].cy)+offs+stag,-50,150),sy:ssy(_baseP0[g].sy)};
      P[4][g]={...P[1][g],ang:-P[1][g].ang,cy:clamp(P[1][g].cy+stag,-50,150)};
      P[3][g]={...P[2][g],ang:-P[2][g].ang,cy:clamp(P[2][g].cy+stag,-50,150)};
    }
  }else if(mode===1){ // 平移: 0→3, 1→4, 2→5  ang同号
    for(let g=0;g<N;g++){
      P[3][g]={...P[0][g],cy:clamp(P[0][g].cy+stag,-50,150)};
      P[4][g]={...P[1][g],cy:clamp(P[1][g].cy+stag,-50,150)};
      P[5][g]={...P[2][g],cy:clamp(P[2][g].cy+stag,-50,150)};
    }
  }else if(mode===2){ // Y对称: 0→3,1→4,2→5  段位倒序+cy翻转  ang反号
    for(let off=0;off<=2;off++)for(let g=0;g<N;g++){
      const src=P[off][N-1-g];
      P[3+off][g]={...src,ang:-src.ang,cy:clamp(100-src.cy+stag,-50,150)};
    }
  }else if(mode===3){ // 中心对称: 0→5,1→4,2→3  段位倒序+cy翻转  ang同号
    for(let off=0;off<=2;off++)for(let g=0;g<N;g++){
      const src=P[off][N-1-g];
      P[5-off][g]={...src,cy:clamp(100-src.cy+stag,-50,150)};
    }
  }
}

function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}

function genDefaults(){presetAsDefault();}
function genRandom(){P=[];for(let s=0;s<CONFIG.NS;s++)P[s]=[];randomGroup(0);randomGroup(5,-1);}
function randomGroup(start,dir){dir=dir||1;for(let g=0;g<CONFIG.NG;g++)P[start][g]={cy:-30+g*32+(Math.random()-0.5)*16,cx:(Math.random()-0.5)*0.6,sy:28+Math.random()*32,sxr:1.8+Math.random()*3.0,ang:(Math.random()-0.5)*40,p:1.2+Math.random()*1.8};const sCY=(10+Math.random()*15)*(Math.random()<0.5?-1:1),sSY=(Math.random()-0.5)*36;for(const off of[1,2]){const si=start+dir*off;for(let g=0;g<CONFIG.NG;g++){const b=P[start][g];P[si][g]={cy:clamp(b.cy+sCY*off,-50,150),cx:b.cx,sy:clamp(b.sy+sSY*off,10,70),sxr:b.sxr,ang:b.ang,p:b.p};}}}

function exportParamsJSON(){return P.map((segs,s)=>({idx:s,group:s<3?0:1,colorSeq:(s<3?CONFIG.LSEQ:CONFIG.RSEQ).map(i=>CONFIG.COLOR_NAMES[i]),segments:segs.map((seg,g)=>({colorIdx:colorIdx(s,g),centerY:seg.cy,centerX:seg.cx,sigmaY:seg.sy,sigmaX_ratio:seg.sxr,angle:seg.ang,sharpness:seg.p})),}));}
