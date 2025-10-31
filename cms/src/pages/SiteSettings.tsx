import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsApi } from '../services/api';

type Locale = 'zh' | 'en' | 'ja';

type FooterLink = {
  label: string;
  url: string;
};

type FooterLocaleConfig = {
  headline: string;
  description: string;
  links: FooterLink[];
};

type FooterSettings = Record<Locale, FooterLocaleConfig>;

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

const DEFAULT_FOOTER: FooterSettings = {
  zh: { headline: '', description: '', links: [] },
  en: { headline: '', description: '', links: [] },
  ja: { headline: '', description: '', links: [] },
};

const SiteSettings: React.FC = () => {
  const [footer, setFooter] = useState<FooterSettings>(DEFAULT_FOOTER);
  const [activeLocale, setActiveLocale] = useState<Locale>('zh');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const normalizeLocale = (config: FooterLocaleConfig): FooterLocaleConfig => ({
    headline: config?.headline || '',
    description: config?.description || '',
    links: Array.isArray(config?.links)
      ? config.links.map((link) => ({
          label: link.label || '',
          url: link.url || '',
        }))
      : [],
  });

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await settingsApi.getSiteSettings();
      const loadedFooter: FooterSettings = {
        zh: data.footer?.zh || DEFAULT_FOOTER.zh,
        en: data.footer?.en || DEFAULT_FOOTER.en,
        ja: data.footer?.ja || DEFAULT_FOOTER.ja,
      };
      setFooter({
        zh: normalizeLocale(loadedFooter.zh),
        en: normalizeLocale(loadedFooter.en),
        ja: normalizeLocale(loadedFooter.ja),
      });
    } catch (err) {
      console.error('加载站点设置失败', err);
      setError('加载设置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (locale: Locale, field: keyof FooterLocaleConfig, value: string) => {
    setFooter((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: value,
      },
    }));
  };

  const handleLinkChange = (locale: Locale, index: number, field: keyof FooterLink, value: string) => {
    setFooter((prev) => {
      const links = [...prev[locale].links];
      links[index] = {
        ...links[index],
        [field]: value,
      };
      return {
        ...prev,
        [locale]: {
          ...prev[locale],
          links,
        },
      };
    });
  };

  const addLink = (locale: Locale) => {
    setFooter((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        links: [...prev[locale].links, { label: '', url: '' }],
      },
    }));
  };

  const removeLink = (locale: Locale, index: number) => {
    setFooter((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        links: prev[locale].links.filter((_, i) => i !== index),
      },
    }));
  };

  const validateFooter = (): string | null => {
    for (const locale of LOCALES.map((l) => l.code)) {
      const config = footer[locale];
      for (const [index, link] of config.links.entries()) {
        if ((link.label && !link.url) || (!link.label && link.url)) {
          return `${LOCALES.find((l) => l.code === locale)?.label} 第 ${index + 1} 个链接需要同时填写名称和地址`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateFooter();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsApi.saveFooter(footer);
      setSuccess('保存成功！前台将在几分钟内更新底部信息');
    } catch (err) {
      console.error('保存失败', err);
      setError('保存失败，请稍后重试');
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
            <h1 className="text-xl font-semibold">站点设置</h1>
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
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 text-red-600 px-4 py-3">{error}</div>
        )}
        {success && (
          <div className="rounded border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3">{success}</div>
        )}

        <section className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">底部主标题</label>
            <input
              type="text"
              value={footer[activeLocale].headline}
              onChange={(e) => handleFieldChange(activeLocale, 'headline', e.target.value)}
              className="input"
              placeholder="例如：尊茗茶业"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">底部描述</label>
            <textarea
              value={footer[activeLocale].description}
              onChange={(e) => handleFieldChange(activeLocale, 'description', e.target.value)}
              className="input h-32"
              placeholder="支持简单的换行描述"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold">底部链接</h2>
              <button onClick={() => addLink(activeLocale)} className="btn-secondary text-sm">
                + 添加链接
              </button>
            </div>

            {footer[activeLocale].links.length === 0 ? (
              <p className="text-sm text-gray-500">暂无链接，点击“添加链接”新增。</p>
            ) : (
              <div className="space-y-3">
                {footer[activeLocale].links.map((link, index) => (
                  <div key={index} className="grid md:grid-cols-7 gap-3 items-end">
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">链接名称</label>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleLinkChange(activeLocale, index, 'label', e.target.value)}
                        className="input"
                        placeholder="例如：联系我们"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">链接地址</label>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleLinkChange(activeLocale, index, 'url', e.target.value)}
                        className="input"
                        placeholder="https://"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => removeLink(activeLocale, index)}
                        className="btn-danger text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6 text-sm text-gray-600 space-y-2">
          <h2 className="text-base font-semibold">提示</h2>
          <p>底部信息会在官网所有页面展示，建议填写品牌简介、联系方式、备案号等内容。</p>
          <p>可使用不同语言版本的底部文案，系统会根据访客选择的语言自动切换。</p>
        </section>
      </main>
    </div>
  );
};

export default SiteSettings;
