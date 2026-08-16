# 部署说明

StyleVault 是静态 Vite 应用，默认可部署到 GitHub Pages、Vercel 或任何静态文件托管。

## 本地验证

```bash
npm ci
npm run check
```

## GitHub Pages

仓库已包含 `.github/workflows/pages.yml`。推送到 `main` 后，GitHub Actions 会执行：

1. 安装依赖。
2. 运行风格数据校验。
3. 使用 `STYLEVAULT_BASE_PATH=/stylevault/` 构建。
4. 上传并发布 `dist`。

如果仓库是私有仓库，GitHub Pages 是否可访问取决于当前 GitHub 账号/组织权限。无法启用 Pages 时，仍可使用 `npm run build` 后把 `dist` 部署到其他静态托管。

## 非 AI 上线边界

当前部署不包含 AI 多模态识别和服务端 Key 代理。图片识别页会以本地取色、手动拆解、候选匹配和可保存记录的方式运行。
