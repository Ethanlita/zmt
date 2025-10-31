# DNS 配置故障排除指南

## 问题 1: admin.zunmingtea.com DNS 解析失败

### 原因分析
S3 静态网站托管的 endpoint 格式为：
```
admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com
```

这是一个 **HTTP-only** 的端点，不支持 HTTPS。但 Cloudflare 的 Proxy（橙色云）默认强制 HTTPS，导致连接失败。

### 解决方案

#### 方案 A：使用 CloudFront（推荐）✅

**优点：** 支持 HTTPS，全球 CDN 加速，自定义域名
**步骤：**

1. **创建 CloudFront 分发**
```bash
# 登录 AWS Console
# CloudFront > Create Distribution

Origin Domain: admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com
Origin Protocol Policy: HTTP Only (S3 网站只支持 HTTP)

Alternate Domain Names (CNAMEs): admin.zunmingtea.com
SSL Certificate: 选择已有的 ACM 证书
  arn:aws:acm:us-east-1:296821242554:certificate/9e69ca45-8c1d-4ae0-b227-96adbcb8d01e

Default Root Object: index.html
Custom Error Response: 
  - 404 → /index.html (200) - 用于 SPA 路由
  - 403 → /index.html (200)
```

2. **在 Cloudflare 配置 CNAME**
```
类型: CNAME
名称: admin
目标: dxxxxxxxxxxxxx.cloudfront.net (CloudFront 分配的域名)
Proxy: ✅ 开启（橙色云）
TTL: Auto
```

3. **等待 CloudFront 部署完成**（约 15-20 分钟）

---

#### 方案 B：直接使用 S3 + Cloudflare DNS Only（临时方案）

**缺点：** 只支持 HTTP，没有 HTTPS，不推荐生产环境
**步骤：**

1. **在 Cloudflare 配置 CNAME**
```
类型: CNAME
名称: admin
目标: admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com
Proxy: ❌ 关闭（DNS Only，灰色云）
TTL: Auto
```

2. **访问地址**
```
http://admin.zunmingtea.com (仅 HTTP)
```

---

#### 方案 C：使用 AWS Amplify 托管 CMS（最简单）

**优点：** 自动 HTTPS，自动部署，自定义域名
**步骤：**

1. 将 CMS 代码推送到 GitHub
2. 在 AWS Amplify Console 创建应用
3. 连接 GitHub 仓库的 `cms/` 目录
4. 配置自定义域名 `admin.zunmingtea.com`
5. Amplify 自动配置 SSL 和 DNS

---

## 问题 2: Cognito Hosted UI redirect_uri 不匹配

### 原因分析
Cognito App Client 的回调 URL 配置了 `https://admin.zunmingtea.com`，但该域名目前无法解析，导致登录后无法重定向。

### 临时解决方案（用于测试）

1. **使用 S3 直接域名进行测试**

修改 Cognito App Client 的回调 URL：
```
登录 AWS Console > Cognito > User Pool > App Integration > App Client

Allowed callback URLs:
http://admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com
http://admin.zunmingtea.com
https://admin.zunmingtea.com

Allowed sign-out URLs:
http://admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com
http://admin.zunmingtea.com
https://admin.zunmingtea.com
```

2. **更新 CMS 环境变量**

```bash
cd /Users/lita/Documents/GitHub/zmt/cms

# 编辑 .env
VITE_COGNITO_LOGIN_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login?client_id=3l2enft1vanfn7l0e27b88j9gr&response_type=token&scope=openid&redirect_uri=http://admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com

VITE_COGNITO_LOGOUT_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/logout?client_id=3l2enft1vanfn7l0e27b88j9gr&logout_uri=http://admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com
```

3. **重新构建和部署 CMS**
```bash
npm run build
aws s3 sync dist/ s3://admin.zunmingtea.com --delete
```

---

### 永久解决方案（推荐）✅

**完成上述方案 A 后：**

