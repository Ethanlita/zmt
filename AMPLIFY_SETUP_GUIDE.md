# AWS Amplify CMS 部署指南

## 方案选择

我们使用 **AWS Amplify** 托管 CMS，原因：
- ✅ 自动 HTTPS（Amplify 托管的 SSL）
- ✅ 自动部署（连接 GitHub，推送即部署）
- ✅ 自定义域名支持
- ✅ SPA 路由自动配置
- ✅ 环境变量管理
- ✅ 无需管理 S3 + CloudFront

---

## 快速部署（推荐）

### 方式 1: 使用脚本自动部署

```bash
cd /Users/lita/Documents/GitHub/zmt/backend/scripts

# 添加执行权限
chmod +x deploy-amplify-cms.sh

# 运行脚本
./deploy-amplify-cms.sh
```

**注意：** 脚本会创建 Amplify App、连接 GitHub、配置环境变量和自定义域名。

---

### 方式 2: 使用 AWS Console 手动部署（最简单）

#### 步骤 1: 创建 Amplify App

1. 登录 AWS Console: https://console.aws.amazon.com/amplify/
2. 点击 **"New app" → "Host web app"**
3. 选择 **GitHub** 作为代码仓库
4. 授权 GitHub（如果首次使用）
5. 选择仓库：**Ethanlita/zmt**
6. 选择分支：**main**

#### 步骤 2: 配置构建设置

在 "Build settings" 页面：

1. 修改 **App name**: `zmt-cms`
2. 修改 **Build spec**:

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

3. 点击 **"Advanced settings"**，添加环境变量：

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://api.zunmingtea.com` |
| `VITE_COGNITO_USER_POOL_ID` | `us-east-1_T7MyJyPr0` |
| `VITE_COGNITO_CLIENT_ID` | `3l2enft1vanfn7l0e27b88j9gr` |
| `VITE_COGNITO_REGION` | `us-east-1` |
| `VITE_COGNITO_DOMAIN` | `zmt-auth` |
| `VITE_COGNITO_LOGIN_URL` | `https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login?client_id=3l2enft1vanfn7l0e27b88j9gr&response_type=token&scope=openid&redirect_uri=https://admin.zunmingtea.com` |
| `VITE_COGNITO_LOGOUT_URL` | `https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/logout?client_id=3l2enft1vanfn7l0e27b88j9gr&logout_uri=https://admin.zunmingtea.com` |

4. 点击 **"Next"** → **"Save and deploy"**

#### 步骤 3: 等待首次构建完成（约 3-5 分钟）

构建完成后，会得到一个默认域名：
```
https://main.d1234abcdefg.amplifyapp.com
```

#### 步骤 4: 配置自定义域名

1. 在 Amplify App 页面，点击左侧菜单 **"Domain management"**
2. 点击 **"Add domain"**
3. 输入域名：`zunmingtea.com`
4. 配置子域名：
   - Subdomain: `admin`
   - Branch: `main`
5. 点击 **"Configure domain"**

Amplify 会自动：
- 创建 SSL 证书
- 提供 CNAME 记录值

#### 步骤 5: 在 Cloudflare 配置 DNS

从 Amplify 复制 CNAME 记录值，然后在 Cloudflare 添加：

```
类型: CNAME
名称: admin
目标: [从 Amplify 复制，例如: d1234abcdefg.cloudfront.net]
Proxy: ❌ 关闭（DNS Only，灰色云）
TTL: Auto
```

**重要：** Amplify 使用自己的 CloudFront，所以 Cloudflare Proxy 必须关闭。

#### 步骤 6: 等待 SSL 证书验证（约 15-30 分钟）

在 Amplify Console 的 Domain management 页面，等待状态变为：
```
✅ Available
```

#### 步骤 7: 更新 Cognito 回调 URL

