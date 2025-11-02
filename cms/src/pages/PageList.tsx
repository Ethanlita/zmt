import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contentApi } from '../services/api';

type PageSummary = {
  page_slug: string;
  title_zh?: string;
  title_en?: string;
  title_ja?: string;
  updatedAt?: string;
};

const PageList: React.FC = () => {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await contentApi.getAll('pages');
      setPages(data || []);
    } catch (error) {
      console.error('加载页面列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    const raw = prompt('请输入新的页面标识（slug），仅限字母、数字和连字符');
    if (!raw) {
      return;
    }
    const sanitized = raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!sanitized) {
      alert('请输入有效的 slug');
      return;
    }
    if (pages.some((page) => page.page_slug === sanitized)) {
      alert('该 slug 已存在，请换一个');
      return;
    }
    navigate(`/pages/${sanitized}`);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('确定要删除该页面吗？删除后不可恢复。')) {
      return;
    }
    try {
      await contentApi.delete('pages', slug);
      alert('删除成功');
      loadPages();
    } catch (error) {
      alert('删除失败：' + (error as Error).message);
    }
  };

  const filteredPages = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return pages;
    }
    return pages.filter((page) => {
      const titleZh = page.title_zh || '';
      const titleEn = page.title_en || '';
      const titleJa = page.title_ja || '';
      return (
        page.page_slug.toLowerCase().includes(keyword) ||
        titleZh.toLowerCase().includes(keyword) ||
        titleEn.toLowerCase().includes(keyword) ||
        titleJa.toLowerCase().includes(keyword)
      );
    });
  }, [pages, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary-600 hover:text-primary-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">页面管理</h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input md:w-64"
              placeholder="搜索页面（标题或 slug）"
            />
            <button onClick={handleCreate} className="btn-primary whitespace-nowrap">
              + 新建页面
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">当前没有匹配的页面</p>
            <button onClick={handleCreate} className="btn-primary">
              创建新页面
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">页面标识</th>
                  <th className="px-4 py-3">中文标题</th>
                  <th className="px-4 py-3">英文标题</th>
                  <th className="px-4 py-3">日文标题</th>
                  <th className="px-4 py-3">更新时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.page_slug} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono text-xs md:text-sm text-gray-600">{page.page_slug}</td>
                    <td className="px-4 py-3">{page.title_zh || '—'}</td>
                    <td className="px-4 py-3">{page.title_en || '—'}</td>
                    <td className="px-4 py-3">{page.title_ja || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {page.updatedAt ? new Date(page.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/pages/${page.page_slug}`} className="btn-secondary">
                          编辑
                        </Link>
                        <button onClick={() => handleDelete(page.page_slug)} className="btn-danger">
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default PageList;
