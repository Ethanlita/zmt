import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetStaticProps } from 'next';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface ProductsPageProps {
  products: any[];
}

const translations = {
  zh: { title: '产品中心', back: '返回首页' },
  en: { title: 'Products', back: 'Back Home' },
  ja: { title: '商品', back: 'ホームに戻る' },
};

export default function ProductsPage({ products }: ProductsPageProps) {
  const router = useRouter();
  const { locale = 'zh' } = router;
  const t = translations[locale as keyof typeof translations];

  return (
    <>
      <Head>
        <title>{t.title} - 尊茗茶业</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <nav className="container-custom flex items-center justify-between py-4 px-6">
            <Link href="/" className="text-2xl font-serif font-bold text-primary-700">
              尊茗茶业
            </Link>
            <Link href="/" className="btn-secondary">
              {t.back}
            </Link>
          </nav>
        </header>

        <main className="section-padding">
          <div className="container-custom">
            <h1 className="text-display font-bold mb-12 text-center text-primary-800">
              {t.title}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link href={`/products/${product.product_id}`} key={product.product_id}>
                  <div className="card overflow-hidden cursor-pointer h-full">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  try {
    const response = await axios.get(`${API_URL}/content/products`, {
      params: { lang: locale },
    });
    
    return {
      props: {
        products: response.data.items || [],
      },
      revalidate: 60,
    };
  } catch (error) {
    return {
      props: {
        products: [],
      },
    };
  }
};
