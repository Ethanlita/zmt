# 内容更新流程

本文档说明在静态导出模式下，内容更新的完整流程和机制。

## 架构概览

```
CMS编辑器 → DynamoDB → 发布触发 → GitHub Actions → 重新构建 → GitHub Pages
```

## 详细流程

### 1. 内容编辑（CMS）

**位置**：`https://admin.zunmingtea.com`

**操作**：
- 编辑页面、产品、导航、站点设置等内容
- 使用富文本编辑器添加/修改内容
- 使用“上传图片/上传视频”按钮选择本地文件，CMS 将自动申请预签名 URL 并上传到 `s3.zunmingtea.com` CloudFront 加速域
- 点击"保存"按钮将内容保存到DynamoDB

**数据流**：
```
CMS前端 → API Gateway → Lambda (content.js) → DynamoDB
```

**存储位置**：
- 页面：DynamoDB `pages` 表
- 产品：DynamoDB `products` 表
- 导航：DynamoDB `navigation` 表
- 站点设置：DynamoDB `settings` 表

### 2. 发布触发（重要）

**操作**：在CMS中点击"保存并发布"按钮

**流程**：
```
1. CMS调用 /services/publish API
2. Lambda (services.js) 接收请求
3. 使用 GitHub PAT 调用 GitHub API
4. 触发 repository_dispatch 事件 (event_type: 'content-published')
5. GitHub Actions 监听到事件并启动构建流程
```
- 点击“发布全站”后，CMS 顶栏的“构建状态”浮窗会在 3 秒后自动查询 GitHub Actions，若发现构建在运行则每秒刷新一次，方便查看 `Deploy Frontend to GitHub Pages` 与 `pages-build-deployment` 的最新状态和耗时。

