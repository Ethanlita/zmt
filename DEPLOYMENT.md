# Zunming Tea - 部署清单

## 🎯 部署前准备

### 1. AWS 账户配置

- [ ] AWS 账户已创建
- [ ] AWS CLI 已安装并配置
- [ ] SAM CLI 已安装
- [ ] 设置 AWS 默认 Region 为 `us-east-1`

### 2. GitHub 配置

- [ ] 仓库已创建：`ethanlita/zmt`
- [ ] 启用 GitHub Pages（分支：gh-pages）
- [ ] 生成 GitHub Personal Access Token（权限：repo）

### 3. Cloudflare 配置

- [ ] 域名 `zunmingtea.com` 已添加到 Cloudflare
- [ ] SSL/TLS 模式设为 Full (strict)
- [ ] 获取 API Token 和 Zone ID

---

## 📋 部署步骤

### 第一步：部署 AWS 后端

#### 1.1 创建 Cognito User Pool

```bash
# 方法 1：通过 AWS Console
# 1. 打开 Cognito > User Pools > Create user pool
# 2. Sign-in options: Email
# 3. Password policy: 默认
# 4. MFA: 可选
# 5. User account recovery: Email only
# 6. Self-registration: Disabled（管理员手动创建用户）
# 7. Attributes: email (required)
# 8. Email provider: Send email with Cognito
# 9. App client: 
#    - App client name: zmt-cms-client
#    - Authentication flows: ALLOW_USER_PASSWORD_AUTH
#    - OAuth 2.0 grant types: Implicit grant
#    - OAuth scopes: openid
#    - Callback URLs: https://admin.zunmingtea.com
#    - Sign out URLs: https://admin.zunmingtea.com
# 10. Domain: auth.zunmingtea.com (或使用 Cognito 默认域名)

# 记录以下信息：
# User Pool ID: us-east-1_xxxxxxxxx
# User Pool ARN: arn:aws:cognito-idp:us-east-1:xxxxxxxxxxxx:userpool/us-east-1_xxxxxxxxx
# App Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 1.2 创建 GitHub PAT 并存储到 SSM

```bash
# 在 GitHub Settings > Developer settings > Personal access tokens
# 创建 Token，权限选择: repo (Full control)

# 存储到 SSM
aws ssm put-parameter \
  --name /zmt/github/pat \
  --value "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  --type SecureString \
  --region us-east-1
```

#### 1.3 部署后端 Lambda 和 API Gateway

```bash
cd backend

# 安装依赖
npm install

# 构建和部署
sam build

sam deploy --guided
# Stack Name: zmt-backend
# AWS Region: us-east-1
# Parameter CognitoUserPoolArn: [粘贴上面的 ARN]
# Confirm changes: Y
# Allow SAM CLI IAM role creation: Y
# Disable rollback: N
# Save arguments to configuration file: Y

# 部署完成后，记录 API Gateway URL
# Output: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### 第二步：配置 CMS 和前端

#### 2.1 创建 S3 Bucket（CMS 托管）

```bash
# 创建 bucket
aws s3 mb s3://admin.zunmingtea.com --region us-east-1

# 启用静态网站托管
aws s3 website s3://admin.zunmingtea.com \
  --index-document index.html \
  --error-document index.html

# 设置公开访问策略
aws s3api put-bucket-policy \
  --bucket admin.zunmingtea.com \
  --policy file://deploy/s3-bucket-policy.json \
  --region us-east-1

# 禁用"阻止公共访问"设置
aws s3api put-public-access-block \
  --bucket admin.zunmingtea.com \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

#### 2.2 配置 GitHub Secrets

在 GitHub 仓库 `Settings > Secrets and variables > Actions` 添加：

```bash
# AWS 相关
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_SAM_BUCKET=aws-sam-cli-managed-default-samclisourcebucket-xxxxx
AWS_S3_BUCKET_CMS=admin.zunmingtea.com
COGNITO_USER_POOL_ARN=arn:aws:cognito-idp:us-east-1:xxx:userpool/us-east-1_xxx

# API URLs
NEXT_PUBLIC_API_URL=https://api.zunmingtea.com
VITE_API_URL=https://api.zunmingtea.com

# Cognito URLs（替换 YOUR_CLIENT_ID）
VITE_COGNITO_LOGIN_URL=https://auth.zunmingtea.com/login?client_id=YOUR_CLIENT_ID&response_type=token&scope=openid&redirect_uri=https://admin.zunmingtea.com
VITE_COGNITO_LOGOUT_URL=https://auth.zunmingtea.com/logout?client_id=YOUR_CLIENT_ID&logout_uri=https://admin.zunmingtea.com

