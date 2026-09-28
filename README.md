# 粒子形态 · Particle Morph

全屏交互粒子形态演示（Vite + TypeScript + Three.js）。多数模式由**参考图亮度/颜色采样**烘焙为目标点云，模式之间平滑变形；拖拽可看到有限轨道视差。

Fullscreen interactive particle morph demo. Most modes are **image-sampled** layouts (luminance + RGB) baked offline, then morph-eased between targets.

**License:** MIT © 2026 PandorAI

## 快速开始 / Quick start

```bash
npm i
npm run bake          # 从 public/refs 生成 public/layouts/*.bin
npm run dev           # http://localhost:5173
```

生产构建：

```bash
npm run build         # 会先 bake，再输出到 dist/
npm run preview
```

可选环境变量：

| 变量 | 含义 |
|------|------|
| `BAKE_MAX_COUNT` | 烘焙粒子数（默认 `280000`；Vercel 构建用 `60000`（控制 `dist` 体积） 以控制产物体积） |
| `MODE` | 只烘焙单个模式，例如 `MODE=nasaWeekly npm run bake` |
| `NASA_API_KEY` | 可选，给 weekly 脚本更高限额（images-api 轻量使用可不设） |
| `FORCE=1` | `weekly-nasa` 忽略「本周已拉过」跳过逻辑 |

## 模式分组 / Mode groups

共 **45** 个可选模式（UI 可筛选、分组滚动）：

| 分组 | 数量 | 快捷键 | 说明 |
|------|------|--------|------|
| **经典** | 8 | `1`–`8` | 含图像采样 + 少量程序化（飞溅/光晕/雾山） |
| **Pinterest A** | 10 | `a`–`j` | 单色粒子参考图 |
| **Pinterest B** | 14 | `k`–`x` | 第二批 Pinterest 参考 |
| **NASA** | 13 | `Shift+A`–`L`，`Shift+W` | NASA 公开域彩色图像；**本周 NASA** = `nasaWeekly` |

交互：拖拽旋转 · 滚轮缩放 · `/` 聚焦筛选 · 自动演示。

## 截图 / Screenshots

仓库内 `screenshots/` 为本地预览截图（不一定随 git 发布）。自行重拍可用 `scripts/shoot.mjs` / `shoot-pin.mjs`（需 Chrome + 本地 dev server）。

## 部署 / Deploy（Vercel）

本项目为静态站点：`npm run build` → **`dist`**。

在 [Vercel](https://vercel.com) 导入仓库后建议：

| 设置 | 值 |
|------|-----|
| Framework | Vite（或 Other） |
| Install | `npm install` |
| Build | `npm run build` |
| Output | `dist` |
| Root | 仓库根目录（本项目） |

`vercel.json` 已写入上述约定，并用 `BAKE_MAX_COUNT=60000` 控制构建时烘焙体积（本地默认仍为 28 万）。若托管限额更宽松，可在 Vercel 环境变量里调高。  
**不要**提交巨大的 `public/layouts/*.bin`（已在 `.gitignore`）；构建时由 `prebuild` 从 `public/refs` 重新生成。

也可任意静态托管：`dist/` 上传到 Cloudflare Pages / Netlify / GitHub Pages（Pages 需自行配置 build）。

## 每周 NASA 更新 / Weekly NASA workflow

目标：每周自动换一张 NASA 图，驱动 **`nasaWeekly`（本周 NASA）** 形态。

```bash
npm run weekly-nasa
# 等价：node scripts/weekly-nasa.mjs
```

脚本会：

1. 按 ISO 周轮换检索词，调用 `https://images-api.nasa.gov/search`
2. 下载 1 张图 → `public/refs/nasa/weekly-latest.jpg`
3. 更新 `public/refs/nasa/manifest.json` 与 `weekly-state.json`
4. 执行 `MODE=nasaWeekly` 重新烘焙
5. 打印 `slug` / `label` JSON

同一周内再次运行会跳过（除非 `FORCE=1`）。

**建议例行（GitHub Actions / cron）：**

```text
每周一：npm run weekly-nasa
       → commit public/refs/nasa/weekly-latest.jpg + manifest/state
       → push → Vercel 自动 build（prebuild 会 bake，含 nasaWeekly）
```

若要把某周图像**永久**加成新 ModeId（而不只覆盖 `nasaWeekly`），需在 `types.ts` / `cameraPresets.ts` / `imageLayout.ts` / `bake-layouts.mjs` 增加条目后全量 `npm run bake`。

## 技术要点

- WebGL `Points` + 自定义 shader，加色混合；每模式 mild bloom（黑洞类关闭）
- 单缓冲 morph（~1.5s ease）；图像模式正面海报构图，轨道约 ±36°
- 烘焙：`scripts/bake-layouts.mjs`（sharp）→ `public/layouts/{mode}.bin`

## Credits / 致谢

- **NASA Image Library** — 多数 NASA 媒体为公共域；来源 [images.nasa.gov](https://images.nasa.gov/) / [images-api.nasa.gov](https://images-api.nasa.gov/)
- 用户提供的 Pinterest / 本地参考图仅作形态采样演示
- 渲染栈：[Three.js](https://threejs.org/) · [Vite](https://vitejs.dev/)

## 开发脚本

| 命令 | 作用 |
|------|------|
| `npm run bake` | 烘焙全部（或 `MODE=` / `BAKE_MAX_COUNT=`） |
| `npm run weekly-nasa` | 拉取本周 NASA 并烘焙 `nasaWeekly` |
| `npm run dev` | 开发服务器（predev 会 bake） |
| `npm run build` | 生产构建到 `dist/` |