**关键代码**：
```javascript
// backend/src/handlers/services.js
await axios.post(
  `https://api.github.com/repos/${githubRepo}/dispatches`,
  { event_type: 'content-published' },
  { headers: { 'Authorization': `Bearer ${githubPat}` } }
);
```

### 3. 自动构建与部署

**触发条件**（任一即可）：
- ✅ CMS "保存并发布"按钮（`repository_dispatch: content-published`）
- ✅ 推送代码到 `main` 分支的 `frontend/**` 路径
- ✅ 手动触发 workflow（GitHub Actions 界面）

**构建流程**：
```yaml
# .github/workflows/deploy-github-pages.yml

1. Checkout 代码
2. 安装 Node.js 依赖
3. 构建 Next.js 站点
   - 执行 getStaticProps，从 API 获取最新的导航和footer数据
   - 生成静态 HTML/CSS/JS 文件
   - 输出到 frontend/out 目录
4. 部署到 GitHub Pages (gh-pages 分支)
```

**环境变量**：
- `NEXT_PUBLIC_API_URL`: API Gateway 地址，用于获取内容数据

### 4. 数据预加载机制

#### 构建时预加载（getStaticProps）

所有页面在构建时会调用 `getStaticProps` 从 API 获取数据：

```typescript
// 示例：frontend/pages/index.tsx
export async function getStaticProps() {
  const { navigation, footer } = await loadSiteChrome();
  
  return {
    props: {
      initialNavigation: navigation,
      initialFooter: footer,
    },
  };
}
```

**数据获取流程**：
```
构建环境 → API Gateway → Lambda → DynamoDB → 返回最新数据 → 注入HTML
```

**优势**：
- ✅ 用户访问时立即看到完整内容，无加载延迟
- ✅ 无页面闪烁（placeholder → 真实内容）
- ✅ SEO友好，爬虫看到完整HTML
- ✅ 性能优秀，纯静态文件

**限制**：
- ❌ 不支持 ISR（增量静态再生成）
- ❌ 内容更新需要重新构建
- ⚠️ 构建时间取决于页面数量（约1-2分钟）

### 5. 发布完成

**GitHub Pages 部署**：
- 文件发布到 `gh-pages` 分支
- CDN 自动更新（可能需要几分钟）
- 网站地址：`https://new.zunmingtea.com`

**验证**：
- 访问网站查看内容是否更新
- 检查导航、页脚是否正确显示
- 测试多语言切换

## 内容更新时间线

| 步骤 | 预计时间 | 说明 |
|------|---------|------|
| CMS编辑内容 | - | 即时保存到数据库 |
| 点击"发布"按钮 | 1-2秒 | 触发GitHub Actions |
| GitHub Actions启动 | 5-10秒 | 等待runner分配 |
| 安装依赖 | 20-30秒 | npm ci (利用缓存) |
| 构建Next.js | 30-60秒 | 生成静态文件 |
| 部署到gh-pages | 5-10秒 | 推送到分支 |
| CDN更新 | 2-5分钟 | GitHub Pages CDN |
| **总计** | **3-7分钟** | 从发布到用户可见 |

## 常见问题

### Q1: 为什么不使用ISR？

**答**：项目使用 `output: 'export'` 静态导出模式部署到 GitHub Pages：
- GitHub Pages 只支持静态文件托管
- 不支持 Node.js 服务器端渲染
- ISR 需要 Next.js 服务器运行时支持

**替代方案**：
- 使用 GitHub Actions 自动重新构建
- CMS 提供便捷的"发布"按钮
- 构建时间可接受（1-2分钟）

### Q2: 能否实现实时更新？

**答**：不可以。静态站点必须重新构建才能更新内容。

**最佳实践**：
- 批量编辑多个内容后再发布
- 避免频繁点击"发布"按钮
- 发布前在CMS中预览内容

### Q3: 构建失败怎么办？

**检查步骤**：

1. **查看构建日志**：
   ```bash
   gh run list --limit 5
   gh run view <run-id> --log-failed
   ```

2. **常见错误**：
   - API返回404/500：检查Lambda日志
   - 构建超时：可能是依赖安装问题
   - 内容格式错误：检查富文本编辑器输出

3. **回滚方案**：
   ```bash
   # 回滚到上一个成功的提交
   git revert HEAD
   git push origin main
   ```

### Q4: 如何手动触发重新构建？

**方法1：GitHub Actions 界面**
1. 访问 `https://github.com/Ethanlita/zmt/actions`
2. 选择 "Deploy Frontend to GitHub Pages"
3. 点击 "Run workflow"

**方法2：命令行**
```bash
gh workflow run "Deploy Frontend to GitHub Pages"
```

**方法3：CMS发布按钮**
- 最简单的方法
- 编辑团队推荐使用

## 监控与维护

### 监控要点

1. **GitHub Actions 状态**
   - 定期检查构建是否成功
   - 关注失败通知邮件

2. **CDN 缓存**
   - 更新后等待5分钟再验证
   - 必要时使用无痕模式或硬刷新

3. **API 健康检查**
   - 监控 API Gateway 指标
   - 检查 Lambda 错误日志

### 维护建议

1. **定期清理**
   - 删除不用的页面/产品
   - 保持导航结构清晰

2. **性能优化**
   - 压缩图片上传到CMS
   - 避免过大的富文本内容

3. **备份策略**
   - DynamoDB 启用 Point-in-Time Recovery
   - 定期导出数据备份
   - 保留重要的 git commit

## 开发者参考

### 相关文件

- 工作流：`.github/workflows/deploy-github-pages.yml`
- 发布接口：`backend/src/handlers/services.js`
- 数据加载：`frontend/lib/siteConfig.ts`
- 页面示例：`frontend/pages/index.tsx`

### 环境变量

**GitHub Secrets**（必需）：
- `NEXT_PUBLIC_API_URL`: API Gateway地址
- `GITHUB_PAT`: GitHub Personal Access Token (repo权限)
- 在 `.github/workflows/deploy-github-pages.yml` 中配置

**Lambda 环境变量**（必需）：
- `GITHUB_PAT`: 同上
- `GITHUB_REPO`: 格式 `owner/repo` (如 `Ethanlita/zmt`)
- 在 SAM 模板中配置

### 调试技巧

**本地测试构建**：
```bash
cd frontend
npm run build
npm run export  # 如果有
```

**检查API响应**：
```bash
curl https://api.zunmingtea.com/navigation
curl https://api.zunmingtea.com/content/footer
```

**查看构建输出**：
```bash
ls -la frontend/out/
```

## 相关文档

- [前端开发规范](./FRONTEND_GUIDELINES.md)
- [团队角色与职责](./AGENTS.md)
- [系统架构](./ARCHITECTURE.md)
- [部署指南](./DEPLOYMENT.md)
