import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contentApi, updatesApi } from '../services/api';
import { useNotificationStore } from '../store/notificationStore';
import { getErrorMessage } from '../utils/errorMessage';

type UpdateSummary = {
  update_id: string;
  channel: string;
  title_zh?: string;
  title_en?: string;
  title_ja?: string;
  publishedAt?: string;
  updatedAt?: string;
};

const UpdatesList: React.FC = () => {
  const [updates, setUpdates] = useState<UpdateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [newChannel, setNewChannel] = useState('');
  const showNotification = useNotificationStore((state) => state.showNotification);
  const navigate = useNavigate();

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    loadUpdates();
  }, [channelFilter]);

  const loadChannels = async () => {
    try {
      const list = await updatesApi.getChannels();
      setChannels(list);
    } catch (error) {
      console.error('加载频道失败', error);
    }
  };

  const loadUpdates = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> | undefined = channelFilter ? { channel: channelFilter } : undefined;
      const data = await contentApi.getAll('updates', undefined, params || {});
      setUpdates(data || []);
    } catch (error) {
      console.error('加载动态失败', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUpdates = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return updates;
    }
    return updates.filter((item) => {
      const slug = item.update_id.toLowerCase();
      const channel = item.channel?.toLowerCase() || '';
      const titles = [item.title_zh, item.title_en, item.title_ja].map((t) => (t || '').toLowerCase());
      return (
        slug.includes(keyword) ||
        channel.includes(keyword) ||
        titles.some((title) => title.includes(keyword))
      );
    });
  }, [updates, search]);

  const sanitizeSlug = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

  const generateUpdateId = () => {
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '');
    return `update-${timestamp}-${Math.random().toString(16).slice(2, 6)}`;
  };

  const handleCreate = () => {
    const sanitizedChannel = sanitizeSlug(newChannel);

    if (!sanitizedChannel) {
      showNotification('请输入频道标识，例如 news 或 events', 'error');
      return;
    }

    const generatedId = generateUpdateId();
    const query = new URLSearchParams({ channel: sanitizedChannel }).toString();
    setNewChannel('');
    navigate(`/updates/${generatedId}?${query}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该动态吗？删除后不可恢复。')) {
      return;
    }
    try {
      await contentApi.delete('updates', id);
      showNotification('动态已删除', 'success');
      loadUpdates();
    } catch (error) {
      showNotification(`删除失败：${getErrorMessage(error)}`, 'error');
    }
  };

  const formatDatetime = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-primary-600 hover:text-primary-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">动态管理</h1>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">筛选频道</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="input"
              >
                <option value="">全部频道</option>
                {channels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">搜索动态</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                placeholder="按标题、频道或标识搜索"
              />
            </div>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex flex-col gap-3">
            <div className="text-sm text-primary-900 font-medium">新增动态</div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  className="input"
                  placeholder="频道（小写字母/数字/连字符）"
                />
              </div>
              <button onClick={handleCreate} className="btn-primary whitespace-nowrap">
                + 创建动态
              </button>
            </div>
            <p className="text-xs text-primary-800">
              系统会自动生成唯一 slug；前台路径示例：<code className="font-mono">/updates/&lt;channel&gt;/&lt;slug&gt;/</code>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-600">加载中...</div>
        ) : filteredUpdates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">当前没有匹配的动态</p>
            <p className="text-sm text-gray-400">请尝试调整搜索/筛选条件或新增动态。</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-xs uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">标识</th>
                  <th className="px-4 py-3">频道</th>
                  <th className="px-4 py-3">中文标题</th>
                  <th className="px-4 py-3">发布时间</th>
                  <th className="px-4 py-3">更新时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUpdates.map((item) => (
                  <tr key={item.update_id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-mono text-xs md:text-sm text-gray-600">{item.update_id}</td>
                    <td className="px-4 py-3 text-gray-600">{item.channel || '—'}</td>
                    <td className="px-4 py-3">{item.title_zh || item.title_en || item.title_ja || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDatetime(item.publishedAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDatetime(item.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/updates/${item.update_id}`} className="btn-secondary">
                          编辑
                        </Link>
                        <button onClick={() => handleDelete(item.update_id)} className="btn-danger">
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

export default UpdatesList;
