# DATA_STRUCTURES

## 总览

项目所有业务数据都持久化在 DynamoDB 中。为了兼容多语言与灵活导航结构，数据模型按照“内容实体 + 树状导航 + 站点设置”拆分。本文件描述各表字段、约束及实体间关系。以下命名使用生产环境 `*-prod` 表为例，其它环境沿用相同结构。

| 表名（生产） | 说明 | 主键 |
|---------------|------|------|
| `zmt-pages-prod` | CMS 页面/文章内容 | `page_slug` |
| `zmt-products-prod` | 产品目录 | `product_id` |
| `zmt-navigation-prod` | 栏目/菜单树 | `nav_id` 固定为 `primary` |
| `zmt-settings-prod` | 站点设置（含页脚） | `settings_id` 固定为 `site` |
| `zmt-updates-prod` | 动态/频道文章 | `update_id`（主键）+ `channel-index` |

## 导航节点（NavigationTree）

导航树以嵌套 JSON 存储在 `zmt-navigation-prod` 中，示例：

```json
{
  "nav_id": "primary",
  "tree": [
    {
      "id": "about",
      "slug": "about",
      "type": "page",
      "order": 0,
      "visible": true,
      "title": {"zh": "关于我们", "en": "About", "ja": "会社概要"},
      "pageSlug": "about-us",
      "customPath": "/about",
      "children": []
    },
    {
      "id": "academy",
      "slug": "academy",
      "type": "section",
      "order": 1,
      "title": {"zh": "茶学堂", "en": "Academy"},
      "children": [
        {
          "id": "history",
          "slug": "history",
          "type": "page",
          "title": {"zh": "历史与传承"},
          "pageSlug": "tea-history"
        }
      ]
    },
    {
      "id": "external-shop",
      "slug": "shop",
      "type": "link",
      "title": {"zh": "官方商城", "en": "Shop"},
      "externalUrl": "https://shop.zunmingtea.com"
    }
  ],
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

字段说明：

- `id`：节点唯一标识，CMS 内部引用。
- `slug`：用于路由/URL 的人类可读标识。
- `type`：`section`（可含子节点）、`page`（绑定 `pageSlug`）、`link`（外部链接）、`dynamic`（动态频道，需指定 `channel`）。
- `title`：多语言标题对象，至少提供一个语言版本。
- `order`：同级排序，越小越靠前。
- `visible`：是否在前端导航中展示。
- `pageSlug`：当 `type = page` 时，指向 `zmt-pages` 中的 `page_slug`。
- `customPath`：可选，用于覆盖默认路径（例如 `/about`）。动态频道若未填写，则前端使用默认 `/updates/{channel}/`。
- `channel`：当 `type = dynamic` 时必填，用于映射到动态频道。
- `externalUrl`：当 `type = link` 时必须提供。
- `children`：子节点数组。

## 页面/文章（Pages）

`zmt-pages-prod` 表通过单 PK (`page_slug`) 访问。内容支持多语言字段与导航挂载：

```json
{
  "page_slug": "tea-history",
  "navigationParentId": "academy",
  "title_zh": "历史与传承",
  "content_zh": "<p>...</p>",
  "title_en": "History & Heritage",
  "content_en": "<p>...</p>",
  "title_ja": "歴史と伝承",
  "content_ja": "<p>...</p>",
  "seo_description_zh": "百年制茶工艺介绍",
  "seo_description_en": "An overview of heritage tea craftsmanship",
  "media": [
    {
      "type": "image",
      "url": "https://cdn.zunmingtea.com/media/tea-history.jpg",
      "alt": {"zh": "历史照片", "en": "Historical photo"}
    }
  ],
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

建议字段：

- `title_{lang}` / `content_{lang}`：语言后缀采用 ISO 639-1，如 `zh`、`en`、`ja`。
- `navigationParentId`：可选，指向导航节点 `id`。CMS 页面列表会按此字段归类。
- `media`：可选媒体数组（图片 / 视频），由富文本编辑器生成。
- `seo_*`：预留 SEO 元数据。

## 动态/频道文章（Updates）

`zmt-updates-prod` 表用于存储频道化的动态消息，每条记录属于一个 `channel`，并支持多语言标题/内容：

```json
{
  "update_id": "news-20251107-001",
  "channel": "news",
  "title_zh": "新品发布",
  "content_zh": "<p>...</p>",
  "title_en": "New Product Release",
  "content_en": "<p>...</p>",
  "title_ja": "新製品のお知らせ",
  "content_ja": "<p>...</p>",
  "publishedAt": "2025-11-07T12:00:00Z",
  "coverImage": "https://cdn.zunmingtea.com/updates/news-001.jpg",
  "tags": ["press", "announcement"],
  "updatedAt": "2025-11-07T12:30:00Z"
}
```

字段约定：

- `update_id`：唯一标识，可由 CMS 生成。
- `channel`：频道名称，如 `news`、`events`。同一频道可对应导航上的动态入口。
- `title_{lang}` / `content_{lang}`：多语言内容。
- `publishedAt`：发布时间，供列表排序。
- `coverImage`、`tags`：可选元数据，前端用于显示卡片或过滤。

访问方式：

- `/content/updates`：支持 `channel`、`lang` 查询。
- `/content/updates/ids`：返回 `{ ids, items: [{update_id, channel}] }`，供 Next.js 构建所有详情页。
- `/public/updates`、`/public/updates/{id}`：提供公开数据给前端。
- `/content/updates/channels`：罗列现有频道，方便 CMS 提示与前端生成静态路径。

## 产品（Products）

`zmt-products-prod` 表存储结构化属性：

```json
{
  "product_id": "dragonwell-001",
  "name_zh": "西湖龙井",
  "desc_zh": "明前龙井，一级标准。",
  "name_en": "Dragon Well",
  "desc_en": "First flush Longjing tea.",
  "origin": "Hangzhou, China",
  "type": "green",
  "imageGallery": [
    "https://cdn.zunmingtea.com/products/dragonwell-1.jpg",
    "https://cdn.zunmingtea.com/products/dragonwell-2.jpg"
  ],
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

常用字段：

- `name_{lang}`、`desc_{lang}`：多语言名称与描述。
- `type`：品类，如 `green`、`black`。
- `origin`：产地，可用于过滤。
- `imageGallery` / `thumbnail`：资源链接由 CMS 媒体库生成。

## 站点设置（Settings）

页脚等全局配置存放在 `zmt-settings-prod`：

```json
{
  "settings_id": "site",
  "footer": {
    "zh": {
      "headline": "尊茗茶业",
      "description": "源自云南高山古树，传承百年制茶工艺。",
      "legal": "© 2025 尊茗茶业有限公司｜滇ICP备00000000号",
      "links": [
        { "label": "联系我们", "url": "mailto:info@zunmingtea.com" }
      ]
    },
    "en": {
      "headline": "Zunming Tea",
      "description": "Crafted from century-old trees in Yunnan.",
      "legal": "© 2025 Zunming Tea. All rights reserved.",
      "links": [
        { "label": "Contact", "url": "mailto:info@zunmingtea.com" }
      ]
    }
  },
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

CMS 通过 `/settings/footer` 写入完整对象，会在后端进行多语言字段校验与归一化（剔除空链接、补全默认值）。前端只消费 `/settings/public` 的公开子集。

字段说明：

- `headline`：页脚主标题（品牌名称等）。
- `description`：简短介绍或宣传语，支持换行。
- `legal`：版权、备案或公司声明，显示在页脚底部。
- `links`：自定义外部链接列表。

## 关系与访问模式

- 导航节点引用 `pageSlug`，页面可以反向记录 `navigationParentId` 以支持多栏目挂载。
- Next.js 前端：
  - `Layout` => `/navigation`、`/settings/public`
  - `sections/[slug]` => `/content/pages?parentId=<id>&lang=<locale>`
  - `pages/[slug]` => `/content/pages/{slug}`
  - 产品页 => `/content/products?lang=<locale>`
- CMS：
  - 栏目管理 => `/navigation`
  - 站点设置 => `/settings`、`/settings/footer`
  - 内容编辑 => `/content/pages/{slug}`、`/content/products/{id}`

## 版本控制与迁移

- SAM 模板声明表名，生产环境以 `*-prod` 后缀区分。
- 新增字段时需同步更新：
  1. DynamoDB 项结构（后端写入逻辑）。
  2. CMS 表单 / 富文本字段。
  3. 前端展示及 fallback 逻辑。
- 若需要 Schema 迁移，可通过一次性 Lambda（或脚本）扫描数据并写回，保留 `updatedAt` 以供内容团队追踪变更。
