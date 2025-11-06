# 前端开发规范

本文档记录前端开发的关键规范和最佳实践，确保代码质量和用户体验。

## 数据加载规范

### 避免页面闪烁（Critical）

**问题**：如果在客户端通过 `useEffect` 异步加载导航和footer数据，会导致页面首次渲染时显示placeholder数据，然后切换到真实数据，造成明显的内容闪烁。

**解决方案**：所有页面必须使用 Next.js 的数据预加载功能（`getStaticProps` 或 `getServerSideProps`）。

### 标准实现模式

#### 1. 导入必要的类型和函数

```typescript
import { FooterSettings, NavigationNode, loadSiteChrome } from '../lib/siteConfig';
```

#### 2. 定义页面Props接口

```typescript
interface PageProps {
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
  // 其他页面特定的props
}
```

#### 3. 组件接收并传递props

```typescript
export default function Page({ initialNavigation, initialFooter }: PageProps) {
  return (
    <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      {/* 页面内容 */}
    </Layout>
  );
}
```

#### 4. 实现getStaticProps（推荐）或getServerSideProps

```typescript
export async function getStaticProps() {
  const { navigation, footer } = await loadSiteChrome();
  
  return {
    props: {
      initialNavigation: navigation,
      initialFooter: footer,
    },
    // 注意：项目使用 output: 'export' 静态导出模式，不支持 revalidate (ISR)
  };
}
```

#### 动态路由示例

```typescript
export async function getStaticProps({ params }: { params: { id: string } }) {
  const { navigation, footer } = await loadSiteChrome();
  
  // 获取页面特定数据
  const pageData = await fetchPageData(params.id);
  
  return {
    props: {
      initialNavigation: navigation,
      initialFooter: footer,
      pageData,
    },
    // 注意：项目使用 output: 'export' 静态导出模式，不支持 revalidate (ISR)
  };
}

export async function getStaticPaths() {
  // 返回需要预渲染的路径
  return {
    paths: [],
    fallback: 'blocking', // 或 true/false
  };
}
```

### 现有页面参考

以下页面已正确实现，可作为参考：
- `frontend/pages/index.tsx` - 首页
- `frontend/pages/about.tsx` - 关于页面
- `frontend/pages/products/index.tsx` - 产品列表
- `frontend/pages/products/[id].tsx` - 产品详情

### ❌ 错误实现（禁止）

```typescript
// ❌ 不要这样做
export default function Page() {
  const [navigation, setNavigation] = useState([]);
  const [footer, setFooter] = useState({});
  
  useEffect(() => {
    // 客户端加载会导致闪烁
    loadSiteChrome().then(data => {
      setNavigation(data.navigation);
      setFooter(data.footer);
    });
  }, []);
  
  return <Layout>...</Layout>;
}
```

## 响应式设计规范

### 移动端导航

- 在小屏幕（`< md`断点，768px）时，导航栏和语言切换器应收入侧边栏
- 使用汉堡按钮（☰）触发侧边栏显示/隐藏
- 侧边栏应支持滑动关闭手势
- 遮罩层点击应关闭侧边栏

### 布局断点

遵循 Tailwind CSS 默认断点：
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 性能优化

### 图片优化

- 使用 Next.js 的 `<Image>` 组件
- 设置合适的 `width` 和 `height`
- 关键图片（如logo）添加 `priority` 属性
- 背景图片使用适当的尺寸和压缩

### 代码分割

- 动态导入大型组件：`const Component = dynamic(() => import('./Component'))`
- 避免在首屏加载不必要的JavaScript

## 样式规范

### Tailwind CSS

- 优先使用 Tailwind 工具类
- 复杂动画使用 `<style jsx>` 或 CSS Modules
- 保持类名语义化和简洁

### 颜色系统

使用项目定义的颜色变量：
- `primary-*`: 主色调（绿色）
- `cream-*`: 辅助色（米色）
- `gray-*`: 中性色

## 可访问性

- 所有交互元素必须可通过键盘访问
- 使用语义化HTML标签
- 图片添加适当的 `alt` 属性
- 链接和按钮提供清晰的标签

## 国际化

- 所有用户可见文本必须通过 `translations` 文件管理
- 支持中文（zh）、英文（en）、日文（ja）
- 使用 `useI18n` hook 获取当前语言和翻译

## 提交规范

- 提交信息使用简体中文
- 格式：`类型: 简短描述`
- 类型：
  - `feat`: 新功能
  - `fix`: 修复bug
  - `docs`: 文档更新
  - `style`: 样式调整
  - `refactor`: 重构
  - `perf`: 性能优化
  - `test`: 测试
  - `chore`: 构建/工具相关

## 测试

- 开发新功能前在本地运行 `npm run dev` 测试
- 提交前确保 `npm run build` 成功
- 检查浏览器控制台无错误和警告

## 相关文档

- [系统架构](./ARCHITECTURE.md)
- [数据结构](./DATA_STRUCTURES.md)
- [环境配置](./ENV_SETUP.md)
- [团队角色](./AGENTS.md)
