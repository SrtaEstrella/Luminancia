# 渐变壁纸生成器 — 技术调研方案 v2

**调研日期**: 2026-05-17
**对标参考**: iOS 26.5 Pride Luminance 壁纸（垂直条纹 / fluted glass 折射效果）
**需求概要**: 用户选取 3~6 色，程序按预设规则生成竖条拼接壁纸。每条内部有带角度和位置的渐变点，产生有机光影效果。手机 6 条带、iPad 12 条带。左右条带硬分割无过渡。

---

## 1. 对标分析：Pride Luminance 的设计语言

### 1.1 我们从 Pride Luminance 身上拆出了什么

| 设计特征 | 具体表现 | 技术含义 |
|----------|----------|----------|
| 竖条硬分割 | 条与条之间是清晰的垂直边界，无过渡混合 | 不需要 overlap blending，渲染边界即条带边界 |
| 条内渐变（非平涂） | 每条内部有明暗光影流动，而非一个纯色块 | 每个条带是一个独立的渐变场 |
| "fluted glass" 折射感 | 像光线穿过槽纹玻璃柱体：亮区、暗区、高光线 | 控制点排布 + 各向异性扩散 → 模拟折射光影 |
| 同色系明暗层次 | 深色和浅色同色相搭配时，条内出现流动的高光 | 调色板不仅是 hue 变化，同色相的 luminance 梯度也很关键 |
| 渐变方向以纵向为主 | 颜色流动是上下方向的，光带沿竖条延伸 | 控制点的 spreadX > spreadY（横向扩散宽，产生水平光带） |
| 11 种预设色彩方案 | 基于不同 Pride 旗帜的配色 | 预设系统需要支持 palette + 规则的组合矩阵 |

### 1.2 Pride Luminance 和我们方案的对齐点

Pride Luminance 的 "fluted glass" 效果，核心就是**在每个竖条内放置带角度偏移的渐变控制点**，让不同颜色/明度以不同角度交汇，产生折射般的光影交错——这与我们方案中的数据模型高度吻合。

差别在于：Pride Luminance 是动画的（解锁时 shimmer），我们 Phase 1 做静态壁纸即可，动画留到后续。

---

## 2. 需求拆解（修正后）

| 需求 | 技术含义 |
|------|----------|
| 3~6 个用户自选颜色 | 输入：调色板。注意不仅是 3~6 个不同色相，可以是同色相的深浅变化 |
| 6 或 12 个竖直条带左右拼接 | 输出：W×H 图像，水平切分为 N 等宽竖条 |
| 左半一组，右半一组 | N/2 条共享一条预设规则 |
| 组内条带渐变相似但有错位 | 每条带在模板控制点基础上叠加 y 偏移，产生流动错落感 |
| 渐变点一维分布（纵向），各有位置和角度 | 单条带内控制点沿 y 轴排布；每个点带独立 angle、spreadX、spreadY |
| **条带之间硬分割** | 无 overlap blending，渲染边界即条带边界 |
| **渐变方向以纵向为主** | 但 angle 参数允许斜向光带，模拟折射的斜向高光 |

---

## 3. 平台选型

结论不变：**首选 Web Canvas 2D**。

新增一个考量：Pride Luminance 的 shimmer 动画暗示苹果可能在用 Metal shader 实时计算。我们如果后续要做动画，Canvas 2D 在 60fps 下对逐像素高斯混合求值压力很大。因此架构上应为 WebGL 迁移预留接口——核心算法（各向异性高斯加权混合）保持为纯函数，Canvas 版本和 WebGL shader 版本共享同一套数据模型。

---

## 4. 数据模型设计

### 4.1 顶层配置

```typescript
interface WallpaperConfig {
  canvasWidth: number;        // e.g. 1170 (iPhone) or 2048 (iPad)
  canvasHeight: number;       // e.g. 2532 (iPhone) or 2732 (iPad)
  stripCount: 6 | 12;

  palette: OKLCH_Color[];     // 3~6 colors from user (stored in OKLCH)

  leftGroupPreset: PresetRule;
  rightGroupPreset: PresetRule;

  grainIntensity: number;     // 0~1, film grain
}
```

