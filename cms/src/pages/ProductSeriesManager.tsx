import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '../services/api';
import { uploadMediaFile } from '../services/mediaUploader';
import { useNotificationStore } from '../store/notificationStore';
import { getErrorMessage } from '../utils/errorMessage';

type Language = 'zh' | 'en' | 'ja';

const DEFAULT_FORM = {
  series_id: '',
  slug: '',
  order: 0,
  image_url: '',
  name_zh: '',
  name_en: '',
  name_ja: '',
  description_zh: '',
  description_en: '',
  description_ja: '',
};

const LANG_TABS: { code: Language; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

const ProductSeriesManager: React.FC = () => {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLocale, setActiveLocale] = useState<Language>('zh');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editing, setEditing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    setLoading(true);
    try {
      const data = await contentApi.getAll('series');
      const sorted = ((data || []) as any[]).sort(
        (a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0),
      );
      setSeriesList(sorted);
    } catch (error) {
      console.error('Failed to load series', error);
      showNotification('加载产品系列失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditing(false);
    setActiveLocale('zh');
  };

  const handleEdit = (series: any) => {
    setForm({
      ...DEFAULT_FORM,
      ...series,
      series_id: series.series_id,
      slug: series.slug || series.series_id,
      order: series.order ?? 0,
    });
    setEditing(true);
  };

  const sanitizeSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const handleChange = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadMediaFile(file, { folder: 'series' });
      setForm((prev) => ({ ...prev, image_url: url }));
      showNotification('系列封面上传成功', 'success');
    } catch (error) {
      console.error('Upload failed', error);
      showNotification(`上传失败：${getErrorMessage(error)}`, 'error');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.slug.trim()) {
      showNotification('请填写系列 slug', 'error');
      return;
    }
    const slug = sanitizeSlug(form.slug);
    if (!slug) {
      showNotification('slug 只能包含字母、数字或短横线', 'error');
      return;
    }
    const payload = {
      ...form,
      series_id: slug,
      slug,
      order: Number(form.order) || 0,
      updatedAt: new Date().toISOString(),
    };
    setSaving(true);
    try {
      await contentApi.save('series', slug, payload);
      showNotification('系列保存成功', 'success');
      resetForm();
      await loadSeries();
    } catch (error) {
      showNotification(`保存失败：${getErrorMessage(error)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (seriesId: string) => {
    if (!confirm('确定要删除该系列吗？此操作不可恢复。')) return;
    try {
      await contentApi.delete('series', seriesId);
      showNotification('系列已删除', 'success');
      if (editing && form.series_id === seriesId) {
        resetForm();
      }
      await loadSeries();
    } catch (error) {
      showNotification(`删除失败：${getErrorMessage(error)}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary-600 hover:text-primary-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">产品系列管理</h1>
          </div>
          <button onClick={resetForm} className="btn-secondary">
            新建系列
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : seriesList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">还没有系列，点击“新建系列”进行创建。</p>
            </div>
          ) : (
            seriesList.map((series) => (
              <div key={series.series_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex gap-4">
                <div className="w-24 h-24 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                  {series.image_url ? (
                    <img src={series.image_url} alt={series.name_zh} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">无封面</div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase">slug: {series.slug}</p>
                  <h3 className="text-lg font-semibold text-primary-700">{series.name_zh || '(未命名)'}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{series.description_zh}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="btn-secondary" onClick={() => handleEdit(series)}>
                      编辑
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(series.series_id)}>
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 sticky top-16 self-start">
          <h2 className="text-xl font-semibold">{editing ? '编辑系列' : '新建系列'}</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">系列 slug</label>
              <input
                type="text"
                className="input"
                value={form.slug}
                disabled={editing}
                placeholder="例如 classic-collection"
                onChange={(e) => handleChange('slug', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">用于 URL 和产品绑定，只能包含字母、数字、短横线。</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序（数字越小越靠前）</label>
              <input
                type="number"
                className="input"
                value={form.order}
                onChange={(e) => handleChange('order', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">系列封面</label>
              {form.image_url ? (
                <div className="mb-3">
                  <img src={form.image_url} alt="系列封面" className="w-full rounded border border-gray-200" />
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-2">尚未上传封面</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? '上传中...' : '上传封面'}
                </button>
                {form.image_url && (
                  <button
                    type="button"
                    className="text-sm text-red-500 hover:text-red-600"
                    onClick={() => handleChange('image_url', '')}
                  >
                    移除
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div>
            <div className="flex gap-2 mb-3">
              {LANG_TABS.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setActiveLocale(code)}
                  className={`px-3 py-1 rounded text-sm ${
                    activeLocale === code ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  系列名称（{LANG_TABS.find((tab) => tab.code === activeLocale)?.label}）
                </label>
                <input
                  type="text"
                  className="input"
                  value={form[`name_${activeLocale}` as keyof typeof form] as string}
                  onChange={(e) => handleChange(`name_${activeLocale}`, e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  系列简介（{LANG_TABS.find((tab) => tab.code === activeLocale)?.label}）
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={form[`description_${activeLocale}` as keyof typeof form] as string}
                  onChange={(e) => handleChange(`description_${activeLocale}`, e.target.value)}
                />
              </div>
            </div>
          </div>

  <div className="flex gap-3">
    <button onClick={handleSave} className="btn-primary" disabled={saving}>
      {saving ? '保存中...' : '保存系列'}
    </button>
    <button onClick={resetForm} className="btn-secondary" disabled={saving}>
      重置
    </button>
  </div>
        </div>
      </main>
    </div>
  );
};

export default ProductSeriesManager;
