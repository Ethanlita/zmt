import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';
import { FooterSettings, NavigationNode, loadSiteChrome, API_URL } from '../../lib/siteConfig';

interface ProductRecord {
  product_id: string;
  slug?: string;
  name_zh?: string;
  name_en?: string;
  name_ja?: string;
  desc_zh?: string;
  desc_en?: string;
  desc_ja?: string;
  type?: string;
  origin?: string;
  image_url?: string;
  series_id?: string;
}

interface ProductSeriesRecord {
  series_id: string;
  slug?: string;
  name_zh?: string;
  name_en?: string;
  name_ja?: string;
  order?: number;
}

interface ProductsPageProps {
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
  initialProducts: ProductRecord[];
  initialSeries: ProductSeriesRecord[];
}

const stripHtml = (html: string) =>
  typeof html === 'string' ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

export default function ProductsPage({
  initialNavigation,
  initialFooter,
  initialProducts,
  initialSeries,
}: ProductsPageProps) {
  const { locale } = useI18n();
  const t = translations[locale].products;
  const router = useRouter();

  const [products, setProducts] = useState<ProductRecord[]>(initialProducts);
  const [seriesList, setSeriesList] = useState<ProductSeriesRecord[]>(initialSeries);
  const [selectedSeries, setSelectedSeries] = useState<string>('');

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setSeriesList(initialSeries);
  }, [initialSeries]);

  useEffect(() => {
    const { series } = router.query;
    if (typeof series === 'string') {
      setSelectedSeries(series);
    }
  }, [router.query.series]);

  const localizedSeries = useMemo(() => {
    return [...seriesList]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((series) => ({
        ...series,
        displayName:
          (series[`name_${locale}` as keyof ProductSeriesRecord] as string) ||
          series.name_zh ||
          series.slug ||
          '',
      }));
  }, [seriesList, locale]);

  const localizedProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      displayName:
        (product[`name_${locale}` as keyof ProductRecord] as string) ||
        product.name_zh ||
        product.product_id,
      displayDescription:
        (product[`desc_${locale}` as keyof ProductRecord] as string) ||
        product.desc_zh ||
        '',
    }));
  }, [products, locale]);

  const filteredProducts = selectedSeries
    ? localizedProducts.filter((product) => product.series_id === selectedSeries)
    : localizedProducts;

  return (
    <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      <Head>
        <title>{t.title} - 尊茗茶业</title>
      </Head>

      <div className="section-padding bg-gray-50">
        <div className="container-custom">
          <h1 className="text-display font-bold mb-12 text-center text-primary-800">{t.title}</h1>

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
                const value = e.target.value;
                setSelectedSeries(value);
                const url = value ? `/products?series=${value}` : '/products';
                router.push(url, undefined, { shallow: true });
              }}
            >
              <option value="">{t.allSeries || '全部系列'}</option>
              {localizedSeries.map((series) => (
                <option key={series.series_id} value={series.series_id}>
                  {series.displayName}
                </option>
              ))}
            </select>
          </div>

          {filteredProducts.length === 0 ? (
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
                          alt={product.displayName}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-200" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{product.displayName}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{stripHtml(product.displayDescription)}</p>
                      {product.series_id && (
                        <p className="text-xs text-primary-600 mt-2">
                          {t.seriesLabel || '系列'}:{' '}
                          {localizedSeries.find((series) => series.series_id === product.series_id)?.displayName ||
                            product.series_id}
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
  const [chrome, productsRes, seriesRes] = await Promise.all([
    loadSiteChrome(),
    fetch(`${API_URL}/content/products`),
    fetch(`${API_URL}/content/series`),
  ]);

  let products: ProductRecord[] = [];
  let series: ProductSeriesRecord[] = [];

  try {
    if (productsRes.ok) {
      const json = await productsRes.json();
      products = Array.isArray(json.items) ? json.items : [];
    } else {
      console.warn('Failed to fetch products for products page:', productsRes.status);
    }
  } catch (error) {
    console.warn('Error parsing products data:', error);
  }

  try {
    if (seriesRes.ok) {
      const json = await seriesRes.json();
      series = Array.isArray(json.items) ? json.items : [];
    } else {
      console.warn('Failed to fetch product series:', seriesRes.status);
    }
  } catch (error) {
    console.warn('Error parsing series data:', error);
  }

  series.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

  return {
    props: {
      initialNavigation: chrome.navigation,
      initialFooter: chrome.footer,
      initialProducts: products,
      initialSeries: series,
    },
  };
}