1. **等待 CloudFront 部署完成**
2. **验证 HTTPS 访问**
```bash
curl -I https://admin.zunmingtea.com
# 应该返回 200 OK
```

3. **Cognito 回调 URL 只保留 HTTPS**
```
Allowed callback URLs:
https://admin.zunmingtea.com

Allowed sign-out URLs:
https://admin.zunmingtea.com
```

4. **更新 CMS 环境变量为最终版本**
```bash
VITE_COGNITO_LOGIN_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login?client_id=3l2enft1vanfn7l0e27b88j9gr&response_type=token&scope=openid&redirect_uri=https://admin.zunmingtea.com

VITE_COGNITO_LOGOUT_URL=https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/logout?client_id=3l2enft1vanfn7l0e27b88j9gr&logout_uri=https://admin.zunmingtea.com
```

5. **重新部署**

---

## 完整的 Cloudflare DNS 配置

完成所有 CloudFront 分发创建后，Cloudflare DNS 配置应该是：

| 类型 | 名称 | 目标 | Proxy | 说明 |
|------|------|------|-------|------|
| CNAME | new | ethanlita.github.io | ✅ | 前端网站 |
| CNAME | api | d21uwwr919zoi4.cloudfront.net | ✅ | API 后端 |
| CNAME | admin | d[新创建的].cloudfront.net | ✅ | CMS 后台 |

**重要提示：** 所有 CloudFront 域名必须先在 CloudFront 控制台配置好 Alternate Domain Names (CNAMEs) 和 ACM 证书，才能在 Cloudflare 添加 CNAME。

---

## 验证步骤

完成配置后，依次验证：

```bash
# 1. DNS 解析
dig admin.zunmingtea.com +short
dig new.zunmingtea.com +short
dig api.zunmingtea.com +short

# 2. HTTPS 访问
curl -I https://admin.zunmingtea.com
curl -I https://new.zunmingtea.com
curl -I https://api.zunmingtea.com

# 3. CMS 登录测试
# 访问 https://admin.zunmingtea.com
# 点击登录按钮
# 应该跳转到 Cognito Hosted UI
# 登录后重定向回 CMS

# 4. API 测试
curl https://api.zunmingtea.com/content/products
```

---

## 快速行动清单

### 现在立即可以做的：

1. ✅ **创建 CloudFront 分发给 CMS**（15 分钟操作 + 20 分钟等待）
2. ✅ **更新 Cognito 回调 URL**（添加 S3 直接域名用于临时测试）
3. ✅ **更新 CMS .env 使用临时回调 URL**
4. ✅ **重新部署 CMS** 
5. ✅ **测试能否通过 S3 直接域名登录**

### CloudFront 部署完成后：

6. ✅ **在 Cloudflare 添加 admin CNAME**
7. ✅ **验证 HTTPS 访问**
8. ✅ **更新 Cognito 和 CMS 使用正式域名**
9. ✅ **最终测试完整登录流程**

---

## 常见错误和解决方法

### 错误 1: "Forbidden" 访问 S3
**原因：** Bucket 策略没有允许公开读取  
**解决：** 更新 Bucket Policy

### 错误 2: "Certificate doesn't match"
**原因：** CloudFront 没有配置 ACM 证书  
**解决：** 在 CloudFront 设置中添加 SSL 证书

### 错误 3: "Invalid redirect_uri"
**原因：** Cognito App Client 没有配置对应的回调 URL  
**解决：** 在 Cognito 控制台添加准确的回调 URL

### 错误 4: DNS 解析到错误的 IP
**原因：** DNS 缓存  
**解决：** 清除本地 DNS 缓存
```bash
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# 或等待 TTL 过期（通常 5 分钟）
```

---

## 参考文档

- [S3 静态网站托管](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront 自定义域名](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)
- [Cognito Hosted UI](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [Cloudflare DNS 配置](https://developers.cloudflare.com/dns/)
