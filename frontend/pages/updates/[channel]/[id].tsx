import Head from 'next/head';
import { GetStaticPathsResult } from 'next';
import Layout from '../../../components/Layout';
import { FooterSettings, NavigationNode, loadSiteChrome } from '../../../lib/siteConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface UpdateDetailProps {
  channel: string;
  updateId: string;
  data: {
    publishedAt?: string;
    coverImage?: string;
    title_zh?: string;
    content_zh?: string;
    title_en?: string;
    content_en?: string;
    title_ja?: string;
    content_ja?: string;
  };
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
}

export default function UpdateDetail({ channel, updateId, data, initialFooter, initialNavigation }: UpdateDetailProps) {
  const title = data.title_zh || data.title_en || data.title_ja || updateId;
  const content = data.content_zh || data.content_en || data.content_ja || '<p>暂无内容</p>';
  const published = data.publishedAt ? new Date(data.publishedAt).toLocaleString() : '待发布';

  return (
    <Layout initialFooter={initialFooter} initialNavigation={initialNavigation}>
      <Head>
        <title>{`${title} - ${channel} 频道`}</title>
      </Head>
      <article className="bg-cream-50 py-16">
        <div className="container mx-auto max-w-4xl px-6 space-y-6">
          <div className="text-sm text-primary-600 uppercase tracking-wide">
            动态频道 / {channel}
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900">{title}</h1>
          <div className="text-gray-500 text-sm">{published}</div>
          {data.coverImage && (
            <div className="aspect-[16/7] overflow-hidden rounded-xl shadow-card">
              <img src={data.coverImage} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="prose prose-lg max-w-none prose-headings:text-primary-800 prose-a:text-primary-600">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      </article>
    </Layout>
  );
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  try {
    const response = await fetch(`${API_URL}/content/updates/ids`);
    if (!response.ok) {
      throw new Error(`Failed to fetch update ids: ${response.status}`);
    }
    const data = await response.json();
    const items = data?.items || [];
    const paths = items.map((item: any) => ({
      params: { channel: item.channel, id: item.update_id },
    }));
    return { paths, fallback: false };
  } catch (error) {
    console.warn('Failed to generate update detail paths:', error);
    return { paths: [], fallback: false };
  }
}

export async function getStaticProps({ params }: { params: { channel: string; id: string } }) {
  const channel = params?.channel;
  const id = params?.id;
  if (!channel || !id) {
    return { notFound: true };
  }

  try {
    const [chrome, updateRes] = await Promise.all([
      loadSiteChrome(),
      fetch(`${API_URL}/content/updates/${id}`),
    ]);

    if (!updateRes.ok) {
      return { notFound: true };
    }

    const data = await updateRes.json();
    return {
      props: {
        channel,
        updateId: id,
        data,
        initialNavigation: chrome.navigation,
        initialFooter: chrome.footer,
      },
    };
  } catch (error) {
    console.warn(`Failed to load update ${id}:`, error);
    return { notFound: true };
  }
}