### 4.2 预设规则（PresetRule）

```typescript
interface GradientPoint {
  colorIndex: number;     // 指向 palette
  yRatio: number;         // 竖直位置，0=顶部 1=底部
  angleDeg: number;       // 扩散角度，0=水平光带，±45=斜向光带，±90=纵向条纹
  spreadX: number;        // 横向扩散半径（归一化到条带宽度）
  spreadY: number;        // 纵向扩散半径（归一化到画布高度）
  luminanceShift: number; // 明度偏移，-1~+1。使该控制点的颜色比 palette 中更暗/更亮
  opacity: number;        // 0~1，控制点强度
}

interface PresetRule {
  name: string;
  description: string;
  gradientPoints: GradientPoint[];   // 5~15 个点，模板
  stripOffsets: number[];             // 每条带的 yRatio 增量，长度 = N/2
}
```

### 4.3 新增字段：luminanceShift

这是对标 Pride Luminance 的关键设计。Pride Luminance 的 fluted glass 效果依赖同色相的明暗层次变化。`luminanceShift` 允许预设规则对同一 palette 颜色自动衍生出更亮/更暗的变体，无需用户手动选 12 个色。

例如用户选了 4 个颜色 `[深蓝, 紫, 粉, 暖金]`，预设规则可以自动为深蓝衍生出 `深蓝+0.3L`、`深蓝-0.2L` 等明暗变体，分配到不同控制点，产生折射光影。

### 4.4 预设规则示例（修正版）

**预设 A — "槽纹玻璃"（fluted glass）**：
对标 Pride Luminance vertical 模式。横向光带主导，带轻微斜向高光。
```
控制点 1: 颜色0, y=0.0,  angle=0°,   spreadX=2.5 spreadY=0.12 lumShift=+0.15
控制点 2: 颜色0, y=0.15, angle=5°,   spreadX=1.8 spreadY=0.08 lumShift=-0.10
控制点 3: 颜色1, y=0.30, angle=-3°,  spreadX=2.2 spreadY=0.14 lumShift=0
控制点 4: 颜色1, y=0.45, angle=8°,   spreadX=1.5 spreadY=0.10 lumShift=+0.20
控制点 5: 颜色2, y=0.55, angle=-5°,  spreadX=2.0 spreadY=0.12 lumShift=-0.05
控制点 6: 颜色2, y=0.70, angle=3°,   spreadX=1.6 spreadY=0.09 lumShift=+0.15
控制点 7: 颜色3, y=0.85, angle=-8°,  spreadX=2.3 spreadY=0.13 lumShift=0
控制点 8: 颜色3, y=1.0,  angle=0°,   spreadX=2.5 spreadY=0.12 lumShift=-0.10
stripOffsets: [0, +0.06, -0.04, +0.10, -0.07, +0.03]
```
效果：每个颜色产生明暗两层光带，角度微偏产生折射感。条带偏移产生波浪流动。

**预设 B — "极光帘幕"**：
斜向光带为主，角度变化剧烈，spreadY 较小（锐利过渡）。
```
控制点 1: 颜色0, y=0.0,  angle=35°,  spreadX=2.5 spreadY=0.06 lumShift=0
控制点 2: 颜色1, y=0.25, angle=25°,  spreadX=2.0 spreadY=0.07 lumShift=+0.10
控制点 3: 颜色2, y=0.50, angle=15°,  spreadX=2.5 spreadY=0.06 lumShift=-0.05
控制点 4: 颜色1, y=0.75, angle=30°,  spreadX=2.0 spreadY=0.07 lumShift=+0.10
控制点 5: 颜色0, y=1.0,  angle=35°,  spreadX=2.5 spreadY=0.06 lumShift=0
stripOffsets: [0, +0.18, -0.10, +0.05, -0.15, +0.08]
```
效果：大面积斜向色带快速错位，模拟极光帘幕感。

