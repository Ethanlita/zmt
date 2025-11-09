import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentApi } from '../services/api';
import { useNotificationStore } from '../store/notificationStore';
import { getErrorMessage } from '../utils/errorMessage';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await contentApi.getAll('products');
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    
    try {
      await contentApi.delete('products', id);
      showNotification('产品删除成功', 'success');
      loadProducts();
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
            <h1 className="text-xl font-semibold">产品管理</h1>
          </div>
          <Link to="/products/new" className="btn-primary">
            + 添加产品
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">还没有产品</p>
            <Link to="/products/new" className="btn-primary">
              添加第一个产品
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.product_id} className="card">
                {product.image_url ? (
                  <div className="aspect-square overflow-hidden rounded-lg mb-4 bg-gray-100">
                    <img
                      src={product.image_url}
                      alt={product.name_zh}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                )}
                <h3 className="font-semibold text-lg mb-2">{product.name_zh}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {typeof product.desc_zh === 'string'
                    ? product.desc_zh.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                    : ''}
                </p>
                <div className="flex gap-2">
                  <Link to={`/products/${product.product_id}`} className="btn-secondary flex-1 text-center">
                    编辑
                  </Link>
                  <button
                    onClick={() => handleDelete(product.product_id)}
                    className="btn-danger"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductList;
