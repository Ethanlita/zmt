import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentApi, navigationApi } from '../services/api';
import { useNotificationStore } from '../store/notificationStore';

type Locale = 'zh' | 'en' | 'ja';

type NavigationNode = {
  id: string;
  slug: string;
  title: Record<Locale, string>;
  type: 'section' | 'page' | 'link';
  pageSlug?: string;
  customPath?: string;
  externalUrl?: string;
  visible: boolean;
  order: number;
  children?: NavigationNode[];
};

type PageSummary = {
  page_slug: string;
  title_zh?: string;
  title_en?: string;
  title_ja?: string;
};

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

const resolveNodeLabel = (node: NavigationNode, locale: Locale) =>
  node.title?.[locale] || node.title?.zh || node.title?.en || node.title?.ja || node.slug || node.id;

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `nav_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const NavigationManager: React.FC = () => {
  const [tree, setTree] = useState<NavigationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [activeLocale, setActiveLocale] = useState<Locale>('zh');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [navigationTree, pageList] = await Promise.all([
        navigationApi.getTree(),
        contentApi.getAll('pages'),
      ]);

      const normalizedTree = normalizeTree(navigationTree || []);
      setTree(normalizedTree);
      setPages(pageList || []);
      setExpanded(new Set(normalizedTree.map((node: NavigationNode) => node.id)));
    } catch (err) {
      console.error('加载导航数据失败', err);
      setError('加载导航数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const createNode = (): NavigationNode => ({
    id: generateId(),
    slug: '',
    title: { zh: '', en: '', ja: '' },
    type: 'section',
    visible: true,
    order: 0,
    children: [],
  });

  const updateNode = (id: string, updater: (node: NavigationNode) => NavigationNode) => {
    setTree((prev) => updateTree(prev, id, updater));
  };

  const removeNode = (id: string) => {
    if (!confirm('确定要删除该栏目及其子栏目吗？')) return;
    setTree((prev) => deleteFromTree(prev, id));
  };

  const addChild = (parentId: string) => {
    const newNode = createNode();
    setTree((prev) => addNode(prev, parentId, newNode));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(parentId);
      return next;
    });
  };

  const addRoot = () => {
    setTree((prev) => {
      const newNode = createNode();
      newNode.order = prev.length;
      return [...prev, newNode];
    });
  };

  const moveNode = (id: string, direction: 'up' | 'down') => {
    setTree((prev) => reorderNode(prev, id, direction));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const normalized = normalizeTree(tree);
      const validation = validateTree(normalized);
      if (validation) {
        setError(validation);
        setSaving(false);
        return;
      }
      await navigationApi.saveTree(normalized);
      showNotification('导航保存成功！', 'success');
    } catch (err) {
      console.error('保存导航失败', err);
      const message = err instanceof Error ? err.message : '保存失败，请检查数据格式或稍后重试';
      setError(message);
      showNotification(`导航保存失败：${message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary-600 hover:text-primary-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">栏目管理</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setActiveLocale(code)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    activeLocale === code ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button onClick={addRoot} className="btn-secondary">
              + 添加一级栏目
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? '保存中...' : '保存导航'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 text-red-600 px-4 py-3">
            {error}
          </div>
        )}

        {tree.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">还没有配置任何栏目</p>
            <button onClick={addRoot} className="btn-primary">
              添加第一个栏目
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tree.map((node) => (
              <NavigationItem
                key={node.id}
                node={node}
                level={0}
                trail={[]}
                pages={pages}
                expanded={expanded}
                onToggle={handleToggle}
                onUpdate={updateNode}
                onRemove={removeNode}
                onAddChild={addChild}
                onMove={moveNode}
                activeLocale={activeLocale}
              />
            ))}
          </div>
        )}

        <section className="mt-10 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">使用说明</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>栏目类型可以选择“栏目”、“单页”或“外部链接”。</li>
            <li>单页类型需要选择已经存在的页面，访问路径默认是 <code>/pages/页面ID</code>，也可以自定义。</li>
            <li>栏目类型可以嵌套子栏目，访问路径默认是 <code>/sections/栏目标识</code>。</li>
            <li>外部链接需要填写完整的 URL，前台会直接跳转。</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

interface NavigationItemProps {
  node: NavigationNode;
  level: number;
  trail: NavigationNode[];
  pages: PageSummary[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updater: (node: NavigationNode) => NavigationNode) => void;
  onRemove: (id: string) => void;
  onAddChild: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  activeLocale: Locale;
}

