# Admin CMS 自定义域名配置

## 需要在 Cloudflare 添加的 DNS 记录

访问 Cloudflare DNS 管理页面：https://dash.cloudflare.com/

### 1. 添加 admin 子域名 CNAME 记录

| 类型 | 名称 | 目标 | 代理状态 | TTL |
|------|------|------|----------|-----|
| CNAME | admin | d30mjqr3vgmyw1.cloudfront.net | DNS only (仅DNS) | Auto |

**重要**：必须选择 **"DNS only"** 模式，不要选择 "Proxied"（橙色云朵图标）

### 2. 添加 SSL 证书验证 CNAME 记录

| 类型 | 名称 | 目标 | 代理状态 | TTL |
|------|------|------|----------|-----|
| CNAME | _5b6d6ed2c64e65b645aa7da3339598ae | _b3bbe887b568ad4166ba939d2847f764.jkddzztsm.acm-validations.aws. | DNS only (仅DNS) | Auto |

**注意**：证书验证记录也必须是 **"DNS only"** 模式

## 添加步骤

1. 登录 Cloudflare Dashboard
2. 选择域名 `zunmingtea.com`
3. 进入 DNS 管理页面
4. 点击 "Add record" 按钮
5. 选择 "CNAME" 类型
6. 按照上表填写信息
7. **关闭代理（Proxy）**，选择 "DNS only"
8. 点击 "Save" 保存
9. 重复步骤 4-8 添加第二条记录

## 验证

添加 DNS 记录后，等待 5-30 分钟：

```bash
# 检查 admin CNAME 记录是否生效
dig admin.zunmingtea.com CNAME +short

# 检查 SSL 证书验证记录是否生效
dig _5b6d6ed2c64e65b645aa7da3339598ae.zunmingtea.com CNAME +short

# 查看 Amplify 域名状态
aws amplify get-domain-association \
  --app-id d1bdghiy8psmgv \
  --domain-name zunmingtea.com \
  --region us-east-1 \
  --query 'domainAssociation.domainStatus' \
  --output text
```

## 预期结果

- DNS 记录生效后（5-15 分钟）
- SSL 证书验证完成（15-30 分钟）
- Amplify 域名状态变为 `AVAILABLE`
- 可以访问：https://admin.zunmingtea.com

## 当前状态

- ✅ Amplify 域名配置已创建
- ⏳ 等待 DNS 记录添加
- ⏳ 等待 SSL 证书验证
- ⏳ 等待域名生效

## 故障排除

### 如果 30 分钟后仍未生效

1. 检查 DNS 记录是否正确：
   ```bash
   nslookup admin.zunmingtea.com
   ```

2. 确认代理状态为 "DNS only"（灰色云朵图标）

3. 查看 Amplify Console 状态：
   https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1bdghiy8psmgv

4. 检查证书验证记录：
   ```bash
   nslookup -type=CNAME _5b6d6ed2c64e65b645aa7da3339598ae.zunmingtea.com
   ```

### 如果看到 "DNS_FAILED" 状态

- 删除域名关联重新创建：
  ```bash
  aws amplify delete-domain-association \
    --app-id d1bdghiy8psmgv \
    --domain-name zunmingtea.com \
    --region us-east-1
  ```
- 然后重新执行创建命令

## 完成后的下一步

1. ✅ 访问 https://admin.zunmingtea.com
2. ✅ 测试登录功能
3. ✅ 添加初始内容（产品、页面）
4. ✅ 测试发布流程
