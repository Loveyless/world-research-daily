# 世界运行原理 · 每日一课

面向 GitHub Pages 的中文深度知识音频站。使用 React + Vite 构建，由 GitHub Actions 自动部署。

## 本地开发

```bash
npm install
npm run dev
```

## 添加一期内容

1. 把 MP3 与 TXT 放进 `public/episodes/`。
2. 在 `src/episodes.js` 顶部新增一期元数据。
3. 运行 `npm test && npm run build`。
4. 推送 `main`，GitHub Actions 自动发布 Pages。