**预设 C — "色散棱镜"**：
多角度交叉，细碎光带交织。
```
控制点 1: 颜色0, y=0.08, angle=-40°, spreadX=1.4 spreadY=0.10 lumShift=+0.10
控制点 2: 颜色2, y=0.18, angle=30°,  spreadX=1.4 spreadY=0.08 lumShift=-0.05
控制点 3: 颜色1, y=0.30, angle=-20°, spreadX=1.6 spreadY=0.12 lumShift=0
控制点 4: 颜色3, y=0.40, angle=45°,  spreadX=1.4 spreadY=0.09 lumShift=+0.15
控制点 5: 颜色0, y=0.52, angle=10°,  spreadX=1.6 spreadY=0.11 lumShift=-0.10
控制点 6: 颜色2, y=0.65, angle=-50°, spreadX=1.4 spreadY=0.08 lumShift=+0.05
控制点 7: 颜色1, y=0.78, angle=25°,  spreadX=1.5 spreadY=0.10 lumShift=-0.08
控制点 8: 颜色3, y=0.90, angle=-35°, spreadX=1.4 spreadY=0.09 lumShift=+0.10
控制点 9: 颜色2, y=1.0,  angle=0°,   spreadX=2.0 spreadY=0.14 lumShift=0
stripOffsets: [0, -0.04, +0.07, -0.03, +0.09, -0.06]
```
效果：不同颜色的光带以不同角度交叉融合，模拟棱镜色散。

---

## 5. 核心渲染算法

### 5.1 单条带渲染

条带 s 的渲染独立于其他条带。给定宽度范围 `[x_start, x_end]` 和该条带的渐变点列表（已叠加 stripOffset）：

```
// 对条带内每个像素 (x, y)
totalWeight = 0
colorSum = (0, 0, 0)   // 在 OKLCH 空间累加

For each gradient point p:
    // 1. 坐标归一化
    dx = (x - stripCenterX) / stripWidth         // [-0.5, 0.5]
    dy = (y / canvasHeight) - p.yRatio_effective  // yRatio 已叠加 stripOffset

    // 2. 按角度旋转坐标系
    rad = p.angleDeg * PI / 180
    dx_rot =  dx * cos(rad) + dy * sin(rad)
    dy_rot = -dx * sin(rad) + dy * cos(rad)

    // 3. 各向异性距离
    dist = sqrt((dx_rot / p.spreadX)² + (dy_rot / p.spreadY)²)

    // 4. 高斯权重（衰减系数 4.5，dist=1 处权重 ~1%）
    weight = p.opacity * exp(-dist² * 4.5)

    // 5. 累计（OKLCH 空间）
    totalWeight += weight
    colorSum.L += weight * (baseColor[p.colorIndex].L + p.luminanceShift)
    colorSum.C += weight * baseColor[p.colorIndex].C
    colorSum.H += weight * baseColor[p.colorIndex].H  // 色相需环形插值

// 归一化 + OKLCH→RGB 转换
finalColor = OKLCH_to_RGB(colorSum / totalWeight)
```

### 5.2 色相的环形插值

OKLCH 的 H（色相）是角度值（0°~360°），不能直接算术平均。加权混合时需要用复数方法：

```
H_sum_real = Σ weight * cos(H_i * π / 180)
H_sum_imag = Σ weight * sin(H_i * π / 180)
H_blended = atan2(H_sum_imag, H_sum_real) * 180 / π
```

这是 OKLCH 混合中唯一需要特殊处理的点。L 和 C 可以直接算术加权平均。

### 5.3 条带硬分割（无需过渡）

与 v1 方案的关键区别：条带之间不做任何混合。每个条带的 `x_start` 和 `x_end` 精确等于分配宽度，像素不会跨条带采样。这简化了渲染管线——每个条带可以完全独立渲染，甚至可以并行（Web Worker / 分块渲染）。

### 5.4 性能评估（修正）

1080×2532（iPhone 尺寸），6 条带：
- 每条带 180×2532 ≈ 456K 像素
- 每像素求值 8 个控制点 ≈ 3.6M 次高斯核
- Canvas 2D 预计 150~300ms
- 若降采样到 1/2 分辨率渲染再放大：< 50ms，视觉无损

