# StyleVault

StyleVault 是一个个人前端设计风格图鉴和 AI 协作工具。它把模糊的“好看一点”“高级一点”压缩成结构化风格数据、CSS 片段和可复制 Prompt。

## 能力范围

- 技术栈：Vue 3 + Vite + TypeScript + CSS Variables
- 数据：`src/data/styles.ts`
- 产品文档：`PRD/StyleVault产品文档.md`
- 上线口径：完整正式版上线，不做残缺 MVP
- 核心能力：风格图鉴、推荐、对比、图片/手动识别、风格混合、识别训练、JSON/CSS/Tailwind/Prompt 导出
- 开源口径：MIT License；不内置私有截图、商业竞品素材或 API Key
- 非 AI 完成口径：风格数据、Markdown 笔记、学习训练、导出、校验、静态部署配置均可用

## 本地运行

```bash
npm install
npm run dev
```

## 环境变量

复制 `.env.example` 为 `.env.local`。当前版本默认使用本地规则；如需接入真实 AI 服务，再填入自己的 Key，并在服务端代理里调用，不要把 Key 写进前端仓库。

## 验证

```bash
npm run validate:styles
npm run build
npm run check
```

## 数据维护

每个风格至少需要具备 7 维度形态拆解、4 个以上配色 token、标签、Prompt、CSS 片段和笔记路径。页面的“数据与导出”模式会显示完整度检查。

生成或刷新风格笔记：

```bash
npm run notes:generate
```

## 部署

仓库包含 GitHub Pages Actions 配置，详见 `docs/DEPLOYMENT.md`。AI 多模态识别和服务端 Key 代理不包含在当前非 AI 上线范围内。
