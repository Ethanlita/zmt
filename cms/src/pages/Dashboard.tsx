import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Dashboard: React.FC = () => {
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-700">尊茗茶业 CMS</h1>
          <button onClick={logout} className="btn-secondary">
            退出登录
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8">内容管理</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pages Card */}
          <Link to="/pages/about-us" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">页面管理</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600">编辑网站页面内容（关于我们等）</p>
            <div className="mt-4 text-primary-600 font-medium">管理页面 →</div>
          </Link>

          {/* Products Card */}
          <Link to="/products" className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">产品管理</h3>
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-600">添加、编辑和管理产品</p>
            <div className="mt-4 text-primary-600 font-medium">管理产品 →</div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">常见操作</h3>
          <div className="flex gap-4">
            <Link to="/pages/about-us" className="btn-primary">
              编辑关于我们
            </Link>
            <Link to="/products" className="btn-secondary">
              查看所有产品
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