2048×2732（iPad 尺寸），12 条带：
- 每条带 170×2732 ≈ 465K 像素
- 每像素求值 8 个控制点 ≈ 3.7M 次高斯核 × 12 = 44M 次
- Canvas 2D 预计 600~1200ms
- 建议降采样渲染（在 1024×1366 渲染再放大）：< 100ms

---

## 6. 色彩空间：OKLCH 的完整方案

### 6.1 为什么必须 OKLCH

RGB 空间蓝→橙的中点产生灰褐色。OKLCH 的 perceptual uniformity 保证了过渡色彩的鲜艳度，这对壁纸品质是决定性的。

### 6.2 转换链路

```
用户选择 hex 颜色
  → RGB (sRGB)
  → 线性 RGB (去 gamma)
  → LMS (cone response)
  → OKLab
  → OKLCH (L, C, H)
  → [渲染：在 OKLCH 空间加权混合]
  → OKLab
  → LMS
  → 线性 RGB
  → sRGB (加 gamma)
  → ImageData 写入 canvas
```

### 6.3 依赖选择

两个选项：

**选项 A — 手写转换（~60 行）**：
参考 Björn Ottosson 的 OKLab 论文中的矩阵公式。优点：零依赖，完全可控。缺点：需要验证精度。

**选项 B — culori（12KB, MIT）**：
`culori.oklch('#ff6600')` 一行搞定。优点是经过充分测试的转换精度，缺点是多一个依赖。

推荐 Phase 1 用 culori 快速验证效果，Phase 2 若在意零依赖可以手写替换。culori 的 OKLCH 实现是 Björn Ottosson 本人审核过的。

---

## 7. 渲染算法层面：无开源可复用接口

这是用户明确指出的关键点，也是本方案需要手搓渲染核心的原因。

### 7.1 为什么现有库不适用

| 现有方案 | 不匹配原因 |
|----------|-----------|
| CSS `linear-gradient` / `conic-gradient` | 不支持各向异性扩散、不支持控制点角度独立设置 |
| CSS `@property` + 动画 | 只能做简单色标过渡，无控制点概念 |
| Canvas `createLinearGradient` | 仅双点线性，无多控制点/角度/扩散半径 |
| Paper Shaders `MeshGradient` | wave distortion 是全局参数，不是逐控制点 angle+spread |
| shadergradient | density/frequency 是全局 uniform，无逐点 anisotropy |
| Three.js / R3F 后处理 | 可以做，但过度工程化——我们是 2D 壁纸，不需要 3D 管线 |

### 7.2 我们需要手写的部分

| 模块 | 代码量 | 复杂度 |
|------|--------|--------|
| OKLCH ↔ sRGB 转换（或引入 culori） | ~60 行（手写）或 1 行（culori） | 中（矩阵运算） |
| 各向异性高斯核求值 | ~20 行 | 低 |
| 控制点加权混合循环 | ~30 行 | 低 |
| ImageData 写入 + 降采样放大 | ~15 行 | 低 |
| 噪点纹理（hash 函数） | ~15 行 | 低 |
| 条带拼接（硬分割，无混合） | ~10 行 | 低 |
| **总计** | **~150 行** | |

核心渲染逻辑清晰、量小，真正的工程工作在于：
- 预设规则参数调优（需要大量目测迭代）
- UI 交互（颜色选择器、预设切换、下载）
- 色彩空间转换的精度验证

---

## 8. 降采样策略（性能优化核心）

渐变是天然的低频信号——相邻像素的颜色差异极小。这意味着一半甚至 1/4 分辨率渲染后双线性放大，肉眼无法察觉差异。

```
策略：renderScale = 0.5  // 默认
renderW = canvasWidth  * renderScale  (e.g. 585 for iPhone)
renderH = canvasHeight * renderScale  (e.g. 1266 for iPhone)

// 在小 canvas 上渲染
smallCanvas = document.createElement('canvas')
smallCanvas.width = renderW; smallCanvas.height = renderH
renderStrips(smallCanvas, config)  // 计算量降为 1/4

// 放大到目标 canvas
ctx.imageSmoothingEnabled = true
ctx.drawImage(smallCanvas, 0, 0, canvasWidth, canvasHeight)
```

对 1080p 6 条带：从 150~300ms 降至 25~40ms，可支持实时 slider 拖动。

