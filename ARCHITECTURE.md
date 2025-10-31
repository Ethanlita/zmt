# 尊茗茶业网站重构 - 技术架构文档

## 系统架构设计

### 整体架构

本项目采用 **Headless CMS + JAMstack + Serverless** 架构：

```
┌────────────────────────────────────────────────────────┐
│                     用户层 (Users)                      │
├────────────┬───────────────────┬──────────────────────┤
│ 公众访客    │    内容编辑者      │    系统管理员         │
└──────┬─────┴─────┬─────────────┴──────┬──────────────┘
       │           │                     │
┌──────▼─────┐ ┌──▼──────────┐    ┌────▼─────────┐
│   前端网站  │ │  CMS 后台   │    │ AWS Console  │
│  (Next.js) │ │ (React SPA) │    │  (管理)      │
└──────┬─────┘ └──────┬──────┘    └──────────────┘
       │              │
       │   ┌──────────▼──────────┐
       │   │   Cognito 认证       │
       │   └──────────┬──────────┘
       │              │
┌──────▼──────────────▼─────────┐
│      API Gateway (REST)        │
│  - CORS 配置                   │
│  - Cognito Authorizer         │
│  - 速率限制                    │
└───────────┬───────────────────┘
            │
    ┌───────▼────────┐
    │  Lambda 函数    │
    │ - Content CRUD │
    │ - Translation  │
    │ - Publish      │
    └───────┬────────┘
            │
    ┌───────▼─────────┐
    │   DynamoDB      │
    │ - Pages         │
    │ - Products      │
    └─────────────────┘
```

### 数据流

#### 1. 内容发布流程
```
CMS 编辑器 → 保存到 DynamoDB → 触发 GitHub Action → 
Next.js 构建 (SSG) → 部署到 GitHub Pages → Cloudflare CDN
```

#### 2. 内容翻译流程
```
CMS 输入中文 → 点击翻译按钮 → Lambda 调用 Amazon Translate →
返回翻译结果 → 自动填充表单
```

#### 3. 用户访问流程
```
用户访问域名 → Cloudflare CDN → 
静态 HTML (已生成) → 直接返回（无需后端）
```

## 技术选型理由

### 前端 - Next.js (SSG)

**为什么选择 Next.js？**
- ✅ 静态站点生成（SSG）- 极致性能
- ✅ 内置 i18n 路由支持
- ✅ SEO 友好（预渲染 HTML）
- ✅ 图片优化
- ✅ 成熟的生态系统

**为什么选择 SSG 而非 SSR？**
- 内容更新频率低（茶叶产品不常变）
- 无需实时数据
- 更好的性能和 CDN 缓存
- 更低的成本（无服务器计算成本）

### CMS - React + Vite

**为什么选择 React？**
- ✅ 灵活性高，适合定制化 CMS
- ✅ 丰富的 UI 组件库
- ✅ 团队熟悉度高

**为什么选择 Vite？**
- ✅ 极快的开发服务器启动
- ✅ 热模块替换（HMR）
- ✅ 现代化构建工具

### 后端 - AWS Lambda + API Gateway

**为什么选择 Serverless？**
- ✅ 按需计费，成本低
- ✅ 自动扩展
- ✅ 无需维护服务器
- ✅ 与 AWS 其他服务集成良好

**为什么选择 SAM 而非 Serverless Framework？**
- ✅ AWS 官方支持
- ✅ 与 CloudFormation 原生集成
- ✅ 本地测试方便（sam local）

### 数据库 - DynamoDB

**为什么选择 DynamoDB？**
- ✅ Serverless，按需付费
- ✅ 低延迟（毫秒级）
- ✅ 自动扩展
- ✅ 无需维护
- ✅ 适合简单的 KV 存储

**为什么不选择关系型数据库？**
- 数据模型简单（页面、产品）
- 无复杂关联查询需求
- 降低成本和维护复杂度

### 认证 - AWS Cognito

**为什么选择 Cognito？**
- ✅ 托管式身份服务
- ✅ 与 API Gateway 原生集成
- ✅ 支持 OAuth 2.0 / OpenID Connect
- ✅ 内置 Hosted UI

### CDN - Cloudflare

**为什么选择 Cloudflare？**
- ✅ 免费 SSL 证书
- ✅ 全球 CDN 加速
- ✅ DDoS 防护
- ✅ DNS 管理
- ✅ 灵活的缓存规则

## 安全设计

### 1. 认证和授权

```
公开端点（GET）        → 无需认证
管理端点（POST/DELETE） → Cognito Token 验证
```

### 2. CORS 配置

