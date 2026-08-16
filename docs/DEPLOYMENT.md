# 部署说明

StyleVault 是静态 Vite 应用，默认可部署到 GitHub Pages、Vercel 或任何静态文件托管。

## 本地验证

```bash
npm ci
npm run check
```

## GitHub Pages

仓库已包含 `.github/workflows/pages.yml`。推送到 `main` 后，GitHub Actions 默认执行：

1. 安装依赖。
2. 运行风格数据校验。
3. 使用 `STYLEVAULT_BASE_PATH=/stylevault/` 构建。

如果当前 GitHub 账号/组织支持私有仓库 Pages，可在仓库变量里设置 `ENABLE_GITHUB_PAGES=true`，然后手动运行 `Validate StyleVault` workflow 发布 `dist`。

当前仓库是私有仓库；如果 GitHub API 返回“current plan does not support GitHub Pages for this repository”，说明账号计划不支持私有仓库 Pages。此时仍可使用 `npm run build` 后把 `dist` 部署到 Vercel、Netlify、Cloudflare Pages 或其他静态托管。

## 非 AI 上线边界

当前部署不包含 AI 多模态识别和服务端 Key 代理。图片识别页会以本地取色、手动拆解、候选匹配和可保存记录的方式运行。