# Cloudflare (可选)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...
```

### 第三步：配置 Cloudflare DNS

在 Cloudflare Dashboard 添加 DNS 记录：

```
类型: CNAME, 名称: new, 内容: ethanlita.github.io, Proxy: ON
类型: CNAME, 名称: admin, 内容: admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com, Proxy: ON
类型: CNAME, 名称: api, 内容: [API Gateway域名].execute-api.us-east-1.amazonaws.com, Proxy: ON
类型: CNAME, 名称: auth, 内容: [cognito-domain].auth.us-east-1.amazoncognito.com, Proxy: ON (如果使用自定义域名)
```

**SSL/TLS 设置**：
- 加密模式：Full (strict)
- 边缘证书：Universal SSL（自动）

### 第四步：触发首次部署

```bash
# 推送代码到 GitHub，触发自动部署
git add .
git commit -m "Initial deployment"
git push origin main

# 等待 GitHub Actions 完成（3-5分钟）
# 1. deploy-aws.yml 会部署后端和 CMS
# 2. deploy-github-pages.yml 会部署前端

# 检查部署状态
# GitHub > Actions > 查看工作流运行状态
```

### 第五步：创建管理员用户

```bash
# 在 AWS Cognito User Pool 中创建用户
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username admin@zunmingtea.com \
  --user-attributes Name=email,Value=admin@zunmingtea.com \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS

# 设置永久密码（首次登录后会提示修改）
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_xxxxxxxxx \
  --username admin@zunmingtea.com \
  --password "YourSecurePassword123!" \
  --permanent
```

### 第六步：验证部署

- [ ] 访问 `https://new.zunmingtea.com` - 前端网站可以访问
- [ ] 访问 `https://admin.zunmingtea.com` - CMS 可以访问并跳转到登录页
- [ ] 使用管理员账户登录 CMS
- [ ] 在 CMS 中添加测试内容
- [ ] 点击"保存并发布"，等待前端更新
- [ ] 刷新前端网站，确认新内容显示

---

## 🔍 故障排查

### 问题 1: Lambda 函数无法访问 DynamoDB
**原因**：IAM 权限不足
**解决**：检查 SAM template.yaml 中的 `DynamoDBCrudPolicy`

### 问题 2: CMS 无法调用 API
**原因**：CORS 配置错误
**解决**：检查 API Gateway 的 CORS 设置，确保允许 `https://admin.zunmingtea.com`

### 问题 3: Cognito 登录后无法重定向
**原因**：Callback URL 不匹配
**解决**：在 Cognito App Client 中添加正确的 Callback URL

### 问题 4: GitHub Pages 部署失败
**原因**：API 无法访问或数据为空
**解决**：确保 API 有测试数据，检查 `NEXT_PUBLIC_API_URL` 是否正确

### 问题 5: Cloudflare 显示 502 错误
**原因**：源站无法访问
**解决**：检查 S3/API Gateway 是否正常运行，DNS 是否正确

---

## 📊 监控和维护

### CloudWatch 日志
```bash
# 查看 Lambda 日志
sam logs --stack-name zmt-backend --tail

# 查看特定函数日志
aws logs tail /aws/lambda/zmt-content-handler --follow
```

### DynamoDB 备份
```bash
# 创建按需备份
aws dynamodb create-backup \
  --table-name zmt-pages \
  --backup-name zmt-pages-backup-$(date +%Y%m%d)

aws dynamodb create-backup \
  --table-name zmt-products \
  --backup-name zmt-products-backup-$(date +%Y%m%d)
```

### 成本预估（月度）
- Lambda: $5-10（前 100 万请求免费）
- API Gateway: $3-5
- DynamoDB: $1-2（按需计费）
- S3: $1-2
- Cognito: 免费（前 50,000 MAU）
- **总计**: ~$10-20/月

---

## ✅ 完成！

系统已成功部署！现在你可以：
1. 访问 `https://new.zunmingtea.com` 查看公共网站
2. 访问 `https://admin.zunmingtea.com` 管理内容
3. 使用 CMS 编辑页面和产品
4. 一键发布更新到前端

---

**下一步**：
- 添加更多页面内容
- 上传产品图片到 S3 或使用 CDN
- 配置 Cognito 邮件模板
- 设置 CloudWatch 告警
- 定期备份 DynamoDB 数据
