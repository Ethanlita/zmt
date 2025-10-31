import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';
import { API_URL, fetchNavigation, NavigationNode } from '../../lib/siteConfig';

interface PageSummary {
  page_slug: string;
  title?: string;
  content?: string;
  navigationParentId?: string;
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

const SectionView = () => {
  const router = useRouter();
  const { locale } = useI18n();
  const { slug } = router.query;
  const [section, setSection] = useState<NavigationNode | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallback = useMemo(() => translations[locale]?.home.products ?? translations['zh'].home.products, [locale]);

  useEffect(() => {
    const slugValue = Array.isArray(slug) ? slug[slug.length - 1] : slug;
    if (!slugValue) return;

    const loadSection = async () => {
      setLoading(true);
      setError(null);
      try {
        const navigation = await fetchNavigation();
        const target = findSectionBySlug(navigation, slugValue);
        if (!target) {
          setError('未找到对应栏目');
          setSection(null);
          setPages([]);
          return;
        }
        setSection(target);

        const response = await axios.get(`${API_URL}/content/pages`, {
          params: { lang: locale, parentId: target.id },
        });
        const items = response.data.items || [];
        setPages(items.map((item: any) => ({
          page_slug: item.page_slug,
          title: item.title || item.title_zh,
          content: item.content || item.content_zh,
          navigationParentId: item.navigationParentId,
        })));
      } catch (err) {
        console.error('加载栏目失败', err);
        setError('栏目内容加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadSection();
  }, [slug, locale]);

  const title = section ? resolveLabel(section, locale) : fallback?.title || '栏目';

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
        <section className="py-16 bg-cream-50">
          <div className="container mx-auto max-w-5xl px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-primary-800">{title}</h1>
            </div>

            {pages.length === 0 ? (
              <p className="text-center text-gray-500">暂无内容</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {pages.map((page) => (
                  <article key={page.page_slug} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                    <h2 className="text-2xl font-semibold text-primary-700 mb-3">{page.title}</h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {stripHtml(page.content || '').slice(0, 160)}
                    </p>
                    <Link
                      href={`/pages/${page.page_slug}`}
                      className="inline-flex items-center text-primary-600 hover:text-primary-700"
                    >
                      {locale === 'zh' ? '查看详情' : locale === 'en' ? 'Read more' : '詳しく見る'}
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </Layout>
  );
};

export default SectionView;

function findSectionBySlug(nodes: NavigationNode[], slug: string): NavigationNode | null {
  for (const node of nodes) {
    if (node.type === 'section' && (node.slug === slug || node.id === slug)) {
      return node;
    }
    if (node.children?.length) {
      const found = findSectionBySlug(node.children, slug);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function resolveLabel(node: NavigationNode, locale: string): string {
  const title = node.title || {};
  return title[locale] || title.zh || title.en || title.ja || node.slug || node.id;
}
