# AWS 部署安全指南

## 🔒 确保部署不影响现有 AWS 服务

本项目采取了多项措施确保部署的安全性和隔离性：

### 1. 资源命名隔离

所有 AWS 资源都使用 **`zmt-*-prod`** 前缀命名，与您账户中的其他资源完全隔离：

```yaml
资源类型              资源名称                      影响范围
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CloudFormation Stack  zmt-backend                  ✅ 独立堆栈
API Gateway          zmt-api-prod                 ✅ 不影响其他 API
Lambda Function      zmt-content-handler-prod     ✅ 独立函数
Lambda Function      zmt-services-handler-prod    ✅ 独立函数
DynamoDB Table       zmt-pages-prod               ✅ 独立表
DynamoDB Table       zmt-products-prod            ✅ 独立表
S3 Bucket            admin.zunmingtea.com         ✅ 域名专用
SSM Parameter        /zmt/github/pat              ✅ 独立参数
```

### 2. CloudFormation Stack 隔离

项目使用独立的 CloudFormation Stack（`zmt-backend`）：

- ✅ 所有资源在单独的堆栈中管理
- ✅ 删除堆栈只会删除该项目的资源
- ✅ 不会影响其他 CloudFormation Stacks
- ✅ 可以随时安全地删除整个项目

```bash
# 查看堆栈
aws cloudformation describe-stacks --stack-name zmt-backend

# 删除整个项目（如果需要）
aws cloudformation delete-stack --stack-name zmt-backend
```

### 3. 删除保护

关键数据表设置了删除保护：

```yaml
DeletionPolicy: Retain        # CloudFormation 删除时保留表
UpdateReplacePolicy: Retain   # 表替换时保留数据
```

这意味着：
- ✅ 即使删除 CloudFormation Stack，DynamoDB 表也会保留
- ✅ 防止意外数据丢失
- ✅ 需要手动删除表（更安全）

### 4. IAM 权限最小化

Lambda 函数只获得必要的权限：

```yaml
Policies:
  - DynamoDBCrudPolicy:
      TableName: !Ref PagesTable      # 仅访问自己的表
  - DynamoDBCrudPolicy:
      TableName: !Ref ProductsTable   # 仅访问自己的表
```

- ✅ 不能访问其他 DynamoDB 表
- ✅ 不能访问其他 AWS 服务
- ✅ 权限范围严格限制

### 5. 资源标签

所有资源都打上了标签，便于识别和管理：

```yaml
Tags:
  Project: ZunmingTea
  Environment: Production
  ManagedBy: SAM
```

好处：
- ✅ 可以通过标签筛选资源
- ✅ 可以追踪成本
- ✅ 可以批量管理资源

### 6. 独立 S3 Bucket

CMS 使用专用的 S3 Bucket：

```
admin.zunmingtea.com  # 域名专用，不会与其他 bucket 冲突
```

### 7. API Gateway 隔离

API Gateway 使用独立的 API：

- ✅ 独立的域名：`api.zunmingtea.com`
- ✅ 独立的资源和方法
- ✅ 不影响其他 API

## 🛡️ 部署前检查清单

在部署前，请确认：

- [ ] **Stack 名称唯一**：`zmt-backend` 在您的账户中是唯一的
- [ ] **表名唯一**：`zmt-pages-prod` 和 `zmt-products-prod` 不存在
- [ ] **S3 Bucket 名称可用**：`admin.zunmingtea.com` 未被占用
- [ ] **Lambda 函数名唯一**：`zmt-*-prod` 函数不存在
- [ ] **SSM 参数路径唯一**：`/zmt/github/pat` 不存在

### 检查命令

```bash
# 检查 CloudFormation Stack 是否已存在
aws cloudformation describe-stacks --stack-name zmt-backend 2>&1 | grep -q "does not exist" && echo "✅ Stack 不存在，可以部署" || echo "⚠️ Stack 已存在"

# 检查 DynamoDB 表是否存在
aws dynamodb describe-table --table-name zmt-pages-prod 2>&1 | grep -q "ResourceNotFoundException" && echo "✅ 表不存在" || echo "⚠️ 表已存在"

aws dynamodb describe-table --table-name zmt-products-prod 2>&1 | grep -q "ResourceNotFoundException" && echo "✅ 表不存在" || echo "⚠️ 表已存在"

# 检查 S3 Bucket 是否存在
aws s3 ls s3://admin.zunmingtea.com 2>&1 | grep -q "NoSuchBucket" && echo "✅ Bucket 不存在" || echo "⚠️ Bucket 已存在"

# 检查 Lambda 函数是否存在
aws lambda get-function --function-name zmt-content-handler-prod 2>&1 | grep -q "ResourceNotFoundException" && echo "✅ 函数不存在" || echo "⚠️ 函数已存在"
```

## 📦 资源清单

部署后会创建以下资源：

### CloudFormation
- Stack: `zmt-backend`

### Lambda (2 个函数)
- `zmt-content-handler-prod`
- `zmt-services-handler-prod`

### API Gateway (1 个 API)
- `zmt-api-prod`

### DynamoDB (2 个表)
- `zmt-pages-prod`
- `zmt-products-prod`

### IAM Roles (自动创建)
- `zmt-backend-ContentHandlerFunctionRole-*`
- `zmt-backend-ServicesHandlerFunctionRole-*`

### CloudWatch Logs (自动创建)
- `/aws/lambda/zmt-content-handler-prod`
- `/aws/lambda/zmt-services-handler-prod`

### S3 Bucket (手动创建)
- `admin.zunmingtea.com`

### SSM Parameter (手动创建)
- `/zmt/github/pat`

## 🚨 安全删除项目

如果需要完全删除项目：

```bash
# 1. 删除 CloudFormation Stack
aws cloudformation delete-stack --stack-name zmt-backend

# 2. 等待删除完成
aws cloudformation wait stack-delete-complete --stack-name zmt-backend

# 3. 手动删除 DynamoDB 表（因为有 DeletionPolicy: Retain）
aws dynamodb delete-table --table-name zmt-pages-prod
aws dynamodb delete-table --table-name zmt-products-prod

# 4. 删除 S3 Bucket
aws s3 rb s3://admin.zunmingtea.com --force

# 5. 删除 SSM Parameter
aws ssm delete-parameter --name /zmt/github/pat

# 6. (可选) 删除 CloudWatch Logs
aws logs delete-log-group --log-group-name /aws/lambda/zmt-content-handler-prod
aws logs delete-log-group --log-group-name /aws/lambda/zmt-services-handler-prod
```

## 💡 最佳实践

1. **先在测试环境部署**
   ```bash
   sam deploy --stack-name zmt-backend-test --parameter-overrides Environment=test
   ```

2. **使用 AWS Organizations**
   - 在独立的 AWS 账户中部署（推荐）
   - 或使用独立的 Region

3. **定期备份数据**
   ```bash
   # 启用 Point-in-time Recovery
   aws dynamodb update-continuous-backups \
     --table-name zmt-pages-prod \
     --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
   ```

4. **监控资源使用**
   - 在 AWS Console 查看 CloudFormation Stack
   - 使用标签筛选资源
   - 查看 Cost Explorer 追踪成本

## ✅ 总结

本项目已经采取了充分的隔离措施：

- ✅ 所有资源使用独特的命名前缀
- ✅ 使用独立的 CloudFormation Stack
- ✅ IAM 权限最小化
- ✅ 关键数据有删除保护
- ✅ 资源打上识别标签
- ✅ 可以安全地部署和删除

**您可以放心部署，不会影响现有的 AWS 服务！**
