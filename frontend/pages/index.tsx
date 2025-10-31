import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetStaticProps } from 'next';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

const translations = {
  zh: {
    title: '尊茗茶业 - 品质茶叶出口商',
    description: '专注于高品质茶叶的出口，将中国传统茶文化传播至全球',
    hero: {
      title: '传承千年茶文化',
      subtitle: '品质源于匠心，香气传遍世界',
      cta: '了解我们',
    },
    about: {
      title: '关于我们',
      content: '尊茗茶业致力于为全球客户提供最优质的中国茶叶',
    },
    products: {
      title: '特色产品',
      viewAll: '查看所有产品',
    },
  },
  en: {
    title: 'Zunming Tea - Premium Tea Exporter',
    description: 'Dedicated to exporting high-quality tea and spreading traditional Chinese tea culture worldwide',
    hero: {
      title: 'Inheriting Millennia of Tea Culture',
      subtitle: 'Quality from Craftsmanship, Aroma Across the World',
      cta: 'Learn More',
    },
    about: {
      title: 'About Us',
      content: 'Zunming Tea is committed to providing the finest Chinese tea to customers worldwide',
    },
    products: {
      title: 'Featured Products',
      viewAll: 'View All Products',
    },
  },
  ja: {
    title: '尊茗茶業 - プレミアム茶輸出業者',
    description: '高品質な茶の輸出に専念し、伝統的な中国茶文化を世界中に広める',
    hero: {
      title: '千年の茶文化を継承',
      subtitle: '職人技から生まれる品質、世界に広がる香り',
      cta: '詳しく見る',
    },
    about: {
      title: '私たちについて',
      content: '尊茗茶業は、世界中のお客様に最高品質の中国茶を提供することに専念しています',
    },
    products: {
      title: '特選商品',
      viewAll: 'すべての商品を見る',
    },
  },
};

interface HomeProps {
  featuredProducts: any[];
}

export default function Home({ featuredProducts }: HomeProps) {
  const router = useRouter();
  const { locale = 'zh' } = router;
  const t = translations[locale as keyof typeof translations];

  return (
    <>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.description} />
        <meta property="og:title" content={t.title} />
        <meta property="og:description" content={t.description} />
      </Head>

      <div className="min-h-screen">
        {/* Header */}
        <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
          <nav className="container-custom flex items-center justify-between py-4 px-6">
            <Link href="/" className="text-2xl font-serif font-bold text-primary-700">
              尊茗茶业
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/about" className="hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '关于我们' : locale === 'en' ? 'About' : '私たちについて'}
              </Link>
              <Link href="/products" className="hover:text-primary-600 transition-colors">
                {locale === 'zh' ? '产品' : locale === 'en' ? 'Products' : '商品'}
              </Link>
              
              {/* Language Switcher */}
              <div className="flex gap-2">
                <Link href={router.asPath} locale="zh" className={`px-2 py-1 rounded ${locale === 'zh' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}>
                  中
                </Link>
                <Link href={router.asPath} locale="en" className={`px-2 py-1 rounded ${locale === 'en' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}>
                  EN
                </Link>
                <Link href={router.asPath} locale="ja" className={`px-2 py-1 rounded ${locale === 'ja' ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}>
                  日
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="hero-section bg-gradient-to-b from-primary-800 to-primary-600 mt-16">
          <div className="container-custom text-center z-10">
            <h1 className="text-hero font-bold mb-6 text-balance">
              {t.hero.title}
            </h1>
            <p className="text-2xl mb-8 text-cream-50">
              {t.hero.subtitle}
            </p>
            <Link href="/about" className="btn-primary inline-block">
              {t.hero.cta}
            </Link>
          </div>
        </section>

        {/* About Section */}
        <section className="section-padding bg-cream-50">
          <div className="container-custom text-center">
            <h2 className="text-display font-bold mb-6 text-primary-800">
              {t.about.title}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {t.about.content}
            </p>
          </div>
        </section>

        {/* Featured Products */}
        <section className="section-padding">
          <div className="container-custom">
            <h2 className="text-display font-bold mb-12 text-center text-primary-800">
              {t.products.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.slice(0, 3).map((product) => (
                <Link href={`/products/${product.product_id}`} key={product.product_id}>
                  <div className="card overflow-hidden cursor-pointer">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                      <p className="text-gray-600">{product.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/products" className="btn-secondary">
                {t.products.viewAll}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary-900 text-white py-12">
          <div className="container-custom text-center">
            <p className="text-lg font-serif mb-4">尊茗茶业</p>
            <p className="text-cream-100">© 2025 Zunming Tea. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

// Static export - no ISR support
export const getStaticProps: GetStaticProps = async () => {
  // Return static placeholder data
  // Products will be loaded client-side
  return {
    props: {
      featuredProducts: [],
    },
  };
};
