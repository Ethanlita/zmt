import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const Dashboard: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const showNotification = useNotificationStore((state) => state.showNotification);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">尊茗茶业 CMS</h1>
          <button onClick={() => logout()} className="btn-secondary">
            退出登录
          </button>
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
