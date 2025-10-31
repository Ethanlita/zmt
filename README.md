# Zunming Tea (ZMT) - 企业网站重构项目

> 为尊茗茶业打造的现代化、高性能、易维护的多语言企业网站系统

## 📋 项目概述

这是一个完整的 Serverless + JAMstack 架构的企业网站系统，包含：
- 🌐 **公共网站**：Next.js 静态站点（SSG），托管于 GitHub Pages
- 🎨 **管理后台**：React + Vite SPA，托管于 AWS S3
- ⚡ **后端 API**：AWS Lambda + API Gateway + DynamoDB
- 🔐 **身份认证**：AWS Cognito
- 🌍 **多语言支持**：原生支持中文、英文、日文
- 🚀 **自动化部署**：GitHub Actions CI/CD

## 🏗️ 系统架构

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

## 🗂️ 项目结构

```
zmt/
├── backend/                 # AWS SAM 后端
│   ├── template.yaml       # SAM 模板
│   ├── src/
│   │   └── handlers/
│   │       ├── content.js  # 内容 CRUD
│   │       └── services.js # 翻译 & 发布
│   └── package.json
│
├── cms/                     # React 管理后台
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # UI 组件
│   │   ├── services/       # API 调用
│   │   └── store/          # 状态管理
│   ├── package.json
│   └── vite.config.ts
│
├── frontend/                # Next.js 公共网站
│   ├── pages/
│   │   ├── index.tsx       # 首页
│   │   ├── about.tsx       # 关于我们
│   │   └── products/       # 产品页面
│   ├── components/
│   ├── styles/
│   ├── next.config.js
│   └── package.json
│
└── .github/
    └── workflows/
        ├── deploy-aws.yml           # 部署后端和 CMS
        └── deploy-github-pages.yml  # 部署前端
```

## 🚀 快速开始

### 1. 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- AWS CLI 配置完成
- SAM CLI 已安装
- GitHub 账户

### 2. 安装依赖

```bash
# 安装所有项目依赖
npm run install:all

# 或分别安装
cd backend && npm install
cd ../cms && npm install
cd ../frontend && npm install
```

### 3. 本地开发

#### 后端开发
```bash
cd backend
# 配置环境变量
cp .env.example .env.local

# 本地运行 Lambda
sam local start-api
```

#### CMS 开发
```bash
cd cms
# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
# 访问 http://localhost:3001
```

#### 前端开发
```bash
cd frontend
# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

## ☁️ AWS 配置指南

### 1. 创建 Cognito User Pool

```bash
# 在 AWS Console 中创建 Cognito User Pool
# 记录以下信息：
# - User Pool ID: us-east-1_xxxxx
# - User Pool ARN: arn:aws:cognito-idp:us-east-1:xxx:userpool/us-east-1_xxxxx
# - App Client ID: xxxxxxxxxxxxx

# 配置 Cognito Hosted UI
# - Domain: auth.zunmingtea.com
# - Callback URLs: https://admin.zunmingtea.com
# - Sign out URLs: https://admin.zunmingtea.com
```

### 2. 部署后端

```bash
cd backend

# 首次部署（引导式）
sam build
sam deploy --guided

# 后续部署
sam build && sam deploy
```

### 3. 创建 S3 Bucket（用于 CMS）

```bash
# 创建 bucket
aws s3 mb s3://admin.zunmingtea.com

# 启用静态网站托管
aws s3 website s3://admin.zunmingtea.com \
  --index-document index.html \
  --error-document index.html

# 配置 bucket 策略（公开访问）
aws s3api put-bucket-policy \
  --bucket admin.zunmingtea.com \
  --policy file://bucket-policy.json
```

### 4. 配置 GitHub PAT

```bash
# 创建 GitHub Personal Access Token
# Permissions: repo (Full control)

# 存储到 SSM Parameter Store
aws ssm put-parameter \
  --name /zmt/github/pat \
  --value "ghp_xxxxxxxxxxxx" \
  --type SecureString