const NavigationItem: React.FC<NavigationItemProps> = ({
  node,
  level,
  pages,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
  onAddChild,
  onMove,
  activeLocale,
  trail,
}) => {
  const indent = level * 28;
  const isExpanded = expanded.has(node.id);
  const currentTrail = [...trail, node];
  const breadcrumb = ['根', ...currentTrail.map((item) => resolveNodeLabel(item, activeLocale || 'zh'))].join(' / ');
  const widthStyle = level > 0 ? { marginLeft: `${indent}px`, width: `calc(100% - ${indent}px)` } : {};

  const handleTitleChange = (locale: Locale, value: string) => {
    onUpdate(node.id, (current) => ({
      ...current,
      title: {
        ...current.title,
        [locale]: value,
      },
    }));
  };

  const handleSlugChange = (value: string) => {
    onUpdate(node.id, (current) => ({
      ...current,
      slug: value.trim().replace(/\s+/g, '-'),
    }));
  };

  const handleTypeChange = (value: 'section' | 'page' | 'link') => {
    onUpdate(node.id, (current) => ({
      ...current,
      type: value,
      pageSlug: value === 'page' ? current.pageSlug : undefined,
      externalUrl: value === 'link' ? current.externalUrl : undefined,
      children: value === 'section' ? current.children || [] : [],
    }));
  };

  const handleVisibleToggle = () => {
    onUpdate(node.id, (current) => ({
      ...current,
      visible: !current.visible,
    }));
  };

  const handleCustomPathChange = (value: string) => {
    onUpdate(node.id, (current) => ({
      ...current,
      customPath: value.trim() || undefined,
    }));
  };

  const handlePageSelect = (value: string) => {
    onUpdate(node.id, (current) => ({
      ...current,
      pageSlug: value || undefined,
      customPath: value ? current.customPath : undefined,
    }));
  };

  const handleExternalUrlChange = (value: string) => {
    onUpdate(node.id, (current) => ({
      ...current,
      externalUrl: value.trim(),
    }));
  };

  return (
    <div className="relative" style={widthStyle}>
      {level > 0 && (
        <>
          <span className="absolute -left-4 top-5 bottom-5 border-l border-gray-200" aria-hidden="true" />
          <span className="absolute -left-4 top-8 w-4 border-t border-gray-200" aria-hidden="true" />
        </>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
        <div className="flex items-start gap-4 p-4">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-3">
              {node.children && node.children.length > 0 ? (
                <button
                  onClick={() => onToggle(node.id)}
                  className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-500"
                  title={isExpanded ? '收起' : '展开'}
                >
                  {isExpanded ? '−' : '+'}
                </button>
              ) : (
                <span className="w-6" />
              )}

              <input
                type="text"
                value={node.title[activeLocale] || ''}
                onChange={(e) => handleTitleChange(activeLocale, e.target.value)}
                placeholder={`${LOCALES.find((l) => l.code === activeLocale)?.label}标题`}
                className="input flex-1"
              />

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={node.visible} onChange={handleVisibleToggle} />
                前台显示
              </label>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-1 w-fit">
              路径：{breadcrumb}
            </div>

            <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-700">
              <div className="col-span-1">
                <label className="block text-xs text-gray-500 mb-1">栏目标识 (slug)</label>
                <input
                  type="text"
                  value={node.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="input"
                  placeholder="例如 about"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs text-gray-500 mb-1">类型</label>
                <select
                  value={node.type}
                  onChange={(e) => handleTypeChange(e.target.value as NavigationNode['type'])}
                  className="input"
                >
                  <option value="section">栏目</option>
                  <option value="page">单页</option>
                  <option value="link">外部链接</option>
                </select>
              </div>

              {node.type === 'page' && (
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">关联页面</label>
                  <select
                    value={node.pageSlug || ''}
                    onChange={(e) => handlePageSelect(e.target.value)}
                    className="input"
                  >
                    <option value="">请选择页面</option>
                    {pages.map((page) => (
                      <option key={page.page_slug} value={page.page_slug}>
                        {page.page_slug}（{page.title_zh || page.title_en || page.title_ja || '未命名'}）
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {node.type === 'link' && (
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">链接地址</label>
                  <input
                    type="url"
                    value={node.externalUrl || ''}
                    onChange={(e) => handleExternalUrlChange(e.target.value)}
                    className="input"
                    placeholder="https://"
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">自定义路径（可选）</label>
                <input
                  type="text"
                  value={node.customPath || ''}
                  onChange={(e) => handleCustomPathChange(e.target.value)}
                  className="input"
                  placeholder={
                    node.type === 'section'
                      ? `/sections/${node.slug}`
                      : node.type === 'page'
                        ? `/pages/${node.pageSlug}`
                        : '自定义地址'
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-36">
            <button onClick={() => onMove(node.id, 'up')} className="btn-secondary">
              上移
            </button>
            <button onClick={() => onMove(node.id, 'down')} className="btn-secondary">
              下移
            </button>
            {node.type === 'section' && (
              <button onClick={() => onAddChild(node.id)} className="btn-secondary">
                添加子栏目
              </button>
            )}
            <button onClick={() => onRemove(node.id)} className="btn-danger">
              删除
            </button>
          </div>
        </div>
      </div>

      {node.children && node.children.length > 0 && isExpanded && (
        <div className="border-t border-gray-200 space-y-3 pb-4 pl-6">
          {node.children.map((child) => (
            <NavigationItem
              key={child.id}
              node={child}
              level={level + 1}
              trail={currentTrail}
              pages={pages}
              expanded={expanded}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddChild={onAddChild}
              onMove={onMove}
              activeLocale={activeLocale}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function updateTree(tree: NavigationNode[], id: string, updater: (node: NavigationNode) => NavigationNode): NavigationNode[] {
  return tree.map((node) => {
    if (node.id === id) {
      return normalizeNode(updater(node));
    }

    if (node.children) {
      return {
        ...node,
        children: updateTree(node.children, id, updater),
      };
    }

    return node;
  });
}

function deleteFromTree(tree: NavigationNode[], id: string): NavigationNode[] {
  const filtered = tree
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children ? deleteFromTree(node.children, id) : [],
    }));

  return normalizeTree(filtered);
}

function addNode(tree: NavigationNode[], parentId: string, newNode: NavigationNode): NavigationNode[] {
  return tree.map((node) => {
    if (node.id === parentId) {
      const children = [...(node.children || []), { ...newNode, order: node.children?.length || 0 }];
      return {
        ...node,
        children: normalizeTree(children),
      };
    }

    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addNode(node.children, parentId, newNode),
      };
    }

    return node;
  });
}

function reorderNode(tree: NavigationNode[], id: string, direction: 'up' | 'down'): NavigationNode[] {
  const index = tree.findIndex((node) => node.id === id);
  if (index !== -1) {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < tree.length) {
      const reordered = [...tree];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(newIndex, 0, moved);
      return normalizeTree(reordered);
    }
    return tree;
  }

  return tree.map((node) => ({
    ...node,
    children: node.children ? reorderNode(node.children, id, direction) : [],
  }));
}

function normalizeTree(nodes: NavigationNode[]): NavigationNode[] {
  return nodes.map((node, index) => normalizeNode({
    ...node,
    order: index,
    children: node.children ? normalizeTree(node.children) : [],
  }));
}

function normalizeNode(node: NavigationNode): NavigationNode {
  const title = node.title || { zh: '', en: '', ja: '' };
  return {
    ...node,
    title: {
      zh: title.zh || '',
      en: title.en || '',
      ja: title.ja || '',
    },
    slug: node.slug?.trim() || '',
    customPath: node.customPath?.trim() || undefined,
    externalUrl: node.externalUrl?.trim() || (node.type === 'link' ? '' : undefined),
    children: node.children?.length ? node.children : [],
  };
}

function validateTree(nodes: NavigationNode[]): string | null {
  const slugSet = new Set<string>();

  const walk = (items: NavigationNode[], parentType?: string): string | null => {
    for (const node of items) {
      if (!node.title.zh && !node.title.en && !node.title.ja) {
        return '每个栏目至少需要填写一个语言的标题';
      }

      if (!node.slug) {
        return '栏目标识（slug）不能为空';
      }

      const key = `${parentType || 'root'}:${node.slug}`;
      if (slugSet.has(key)) {
        return `同一级别中存在重复的 slug：${node.slug}`;
      }
      slugSet.add(key);

      if (node.type === 'page' && !node.pageSlug) {
        return `栏目 ${node.title.zh || node.slug} 需要选择关联页面`;
      }

      if (node.type === 'link' && !node.externalUrl) {
        return `栏目 ${node.title.zh || node.slug} 需要填写链接地址`;
      }

      if (node.children?.length) {
        const childError = walk(node.children, node.id);
        if (childError) {
          return childError;
        }
      }
    }

    return null;
  };

  return walk(nodes);
}

export default NavigationManager;
