# 尊茗茶业网站重构 - 快速开始指南

## 🎯 5 分钟了解项目

这是一个现代化的企业网站系统，包含三个主要部分：

1. **公共网站** (`new.zunmingtea.com`) - 客户访问的网站
2. **管理后台** (`admin.zunmingtea.com`) - 编辑内容的 CMS
3. **后端 API** (`api.zunmingtea.com`) - 提供数据的 API

## 🚀 本地开发

### 前置要求
```bash
node --version  # 需要 >= 18
npm --version   # 需要 >= 9
```

### 快速启动

```bash
# 1. 克隆仓库
git clone https://github.com/ethanlita/zmt.git
cd zmt

# 2. 安装所有依赖
npm run install:all

# 3. 启动开发服务器
# 在三个终端窗口中分别运行：

# 终端 1 - 后端 (需要先配置 AWS)
cd backend
sam local start-api

# 终端 2 - CMS
cd cms
npm run dev

# 终端 3 - 前端
cd frontend
npm run dev
```

### 访问地址
- 前端：http://localhost:3000
- CMS：http://localhost:3001
- API：http://localhost:3000 (SAM local)

## 📝 常见任务

### 如何添加新页面？

1. 登录 CMS (`admin.zunmingtea.com`)
2. 在仪表板点击"页面管理"
3. 编辑内容（支持富文本）
4. 使用"从中文翻译"按钮自动翻译
5. 点击"保存并发布"

### 如何添加新产品？

1. 登录 CMS
2. 点击"产品管理" > "添加产品"
3. 填写产品信息
4. 使用翻译功能填充英文/日文
5. 点击"保存并发布"

### 如何更新样式？

**前端**：编辑 `frontend/tailwind.config.js` 和 `frontend/styles/globals.css`

**CMS**：编辑 `cms/tailwind.config.js` 和 `cms/src/index.css`

### 如何查看日志？

```bash
# 本地开发 - 查看终端输出

# AWS 生产环境
sam logs --stack-name zmt-backend --tail

# 或使用 AWS Console
# CloudWatch > Log groups > /aws/lambda/zmt-*
```

## 🔧 故障排查

### CMS 无法登录
- 检查 Cognito 用户是否已创建
- 检查 `.env.local` 中的 `VITE_COGNITO_LOGIN_URL`

### API 返回 403 错误
- 检查 Cognito Token 是否有效
- 检查 API Gateway 的 Authorizer 配置

### 前端页面空白
- 检查 API 是否返回数据
- 在浏览器控制台查看错误信息
- 检查 `NEXT_PUBLIC_API_URL` 配置

### GitHub Actions 失败
- 检查 GitHub Secrets 是否配置完整
- 查看 Actions 页面的详细日志
- 常见问题：AWS 凭证过期、S3 bucket 不存在

## 📚 更多文档

- [完整部署指南](./DEPLOYMENT.md)
- [详细 README](./README.md)
- [AWS SAM 文档](https://docs.aws.amazon.com/serverless-application-model/)
- [Next.js 文档](https://nextjs.org/docs)
- [Vite 文档](https://vitejs.dev/)

## 🆘 需要帮助？

1. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 的"故障排查"部分
2. 检查 GitHub Issues
3. 联系开发团队

---

**提示**：首次部署请按照 [DEPLOYMENT.md](./DEPLOYMENT.md) 的步骤操作！
