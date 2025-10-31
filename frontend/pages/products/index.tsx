import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface Product {
  product_id: string;
  name: string;
  desc: string;
  type?: string;
  origin?: string;
}

export default function ProductsPage() {
  const { locale } = useI18n();
  const t = translations[locale].products;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/products`, {
          params: { lang: locale },
        });
        setProducts(response.data.items || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [locale]);

  return (
    <Layout>
      <Head>
        <title>{t.title} - 尊茗茶业</title>
      </Head>

      <div className="section-padding bg-gray-50">
        <div className="container-custom">
          <h1 className="text-display font-bold mb-12 text-center text-primary-800">
            {t.title}
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">暂无产品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link href={`/products/${product.product_id}`} key={product.product_id}>
                  <div className="card overflow-hidden cursor-pointer h-full hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.desc}</p>
                      {product.origin && (
                        <p className="text-xs text-gray-500 mt-2">
                          {t.origin}: {product.origin}
                        </p>
                      )}
                      {product.type && (
                        <p className="text-xs text-gray-500">
                          {t.type}: {product.type}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
