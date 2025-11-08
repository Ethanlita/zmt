import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { contentApi, publishApi, translateApi, updatesApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import { useNotificationStore } from '../store/notificationStore';
import { getErrorMessage } from '../utils/errorMessage';
import { extractPlainText, plainTextToRichText } from '../utils/richText';

type Language = 'zh' | 'en' | 'ja';

type UpdateContent = {
  title_zh: string;
  content_zh: string;
  title_en: string;
  content_en: string;
  title_ja: string;
  content_ja: string;
  channel: string;
  publishedAt?: string;
  coverImage?: string;
};

const EMPTY_CONTENT: UpdateContent = {
  title_zh: '',
  content_zh: '',
  title_en: '',
  content_en: '',
  title_ja: '',
  content_ja: '',
  channel: '',
  publishedAt: '',
  coverImage: '',
};

const toDatetimeLocal = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const fromDatetimeLocal = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const UpdateEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const prefilledChannel = params.get('channel') || '';

  const [activeTab, setActiveTab] = useState<Language>('zh');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);
  const [content, setContent] = useState<UpdateContent>({
    ...EMPTY_CONTENT,
    channel: prefilledChannel,
  });

  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (id) {
      loadContent();
    }
  }, [id]);

  const loadChannels = async () => {
    try {
      const data = await updatesApi.getChannels();
      setChannels(data);
    } catch (error) {
      console.error('加载频道失败', error);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await contentApi.getById('updates', id!);
      setContent({
        ...EMPTY_CONTENT,
        ...data,
      });
    } catch (error) {
      console.warn('动态不存在，准备创建新内容', error);
      setContent((prev) => ({
        ...prev,
        channel: prefilledChannel,
      }));
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

      const updates: Partial<UpdateContent> = {};

      if (sourceTitle) {
        const titleKey = `title_${targetLang}` as keyof UpdateContent;
        updates[titleKey] = await translateApi.translate(sourceTitle, 'zh', targetLang);
      }

      if (sourceBodyPlain) {
        const contentKey = `content_${targetLang}` as keyof UpdateContent;
        const translatedBody = await translateApi.translate(sourceBodyPlain, 'zh', targetLang);
        updates[contentKey] = plainTextToRichText(translatedBody);
      }

      setContent({
        ...content,
        ...updates,
      });
      showNotification(`翻译成功！已自动填充${targetLang === 'en' ? '英文' : '日文'}内容`, 'success');
    } catch (error) {
      showNotification(`翻译失败：${getErrorMessage(error)}`, 'error');
    }
  };

  const handleFieldChange = (key: keyof UpdateContent, value: string) => {
    setContent((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!id) return;
    if (!content.channel?.trim()) {
      showNotification('频道不能为空', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...content,
        channel: content.channel.trim().toLowerCase(),
        publishedAt: fromDatetimeLocal(content.publishedAt),
      };
      await contentApi.save('updates', id, payload);
      showNotification('动态已保存', 'success');
      await loadChannels(); // 可能新增频道
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
      showNotification('发布成功，网站将在几分钟内更新动态页面', 'success');
    } catch (error) {
      showNotification(`发布失败：${getErrorMessage(error)}`, 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (!id) {
    return <div className="min-h-screen flex items-center justify-center">缺少动态标识</div>;
  }

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
            <Link to="/updates" className="text-primary-600 hover:text-primary-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">编辑动态：{id}</h1>
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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="card">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">动态标识（slug）</label>
              <input type="text" value={id} className="input bg-gray-50" disabled />
              <p className="text-xs text-gray-400 mt-1">如需更改，请在列表页重新创建动态。</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">频道</label>
              <input
                list="channel-options"
                value={content.channel}
                onChange={(e) => handleFieldChange('channel', e.target.value)}
                className="input"
                placeholder="例如 news / events"
              />
              <datalist id="channel-options">
                {channels.map((channel) => (
                  <option value={channel} key={channel} />
                ))}
              </datalist>
              <p className="text-xs text-gray-400 mt-1">频道将决定前端路径：/updates/频道/{'{slug}'}/</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">发布时间</label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(content.publishedAt)}
                onChange={(e) => handleFieldChange('publishedAt', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="border-b border-gray-200">
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
              标题（{langs.find((l) => l.code === activeTab)?.label}）
            </label>
            <input
              type="text"
              value={content[`title_${activeTab}` as keyof UpdateContent] as string}
              onChange={(e) => handleFieldChange(`title_${activeTab}` as keyof UpdateContent, e.target.value)}
              className="input"
              placeholder="输入标题..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容（{langs.find((l) => l.code === activeTab)?.label}）
            </label>
            <RichTextEditor
              value={content[`content_${activeTab}` as keyof UpdateContent] as string}
              onChange={(value) => handleFieldChange(`content_${activeTab}` as keyof UpdateContent, value)}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UpdateEditor;
