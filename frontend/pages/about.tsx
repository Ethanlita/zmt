import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetStaticProps } from 'next';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

const translations = {
  zh: {
    title: '关于我们 - 尊茗茶业',
    back: '返回首页',
  },
  en: {
    title: 'About Us - Zunming Tea',
    back: 'Back to Home',
  },
  ja: {
    title: '私たちについて - 尊茗茶業',
    back: 'ホームに戻る',
  },
};

interface AboutProps {
  pageData: {
    title: string;
    content: string;
  };
}

export default function About({ pageData }: AboutProps) {
  const router = useRouter();
  const { locale = 'zh' } = router;
  const t = translations[locale as keyof typeof translations];

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={pageData.title} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
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

        {/* Content */}
        <main className="section-padding">
          <div className="container-custom max-w-4xl">
            <h1 className="text-display font-bold mb-8 text-center text-primary-800">
              {pageData.title}
            </h1>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-primary-900 text-white py-12 mt-16">
          <div className="container-custom text-center">
            <p className="text-lg font-serif mb-4">尊茗茶业</p>
            <p className="text-cream-100">© 2025 Zunming Tea. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  try {
    const response = await axios.get(`${API_URL}/content/pages/about-us`);
    const data = response.data;

    const pageData = {
      title: data[`title_${locale}`] || data.title_zh || 'About Us',
      content: data[`content_${locale}`] || data.content_zh || '',
    };

    return {
      props: {
        pageData,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Error fetching about page:', error);
    return {
      props: {
        pageData: {
          title: 'About Us',
          content: '<p>Loading...</p>',
        },
      },
    };
  }
};
