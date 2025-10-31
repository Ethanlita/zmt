import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contentApi, translateApi, publishApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';

type Language = 'zh' | 'en' | 'ja';

const PageEditor: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<Language>('zh');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const [content, setContent] = useState({
    title_zh: '',
    content_zh: '',
    title_en: '',
    content_en: '',
    title_ja: '',
    content_ja: '',
  });

  useEffect(() => {
    if (slug) {
      loadContent();
    }
  }, [slug]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await contentApi.getById('pages', slug!);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (targetLang: Language) => {
    try {
      const translatedTitle = await translateApi.translate(content.title_zh, 'zh', targetLang);
      const translatedContent = await translateApi.translate(content.content_zh, 'zh', targetLang);
      
      setContent({
        ...content,
        [`title_${targetLang}`]: translatedTitle,
        [`content_${targetLang}`]: translatedContent,
      });
      
      alert(`翻译成功！已自动填充${targetLang === 'en' ? '英文' : '日文'}内容`);
    } catch (error) {
      alert('翻译失败：' + (error as Error).message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentApi.save('pages', slug!, content);
      alert('保存成功！');
    } catch (error) {
      alert('保存失败：' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await handleSave();
      await publishApi.triggerBuild();
      alert('发布成功！网站将在几分钟内更新');
    } catch (error) {
      alert('发布失败：' + (error as Error).message);
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
            <h1 className="text-xl font-semibold">编辑页面: {slug}</h1>
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
        {/* Language Tabs */}
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

        {/* Content Form */}
        <div className="card">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 ({langs.find(l => l.code === activeTab)?.label})
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
              内容 ({langs.find(l => l.code === activeTab)?.label})
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

export default PageEditor;
