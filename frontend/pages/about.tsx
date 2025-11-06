import Head from 'next/head';
import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { translations } from '../lib/translations';
import { FooterSettings, NavigationNode, loadSiteChrome } from '../lib/siteConfig';

interface PageResponse {
  [key: string]: any;
  page_slug?: string;
}

interface AboutProps {
  pageData: PageResponse | null;
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

export default function About({ pageData, initialNavigation, initialFooter }: AboutProps) {
  const { locale } = useI18n();
  const t = translations[locale].about;

  const title = pageData?.[`title_${locale}`] || pageData?.title_zh || t.title;
  const content = pageData?.[`content_${locale}`] || pageData?.content_zh || `<p>${t.content}</p>`;

  return (
    <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      <Head>
        <title>{title} - 尊茗茶业</title>
        <meta name="description" content={title} />
      </Head>

      <div className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-4xl px-6">
          <h1 className="text-5xl font-bold mb-8 text-center text-primary-800">
            {title}
          </h1>
          <div
            className="prose prose-lg max-w-none prose-headings:text-primary-800 prose-a:text-primary-600"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const response = await fetch(`${API_URL}/public/pages/about-us`);
    if (!response.ok) {
      throw new Error(`Failed to fetch about-us page: ${response.status}`);
    }
    const data = await response.json();
    const { navigation, footer } = await loadSiteChrome();

    return {
      props: {
        pageData: data,
        initialNavigation: navigation,
        initialFooter: footer,
      },
    };
  } catch (error) {
    console.warn('Failed to load about-us content during build:', error);
    const { navigation, footer } = await loadSiteChrome();
    return {
      props: {
        pageData: null,
        initialNavigation: navigation,
        initialFooter: footer,
      },
    };
  }
}
