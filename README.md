# Zunming Tea (ZMT) - 企业网站重构项目

> 为尊茗茶业打造的现代化、高性能、易维护的多语言企业网站系统

## 📋 项目概述

ZMT 采用 Serverless + JAMstack 架构，面向企业官网与内部内容团队提供统一的平台能力：

- 🌐 **公共网站**：Next.js 静态站点（SSG），全球 CDN 加速。
- 🎨 **管理后台**：React + Vite SPA，支持所见即所得编辑、栏目树管理、媒体插入与多语言内容。
- ⚡ **后端 API**：AWS Lambda + API Gateway + DynamoDB，提供内容、导航、站点设置及发布接口。
- 🔐 **身份认证**：AWS Cognito Hosted UI，采用隐式登录流程。
- 🧭 **栏目树管理**：树状节点定义栏目、页面与外部链接，支持深度嵌套与拖拽排序。
- 🦶 **可配置页脚**：CMS 可配置多语言页脚文案与链接，前端实时加载。
- 🚀 **自动化部署**：GitHub Actions 负责后端、CMS 与网站发布。

## 🗂️ 项目结构

```
zmt/
├── backend/                 # AWS SAM 后端
│   ├── template.yaml       # SAM 模板
│   └── src/handlers/       # Lambda 入口 (content/navigation/services)
│
├── cms/                     # React 管理后台
│   ├── src/pages/          # 页面组件（Dashboard、Navigation 等）
│   ├── src/components/     # UI & 富文本组件
│   └── src/services/       # API 封装
│
├── frontend/                # Next.js 公共网站
│   ├── pages/              # 静态/动态路由 (index, sections/[slug], pages/[slug])
│   ├── components/         # Layout、导航、页脚等
│   └── lib/                # i18n、站点配置
│
└── .github/workflows/      # CI/CD 工作流
    ├── deploy-aws.yml
    └── deploy-github-pages.yml
```

## 🚀 快速开始

### 1. 环境依赖
- Node.js ≥ 18
- npm ≥ 9
- AWS CLI & SAM CLI 已配置凭证
- GitHub 账户（用于触发 CI/CD）

### 2. 安装依赖

```bash
npm run install:all
# 或者分别进入 backend / cms / frontend 执行 npm install
```

### 3. 本地开发

```bash
# 后端（本地 API）
cd backend
cp .env.example .env.local
sam local start-api

# CMS
cd ../cms
cp .env.example .env.local
npm run dev  # 默认端口 3001

# 公共网站
cd ../frontend
cp .env.example .env.local
npm run dev  # 默认端口 3000
```

### 4. 发布概览
- 推送代码到 `main` 分支会触发后端与 CMS 部署（参见 `deploy-aws.yml`）。
- 在 CMS 中点击“保存并发布”会触发前端构建（调用 `deploy-github-pages.yml`）。

更多角色分工、操作清单请查阅 [`AGENTS.md`](./AGENTS.md)。

## 📚 文档索引
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)：整体架构、拓扑、部署与网络配置。
- [`DATA_STRUCTURES.md`](./DATA_STRUCTURES.md)：DynamoDB 表结构、导航树与内容模型。
- [`AGENTS.md`](./AGENTS.md)：开发 / 内容 / 运维角色职责与操作列表。
- [`ENV_SETUP.md`](./ENV_SETUP.md)：环境变量与凭证配置指南。

## 🤝 贡献与支持
- 本项目为私有仓库，如需协作请联系项目维护者。
- 技术支持或问题反馈：`info@zunmingtea.com`。

## 📄 许可证

© 2025 Zunming Tea. All rights reserved.