```javascript
允许来源: https://admin.zunmingtea.com
允许方法: GET, POST, DELETE, OPTIONS
允许头部: Content-Type, Authorization
```

### 3. API 速率限制

- API Gateway 默认限制：10,000 请求/秒
- 可按需配置更严格的限制

### 4. 数据验证

- Lambda 函数中进行输入验证
- DynamoDB 使用 IAM 策略限制访问

## 性能优化

### 1. 前端优化

- **静态生成（SSG）**：构建时生成所有页面
- **图片优化**：Next.js Image 组件（需要配置）
- **代码分割**：Next.js 自动按路由分割
- **字体优化**：Google Fonts 预加载

### 2. CDN 缓存策略

```
前端网站 (new.zunmingtea.com):
  - Browser Cache TTL: 4 hours
  - Edge Cache TTL: 1 day
  
CMS (admin.zunmingtea.com):
  - Bypass cache (实时更新)
  
API (api.zunmingtea.com):
  - Bypass cache (动态数据)
```

### 3. 数据库优化

- DynamoDB 按需计费模式
- 使用分区键优化查询
- 避免全表扫描

## 成本分析

### 预估月度成本（小型网站）

| 服务 | 用量 | 成本 |
|------|------|------|
| Lambda | 100K 请求 | $0.20 |
| API Gateway | 100K 请求 | $0.35 |
| DynamoDB | 1GB 存储，100K 读写 | $0.50 |
| S3 (CMS) | 5GB 存储，1GB 传输 | $0.20 |
| Cognito | < 50K MAU | $0 (免费) |
| GitHub Pages | 100GB 带宽 | $0 (免费) |
| Cloudflare | CDN + SSL | $0 (免费) |
| **总计** | | **~$1.25/月** |

### 流量增长后（10 倍流量）

| 服务 | 用量 | 成本 |
|------|------|------|
| Lambda | 1M 请求 | $2.00 |
| API Gateway | 1M 请求 | $3.50 |
| DynamoDB | 1GB 存储，1M 读写 | $2.00 |
| 其他 | 同上 | $0.20 |
| **总计** | | **~$7.70/月** |

💡 **成本优势**：
- 传统 VPS (2GB): ~$10-20/月
- 传统云主机 (EC2 t3.small): ~$15-25/月
- Serverless: 按实际使用付费，更经济

## 扩展性设计

### 1. 水平扩展

- Lambda 自动扩展（并发：1000）
- API Gateway 无限扩展
- DynamoDB 自动扩展
- Cloudflare CDN 全球分布

### 2. 垂直扩展

- Lambda 内存：512MB → 3008MB
- DynamoDB：按需模式 → 预配置模式

### 3. 功能扩展

- 添加图片服务（S3 + CloudFront）
- 添加搜索功能（ElasticSearch）
- 添加分析功能（Google Analytics / CloudWatch）

## 灾难恢复

### 备份策略

```bash
# DynamoDB 自动备份（每日）
aws dynamodb update-continuous-backups \
  --table-name zmt-pages \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# 代码仓库
Git 版本控制 → GitHub（自动备份）
```

### 恢复时间目标（RTO/RPO）

- **RTO（恢复时间目标）**: < 1 小时
- **RPO（恢复点目标）**: < 24 小时（DynamoDB 备份）

### 高可用性

- Lambda：多 AZ 部署（AWS 自动）
- DynamoDB：多 AZ 复制（AWS 自动）
- GitHub Pages：99.9% SLA
- Cloudflare：100% 正常运行时间 SLA

## 监控和告警

### 1. CloudWatch 监控

```bash
# Lambda 指标
- 调用次数
- 错误率
- 持续时间
- 并发执行

# API Gateway 指标
- 请求数量
- 4XX/5XX 错误
- 延迟

# DynamoDB 指标
- 读写容量单位
- 存储大小
- 受限请求
```

### 2. 告警设置

```yaml
Lambda 错误率 > 5%: 发送邮件告警
API Gateway 5XX > 10: 发送邮件告警
DynamoDB 受限请求 > 100: 发送邮件告警
```

## 未来架构演进

### Phase 2: 增强功能
- 图片管理系统（S3 + CloudFront）
- 全文搜索（Algolia / ElasticSearch）
- 用户评论系统

### Phase 3: 企业级
- 多租户支持
- 高级权限管理
- 审计日志
- A/B 测试

### Phase 4: 国际化
- 更多语言支持
- 地区化内容
- 多货币支持

---

**参考资料**：
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [JAMstack Best Practices](https://jamstack.org/best-practices/)
- [Next.js Documentation](https://nextjs.org/docs)
