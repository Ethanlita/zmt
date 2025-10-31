import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetStaticProps, GetStaticPaths } from 'next';
import axios from 'axios';

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

interface ProductPageProps {
  product: Product;
}

export default function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const { locale = 'zh' } = router;

  const name = product[`name_${locale}` as keyof Product] as string || product.name_zh;
  const desc = product[`desc_${locale}` as keyof Product] as string || product.desc_zh;

  return (
    <>
      <Head>
        <title>{name} - 尊茗茶业</title>
        <meta name="description" content={desc} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <nav className="container-custom flex items-center justify-between py-4 px-6">
            <Link href="/" className="text-2xl font-serif font-bold text-primary-700">
              尊茗茶业
            </Link>
            <Link href="/products" className="btn-secondary">
              {locale === 'zh' ? '返回' : locale === 'en' ? 'Back' : '戻る'}
            </Link>
          </nav>
        </header>

        {/* Product Content */}
        <main className="section-padding">
          <div className="container-custom max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div>
                <h1 className="text-4xl font-bold mb-6 text-primary-800">{name}</h1>
                <div className="prose prose-lg">
                  <p className="text-gray-700">{desc}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await axios.get(`${API_URL}/content/products/ids`);
    const { ids } = response.data;

    const paths = ids.flatMap((id: string) =>
      ['zh', 'en', 'ja'].map((locale) => ({
        params: { id },
        locale,
      }))
    );

    return { paths, fallback: 'blocking' };
  } catch (error) {
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const response = await axios.get(`${API_URL}/content/products/${params?.id}`);
    
    return {
      props: {
        product: response.data,
      },
      revalidate: 60,
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};
