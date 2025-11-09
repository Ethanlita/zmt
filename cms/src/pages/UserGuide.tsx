import React from 'react';
import { Link } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
    <h2 className="text-2xl font-semibold text-primary-700">{title}</h2>
    {children}
  </section>
);

const UserGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">CMS 用户操作手册</p>
            <h1 className="text-2xl font-bold text-primary-700">尊茗茶业内容管理指南</h1>
          </div>
          <Link to="/" className="btn-secondary">
            ← 返回控制台
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <Section title="1. 登录与 Dashboard">
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>访问 <code>https://admin.zunmingtea.com</code>，使用 Cognito 账号登录。</li>
            <li>首次登录需按提示修改密码，登录完成后自动跳转到 Dashboard。</li>
            <li>Dashboard 顶部按钮说明：
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>发布全站：保存当前修改并触发 GitHub Actions 构建，构建完成后就会在前端可以查看。</li>
                <li>构建状态：点击可查看最近一次部署 Workflow 的状态与耗时，当发布以后就可以查询到有任务正在运行，两个任务均完成后就可以在前端查看。</li>
                <li>操作指南：当前页面，可随时查看所有功能说明。</li>
                <li>退出登录：清除身份并返回登录页。</li>
              </ul>
            </li>
          </ol>
        </Section>

        <Section title="2. 名词解释">
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>
              <strong>Slug（别名 / 标识）</strong>：用于拼接站点 URL 的英文/数字/短横线组合，是系统内对页面的唯一标识。
              例如 slug=about-us，则页面地址为 <code>/pages/about-us</code>。禁止使用空格和中文，对于一个页面，必须保证和其他页面的slug不重复。
            </li>
            <li><strong>栏目</strong>：前台导航条上的一级或多级结构节点，可包含子栏目或页面。</li>
            <li><strong>单页</strong>：展示一篇富文本内容的页面，例如 About 或 Certificate。</li>
            <li><strong>外部链接</strong>：链接到外部其他页面，如1688店铺页面。</li>
            <li><strong>动态</strong>：按频道分类的资讯列表，对应前台 <code>/updates/{'{channel}'}</code>。</li>
            <li><strong>发布全站</strong>：拉取最新 CMS 数据并触发前端/后端构建，耗时约 1~2 分钟。</li>
          </ul>
        </Section>

        <Section title="3. 页面管理（Page Management）">
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>进入 Dashboard → “页面管理”或“管理页面列表”。</li>
            <li>列表页可查看所有页面，点击 “新建页面” 时需输入 slug（建议只使用小写英文和英文连字符）。</li>
            <li>页面编辑器支持：
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>多语言切换标签：默认中文内容，可切换 EN / JA 填写翻译。</li>
                <li>“从中文翻译”按钮：自动调用机器翻译并覆盖当前语言内容。机器翻译的结果不保证正确性，必须检查其正确性。</li>
                <li>富文本插入：标题、段落、列表、引用、代码、锚点、目录、图片、视频、Markdown 导入/导出。</li>
              </ul>
            </li>
            <li>保存：仅写入数据库，不立即更新到前台。</li>
            <li>保存并发布：保存后自动触发构建流程，运行完成后前台生效。</li>
          </ol>
        </Section>

        <Section title="4. 产品管理（Product Management）">
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>在 Dashboard 点击“产品管理”或“添加产品”。</li>
            <li>新增产品：
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>图片上传：点击“选择并上传图片”挑选本地文件，系统会自动传至 <code>s3.zunmingtea.com/products</code>。</li>
                <li>多语言名称与描述：与页面相同，每种语言均可直接编辑或“从中文翻译”。</li>
                <li>保存后会生成形如 <code>product-{Date.now()}</code> 的 <code>product_id</code>。</li>
              </ul>
            </li>
            <li>产品列表页可查看所有产品卡片、预览主图、点击编辑或删除。</li>
            <li>前台展示：
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>首页“特色产品”显示最近 3 条。</li>
                <li>全部产品列表在 <code>/products</code>；详情页面地址为 <code>/products/{'{product_id}'}</code>。</li>
              </ul>
            </li>
          </ol>
        </Section>

        <Section title="5. 产品系列（Product Series）">
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>通过 Dashboard → “产品系列” 进入管理页面。</li>
            <li>新建系列时需填写 slug（用于 URL 和产品绑定），支持中文/英文/日文名称与简介。</li>
            <li>上传封面图：建议 16:9 或方形，系统会自动上传到媒体 CDN。</li>
            <li>排序用于控制首页及筛选列表展示顺序，数值越小越靠前。</li>
            <li>保存系列后，可在“产品管理”中为每个产品选择所属系列。</li>
            <li>前台表现：
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>首页“产品”板块显示系列卡片。</li>
                <li>产品中心支持按系列筛选，URL 可带 <code>?series=slug</code>。</li>
              </ul>
            </li>
          </ol>
        </Section>

        <Section title="6. 动态管理（Updates）">
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>进入“动态管理”可查看所有动态，以及绑定的频道 channel。</li>
            <li>新增动态：
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>系统自动生成唯一 slug 和 <code>update_id</code>。</li>
                <li>填写频道（如 news、events），内容相同也可翻译。动态的channel必须和展示页面设置的channel严格一致，否则就不会在对应的展示页面显示。</li>
                <li>上传封面图与附件同产品类似。封面图会在首页和产品中心展示，在产品页也会大幅展示。如果在产品详情中添加了其他图片，也会在产品页面中显示。</li>
              </ul>
            </li>
            <li>发布后，前台 <code>/updates/{'{channel}'}</code> 会显示对应列表，详情页为 <code>/updates/{'{channel}'}/{'{update_id}'}</code>。</li>
          </ol>
        </Section>

        <Section title="7. 栏目/导航管理">
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>进入“栏目管理”可视化编辑树状结构。</li>
            <li>类型说明：
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>栏目（section）：可添加子节点，默认路径 <code>/sections/{'{slug}'}</code>。</li>
                <li>单页（page）：需选择已有页面，默认路径 <code>/pages/{'{pageSlug}'}</code>。</li>
                <li>外部链接（link）：填写完整 URL。</li>
                <li>动态频道（dynamic）：绑定 channel，前台跳转 <code>/updates/{'{channel}'}</code>。</li>
              </ul>
            </li>
            <li>“自定义路径”可覆盖默认 URL，注意保持以 <code>/</code> 开头。</li>
            <li>操作完成后点击“保存导航”写入数据库，再点击“保存并发布”触发构建。</li>
          </ol>
        </Section>

        <Section title="8. 首页关于我们">
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>进入“首页关于我们”页面，分别维护三种语言的标题与富文本内容。</li>
            <li>内容支持自动翻译、富文本编辑（与页面一致）。</li>
            <li>保存后点击“保存并发布”，前台首页 About 模块 3~5 分钟后更新。</li>
          </ol>
        </Section>

        <Section title="9. 站点设置 / 页脚">
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>“站点设置”页面可编辑多语言首页 Slogan（Hero）标题与副标题。</li>
            <li>支持设置中/英/日的页脚文案、描述与链接。</li>
            <li>链接项需包含完整协议（https:// 或 mailto:）。</li>
            <li>保存后必须点击“保存并发布”才会同步到前台。</li>
          </ol>
        </Section>

        <Section title="10. 发布与 GitHub Actions">
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>建议批量完成修改后再点击“发布全站”，避免频繁触发 CI。</li>
            <li>发布流程：CMS 保存数据 → 调用 GitHub API → 触发 <code>Deploy AWS Backend and CMS</code> 与 <code>Deploy Frontend to GitHub Pages</code> → 前端/后端重新构建。</li>
            <li>构建状态按钮会显示最近一次运行的结果，若 workflow 正在运行，每秒刷新一次。</li>
            <li>如某次 workflow 失败，可进入 GitHub → Actions 查看详细日志，并根据错误提示重试。</li>
          </ul>
        </Section>

        <Section title="11. 常见问题 / FAQ">
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>发布后前台未更新？</strong> 等待 3~6 分钟后再次访问，或手动刷新 Cloudflare 缓存。</li>
            <li><strong>slug 冲突或 404？</strong> 确认 slug 是否唯一，且在导航或对应列表中已引用；必要时重新发布。</li>
            <li><strong>图片未显示？</strong> 确认已成功上传至 <code>s3.zunmingtea.com/products</code> 或对应目录，链接可直接在浏览器打开。</li>
            <li><strong>翻译失败？</strong> 检查中文内容是否为空，并稍后重试；AWS Translate 会偶尔受限。</li>
          </ul>
        </Section>

        <Section title="12. 续费">
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>需要续费的服务商</strong> 阿里云、AWS、Cloudflare、Google、Github</li>
            <li><strong>阿里云</strong> 需要手动续费：域名、阿里邮箱</li>
            <li><strong>AWS</strong> 通过信用卡自动扣款：API Gateway、Cognito、S3、Lambda、SQS、CloudFront、Amplify</li>
            <li><strong>Google</strong> 通过信用卡自动扣款：Google Workspace、Google Cloud Platform</li>
            <li><strong>Cloudflare</strong> 通过信用卡自动扣款：CDN加速服务</li>
            <li><strong>Github</strong> 目前免费：Repository、Actions、Secrets</li>
          </ul>
        </Section>

        <div className="text-center text-sm text-gray-500">
          如需进一步帮助，请在飞书联系技术支持。
        </div>
      </main>
    </div>
  );
};

export default UserGuide;
