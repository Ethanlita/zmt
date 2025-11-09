import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { publishApi, actionsApi } from '../services/api';
import { getErrorMessage } from '../utils/errorMessage';

type WorkflowStatus = {
  name: string;
  key: string;
  status?: string;
  conclusion?: string;
  found?: boolean;
  duration_ms?: number;
  updated_at?: string;
  run_started_at?: string;
  html_url?: string;
};

const WORKFLOW_DEFINITIONS = [
  { key: 'deploy-frontend', name: 'Deploy Frontend to GitHub Pages', label: '前端部署' },
  { key: 'pages-build', name: 'pages build and deployment', label: 'Pages Build' },
];

const Dashboard: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const showNotification = useNotificationStore((state) => state.showNotification);
  const [publishing, setPublishing] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayedFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (delayedFetchRef.current) {
        clearTimeout(delayedFetchRef.current);
      }
    };
  }, []);

  const handleCreatePage = () => {
    const raw = prompt('请输入新的页面标识（slug），仅限字母、数字和连字符');
    if (!raw) return;
    const sanitized = raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!sanitized) {
      showNotification('请输入有效的 slug', 'error');
      return;
    }
    navigate(`/pages/${sanitized}`);
  };

  const handlePublishAll = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      await publishApi.triggerBuild();
      showNotification('发布成功，前台将在几分钟内构建最新内容', 'success');
      if (delayedFetchRef.current) {
        clearTimeout(delayedFetchRef.current);
      }
      delayedFetchRef.current = setTimeout(() => {
        void fetchWorkflowStatuses();
      }, 3000);
    } catch (error) {
      showNotification(`发布失败：${getErrorMessage(error)}`, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const evaluatePolling = (statuses: WorkflowStatus[]) => {
    const hasRunning = statuses.some((status) =>
      status.status && ['queued', 'in_progress', 'waiting'].includes(status.status),
    );
    if (hasRunning) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          void fetchWorkflowStatuses({ silent: true });
        }, 1000);
      }
    } else {
      stopPolling();
    }
  };

  const fetchWorkflowStatuses = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setStatusLoading(true);
    }
    try {
      const data = await actionsApi.getWorkflowStatus();
      setWorkflowStatuses(data);
      setLastCheckedAt(new Date().toISOString());
      evaluatePolling(data);
    } catch (error) {
      if (!silent) {
        showNotification(`获取构建状态失败：${getErrorMessage(error)}`, 'error');
      }
      stopPolling();
    } finally {
      if (!silent) {
        setStatusLoading(false);
      }
    }
  };

  const renderStatusBadge = (status?: string, conclusion?: string) => {
    if (!status) return <span className="text-gray-500 text-xs">暂无</span>;
    if (['queued', 'in_progress', 'waiting'].includes(status)) {
      return <span className="text-amber-600 text-xs font-medium">运行中</span>;
    }
    if (status === 'completed') {
      if (conclusion === 'success') {
        return <span className="text-emerald-600 text-xs font-medium">成功</span>;
      }
      if (conclusion === 'failure' || conclusion === 'cancelled') {
        return <span className="text-red-500 text-xs font-medium">{conclusion === 'failure' ? '失败' : '已取消'}</span>;
      }
    }
    return (
      <span className="text-gray-600 text-xs font-medium">
        {status}
        {conclusion ? ` (${conclusion})` : ''}
      </span>
    );
  };

  const formatDuration = (ms?: number | null) => {
    if (ms == null || ms < 0) return '—';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m${secs.toString().padStart(2, '0')}s`;
  };

  const runningNow = workflowStatuses.some((status) =>
    status.status && ['queued', 'in_progress', 'waiting'].includes(status.status),
  );

  const statusIndicatorClass = runningNow
    ? 'bg-amber-500 animate-pulse'
    : workflowStatuses.some((status) => status.conclusion === 'failure')
      ? 'bg-red-500'
      : workflowStatuses.length
        ? 'bg-emerald-500'
        : 'bg-gray-400';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">尊茗茶业 CMS</h1>
          <div className="flex gap-3">
            <Link to="/guide" className="btn-secondary">
              操作指南
            </Link>
            <div className="relative">
              <button
                onClick={() => {
                  const nextOpen = !statusPopoverOpen;
                  setStatusPopoverOpen(nextOpen);
                  if (nextOpen && workflowStatuses.length === 0) {
                    void fetchWorkflowStatuses();
                  }
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <span>构建状态</span>
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusIndicatorClass}`} />
              </button>
              {statusPopoverOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div>
                      <p className="text-sm font-medium text-gray-700">最近一次运行</p>
                      <p className="text-xs text-gray-500">
                        {lastCheckedAt ? `上次检查：${new Date(lastCheckedAt).toLocaleTimeString()}` : '尚未检查'}
                      </p>
                    </div>
                    <button
                      className="text-primary-600 text-sm disabled:text-gray-400"
                      onClick={() => void fetchWorkflowStatuses()}
                      disabled={statusLoading}
                    >
                      {statusLoading ? '刷新中' : '刷新'}
                    </button>
                  </div>
                  <div className="divide-y">
                    {WORKFLOW_DEFINITIONS.map((definition) => {
                      const status = workflowStatuses.find((item) => item.key === definition.key);
                      return (
                        <div key={definition.key} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-800">{definition.label}</p>
                            {renderStatusBadge(status?.status, status?.conclusion)}
                          </div>
                          <p className="text-xs text-gray-500">
                            耗时：{formatDuration(status?.duration_ms)}
                          </p>
                          <p className="text-xs text-gray-500">
                            完成时间：{status?.updated_at ? new Date(status.updated_at).toLocaleTimeString() : '—'}
                          </p>
                          {status?.html_url && (
                            <a
                              href={status.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-600 text-xs font-medium inline-block mt-1"
                            >
                              查看详情 →
                            </a>
                          )}
                          {!status?.found && (
                            <p className="text-xs text-gray-400 mt-1">暂无运行记录</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handlePublishAll} disabled={publishing} className="btn-primary">
              {publishing ? '发布中...' : '发布全站'}
            </button>
            <button onClick={() => logout()} className="btn-secondary">
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8">内容管理</h2>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
          {/* Pages Card */}
          <Link to="/pages" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">页面管理</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600">查看全部页面，创建或编辑内容</p>
            <div className="mt-4 text-primary-600 font-medium">进入页面列表 →</div>
          </Link>

          {/* Products Card */}
          <Link to="/products" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">产品管理</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-600">创建新品、维护展示信息</p>
            <div className="mt-4 text-primary-600 font-medium">管理产品 →</div>
          </Link>

          {/* Product Series Card */}
          <Link to="/series" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">产品系列</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </div>
            <p className="text-gray-600">定义系列封面与简介，并绑定到产品展示</p>
            <div className="mt-4 text-primary-600 font-medium">管理产品系列 →</div>
          </Link>

          {/* Home About Card */}
          <Link to="/home-about" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">首页关于我们</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7H7m6 4H7m6 4H7m9-8l3 3m0 0l-3 3m3-3h-4" />
              </svg>
            </div>
            <p className="text-gray-600">维护首页“关于我们”内容，多语言同步</p>
            <div className="mt-4 text-primary-600 font-medium">管理首页介绍 →</div>
          </Link>

          {/* Updates Card */}
          <Link to="/updates" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">动态管理</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h7m-7 4h5M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </div>
            <p className="text-gray-600">发布不同频道的动态内容，自动同步到前端</p>
            <div className="mt-4 text-primary-600 font-medium">维护动态 →</div>
          </Link>

          {/* Navigation Card */}
          <Link to="/navigation" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">栏目管理</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h7" />
              </svg>
            </div>
            <p className="text-gray-600">配置首页导航栏、子栏目和页面路径</p>
            <div className="mt-4 text-primary-600 font-medium">管理栏目 →</div>
          </Link>

          {/* Site settings */}
          <Link to="/settings" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">站点设置</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 4.94l1.06-1.06-2.12-2.12-1.06 1.06a7.978 7.978 0 00-1.41-.82l-.2-1.42H10.79l-.2 1.42c-.5.2-.97.47-1.41.82L8.12 9.76 6 11.88l1.06 1.06c-.35.44-.62.91-.82 1.41l-1.42.2v3.03l1.42.2c.2.5.47.97.82 1.41L6 20.12l2.12 2.12 1.06-1.06c.44.35.91.62 1.41.82l.2 1.42h3.03l.2-1.42c.5-.2.97-.47 1.41-.82l1.06 1.06 2.12-2.12-1.06-1.06c.35-.44.62-.91.82-1.41l1.42-.2v-3.03l-1.42-.2c-.2-.5-.47-.97-.82-1.41z" />
              </svg>
            </div>
            <p className="text-gray-600">自定义底部信息与全站文案</p>
            <div className="mt-4 text-primary-600 font-medium">管理设置 →</div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">常见操作</h3>
          <div className="flex flex-wrap gap-4">
            <button onClick={handleCreatePage} className="btn-primary">
              新建页面
            </button>
            <Link to="/pages" className="btn-secondary">
              管理页面列表
            </Link>
            <Link to="/products/new" className="btn-secondary">
              添加新产品
            </Link>
            <Link to="/home-about" className="btn-secondary">
              编辑首页关于我们
            </Link>
            <Link to="/navigation" className="btn-secondary">
              调整栏目结构
            </Link>
            <Link to="/settings" className="btn-secondary">
              更新站点设置
            </Link>
            <Link to="/updates" className="btn-secondary">
              管理动态内容
            </Link>
            <Link to="/series" className="btn-secondary">
              管理产品系列
            </Link>
            <button onClick={handlePublishAll} disabled={publishing} className="btn-primary">
              {publishing ? '发布中...' : '发布全站'}
            </button>
          </div>
        </div>
        <p className="mt-4 text-primary-600 font-medium">如果你遇到了任何技术问题，发现了任何Bug，或者需要任何新功能，请在飞书中联系技术人员。</p>
      </main>
    </div>
  );
};

export default Dashboard;