```

## 🌐 Cloudflare 配置

### DNS 记录

在 Cloudflare 中添加以下 DNS 记录（全部启用 Proxy 橙色云）：

| 类型 | 名称 | 目标 | Proxied |
|------|------|------|---------|
| CNAME | new | ethanlita.github.io | ✅ |
| CNAME | @ | new.zunmingtea.com | ✅ |
| CNAME | admin | admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com | ✅ |
| CNAME | api | xxxxxxxxx.execute-api.us-east-1.amazonaws.com | ✅ |
| CNAME | auth | [cognito-domain].auth.us-east-1.amazoncognito.com | ✅ |

### SSL/TLS 设置

- 加密模式：**Full (strict)**
- 最小 TLS 版本：**TLS 1.2**
- 自动 HTTPS 重写：**开启**

### 缓存规则

为 `new.zunmingtea.com` 设置：
- Browser Cache TTL: 4 hours
- Edge Cache TTL: 1 day

为 `admin.zunmingtea.com` 和 `api.zunmingtea.com`：
- Bypass cache

## 🔐 GitHub Secrets 配置

在 GitHub 仓库的 `Settings > Secrets and variables > Actions` 中添加：

### AWS 相关
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_SAM_BUCKET=aws-sam-cli-managed-default-samclisourcebucket
AWS_S3_BUCKET_CMS=admin.zunmingtea.com
COGNITO_USER_POOL_ARN=arn:aws:cognito-idp:...
```

### API URLs
```
NEXT_PUBLIC_API_URL=https://api.zunmingtea.com
VITE_API_URL=https://api.zunmingtea.com
VITE_COGNITO_LOGIN_URL=https://auth.zunmingtea.com/login?client_id=xxx&response_type=token&scope=openid&redirect_uri=https://admin.zunmingtea.com
VITE_COGNITO_LOGOUT_URL=https://auth.zunmingtea.com/logout?client_id=xxx&logout_uri=https://admin.zunmingtea.com
```

### Cloudflare（可选）
```
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
CLOUDFRONT_DISTRIBUTION_ID=...  # 如果使用 CloudFront
```

## 📦 部署流程

### 自动部署（推荐）

1. **后端和 CMS**：推送到 `main` 分支时自动部署
   ```bash
   git add backend/ cms/
   git commit -m "Update backend/cms"
   git push origin main
   ```

2. **前端**：通过 CMS 发布按钮触发，或手动触发
   - 在 CMS 中点击"保存并发布"
   - 或在 GitHub Actions 中手动运行 `deploy-github-pages`

### 手动部署

```bash
# 部署后端
npm run deploy:backend

# 部署 CMS
npm run deploy:cms

# 部署前端
npm run deploy:frontend
```

## 🎨 设计规范

### 颜色方案
- **主色（深绿）**：`#16a34a` - 代表茶叶、自然
- **辅色（米色）**：`#fef9c3` - 代表纸张、纯净
- **金色**：`#f59e0b` - 代表高端茶汤

### 字体
- **标题**：Noto Serif SC（衬线字体）- 传承感
- **正文**：Noto Sans（无衬线字体）- 现代感、可读性

### 参考设计
- 视觉风格参考：https://www.nationalparks.org/
- 大幅图片、简洁布局、充足留白

## 🔧 常见问题

### Q: 如何添加新用户到 CMS？
A: 在 AWS Cognito User Pool 中手动创建用户。

### Q: 如何修改网站内容？
A: 登录 `admin.zunmingtea.com`，编辑页面或产品，点击"保存并发布"。

### Q: 发布后多久生效？
A: GitHub Actions 构建需要 3-5 分钟，Cloudflare 缓存清除即时生效。

### Q: 如何查看 Lambda 日志？
A: 使用 AWS CloudWatch Logs 或在本地运行 `sam logs`。

### Q: 翻译功能如何工作？
A: 使用 Amazon Translate API 自动翻译中文内容为英文/日文。

## 📝 开发备忘

### API 端点

**公开端点**（无需认证）：
- `GET /content/pages?lang=zh` - 获取所有页面
- `GET /content/products?lang=en` - 获取所有产品
- `GET /content/products/ids` - 获取产品 ID 列表
- `GET /content/products/{id}` - 获取单个产品

**保护端点**（需要 Cognito Token）：
- `POST /content/pages/{slug}` - 创建/更新页面
- `POST /content/products/{id}` - 创建/更新产品
- `DELETE /content/products/{id}` - 删除产品
- `POST /translate` - 翻译文本
- `POST /publish` - 触发 GitHub Actions 构建

### DynamoDB 表结构

**Pages 表**：
```json
{
  "page_slug": "about-us",
  "title_zh": "关于我们",
  "content_zh": "...",
  "title_en": "About Us",
  "content_en": "...",
  "title_ja": "私たちについて",
  "content_ja": "...",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

**Products 表**：
```json
{
  "product_id": "product-1698765432000",
  "name_zh": "龙井茶",
  "desc_zh": "...",
  "name_en": "Longjing Tea",
  "desc_en": "...",
  "name_ja": "龍井茶",
  "desc_ja": "...",
  "image_url": "https://...",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

## 📄 许可证

© 2025 Zunming Tea. All rights reserved.

---

## 🤝 贡献

本项目为私有项目。如有问题，请联系开发团队。

## 📞 支持

如需技术支持，请联系：[your-email@example.com]
