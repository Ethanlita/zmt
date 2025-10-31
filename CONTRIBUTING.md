# 贡献指南

感谢您对尊茗茶业项目的关注！本文档将帮助您了解如何为项目做出贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)

## 行为准则

请保持专业和尊重的态度与其他贡献者交流。

## 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/ethanlita/zmt/issues) 中搜索是否已存在类似问题
2. 如果没有，创建新 issue 使用 "Bug Report" 模板
3. 提供详细的复现步骤和环境信息

### 建议新功能

1. 在 Issues 中创建 "Feature Request"
2. 描述功能的用途和价值
3. 等待团队反馈

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开发流程

### 1. 设置开发环境

```bash
# 克隆仓库
git clone https://github.com/ethanlita/zmt.git
cd zmt

# 安装依赖
npm run install:all

# 配置环境变量
cp backend/.env.example backend/.env.local
cp cms/.env.example cms/.env.local
cp frontend/.env.example frontend/.env.local

# 启动开发服务器
./dev.sh
```

### 2. 创建分支

```bash
# 功能分支
git checkout -b feature/my-new-feature

# Bug 修复分支
git checkout -b fix/bug-description

# 文档更新分支
git checkout -b docs/update-readme
```

### 3. 进行更改

- 遵循项目的代码规范
- 添加必要的测试
- 更新相关文档

### 4. 测试

```bash
# Backend 测试
cd backend && npm test

# CMS 测试
cd cms && npm test

# Frontend 测试
cd frontend && npm test
```

### 5. 提交代码

```bash
# 添加更改
git add .

# 提交（遵循提交规范）
git commit -m "feat: add user profile page"

# 推送
git push origin feature/my-new-feature
```

### 6. 创建 Pull Request

1. 在 GitHub 上打开 Pull Request
2. 填写 PR 模板
3. 等待代码审查
4. 根据反馈进行修改

## 代码规范

### JavaScript/TypeScript

- 使用 ESLint 检查代码
- 使用 2 空格缩进
- 使用单引号
- 添加适当的注释

```javascript
// ✅ 好的示例
const fetchProducts = async (lang = 'zh') => {
  try {
    const response = await api.get('/products', { params: { lang } });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};

// ❌ 不好的示例
const fetchProducts=async(lang)=>{
const response=await api.get("/products",{params:{lang}})
return response.data
}
```

### CSS/Tailwind

- 优先使用 Tailwind 类名
- 避免内联样式
- 使用语义化的自定义类

```jsx
// ✅ 好的示例
<button className="btn-primary">
  保存
</button>

// ❌ 不好的示例
<button style={{ backgroundColor: 'blue', color: 'white' }}>
  保存
</button>
```

### React 组件

- 使用函数组件和 Hooks
- 组件名使用 PascalCase
- Props 使用 TypeScript 类型

```tsx
// ✅ 好的示例
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {
  return (
    <button className={`btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交示例

```bash
# 新功能
git commit -m "feat: add product search functionality"

# Bug 修复
git commit -m "fix: resolve login redirect issue"

# 文档
git commit -m "docs: update deployment guide"

# 样式
git commit -m "style: format code with prettier"

# 重构
git commit -m "refactor: simplify API service layer"

# 性能
git commit -m "perf: optimize image loading"

# 测试
git commit -m "test: add unit tests for content handler"

# 杂项
git commit -m "chore: update dependencies"
```

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**：

```
feat(cms): add one-click translation button

- Add translation button to language tabs
- Integrate with Amazon Translate API
- Show loading state during translation

Closes #123
```

## Pull Request 规范

### PR 标题

与提交信息格式相同：`<type>: <description>`

### PR 描述模板

```markdown
## 📝 变更描述
<!-- 简短描述这个 PR 做了什么 -->

## 🎯 相关 Issue
<!-- 关联的 Issue，例如: Closes #123 -->

## 🧪 测试
<!-- 如何测试这些变更？ -->
- [ ] 本地测试通过
- [ ] 添加了新的测试用例

## 📸 截图（如适用）
<!-- 如果有 UI 变更，添加截图 -->

## ✅ Checklist
- [ ] 代码遵循项目规范
- [ ] 已添加必要的文档
- [ ] 已添加或更新测试
- [ ] 所有测试通过
- [ ] 已自我审查代码
```

## 代码审查

### 作为审查者

- 保持建设性和友好
- 给出具体的改进建议
- 指出潜在的问题

### 作为提交者

- 及时响应反馈
- 不要将批评当作个人攻击
- 解释你的设计决策

## 许可证

提交代码即表示您同意将贡献按照项目的许可证进行许可。

## 问题？

如有任何问题，请通过以下方式联系：
- 创建 Issue
- 发送邮件至：[your-email@example.com]

---

感谢您的贡献！🎉
