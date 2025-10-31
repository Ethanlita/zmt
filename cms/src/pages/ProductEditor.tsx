import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contentApi, translateApi, publishApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';

type Language = 'zh' | 'en' | 'ja';

const ProductEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Language>('zh');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [product, setProduct] = useState({
    name_zh: '',
    desc_zh: '',
    name_en: '',
    desc_en: '',
    name_ja: '',
    desc_ja: '',
    image_url: '',
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const data = await contentApi.getById('products', id!);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (targetLang: Language) => {
    try {
      const translatedName = await translateApi.translate(product.name_zh, 'zh', targetLang);
      const translatedDesc = await translateApi.translate(product.desc_zh, 'zh', targetLang);
      
      setProduct({
        ...product,
        [`name_${targetLang}`]: translatedName,
        [`desc_${targetLang}`]: translatedDesc,
      });
      
      alert('翻译成功！');
    } catch (error) {
      alert('翻译失败：' + (error as Error).message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const productId = id === 'new' ? `product-${Date.now()}` : id!;
      await contentApi.save('products', productId, product);
      alert('保存成功！');
      if (id === 'new') {
        navigate(`/products/${productId}`);
      }
    } catch (error) {
      alert('保存失败：' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await handleSave();
      await publishApi.triggerBuild();
      alert('发布成功！');
    } catch (error) {
      alert('发布失败：' + (error as Error).message);
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
            <Link to="/products" className="text-primary-600 hover:text-primary-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-semibold">
              {id === 'new' ? '添加产品' : '编辑产品'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-secondary">
              {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={handlePublish} className="btn-primary">
              保存并发布
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

        {/* Product Form */}
        <div className="card">
          {activeTab === 'zh' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                产品图片 URL
              </label>
              <input
                type="text"
                value={product.image_url}
                onChange={(e) => setProduct({ ...product, image_url: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品名称 ({langs.find(l => l.code === activeTab)?.label})
            </label>
            <input
              type="text"
              value={product[`name_${activeTab}` as keyof typeof product] as string}
              onChange={(e) => setProduct({ ...product, [`name_${activeTab}`]: e.target.value })}
              className="input"
              placeholder="输入产品名称..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品描述 ({langs.find(l => l.code === activeTab)?.label})
            </label>
            <RichTextEditor
              value={product[`desc_${activeTab}` as keyof typeof product] as string}
              onChange={(value: string) => setProduct({ ...product, [`desc_${activeTab}`]: value })}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductEditor;
