import Head from 'next/head';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';
import { API_URL, FooterSettings, NavigationNode, loadSiteChrome } from '../../lib/siteConfig';

interface PageResponse {
  [key: string]: any;
  page_slug: string;
  navigationParentId?: string;
  updatedAt?: string;
}

interface PageProps {
  pageData: PageResponse | null;
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
}

const PageView = ({ pageData, initialNavigation, initialFooter }: PageProps) => {
  const { locale } = useI18n();
  const fallback = translations[locale]?.about ?? translations['zh'].about;

  const title = pageData?.[`title_${locale}`] || pageData?.title_zh || fallback?.title || 'Zunming Tea';
  const content = pageData?.[`content_${locale}`] || pageData?.content_zh || `<p>${fallback?.content || ''}</p>`;

  return (
    <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      <Head>
        <title>{title} - 尊茗茶业</title>
        <meta name="description" content={title} />
      </Head>

      <div className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-4xl px-6">
          <h1 className="text-5xl font-bold mb-8 text-center text-primary-800">{title}</h1>
          <div
            className="prose prose-lg max-w-none prose-headings:text-primary-800 prose-a:text-primary-600"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default PageView;

export async function getStaticPaths() {
  try {
    const response = await fetch(`${API_URL}/content/pages/ids`);
    if (!response.ok) {
      throw new Error(`Failed to fetch page ids: ${response.status}`);
    }
    const data = await response.json();
    const ids: string[] = Array.isArray(data?.ids) ? data.ids : [];

    const paths = ids.map((id) => ({ params: { slug: id } }));

    return {
      paths,
      fallback: false,
    };
  } catch (error) {
    console.warn('Failed to generate static paths for pages:', error);
    return {
      paths: [],
      fallback: false,
    };
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const slug = params?.slug;

  try {
    const response = await fetch(`${API_URL}/public/pages/${slug}`);
    if (!response.ok) {
      return { notFound: true };
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
    console.warn(`Failed to fetch page ${slug} during build:`, error);
    return {
      notFound: true,
    };
  }
}
