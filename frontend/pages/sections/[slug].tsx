import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import Layout from '../../components/Layout';
import { useI18n } from '../../lib/i18n';
import { translations } from '../../lib/translations';
import {
  API_URL,
  NavigationNode,
  loadSiteChrome,
  fetchNavigation,
  FooterSettings,
} from '../../lib/siteConfig';

interface PageRecord {
  page_slug: string;
  navigationParentId?: string;
  [key: string]: any;
}

interface SectionPageProps {
  section: NavigationNode | null;
  pages: PageRecord[];
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

const SectionView = ({ section, pages, initialNavigation, initialFooter }: SectionPageProps) => {
  const { locale } = useI18n();
  const fallback = translations[locale]?.home.products ?? translations['zh'].home.products;

  const title = section ? resolveLabel(section, locale) : fallback?.title || '栏目';

  const localizedPages = useMemo(() => {
    return pages.map((item) => ({
      page_slug: item.page_slug,
      title:
        item[`title_${locale}`] ||
        item.title ||
        item.title_zh ||
        item.title_en ||
        item.title_ja ||
        item.page_slug,
      content:
        item[`content_${locale}`] ||
        item.content ||
        item.content_zh ||
        item.content_en ||
        item.content_ja ||
        '',
    }));
  }, [pages, locale]);

  return (
    <Layout initialNavigation={initialNavigation} initialFooter={initialFooter}>
      <Head>
        <title>{title} - 尊茗茶业</title>
        <meta name="description" content={title} />
      </Head>

      <section className="py-16 bg-cream-50">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-800">{title}</h1>
          </div>

          {!section ? (
            <p className="text-center text-gray-500">未找到对应栏目</p>
          ) : localizedPages.length === 0 ? (
            <p className="text-center text-gray-500">暂无内容</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {localizedPages.map((page) => (
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

export async function getStaticPaths() {
  try {
    const navigation = await fetchNavigation();
    const sections = collectSections(navigation);

    const paths = sections
      .filter((section) => section.slug)
      .map((section) => ({ params: { slug: section.slug as string } }));

    return {
      paths,
      fallback: false,
    };
  } catch (error) {
    console.warn('Failed to generate static paths for sections:', error);
    return {
      paths: [],
      fallback: false,
    };
  }
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const slug = params?.slug;

  try {
    const { navigation, footer } = await loadSiteChrome();
    const section = findSectionBySlug(navigation, slug);

    let pages: PageRecord[] = [];

    if (section?.id) {
      const response = await fetch(`${API_URL}/content/pages?parentId=${section.id}`);
      if (response.ok) {
        const data = await response.json();
        pages = Array.isArray(data?.items) ? data.items : [];
      }
    }

    return {
      props: {
        section: section ? JSON.parse(JSON.stringify(section)) : null,
        pages,
        initialNavigation: navigation,
        initialFooter: footer,
      },
    };
  } catch (error) {
    console.warn(`Failed to fetch section ${slug} during build:`, error);
    return {
      notFound: true,
    };
  }
}

function collectSections(nodes: NavigationNode[]): NavigationNode[] {
  const result: NavigationNode[] = [];

  for (const node of nodes) {
    if (node.type === 'section' && (node.slug || node.id)) {
      result.push(node);
    }
    if (node.children?.length) {
      result.push(...collectSections(node.children));
    }
  }

  return result;
}
