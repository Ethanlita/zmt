# 🎯 CMS Amplify 部署状态报告

**更新时间：** 2025年10月31日 20:49  
**状态：** 🟡 构建中

---

## ✅ 已完成的配置

### 1. Amplify App 创建
- **App ID:** `d1bdghiy8psmgv`
- **App 名称:** zmt
- **默认域名:** https://d1bdghiy8psmgv.amplifyapp.com
- **仓库:** https://github.com/Ethanlita/zmt
- **分支:** main
- **状态:** ✅ 已连接

### 2. 环境变量配置（已修正）
```bash
VITE_API_URL=https://api.zunmingtea.com
VITE_COGNITO_USER_POOL_ID=us-east-1_T7MyJyPr0
VITE_COGNITO_CLIENT_ID=3l2enft1vanfn7l0e27b88j9gr
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_DOMAIN=us-east-1t7myjypr0                    ✅ 已修正
VITE_COGNITO_LOGIN_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login?client_id=3l2enft1vanfn7l0e27b88j9gr&response_type=token&scope=email+openid+phone&redirect_uri=https://admin.zunmingtea.com    ✅ 已修正
VITE_COGNITO_LOGOUT_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/logout?client_id=3l2enft1vanfn7l0e27b88j9gr&logout_uri=https://admin.zunmingtea.com    ✅ 已修正
```

**关键修正：**
- ❌ 旧域名：`zmt-auth.auth.us-east-1.amazoncognito.com`
- ✅ 新域名：`us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com`
- ✅ response_type 从 `token` 改为 `code`
- ✅ scope 改为 `email+openid+phone`

### 3. GitHub Secrets
- ✅ **AMPLIFY_APP_ID:** `d1bdghiy8psmgv` 已添加
- ✅ CI/CD 已配置：推送代码自动触发 Amplify 构建

### 4. Cognito 回调 URL
- ✅ 已确认 App Client 包含 `https://admin.zunmingtea.com`
- ✅ 同时支持本地开发：`http://localhost:3000`, `http://localhost:4173`

### 5. 构建配置
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd cms
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: cms/dist
    files:
      - '**/*'
  cache:
    paths:
      - cms/node_modules/**/*
```

---

## 🟡 当前进行中

### Amplify 构建状态

**查看实时状态：**
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1bdghiy8psmgv
```

**当前构建队列：**
| Job ID | 状态 | 提交时间 | 说明 |
|--------|------|----------|------|
| 3 | PENDING | 20:49 | GitHub 推送触发（修正后的配置） |
| 2 | RUNNING | 20:46 | 手动触发（环境变量更新） |

**预计完成时间：** 3-5 分钟（每个构建）

---

## ⏳ 下一步操作

### 1. 等待构建完成
- 监控 Amplify Console
- 查看构建日志，确认无错误
- 验证 dist 文件正确生成

### 2. 配置自定义域名
构建成功后，在 Amplify Console 执行：

1. 点击左侧 **"Domain management"**
2. 点击 **"Add domain"**
3. 输入：`zunmingtea.com`
4. 子域名：`admin` → 分支：`main`
5. 点击 **"Configure domain"**

Amplify 会提供 CNAME 记录，例如：
```
admin.zunmingtea.com → d123abc.cloudfront.net
```

### 3. 在 Cloudflare 配置 DNS
```
类型: CNAME
名称: admin
目标: [从 Amplify 复制]
Proxy: ❌ DNS only（灰色云）
TTL: Auto
```

⚠️ **重要：** 必须关闭 Proxy（灰色云），否则 SSL 验证会失败。

### 4. 等待 SSL 证书生成（15-30 分钟）

### 5. 创建 Cognito 用户
```bash
# 在 AWS Console 中操作
https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_T7MyJyPr0?region=us-east-1

# 或使用 CLI
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_T7MyJyPr0 \
  --username admin@zunmingtea.com \
  --user-attributes Name=email,Value=admin@zunmingtea.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --region us-east-1
```

