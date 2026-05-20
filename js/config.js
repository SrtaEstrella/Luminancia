const PALETTE = [
  // Reds
  [99, 16, 6],
  [154, 30, 28],
  [228, 3, 3],
  [117, 53, 61],
  [213, 45, 0],
  [232, 52, 36],
  [225, 79, 38],

  // Oranges
  [239, 118, 39],
  [255, 140, 0],
  [255, 154, 86],

  // Yellows
  [238, 174, 64],
  [255, 235, 180],
  [255, 216, 0],
  [255, 237, 0],
  [219, 232, 127],
  [250, 229, 79],
  [252, 244, 52],
  [250, 233, 143],
  [236, 253, 89],

  // Yellow-Greens
  [169, 226, 87],

  // Greens
  [23, 35, 11],
  [36, 64, 19],
  [45, 90, 54],
  [0, 128, 38],
  [58, 122, 33],
  [103, 183, 56],
  [107, 212, 120],
  [190, 215, 180],
  [170, 225, 200],
  [178, 252, 183],

  // Cyans / Teals
  [7, 141, 112],
  [38, 206, 170],
  [101, 207, 202],
  [152, 232, 193],
  [143, 250, 232],

  // Light Blues
  [50, 89, 103],
  [53, 101, 150],
  [0, 162, 232],
  [78, 159, 241],
  [123, 173, 226],
  [180, 210, 240],
  [91, 206, 250],
  [220, 230, 245],
  [122, 205, 245],

  // Blues
  [19, 0, 141],
  [45, 3, 136],
  [8, 32, 158],
  [44, 22, 214],
  [0, 56, 168],
  [36, 64, 142],
  [0, 77, 255],
  [46, 65, 213],
  [80, 73, 204],
  [116, 83, 196],
  [98, 99, 245],
  [102, 128, 233],

  // Purples
  [86, 12, 135],
  [104, 26, 212],
  [115, 41, 130],
  [162, 34, 211],
  [156, 89, 209],
  [175, 111, 204],
  [200, 180, 220],
  [210, 200, 240],

  // Magentas
  [128, 0, 128],
  [187, 43, 149],
  [155, 79, 150],
  [186, 97, 182],
  [230, 210, 220],
  [232, 141, 206],

  // Pinks
  [151, 29, 56],
  [163, 2, 98],
  [214, 2, 112],
  [255, 0, 128],
  [221, 47, 84],
  [222, 48, 120],
  [225, 73, 111],
  [209, 92, 118],
  [209, 98, 164],
  [227, 113, 138],
  [245, 169, 184],
  [255, 200, 200],
  [255, 220, 210],

  // Browns / Golds
  [53, 17, 2],
  [83, 34, 30],
  [97, 57, 21],
  [84, 59, 52],
  [150, 73, 47],
  [161, 99, 86],
  [137, 128, 99],
  [216, 103, 67],
  [158, 124, 115],
  [246, 216, 183],

  // Neutrals
  [0, 0, 0],
  [44, 44, 44],
  [71, 70, 68],
  [83, 83, 83],
  [128, 128, 128],
  [233, 235, 236],
  [255, 255, 255],
];

var PALETTE_HEX = PALETTE.map(function (c) {
  return '#' + c.map(function (v) {
    return v.toString(16).padStart(2, '0');
  }).join('');
});

var CONFIG = {
  OW: 1290,
  OH: 2796,
  PAD: 0.5,
  NS: 6,
  NG: 7,
  RENDER_SCALE: 1 / 3
};

CONFIG.RH = CONFIG.OH * (1 + 2 * CONFIG.PAD);
CONFIG.SW = CONFIG.OW / CONFIG.NS;
CONFIG.PW = Math.round(CONFIG.OW * CONFIG.RENDER_SCALE);
CONFIG.PH = Math.round(CONFIG.RH * CONFIG.RENDER_SCALE);

// Dynamic color state
var ACTIVE_COLORS = [[180, 210, 240], [200, 180, 220], [170, 225, 200], [255, 220, 210]];
var ACTIVE_N = 4;
var LSEQ = [0, 1, 2, 3, 0, 1, 2];
var RSEQ = [3, 2, 1, 0, 3, 2, 1];

function colorIdx(s, g) {
  return s < 3 ? LSEQ[g] : RSEQ[g];
}

function stripGroup(s) {
  return s < 3 ? 0 : 1;
}

var PARAM_DEFS = [
  { k: 'cy',  lbl: 'centerY',       min: -50,  max: 150, step: 0.5,  fmt: function (v) { return v.toFixed(1) + '%'; } },
  { k: 'cx',  lbl: 'centerX',       min: -1,   max: 1,   step: 0.02, fmt: function (v) { return v.toFixed(2); } },
  { k: 'sy',  lbl: 'sigmaY',        min: 2,    max: 60,  step: 0.5,  fmt: function (v) { return v.toFixed(1) + '%'; } },
  { k: 'sxr', lbl: 'sigmaX ratio',  min: 0.3,  max: 5,   step: 0.05, fmt: function (v) { return v.toFixed(2); } },
  { k: 'ang', lbl: 'angle',         min: -80,  max: 80,  step: 0.5,  fmt: function (v) { return v.toFixed(1) + '°'; } },
  { k: 'dcy', lbl: 'Δ centerY', min: -50, max: 50,  step: 0.5,  fmt: function (v) { return v.toFixed(1) + '%'; } },
  { k: 'dsy', lbl: 'Δ sigmaY',  min: -20, max: 20,  step: 0.5,  fmt: function (v) { return v.toFixed(1) + '%'; } }
];

