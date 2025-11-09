import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';
import { FooterSettings, NavigationNode, loadSiteChrome } from '../../lib/siteConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface Product {
  product_id: string;
  name: string;
  desc: string;
  type?: string;
  origin?: string;
  image_url?: string;
  series_id?: string;
}

interface ProductSeries {
  series_id: string;
  name: string;
  description?: string;
  image_url?: string;
  order?: number;
}

interface ProductsPageProps {
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
}

export default function ProductsPage({ initialNavigation, initialFooter }: ProductsPageProps) {
  const { locale } = useI18n();
  const t = translations[locale].products;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seriesList, setSeriesList] = useState<ProductSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const router = useRouter();

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

    const fetchSeries = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/series`, { params: { lang: locale } });
        const items: ProductSeries[] = (response.data.items || []).sort(
          (a: ProductSeries, b: ProductSeries) => (a.order ?? 0) - (b.order ?? 0),
        );
        setSeriesList(items);
      } catch (error) {
        console.error('Error fetching series:', error);
        setSeriesList([]);
      }
    };

    fetchProducts();
    fetchSeries();
  }, [locale]);

  useEffect(() => {
    const { series } = router.query;
    if (typeof series === 'string') {
      setSelectedSeries(series);
    }
  }, [router.query.series]);

  const filteredProducts = selectedSeries
    ? products.filter((product) => product.series_id === selectedSeries)
    : products;

  return (
    <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      <Head>
        <title>{t.title} - 尊茗茶业</title>
      </Head>

      <div className="section-padding bg-gray-50">
        <div className="container-custom">
          <h1 className="text-display font-bold mb-12 text-center text-primary-800">
            {t.title}
          </h1>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{t.filterLabel || '按系列筛选'}</p>
              <p className="text-xs text-gray-500">
                {t.filterHint || '选择一个系列即可只查看该系列产品。'}
              </p>
            </div>
            <select
              className="input md:w-80"
              value={selectedSeries}
              onChange={(e) => {
                setSelectedSeries(e.target.value);
                const url = e.target.value ? `/products?series=${e.target.value}` : '/products';
                router.push(url, undefined, { shallow: true });
              }}
            >
              <option value="">{t.allSeries || '全部系列'}</option>
              {seriesList.map((series) => (
                <option key={series.series_id} value={series.series_id}>
                  {series.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">暂无产品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Link href={`/products/${product.product_id}`} key={product.product_id}>
                  <div className="card overflow-hidden cursor-pointer h-full hover:shadow-lg transition-shadow">
                    {product.image_url ? (
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-200" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {typeof product.desc === 'string'
                          ? product.desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                          : ''}
                      </p>
                      {product.series_id && (
                        <p className="text-xs text-primary-600 mt-2">
                          {t.seriesLabel || '系列'}:{' '}
                          {seriesList.find((series) => series.series_id === product.series_id)?.name || product.series_id}
                        </p>
                      )}
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

export async function getStaticProps() {
  const { navigation, footer } = await loadSiteChrome();

  return {
    props: {
      initialNavigation: navigation,
      initialFooter: footer,
    },
  };
}
