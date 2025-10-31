# ARCHITECTURE

## 系统概览

Zunming Tea 平台基于 Serverless + JAMstack 架构构建，按照“前台静态渲染、后台无服务器 API、全局 CDN”思路拆分：

- **公共网站**：Next.js 预渲染页面，通过 GitHub Pages + Cloudflare 对外服务。
- **管理后台（CMS）**：React + Vite 单页应用，静态资源托管在 Amazon S3。
- **后端 API**：AWS Lambda + API Gateway 提供内容、导航、设置、发布等接口，所有数据写入 DynamoDB。
- **身份认证**：AWS Cognito Hosted UI 承担登录流程，CMS 使用隐式授权获取 `id_token`。
- **自动化部署**：GitHub Actions 负责后端与前端构建、部署和缓存刷新。

## 拓扑图

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare CDN                        │
│  (DNS, SSL, Cache, Security)                                │
└────────────┬────────────┬────────────┬──────────────────────┘
             │            │            │
    ┌────────▼─────┐  ┌──▼─────┐  ┌──▼──────────┐
    │   www.       │  │ admin. │  │    api.     │
    │ zunmingtea   │  │ zunmin │  │  zunmingtea │
    │    .com      │  │ gtea   │  │    .com     │
    └──────┬───────┘  └───┬────┘  └──────┬──────┘
           │              │               │
    ┌──────▼────────┐ ┌──▼──────┐  ┌────▼────────┐
    │ GitHub Pages  │ │ AWS S3  │  │ API Gateway │
    │  (Frontend)   │ │  (CMS)  │  │  + Lambda   │
    └───────────────┘ └─────────┘  └─────┬───────┘
                                          │
                                   ┌──────▼────────┐
                                   │   DynamoDB    │
                                   └───────────────┘
```

## 组件说明

### Public Website（Next.js）
- 构建产物由 GitHub Actions 推送到 `gh-pages` 分支，通过 GitHub Pages 暴露。
- 运行期使用 SWR/axios 调用 `api.zunmingtea.com` 获取导航树、页脚配置及内容数据。
- 站点在 Cloudflare 上启用 HTTP/2、缓存与 TLS 终端，静态资源进一步加速。

### CMS（React + Vite）
- 编译后的 `dist/` 上传至 `admin.zunmingtea.com` S3 桶，并开启 Website Hosting。
- 使用 Cognito Hosted UI 完成登录，`id_token` 保存在 `localStorage` 并通过 Axios 拦截器附加在请求头。
- 包含栏目管理、页面/产品编辑、站点设置、发布触发等模块。

### API & Service 层
- `content.js`：处理页面/产品 CRUD，并支持按 `lang` 与 `navigationParentId` 过滤。
- `navigation.js`：维护导航树与站点设置（页脚），对外提供公开与受保护接口。
- `services.js`：封装 Amazon Translate 调用及前端发布（GitHub Actions webhook）。
- 所有 Lambda 通过 AWS SAM 管理，部署到单一 API Gateway（`/prod` stage）。

### 身份认证
- Cognito User Pool（`us-east-1_T7MyJyPr0`）启用 Hosted UI。
- App Client 开启隐式授权，回调地址包含 `https://admin.zunmingtea.com` 与本地开发域。
- Logout URL 指向 CMS 根域，退出后清理本地 Token 并回到登录页。

## 内容与导航流

1. CMS 在登录后请求 `/navigation` 获取整棵导航树，根据节点类型渲染树形编辑器。
2. 页面编辑器允许选择 `navigationParentId`，保存后 `pages` 表会写入该字段。
3. 前台渲染时：
   - `Layout` 在客户端并行请求 `/navigation` 与 `/settings/public` 填充导航、页脚。
   - `sections/[slug].tsx` 根据导航节点 ID 调用 `/content/pages`，展示同一栏目下的文章列表。
   - 单页路由 `pages/[slug].tsx` 直接加载具体内容。

## 部署流水线

| 阶段 | 触发方式 | 工作内容 |
|------|----------|----------|
| 后端/API | `main` 分支 push | SAM 构建/部署 Lambda、DynamoDB 表保持不变。
| CMS | `main` 分支 push | Vite 构建，产物同步至 S3，刷新 CloudFront/Cloudflare 缓存（如配置）。
| 前端网站 | CMS 发布按钮或手动 Action | 调用 GitHub Actions，执行 Next.js 静态导出并推送至 `gh-pages`。

CI/CD 所需的凭据存放在 GitHub Secrets（参见 `AGENTS.md`）。

## 基础设施配置

### Cognito
- Hosted UI 域名：`us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com`。
- Callback URLs：`https://admin.zunmingtea.com`、`http://localhost:3001`。
- 授权范围：`email openid phone`，Response Type 设置为 `token`。

### API & 数据层
- DynamoDB 表：`PagesTable`、`ProductsTable`、`NavigationTable`、`SettingsTable`（具体结构见 `DATA_STRUCTURES.md`）。
- API Gateway 域名通过 Cloudflare CNAME 映射至 `api.zunmingtea.com`，可选绑定自定义证书。

### CMS 托管（S3）
- 开启静态网站托管，Index/Error 均设为 `index.html`。
- 桶策略允许公共读取静态资源，可在 Cloudflare 上使用 `DNS only` 或 `Proxy`（若需 Rewrites）。

### Cloudflare
- 主要记录：`new`（GitHub Pages）、`admin`（S3 Website）、`api`（API Gateway）、`auth`（Cognito 域）。
- `admin` 与 `api` 建议设为“DNS only”，避免 Hosted UI/OAuth 或 API 请求被代理导致证书校验失败。
- TLS 模式为 **Full (strict)**，最小 TLS 版本 1.2。
- 针对 `new.zunmingtea.com` 设置浏览器缓存 4 小时、边缘缓存 1 天；`admin` & `api` 绕过缓存。

### Secrets & 配置管理
- GitHub 仓库中维护 AWS 凭证（部署）、API URL、Cognito 登录/登出 URL、Cloudflare Token 等。
- 本地开发使用 `.env.local`（参见 `ENV_SETUP.md`）。

## 参考
- 数据模型详见 [`DATA_STRUCTURES.md`](./DATA_STRUCTURES.md)。
- 各角色操作指南详见 [`AGENTS.md`](./AGENTS.md)。
