import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';
import { API_URL } from '../../lib/siteConfig';

interface PageResponse {
  [key: string]: any;
  page_slug: string;
  navigationParentId?: string;
  updatedAt?: string;
}

const PageView = () => {
  const router = useRouter();
  const { locale } = useI18n();
  const { slug } = router.query;
  const [pageData, setPageData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallback = useMemo(() => translations[locale]?.about ?? translations['zh'].about, [locale]);

  useEffect(() => {
    const slugValue = Array.isArray(slug) ? slug[slug.length - 1] : slug;
    if (!slugValue) return;

    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/content/pages/${slugValue}`);
        setPageData(response.data);
      } catch (err) {
        console.error('Failed to load page', err);
        setError('页面暂时无法访问');
        setPageData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  const title = pageData?.[`title_${locale}`] || pageData?.title_zh || fallback?.title || 'Zunming Tea';
  const content = pageData?.[`content_${locale}`] || pageData?.content_zh || `<p>${fallback?.content || ''}</p>`;

  return (
    <Layout>
      <Head>
        <title>{title} - 尊茗茶业</title>
        <meta name="description" content={title} />
      </Head>

      {loading ? (
        <div className="py-32 text-center">
          <p className="text-gray-600 text-xl">
            {locale === 'zh' ? '加载中...' : locale === 'en' ? 'Loading...' : '読み込み中...'}
          </p>
        </div>
      ) : error ? (
        <div className="py-32 text-center">
          <p className="text-gray-600 text-xl">{error}</p>
        </div>
      ) : (
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto max-w-4xl px-6">
            <h1 className="text-5xl font-bold mb-8 text-center text-primary-800">{title}</h1>
            <div
              className="prose prose-lg max-w-none prose-headings:text-primary-800 prose-a:text-primary-600"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PageView;
