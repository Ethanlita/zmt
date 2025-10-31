import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { translations } from '../lib/translations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface Product {
  product_id: string;
  name: string;
  desc: string;
  type?: string;
  origin?: string;
}

export default function Home() {
  const { locale } = useI18n();
  const t = translations[locale].home;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products client-side
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
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta property="og:title" content={t.title} />
        <meta property="og:description" content={t.description} />
      </Head>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-800 to-primary-600 text-white py-32">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {t.hero.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-cream-50 max-w-3xl mx-auto">
            {t.hero.subtitle}
          </p>
          <Link href="/about" className="inline-block bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-cream-50 transition-colors">
            {t.hero.cta}
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-cream-50">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-primary-800">
            {t.about.title}
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {t.about.content}
          </p>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto max-w-7xl px-6">
          <h2 className="text-4xl font-bold mb-12 text-center text-primary-800">
            {t.products.title}
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{locale === 'zh' ? '加载中...' : locale === 'en' ? 'Loading...' : '読み込み中...'}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {locale === 'zh' ? '暂无产品' : locale === 'en' ? 'No products available' : '商品がありません'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {products.slice(0, 3).map((product) => (
                  <Link 
                    href={`/products/${product.product_id}`} 
                    key={product.product_id}
                    className="group"
                  >
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200"></div>
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 line-clamp-2">{product.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-12">
                <Link 
                  href="/products" 
                  className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  {t.products.viewAll}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
