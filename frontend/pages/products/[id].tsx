import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPathsResult } from 'next';
import { FooterSettings, NavigationNode, loadSiteChrome, API_URL } from '../../lib/siteConfig';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';

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

interface ProductPageProps {
  product: Product | null;
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
}

export default function ProductPage({ product, initialNavigation, initialFooter }: ProductPageProps) {
  const { locale } = useI18n();
  const t = translations[locale].products;
  const stripHtml = (html: string) =>
    typeof html === 'string' ? html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  const fallbackDesc =
    locale === 'zh' ? '暂无描述' : locale === 'en' ? 'Description coming soon' : '説明は準備中です';
  const name = product ? ((product[`name_${locale}` as keyof Product] as string) || product.name_zh) : '';
  const descHtml = product ? ((product[`desc_${locale}` as keyof Product] as string) || product.desc_zh) : '';
  const descPlain = stripHtml(descHtml) || fallbackDesc;
 
  if (!product) {
    return (
      <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
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
    <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      <Head>
        <title>{name} - 尊茗茶业</title>
        <meta name="description" content={descPlain} />
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
              <div
                className="prose prose-lg text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: descHtml || `<p>${fallbackDesc}</p>`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  try {
    const response = await fetch(`${API_URL}/content/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }
    const data = await response.json();
    const items: Product[] = Array.isArray(data?.items) ? data.items : [];
    const ids = items
      .map((item) => item.product_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    return {
      paths: ids.map((id) => ({ params: { id } })),
      fallback: false,
    };
  } catch (error) {
    console.warn('Failed to generate static paths for products:', error);
    return {
      paths: [],
      fallback: false,
    };
  }
}

export async function getStaticProps({ params }: { params: { id: string } }) {
  const productId = params?.id;

  try {
    const response = await fetch(`${API_URL}/content/products/${productId}`);
    if (!response.ok) {
      return { notFound: true };
    }
    const data = await response.json();
    const { navigation, footer } = await loadSiteChrome();

    return {
      props: {
        product: data,
        initialNavigation: navigation,
        initialFooter: footer,
      },
    };
  } catch (error) {
    console.warn(`Failed to fetch product ${productId} during build:`, error);
    return { notFound: true };
  }
}
