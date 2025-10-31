import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface Product {
  product_id: string;
  name_zh: string;
  name_en: string;
  name_ja: string;
  desc_zh: string;
  desc_en: string;
  desc_ja: string;
  image_url?: string;
}

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  const { locale } = useI18n();
  const t = translations[locale].products;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, locale]);

  const name = product ? (product[`name_${locale}` as keyof Product] as string || product.name_zh) : '';
  const desc = product ? (product[`desc_${locale}` as keyof Product] as string || product.desc_zh) : '';

  if (loading) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-custom text-center">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="section-padding">
          <div className="container-custom text-center">
            <h1 className="text-2xl font-bold mb-4">产品未找到</h1>
            <Link href="/products" className="btn-primary">
              {t.back}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{name} - 尊茗茶业</title>
        <meta name="description" content={desc} />
      </Head>

      <div className="section-padding bg-gray-50">
        <div className="container-custom max-w-5xl">
          <div className="mb-6">
            <Link href="/products" className="btn-secondary">
              ← {t.back}
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
              {product.image_url ? (
                <img src={product.image_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  暂无图片
                </div>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-6 text-primary-800">{name}</h1>
              <div className="prose prose-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