1. 登录 AWS Console
2. 进入 Cognito → User pools → `us-east-1_T7MyJyPr0`
3. 点击 **"App integration"** 标签
4. 找到 App client: `zmt-cms-client`
5. 点击 **"Edit"**
6. 更新回调 URL：

```
Allowed callback URLs:
https://admin.zunmingtea.com

Allowed sign-out URLs:
https://admin.zunmingtea.com
```

7. 点击 **"Save changes"**

---

## 验证部署

完成后，访问：

```bash
# 1. 访问 CMS
https://admin.zunmingtea.com

# 2. 点击登录按钮
# 应该跳转到 Cognito Hosted UI: https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login

# 3. 输入用户名密码（需要先在 Cognito 创建用户）

# 4. 登录成功后，应该重定向回 https://admin.zunmingtea.com
```

---

## GitHub Actions 集成

部署完成后，需要配置 GitHub Secrets：

### 添加新的 Secret

在 GitHub 仓库的 Settings → Secrets and variables → Actions，添加：

```
AMPLIFY_APP_ID=d1234abcdefg
```

**获取 App ID 的方法：**

```bash
aws amplify list-apps --region us-east-1 --query 'apps[?name==`zmt-cms`].appId' --output text
```

或从 Amplify Console URL 中复制：
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1234abcdefg
                                                                  ^^^^^^^^^^^^^
                                                                  这就是 App ID
```

### 工作流会自动触发

修改 `cms/` 目录下的任何文件并推送到 `main` 分支，GitHub Actions 会：

1. 触发 Amplify 构建
2. Amplify 自动从 GitHub 拉取代码
3. 执行 `amplify.yml` 中定义的构建步骤
4. 部署到 `https://admin.zunmingtea.com`

---

## 自动部署流程

```
开发者推送代码到 GitHub
        ↓
GitHub Actions 触发（deploy-aws.yml）
        ↓
调用 AWS Amplify API 开始构建
        ↓
Amplify 从 GitHub 拉取最新代码
        ↓
执行 amplify.yml 构建脚本
   - cd cms
   - npm ci
   - npm run build
        ↓
部署到 CloudFront + S3
        ↓
更新 https://admin.zunmingtea.com
```

---

## 常见问题

### Q: Amplify 构建失败

**A:** 检查构建日志：
1. 访问 Amplify Console
2. 点击失败的构建
3. 查看详细日志

常见原因：
- 环境变量缺失
- npm 依赖安装失败
- Build spec 路径错误

### Q: 自定义域名 SSL 证书验证失败

**A:** 
1. 确认 Cloudflare DNS 记录正确
2. 确认 Proxy 已关闭（灰色云）
3. 等待 15-30 分钟
4. 如果仍然失败，删除域名重新添加

### Q: 登录后重定向失败

**A:** 
1. 检查 Cognito 回调 URL 是否完全匹配 `https://admin.zunmingtea.com`
2. 检查 CMS 环境变量中的 `VITE_COGNITO_LOGIN_URL` 是否正确
3. 清除浏览器缓存重试

### Q: 如何查看 Amplify 构建日志

**A:**
```bash
aws amplify list-jobs --app-id YOUR_APP_ID --branch-name main --region us-east-1
```

或直接访问 Console：
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/YOUR_APP_ID
```

---

## 回滚到之前的版本

如果部署出现问题，可以快速回滚：

1. 在 Amplify Console 点击 **"Deployments"**
2. 找到正常工作的历史版本
3. 点击 **"Redeploy this version"**

---

## 成本估算

AWS Amplify 免费套餐（每月）：
- 构建时间：1000 分钟
- 托管流量：5GB
- 托管存储：5GB

对于 CMS 这样的低流量应用，完全在免费套餐内。

超出免费套餐的定价：
- 构建：$0.01/分钟
- 托管：$0.15/GB

---

## 参考资料

- [AWS Amplify 文档](https://docs.aws.amazon.com/amplify/)
- [Amplify Console 用户指南](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [自定义域名配置](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