// Legacy property getters for backward compatibility
Object.defineProperty(CONFIG, 'COLORS', { get: function () { return ACTIVE_COLORS; } });
Object.defineProperty(CONFIG, 'LSEQ', { get: function () { return LSEQ; } });
Object.defineProperty(CONFIG, 'RSEQ', { get: function () { return RSEQ; } });

CONFIG.COLOR_NAMES = [];
CONFIG.COLOR_HEX = [];

function updateColorMeta() {
  CONFIG.COLOR_NAMES = ACTIVE_COLORS.map(function (_, i) {
    return '#' + (i + 1);
  });
  CONFIG.COLOR_HEX = ACTIVE_COLORS.map(function (c) {
    return '#' + c.map(function (v) {
      return v.toString(16).padStart(2, '0');
    }).join('');
  });
}

updateColorMeta();

/* ---- Locale Strings ---- */

var T_ZH = {
  title: '流光意彩',
  globalCtl: '全局控制',
  fullness: '中心饱满度',
  vScale: '纵向缩放',
  globalOffs: '全局偏移',
  stagger: '右组错位',
  symMode: '左右对称模式',
  symOpt: ['X对称', '平移', 'Y对称', '中心对称'],
  aspectRatio: '长宽比',
  resolution: '分辨率',
  exportSize: '壁纸导出尺寸：',
  advanced: '高级微调',
  segment: '色段',
  isolate: '只看此块',
  colorCustom: '色彩自定义',
  colorCount: '色数',
  randColor: '随机选色',
  randSeq: '随机排序',
  paletteHint: '左键色块切换 · 右键弹出选择',
  reset: '重新生成',
  exportImg: '导出壁纸',
  exportJSON: '导出 JSON',
  importJSON: '导入 JSON',
  arPresets: [
    '19.5:9 (iPhone/三星)',
    '20:9 (国产主流)',
    '20.5:9 (小米数字)',
    '19.8:9 (华为Mate/Pura)'
  ],
  resPresets: ['1080', '1170', '1206', '1290', '1320', '1440'],
  custom: '自定义',
  customARPrompt: '自定义 (高/宽):',
  customResPrompt: '宽度:',
  replaceColor: '替换 #',
  eyedropper: '取色',
  segTooltip: '色段',
  exportProgress: '导出中... ',
  exportProgress0: '导出中... 0%',
  fitBtn: '适合',
  preview: '预览:',
  allStrips: '全部条带',
  stripN: '条带',
  clearMarkerBtn: '✕ 清除标记',
  clearMarkerTitle: '清空标记线',
  refImage: '参考图:',
  upload: '上传',
  clear: '清除',
  themeLight: '☀',
  themeDark: '☾',
  footer: 'Ctrl+滚轮缩放 · 红色虚线外阴影区域输出时裁切 · 点击预览图定位Y坐标',
  leftSeq: '左序',
  rightSeq: '右序',
  zoomOut: '缩小',
  zoomIn: '放大',
  zoomFitTitle: '还原缩放'
};

var T_EN = {
  title: 'Luminancia',
  globalCtl: 'Global Controls',
  fullness: 'Fullness',
  vScale: 'Vertical Scale',
  globalOffs: 'Global Offset',
  stagger: 'Stagger',
  symMode: 'Symmetry Mode',
  symOpt: ['X-Sym', 'Translate', 'Y-Sym', 'Central'],
  aspectRatio: 'Aspect Ratio',
  resolution: 'Resolution',
  exportSize: 'Export Size: ',
  advanced: 'Fine Tuning',
  segment: 'Segment ',
  isolate: 'Isolate',
  colorCustom: 'Color Palette',
  colorCount: 'Colors',
  randColor: 'Random Colors',
  randSeq: 'Random Order',
  paletteHint: 'Left-click cycle · Right-click select',
  reset: 'Reset',
  exportImg: 'Export PNG',
  exportJSON: 'Export JSON',
  importJSON: 'Import JSON',
  arPresets: [
    '19.5:9 (iPhone/Samsung)',
    '20:9 (Pixel/OPPO/vivo/Moto)',
    '20.5:9 (Xiaomi flagship)',
    '19.8:9 (Huawei Pura/Mate)'
  ],
  resPresets: ['1080', '1170', '1206', '1290', '1320', '1440'],
  custom: 'Custom',
  customARPrompt: 'Custom (H/W):',
  customResPrompt: 'Width:',
  replaceColor: 'Replace #',
  eyedropper: 'Pick',
  segTooltip: 'Seg',
  exportProgress: 'Exporting... ',
  exportProgress0: 'Exporting... 0%',
  fitBtn: 'Fit',
  preview: 'Preview:',
  allStrips: 'All Strips',
  stripN: 'Strip ',
  clearMarkerBtn: '✕ Clear Marker',
  clearMarkerTitle: 'Clear marker line',
  refImage: 'Ref:',
  upload: 'Upload',
  clear: 'Clear',
  themeLight: '☀',
  themeDark: '☾',
  footer: 'Ctrl+Scroll to zoom · Shaded areas cropped on export · Click preview to mark Y position',
  leftSeq: 'Left Side',
  rightSeq: 'Right Side',
  zoomOut: 'Zoom Out',
  zoomIn: 'Zoom In',
  zoomFitTitle: 'Reset Zoom'
};

var T = T_ZH;

function switchLang(lang) {
  T = Object.assign({}, lang === 'en' ? T_EN : T_ZH);
}
