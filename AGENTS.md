# AGENTS

本文件用于划分不同角色（Agents）的职责边界，并记录日常操作清单，避免阶段性文档重复。

## 工程团队（Developers）

**定位**：负责应用代码、基础设施模板、自动化流程。

**常用流程**
- 本地准备：执行 `npm run install:all`，分别 `npm run dev`（frontend）、`npm run dev -- --host`（cms）和 `sam local start-api`（backend）。
- 环境变量：参见 `ENV_SETUP.md`，本地 `.env.local` 不要提交。
- 提交规范：功能完成后运行 `npm --prefix cms run build` / 单元测试，提交信息使用简体中文说明目的。
- 发布：推送到 `main` 触发后端与 CMS 部署；CMS 发布按钮会触发前端构建。
- 调试导航：使用 CMS → “栏目管理”调试结构；保持 `id`、`slug` 唯一。

**注意事项**
- 登录流程依赖 Cognito 隐式授权，不要在 React 中改动 `App.tsx` 的回调顺序。
- API 请求需带 `id_token`，调试可在浏览器 Local Storage 查验。
- 变更数据结构时同步更新 `DATA_STRUCTURES.md` 与后端验证逻辑。

**前端开发规范**
- **避免页面闪烁**：所有页面必须使用 `getStaticProps` 或 `getServerSideProps` 预加载导航和footer数据。
  - 导入：`import { FooterSettings, NavigationNode, loadSiteChrome } from '../lib/siteConfig';`
  - 定义Props接口，包含 `initialNavigation: NavigationNode[]` 和 `initialFooter: FooterSettings`
  - 在 `getStaticProps` 中调用 `loadSiteChrome()` 并通过props传递
  - Layout组件调用：`<Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>`
  - 设置 `revalidate: 60` 支持增量静态再生成
- **示例实现**：
  ```typescript
  interface PageProps {
    initialNavigation: NavigationNode[];
    initialFooter: FooterSettings;
  }
  
  export default function Page({ initialNavigation, initialFooter }: PageProps) {
    return <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      {/* 页面内容 */}
    </Layout>;
  }
  
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
- **禁止**：不要让Layout组件在客户端useEffect中加载导航/footer数据，这会导致placeholder闪烁。
- **注意**：项目使用 `output: 'export'` 静态导出模式部署到GitHub Pages，不支持ISR的 `revalidate` 选项。

## 内容编辑团队（Content Editors）

**定位**：通过 CMS 生产内容、维护导航与页脚。

**日常任务**
1. 登录 `https://admin.zunmingtea.com` → Cognito 账号。
2. 编辑页面/产品：
   - 使用富文本编辑器插入标题、段落、媒体、内部锚点、外部链接。
   - 需要翻译时点击“从中文翻译”按钮批量生成英文/日文。
3. 栏目管理：
   - 通过“栏目管理”页面新增/拖拽节点，设置节点类型（栏目/单页/外链）。
   - 为文章指定 `所属栏目` 以在前台展示。
4. 站点设置：
   - 在“站点设置”中编辑多语言页脚文案、联系人链接。
5. 发布：完成内容后点击“保存并发布”，触发 GitHub Action 构建前端。

**校验清单**
- 页面保存后刷新确保内容生效。
- 发布前确保导航无重复 `slug`，否则前端会显示最后一个匹配。
- 页脚链接需包含协议（`https://` 或 `mailto:`）。

## 平台运维（Operations）

**定位**：负责 AWS、Cloudflare、证书及 Secrets 管理。

**核心职责**

### AWS 资源
- **Cognito**：
  - 维护 User Pool 中管理员账户，临时账号需在登录后修改密码。
  - 确认 App Client 启用 *Implicit grant*，回调/登出 URL 与环境保持一致。
- **DynamoDB**：
  - 通过 Point-in-Time Recovery 备份 `pages/products/navigation/settings` 表。
  - 大批量改动前建议导出 JSON 备份（`aws dynamodb scan ...`）。
