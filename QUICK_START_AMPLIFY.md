# 🚀 立即行动：部署 CMS 到 Amplify

## 现在就做这个！（最简单的方式）

### 步骤 1: 打开 AWS Amplify Console
```
https://console.aws.amazon.com/amplify/home?region=us-east-1
```

### 步骤 2: 创建新应用
1. 点击 **"New app" → "Host web app"**
2. 选择 **"GitHub"**
3. 授权访问（点击"Authorize"）
4. 选择仓库：**Ethanlita/zmt**
5. 选择分支：**main**
6. 点击 **"Next"**

### 步骤 3: 配置应用设置
**App name:** `zmt-cms`

**Build settings:** 点击 "Edit"，替换为：
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

### 步骤 4: 添加环境变量
点击 **"Advanced settings"**，添加以下变量（复制粘贴）：

```
VITE_API_URL=https://api.zunmingtea.com
VITE_COGNITO_USER_POOL_ID=us-east-1_T7MyJyPr0
VITE_COGNITO_CLIENT_ID=3l2enft1vanfn7l0e27b88j9gr
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_DOMAIN=us-east-1t7myjypr0
VITE_COGNITO_LOGIN_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login?client_id=3l2enft1vanfn7l0e27b88j9gr&response_type=code&scope=email+openid+phone&redirect_uri=https://admin.zunmingtea.com
VITE_COGNITO_LOGOUT_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/logout?client_id=3l2enft1vanfn7l0e27b88j9gr&logout_uri=https://admin.zunmingtea.com
```

### 步骤 5: 点击 "Next" → "Save and deploy"

⏱️ 等待 3-5 分钟，首次构建完成。

---

## 构建完成后：配置自定义域名

### 步骤 6: 添加域名
1. 在 Amplify App 页面，点击左侧 **"Domain management"**
2. 点击 **"Add domain"**
3. 输入：`zunmingtea.com`
4. 子域名配置：
   - Subdomain: `admin`
   - Branch: `main`
5. 点击 **"Configure domain"**

### 步骤 7: 复制 CNAME 记录
Amplify 会显示类似这样的记录：
```
Name: admin.zunmingtea.com
Type: CNAME
Value: d1a2b3c4d5e6f7.cloudfront.net
```

### 步骤 8: 在 Cloudflare 添加 DNS 记录
1. 登录 Cloudflare
2. 选择域名 `zunmingtea.com`
3. 进入 **DNS** 设置
4. 点击 **"Add record"**
5. 填写：
   - Type: `CNAME`
   - Name: `admin`
   - Target: `[从 Amplify 复制的值]`
   - Proxy status: **❌ DNS only（灰色云）**
   - TTL: `Auto`
6. 点击 **"Save"**

⏱️ 等待 15-30 分钟，SSL 证书自动配置。

---

## 最后一步：更新 Cognito

### 步骤 9: 更新回调 URL
1. 打开 Cognito Console：
```
https://console.aws.amazon.com/cognito/v2/idp/user-pools/us-east-1_T7MyJyPr0/app-integration/clients/3l2enft1vanfn7l0e27b88j9gr?region=us-east-1
```

2. 点击 **"Edit"**

3. 更新 **Allowed callback URLs**：
```
https://admin.zunmingtea.com
```

4. 更新 **Allowed sign-out URLs**：
```
https://admin.zunmingtea.com
```

5. 点击 **"Save changes"**

---

## ✅ 完成！测试一下

访问：https://admin.zunmingtea.com

应该看到 CMS 登录页面 ✅

---

## 获取 Amplify App ID（用于 GitHub Actions）

✅ **已完成！** App ID 是：`d1bdghiy8psmgv`

GitHub Secret `AMPLIFY_APP_ID` 已添加，现在推送代码到 GitHub 会自动触发 Amplify 部署。

你可以在这里查看部署状态：
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1bdghiy8psmgv
```

---

## 🎉 大功告成！

现在你有了：
- ✅ HTTPS 支持的 CMS（https://admin.zunmingtea.com）
- ✅ 自动部署（推送到 GitHub 自动更新）
- ✅ SSL 证书自动管理
- ✅ 完整的 CI/CD 流程

下一步：
1. 在 Cognito 创建管理员用户
2. 登录 CMS
3. 添加产品内容
4. 点击"发布"更新前端网站
