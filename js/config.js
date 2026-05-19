const PALETTE=[
  [228,3,3],[213,45,0],[239,118,39],[255,154,86],[255,140,0],[255,0,128],[214,2,112],[245,169,184],[209,98,164],[163,2,98],
  [255,237,0],[252,244,52],[255,216,0],
  [0,128,38],[7,141,112],[38,206,170],[152,232,193],
  [0,77,255],[0,56,168],[0,162,232],[91,206,250],[123,173,226],[36,64,142],
  [115,41,130],[155,79,150],[156,89,209],[80,73,204],[128,0,128],
  [97,57,21],[0,0,0],[44,44,44],[128,128,128],[255,255,255]
];
const PALETTE_HEX=PALETTE.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''));

const CONFIG={OW:1290,OH:2796,PAD:0.5,NS:6,NG:7,RENDER_SCALE:1/3};
CONFIG.RH=CONFIG.OH*(1+2*CONFIG.PAD);CONFIG.SW=CONFIG.OW/CONFIG.NS;CONFIG.PW=Math.round(CONFIG.OW*CONFIG.RENDER_SCALE);CONFIG.PH=Math.round(CONFIG.RH*CONFIG.RENDER_SCALE);

// 动态色彩
let ACTIVE_COLORS=[[255,154,86],[255,255,255],[38,206,170]];
let ACTIVE_N=3;
let LSEQ=[1,0,2,1,0,2,1],RSEQ=[2,1,0,2,1,0,2];

function colorIdx(s,g){return s<3?LSEQ[g]:RSEQ[g];}
function stripGroup(s){return s<3?0:1;}

const PARAM_DEFS=[{k:'cy',lbl:'centerY',min:-50,max:150,step:0.5,fmt:v=>v.toFixed(1)+'%'},{k:'cx',lbl:'centerX',min:-1,max:1,step:0.02,fmt:v=>v.toFixed(2)},{k:'sy',lbl:'sigmaY',min:2,max:60,step:0.5,fmt:v=>v.toFixed(1)+'%'},{k:'sxr',lbl:'sigmaX ratio',min:0.3,max:5,step:0.05,fmt:v=>v.toFixed(2)},{k:'ang',lbl:'angle',min:-80,max:80,step:0.5,fmt:v=>v.toFixed(1)+'°'},{k:'dcy',lbl:'Δ centerY',min:-50,max:50,step:0.5,fmt:v=>v.toFixed(1)+'%'},{k:'dsy',lbl:'Δ sigmaY',min:-20,max:20,step:0.5,fmt:v=>v.toFixed(1)+'%'}];

// 旧接口兼容
Object.defineProperty(CONFIG,'COLORS',{get:()=>ACTIVE_COLORS});
Object.defineProperty(CONFIG,'LSEQ',{get:()=>LSEQ});
Object.defineProperty(CONFIG,'RSEQ',{get:()=>RSEQ});
CONFIG.COLOR_NAMES=[];CONFIG.COLOR_HEX=[];
function updateColorMeta(){
  CONFIG.COLOR_NAMES=ACTIVE_COLORS.map((_,i)=>'#'+(i+1));
  CONFIG.COLOR_HEX=ACTIVE_COLORS.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''));
}
updateColorMeta();

// 文本字段
const T_ZH={
  globalCtl:'全局控制',fullness:'中心饱满度',vScale:'纵向缩放',globalOffs:'全局偏移',stagger:'右组错位',
  symMode:'左右对称模式',symOpt:['X对称','平移','Y对称','中心对称'],
  aspectRatio:'长宽比',resolution:'分辨率',exportSize:'壁纸导出尺寸：',advanced:'高级微调',
  segment:'色段',isolate:'只看此块',colorCustom:'色彩自定义',colorCount:'色数',
  randColor:'随机选色',randSeq:'随机排序',paletteHint:'左键色块切换 · 右键弹出选择',
  reset:'重新生成',exportImg:'导出壁纸',exportJSON:'导出 JSON',importJSON:'导入 JSON',
  arPresets:['19.5:9 (iPhone/三星)','20:9 (国产主流)','20.5:9 (小米数字)','19.8:9 (华为Mate/Pura)'],
  resPresets:['1080','1170','1206','1290','1320','1440'],
  custom:'自定义',customARPrompt:'自定义 (高/宽):',customResPrompt:'宽度:',
  replaceColor:'替换 #',segTooltip:'色段',exportProgress:'导出中... ',exportProgress0:'导出中... 0%',
  fitBtn:'适合',preview:'预览:',allStrips:'全部条带',stripN:'条带',
  clearMarkerBtn:'✕ 清除标记',clearMarkerTitle:'清空标记线',refImage:'参考图:',upload:'上传',clear:'清除',
  themeLight:'☀',themeDark:'☾',
  footer:'Ctrl+滚轮缩放 · 红色虚线外阴影区域输出时裁切 · 点击预览图定位Y坐标',
  leftSeq:'左序',rightSeq:'右序',
  zoomOut:'缩小',zoomIn:'放大',zoomFitTitle:'还原缩放',
};
const T_EN={
  globalCtl:'Global Controls',fullness:'Fullness',vScale:'Vertical Scale',globalOffs:'Global Offset',stagger:'Stagger',
  symMode:'Symmetry Mode',symOpt:['X-Sym','Translate','Y-Sym','Central'],
  aspectRatio:'Aspect Ratio',resolution:'Resolution',exportSize:'Export Size: ',advanced:'Fine Tuning',
  segment:'Segment ',isolate:'Isolate',colorCustom:'Color Palette',colorCount:'Colors',
  randColor:'Random Colors',randSeq:'Random Order',paletteHint:'Left-click cycle · Right-click pick',
  reset:'Reset',exportImg:'Export PNG',exportJSON:'Export JSON',importJSON:'Import JSON',
  arPresets:['19.5:9 (iPhone/Samsung)','20:9 (Pixel/OPPO/vivo/Moto)','20.5:9 (Xiaomi flagship)','19.8:9 (Huawei Pura/Mate)'],
  resPresets:['1080','1170','1206','1290','1320','1440'],
  custom:'Custom',customARPrompt:'Custom (H/W):',customResPrompt:'Width:',
  replaceColor:'Replace #',segTooltip:'Seg',exportProgress:'Exporting... ',exportProgress0:'Exporting... 0%',
  fitBtn:'Fit',preview:'Preview:',allStrips:'All Strips',stripN:'Strip ',
  clearMarkerBtn:'✕ Clear Marker',clearMarkerTitle:'Clear marker line',refImage:'Ref:',upload:'Upload',clear:'Clear',
  themeLight:'☀',themeDark:'☾',
  footer:'Ctrl+Scroll to zoom · Shaded areas cropped on export · Click preview to mark Y position',
  leftSeq:'Left Side',rightSeq:'Right Side',
  zoomOut:'Zoom Out',zoomIn:'Zoom In',zoomFitTitle:'Reset Zoom',
};
let T=T_ZH;
function switchLang(lang){T=Object.assign({},lang==='en'?T_EN:T_ZH);}