- **S3 (CMS)**：
  - 桶 `admin.zunmingtea.com` 必须允许公共读取；若需回滚，可将旧版本静态文件恢复到根目录。
- **S3/CloudFront (媒体上传)**：
  - 桶 `zmt-media-prod` 通过 `media.handler` 预签名 URL 写入，需保持公共读取和 CORS（允许 `https://admin.zunmingtea.com` PUT）。
  - CloudFront Distribution 绑定 `s3.zunmingtea.com`，DNS 中配置 `CNAME s3 → <CloudFront>`，证书在 us-east-1。
  - 如果发现上传的图片/视频无法访问，先检查 Lambda 日志，其次确认 CloudFront 已完成部署并未命中缓存。
- **API Gateway / Lambda**：
  - 监控 `CloudWatch Logs`，留意 `navigation`、`content`、`services` 三类函数错误。

### Cloudflare / DNS
- `admin.zunmingtea.com` 和 ACM 验证记录必须设为 **DNS only**。
- 自定义域操作流程：
  1. 登录 Cloudflare 选择 `zunmingtea.com`。
  2. 新增 CNAME：`admin → <CloudFront or S3 Endpoint>`、`api → <API Gateway Domain>`。
  3. 验证 `dig admin.zunmingtea.com CNAME +short` 与 ACM 状态。
- 证书更新：若看到 `DNS_FAILED`，删除并重新创建 Amplify/ACM 证书，更新对应验证记录。

### Secrets & CI/CD
- GitHub Secrets 包含：
  - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`
  - `AWS_SAM_BUCKET`、`AWS_S3_BUCKET_CMS`
  - `COGNITO_USER_POOL_ARN`
  - `NEXT_PUBLIC_API_URL`、`VITE_API_URL`、`VITE_COGNITO_LOGIN_URL`、`VITE_COGNITO_LOGOUT_URL`
  - `MEDIA_CDN_DOMAIN`、`MEDIA_CERTIFICATE_ARN`
  - 可选：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ZONE_ID`
- 更新 Secrets 后手动触发一次 `deploy-aws`/`deploy-github-pages` 验证。

## 自动化流水线（CI/CD Agents）

| Workflow | 文件 | 触发 | 执行内容 |
|----------|------|------|----------|
| `deploy-aws` | `.github/workflows/deploy-aws.yml` | Push 到 `main`、手动触发 | 安装依赖 → SAM 构建 → 部署 Lambda、API、同步 CMS 静态资源 |
| `deploy-github-pages` | `.github/workflows/deploy-github-pages.yml` | `publish` API 调用、手动触发 | 构建 Next.js → 推送 `gh-pages` → 可选清理 Cloudflare 缓存 |

CMS 的“保存并发布”按钮会调用后端 `/publish`，由 `services.js` 触发 `deploy-github-pages` workflow。

## 事件响应

| 场景 | 建议处理 |
|------|----------|
| 登录后仍跳转回登录页 | 检查 Cognito App Client 是否启用 `Implicit grant`，确认 CMS 构建为最新版本。|
| 前端导航缺少栏目 | 查看 CMS 栏目管理是否同步保存；检查 `/navigation` API 是否返回新节点。|
| 访问 CMS 出现证书错误 | 确认 Cloudflare 记录为 DNS only，并复查 S3 Website 端点是否可达。|
| 发布后页面未更新 | 在 GitHub Actions 查看 `deploy-github-pages` 日志；必要时手动清理 Cloudflare 缓存。|

## 文档索引
- 系统组成与网络拓扑：[`ARCHITECTURE.md`](./ARCHITECTURE.md)
- 数据模型：[`DATA_STRUCTURES.md`](./DATA_STRUCTURES.md)
- 开发环境变量：[`ENV_SETUP.md`](./ENV_SETUP.md)
