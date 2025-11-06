import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentApi, translateApi, publishApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import { useNotificationStore } from '../store/notificationStore';
import { getErrorMessage } from '../utils/errorMessage';
import { extractPlainText, plainTextToRichText } from '../utils/richText';

const HOME_ABOUT_SLUG = 'home-about';

const EMPTY_CONTENT = {
  title_zh: '',
  content_zh: '',
  title_en: '',
  content_en: '',
  title_ja: '',
  content_ja: '',
};

type Language = 'zh' | 'en' | 'ja';

const HomeAbout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Language>('zh');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [content, setContent] = useState<typeof EMPTY_CONTENT>(EMPTY_CONTENT);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await contentApi.getById('pages', HOME_ABOUT_SLUG);
      setContent({ ...EMPTY_CONTENT, ...data });
    } catch (error) {
      console.error('Failed to load home about content', error);
      setContent(EMPTY_CONTENT);
      showNotification(`加载首页关于我们内容失败：${getErrorMessage(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (targetLang: Language) => {
    try {
      const sourceTitle = (content.title_zh || '').trim();
      const sourceBodyHtml = content.content_zh || '';
      const sourceBodyPlain = extractPlainText(sourceBodyHtml);

      if (!sourceTitle && !sourceBodyPlain) {
        showNotification('请先填写中文标题或内容，再执行翻译', 'error');
        return;
      }

      const updates: Partial<typeof content> = {};

      if (sourceTitle) {
        const titleKey = `title_${targetLang}` as keyof typeof content;
        updates[titleKey] = await translateApi.translate(sourceTitle, 'zh', targetLang);
      }

      if (sourceBodyPlain) {
        const contentKey = `content_${targetLang}` as keyof typeof content;
        const translatedBody = await translateApi.translate(sourceBodyPlain, 'zh', targetLang);
        updates[contentKey] = plainTextToRichText(translatedBody);
      }

      setContent({ ...content, ...updates });
      showNotification(`翻译成功！已自动填充${targetLang === 'en' ? '英文' : '日文'}内容`, 'success');
    } catch (error) {
      showNotification(`翻译失败：${getErrorMessage(error)}`, 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentApi.save('pages', HOME_ABOUT_SLUG, content);
      showNotification('首页关于我们内容已保存', 'success');
    } catch (error) {
      showNotification(`保存失败：${getErrorMessage(error)}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await handleSave();
      await publishApi.triggerBuild();
      showNotification('发布成功，网站将在几分钟内更新', 'success');
    } catch (error) {
      showNotification(`发布失败：${getErrorMessage(error)}`, 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  const langs: { code: Language; label: string }[] = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary-600 hover:text-primary-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">首页关于我们内容</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-secondary">
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={handlePublish} disabled={publishing} className="btn-primary">
              {publishing ? '发布中...' : '保存并发布'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
            {langs.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setActiveTab(code)}
                className={`tab ${activeTab === code ? 'tab-active' : 'tab-inactive'}`}
              >
                {label}
                {code !== 'zh' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTranslate(code);
                    }}
                    className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded hover:bg-primary-200"
                  >
                    从中文翻译
                  </button>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="card space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 ({langs.find((l) => l.code === activeTab)?.label})
            </label>
            <input
              type="text"
              value={content[`title_${activeTab}` as keyof typeof content] as string}
              onChange={(e) => setContent({ ...content, [`title_${activeTab}`]: e.target.value })}
              className="input"
              placeholder="输入标题..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容 ({langs.find((l) => l.code === activeTab)?.label})
            </label>
            <RichTextEditor
              value={content[`content_${activeTab}` as keyof typeof content] as string}
              onChange={(value) => setContent({ ...content, [`content_${activeTab}`]: value })}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeAbout;