---

## 9. 预设系统设计

### 9.1 预设 = Palette × Rule 的矩阵

Pride Luminance 有 11 种 color scheme × 2 种 pattern = 22 种组合。我们类似：
- Palette：用户选 3~6 色（可保存为预设）
- Rule：渐变规则（可独立于 palette 选择）
- 左组规则和右组规则可以不同

### 9.2 MVP 预设规则库（6 条）

| 预设名 | 对标 | 控制点数 | 特点 |
|--------|------|---------|------|
| **槽纹玻璃** | Pride Luminance vertical | 8 | 水平光带 + 明暗交替 + 微角度偏差 |
| **极光帘幕** | 斜向扫掠 | 5 | 大角度变化 + 小 spreadY（锐利过渡） |
| **色散棱镜** | 多角度交叉 | 9 | 各控制点角度差异大，模拟折射色散 |
| **柔焦弥散** | 镜头虚化感 | 4 | 大 spreadX/Y，极柔过渡，少控制点 |
| **锐利切片** | 区块分明 | 6 | 小 spreadY（0.04~0.08），颜色区块清晰 |
| **波浪流动** | 正弦错位 | 7 | stripOffsets 呈正弦波分布，有机流动感 |

### 9.3 内置调色板预设（6 套，对标 Pride Luminance 旗帜）

| 名称 | 颜色 |
|------|------|
| **经典彩虹** | #FF3B30, #FF9500, #FFCC00, #34C759, #007AFF, #AF52DE |
| **日落暖调** | #8B1E3F, #D4563C, #E8894B, #F4C17B, #A64253, #5C2344 |
| **海洋冷调** | #0B3D5C, #1A6B8A, #2D9CB4, #5DBFCC, #1E4D6B, #0A2E44 |
| **暮光紫金** | #1A0533, #4A1A6B, #8B3A9E, #C56E33, #E8A94E, #2D0B4E |
| **森林暖翠** | #1B3A2D, #2D6B4A, #4A9E5C, #7BC67E, #C4D44C, #3A5C25 |
| **中性灰度** | #1A1A2E, #3D3D56, #6B6B8A, #A0A0B8, #D0D0E0, #0D0D1A |

---

## 10. 文件结构

```
gradient-wallpaper/
├── index.html              # 单页应用
├── js/
│   ├── renderer.js         # 核心渲染 (~80 行)：各向异性高斯核 + ImageData 写入 + 降采样
│   ├── presets.js          # 预设规则 + 内置调色板（纯数据）
│   ├── color.js            # OKLCH ↔ sRGB 转换（或 culori wrapper）
│   ├── noise.js            # hash 噪点生成器 (~15 行)
│   ├── ui.js               # DOM 交互
│   └── main.js             # 入口
├── generate.py             # Python 批量生成（可选，Phase 2）
└── README.md
```

唯一可能的外部依赖：culori（12KB），仅用于 OKLCH 转换。其余全部零依赖。

---

## 11. 与 v1 方案的差异总结

| 维度 | v1 | v2（修正后） |
|------|-----|-------------|
| 条带边界 | 重叠混合带 | **硬分割**，无过渡 |
| 渐变方向 | 未明确 | **纵向为主**，angle 控制斜向偏移 |
| 对标参考 | 泛苹果壁纸风格 | **Pride Luminance fluted glass** |
| 颜色模型 | RGB 插值 | **OKLCH**，增加 luminanceShift 参数 |
| 可行复用接口 | 假设可能有 | **确认不存在**，全部手搓 |
| 降采样渲染 | 提到但未强调 | **默认策略**，renderScale=0.5 |

---

## 12. 结论

**方案：Web Canvas 2D + OKLCH 色域 + 各向异性高斯核 + 降采样渲染。**

核心渲染代码约 150 行，算法清晰（2D 各向异性散点插值）。与 Pride Luminance 的对标体现在：硬分割竖条、fluted glass 明暗折射光带、基于同色相 luminance 变化的有机光影。预设系统通过 JSON 数据驱动，新增规则不改代码。OKLCH 色彩空间保证过渡不脏。降采样渲染保证交互流畅度。