### 6. 测试登录
访问：
- 默认域名：https://main.d1bdghiy8psmgv.amplifyapp.com
- 自定义域名（配置后）：https://admin.zunmingtea.com

---

## 🔍 验证清单

构建完成后，依次验证：

```bash
# 1. 检查 Amplify 默认域名
curl -I https://main.d1bdghiy8psmgv.amplifyapp.com
# 应该返回 200 OK

# 2. 检查是否为 SPA（所有路由返回 index.html）
curl -I https://main.d1bdghiy8psmgv.amplifyapp.com/some-random-path
# 应该返回 200 OK，而不是 404

# 3. 检查构建的文件
aws amplify list-artifacts \
  --app-id d1bdghiy8psmgv \
  --branch-name main \
  --job-id [最新的 job id] \
  --region us-east-1

# 4. 测试登录跳转
# 访问 CMS，点击登录按钮
# 应该跳转到：https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login
```

---

## 📊 关键链接

| 资源 | URL |
|------|-----|
| Amplify Console | https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1bdghiy8psmgv |
| Amplify 默认域名 | https://main.d1bdghiy8psmgv.amplifyapp.com |
| Cognito Console | https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_T7MyJyPr0?region=us-east-1 |
| Cognito App Client | https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_T7MyJyPr0/app-integration/clients/3l2enft1vanfn7l0e27b88j9gr?region=us-east-1 |
| GitHub Actions | https://github.com/Ethanlita/zmt/actions |
| GitHub Secrets | https://github.com/Ethanlita/zmt/settings/secrets/actions |

---

## 🐛 故障排除

### 如果构建失败

1. **检查构建日志：**
```bash
aws amplify get-job \
  --app-id d1bdghiy8psmgv \
  --branch-name main \
  --job-id [失败的 job id] \
  --region us-east-1
```

2. **常见问题：**
   - npm 依赖安装失败 → 检查 package.json
   - 构建命令失败 → 检查 build spec 中的路径
   - 环境变量缺失 → 检查 Amplify 环境变量配置

### 如果登录跳转失败

1. **检查回调 URL：**
```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_T7MyJyPr0 \
  --client-id 3l2enft1vanfn7l0e27b88j9gr \
  --region us-east-1 \
  --query 'UserPoolClient.CallbackURLs'
```

2. **验证 Cognito domain：**
```bash
curl -I https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login
# 应该返回 302 或 200
```

3. **确认 OAuth Flow：**
   - 在 Cognito Console 打开 App Client 设置
   - 勾选 **Implicit grant**，确保 Hosted UI 可以返回 `id_token`
   - 点击保存

### 如果 SSL 证书验证失败

1. 确认 Cloudflare DNS 记录为 **DNS only（灰色云）**
2. 确认 CNAME 值完全匹配 Amplify 提供的值
3. 等待 15-30 分钟（DNS 传播）
4. 如果仍失败，删除域名重新添加

---

## 📝 更新日志

### 2025-10-31 20:49
- ✅ 修正 Cognito domain
- ✅ 更新 response_type 和 scope
- ✅ 添加 GitHub Secret: AMPLIFY_APP_ID
- ✅ 触发新构建（Job ID: 2, 3）
- ✅ 更新所有文档

### 2025-10-31 20:36
- ✅ 创建 Amplify App
- ✅ 连接 GitHub 仓库
- ✅ 配置 build spec
- ❌ 首次构建失败（环境变量错误）

---

## 🎯 项目进度总览

| 组件 | 状态 | URL |
|------|------|-----|
| 后端 API | ✅ 已部署 | https://api.zunmingtea.com |
| 前端网站 | ✅ 已部署 | https://new.zunmingtea.com |
| CMS 后台 | 🟡 构建中 | https://admin.zunmingtea.com（待配置） |
| 默认 CMS | 🟡 构建中 | https://main.d1bdghiy8psmgv.amplifyapp.com |

**下一个里程碑：** CMS 构建成功 → DNS 配置 → 创建用户 → 测试登录 → 添加内容
