# 支援未来 · 个人门户

纯静态单页：开屏动画 → 滚动门面（双图渐变）→ 站点简介 → 页脚（占位，待设计）。
没有构建步骤、没有后端，GitHub 上改了文件、网站就跟着变。

> 2026-10-28 定稿：仓库按功能分文件夹，每个文件夹就是一个部件。

## 仓库结构

```
Monarchish.github.io/
├── index.html              ← 网站入口（骨架 + 简介文案 + 页脚文案）
├── README.md               ← 本说明
├── .nojekyll               ← 关掉 GitHub Pages 自带的 Jekyll 处理（别删）
│
├── 1、开屏动画/             ← 进站的开场揭幕
│   ├── 样式.css
│   ├── 动画.js
│   └── 标志-白.png          ← 「进入」按钮的 S 标志
│
├── 2、滚动门面/             ← 滑屏介绍（handbook 原版动画 + 双图渐变）
│   ├── 样式.css
│   ├── 动画.js              ← 滚动剧情 + 双图渐变（搜 swapProgress 调时机）
│   ├── 主图-开场.webp       ← 1952 全分辨率
│   ├── 主图-结尾.webp       ← 1952 全分辨率
│   ├── 蒙版窗.svg           ← 中间的像素阶梯开窗
│   └── 方格网.svg
│
├── 3、站点简介/             ← 门面之后的几段总介绍
│   └── 样式.css             ← 文案在 index.html 搜 home-intro
│
├── 4、页脚/                 ← 页脚（占位，待设计）
│   └── 样式.css             ← 文案在 index.html 搜 site-footer
│
└── 0、公共库/               ← gsap / ScrollTrigger / CustomEase /
    │                          ScrambleText / lenis（开屏和门面共用，自托管不吃 CDN）
    └── 字体/                ← 简介与页脚用的两个 woff2
```

## 常用调整

- **改简介/页脚文案**：`index.html` 搜 `home-intro` / `site-footer`；改样式去对应文件夹的 `样式.css`。
- **换门面主图**：替换 `2、滚动门面/主图-开场.webp`（开场）/ `主图-结尾.webp`（结尾）。
- **改门面文案**：`index.html` 搜 `hero-content-block`。
- **调双图渐变**：`2、滚动门面/动画.js` 搜 `swapProgress`。
- **调亮度**：同文件搜 `heroImgOverlayOpacity`。
- **开屏小字**：`1、开屏动画/动画.js` 顶部的 CONTENT 表。

## 调试开关（网址后面加参数）

`?hero=0` 直达简介 · `?reveal=0` 跳过开屏 · `?jump=1` 直接跳到简介 · `?seen=0` 重看完整入场
