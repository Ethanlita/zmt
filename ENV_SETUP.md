# 环境变量配置指南

本项目使用环境变量来配置不同环境的设置。请按照以下步骤配置。

## Backend 环境变量

文件: `backend/.env.local`

```bash
# 复制示例文件
cd backend
cp .env.example .env.local

# 编辑文件，填入实际值
AWS_REGION=us-east-1
PAGES_TABLE=zmt-pages
PRODUCTS_TABLE=zmt-products
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=ethanlita/zmt
```

## CMS 环境变量

文件: `cms/.env.local`

```bash
# 复制示例文件
cd cms
cp .env.example .env.local

# 编辑文件，填入实际值
VITE_API_URL=http://localhost:3000  # 本地开发
# VITE_API_URL=https://api.zunmingtea.com  # 生产环境

VITE_COGNITO_LOGIN_URL=https://auth.zunmingtea.com/login?client_id=YOUR_CLIENT_ID&response_type=token&scope=openid&redirect_uri=http://localhost:3001

VITE_COGNITO_LOGOUT_URL=https://auth.zunmingtea.com/logout?client_id=YOUR_CLIENT_ID&logout_uri=http://localhost:3001
```

### 如何获取 Cognito Client ID？

1. 打开 AWS Console
2. 进入 Cognito > User Pools
3. 选择你的 User Pool
4. 点击 "App integration" 标签
5. 在 "App clients" 部分找到 Client ID

## Frontend 环境变量

文件: `frontend/.env.local`

```bash
# 复制示例文件
cd frontend
cp .env.example .env.local

# 编辑文件，填入实际值
NEXT_PUBLIC_API_URL=http://localhost:3000  # 本地开发
# NEXT_PUBLIC_API_URL=https://api.zunmingtea.com  # 生产环境
```

## GitHub Secrets（生产环境）

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加：

### AWS 相关
```
AWS_ACCESS_KEY_ID         # AWS 访问密钥 ID
AWS_SECRET_ACCESS_KEY     # AWS 秘密访问密钥
AWS_REGION                # AWS 区域（us-east-1）
AWS_SAM_BUCKET            # SAM 部署 bucket
AWS_S3_BUCKET_CMS         # CMS 托管 bucket (admin.zunmingtea.com)
COGNITO_USER_POOL_ARN     # Cognito User Pool ARN
```

### API URLs
```
NEXT_PUBLIC_API_URL       # 前端 API URL (https://api.zunmingtea.com)
VITE_API_URL              # CMS API URL (https://api.zunmingtea.com)
VITE_COGNITO_LOGIN_URL    # Cognito 登录 URL
VITE_COGNITO_LOGOUT_URL   # Cognito 登出 URL
```

### Cloudflare（可选）
```
CLOUDFLARE_API_TOKEN      # Cloudflare API Token
CLOUDFLARE_ZONE_ID        # Cloudflare Zone ID
```

## 环境变量说明

### AWS_REGION
- **说明**: AWS 服务所在区域
- **建议**: `us-east-1` (美国东部，延迟较低)
- **获取方式**: 在 AWS Console 右上角选择区域

### GITHUB_PAT (Personal Access Token)
- **说明**: 用于触发 GitHub Actions
- **权限**: `repo` (Full control of private repositories)
- **获取方式**: GitHub Settings > Developer settings > Personal access tokens > Generate new token

### Cognito URLs
- **VITE_COGNITO_LOGIN_URL**: 用户登录时重定向的 URL
- **VITE_COGNITO_LOGOUT_URL**: 用户登出时重定向的 URL
- **格式**: `https://[domain]/login?client_id=[id]&response_type=token&scope=openid&redirect_uri=[callback]`

### CLOUDFLARE_API_TOKEN
- **说明**: 用于清除 Cloudflare CDN 缓存
- **权限**: Zone.Cache Purge
- **获取方式**: Cloudflare Dashboard > My Profile > API Tokens > Create Token

## 安全提示

⚠️ **重要**：
- 永远不要将 `.env.local` 文件提交到 Git
- 不要在代码中硬编码敏感信息
- 定期轮换 API 密钥和 Token
- 使用 AWS Secrets Manager 存储生产环境敏感数据

## 验证配置

### 验证 Backend
```bash
cd backend
node -e "console.log(process.env)"  # 查看环境变量
sam local start-api  # 启动本地 API
```

### 验证 CMS
```bash
cd cms
npm run dev  # 应该能正常启动
```

### 验证 Frontend
```bash
cd frontend
npm run dev  # 应该能正常启动
```

## 故障排查

### 问题: CMS 无法登录
- 检查 `VITE_COGNITO_LOGIN_URL` 是否正确
- 检查 Cognito Callback URL 是否包含当前域名

### 问题: API 调用失败
- 检查 `VITE_API_URL` / `NEXT_PUBLIC_API_URL` 是否正确
- 检查网络连接
- 查看浏览器控制台的错误信息

### 问题: GitHub Actions 部署失败
- 检查 GitHub Secrets 是否配置完整
- 检查 AWS 凭证是否有效
- 查看 Actions 日志获取详细错误信息
