# 支援未来 · 个人门户

纯静态单页：开屏动画 → 滚动门面（双图渐变）→ 几段总介绍 → 页脚（占位，待设计）。
没有构建步骤、没有后端，GitHub 上改了文件、网站就跟着变。

> 2026-10-28 定稿：原来的目录 / SOP 正文 / 侧栏 / 内容门锁整块已移除，
> 现在只是一个简单的 home 门户。git 历史里有全部旧版，随时可回溯。

## 仓库结构

```
Monarchish.github.io/
├── index.html              ← 网站入口（骨架 + 介绍文案 + 页脚，改文案就动它）
├── README.md               ← 本说明
├── .nojekyll               ← 关掉 GitHub Pages 自带的 Jekyll 处理（别删）
│
└── 01、设置/
    ├── 03.Hero门面样式.css   ← 滚动门面外观
    ├── 04.Hero门面.js        ← 门面滚动剧情 + 双图渐变
    ├── 06.开屏动画样式.css   ← 进站的开场动画
    ├── 07.开屏动画.js
    ├── 素材/                 ← 门面主图 B/D、蒙版窗、方格网、开屏标志
    └── 库/                   ← 自托管的 gsap / ScrollTrigger / CustomEase /
                                ScrambleText / lenis + 两个字体（不依赖外部 CDN）
```

## 常用调整

- **改介绍文案 / 页脚**：`index.html` 搜 `home-intro` / `site-footer`，文字都在那里。
- **换门面主图**：替换 `01、设置/素材/06.门面主图B.webp`（结尾图）/ `07.门面主图D.webp`（开场图）。
- **改门面文案**：`index.html` 搜 `hero-content-block`。
- **调双图渐变**：`01、设置/04.Hero门面.js` 搜 `swapProgress`。
- **调亮度**：同文件搜 `heroImgOverlayOpacity`。
- **开屏小字**：`01、设置/07.开屏动画.js` 顶部的 CONTENT 表。

## 调试开关（网址后面加参数）

`?hero=0` 直达简介 · `?reveal=0` 跳过开屏 · `?jump=1` 直接跳到简介 · `?seen=0` 重看完整入场
