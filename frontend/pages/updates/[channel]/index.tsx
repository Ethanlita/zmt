import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPathsResult } from 'next';
import Layout from '../../../components/Layout';
import { FooterSettings, NavigationNode, loadSiteChrome } from '../../../lib/siteConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface UpdateListItem {
  update_id: string;
  channel: string;
  title?: string;
  summary?: string;
  publishedAt?: string;
  coverImage?: string;
}

interface UpdatesPageProps {
  channel: string;
  items: UpdateListItem[];
  initialNavigation: NavigationNode[];
  initialFooter: FooterSettings;
}

export default function UpdatesChannelPage({ channel, items, initialFooter, initialNavigation }: UpdatesPageProps) {
  return (
    <Layout initialFooter={initialFooter} initialNavigation={initialNavigation}>
      <Head>
        <title>{`频道：${channel} - 尊茗茶业`}</title>
      </Head>
      <section
        className="py-16 bg-cream-50"
        style={{ minHeight: 'calc(100vh - var(--header-height, 88px) - var(--footer-height, 160px))' }}
      >
        <div className="container mx-auto max-w-5xl px-6">
          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-500">该频道暂无动态</div>
          ) : (
            <div className="space-y-8">
              {items.map((item) => (
                <article key={item.update_id} className="bg-white rounded-xl shadow-card overflow-hidden">
                  {item.coverImage && (
                    <div className="aspect-[16/7] overflow-hidden">
                      <img src={item.coverImage} alt={item.title || item.update_id} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6 space-y-4">
                    <div className="text-xs uppercase tracking-wide text-primary-500">{channel}</div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">
                      <Link href={`/updates/${channel}/${item.update_id}/`} className="hover:text-primary-600">
                        {item.title || item.update_id}
                      </Link>
                    </h2>
                    {item.summary && <p className="text-gray-600">{item.summary}</p>}
                    <div className="text-sm text-gray-500">
                      {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '待发布'}
                    </div>
                    <div>
                      <Link
                        href={`/updates/${channel}/${item.update_id}/`}
                        className="inline-flex items-center gap-2 text-primary-600 font-medium"
                      >
                        查看详情 →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  try {
    const response = await fetch(`${API_URL}/content/updates/channels`);
    if (!response.ok) {
      throw new Error(`Failed to fetch channels: ${response.status}`);
    }
    const data = await response.json();
    const channels: string[] = Array.isArray(data?.channels) ? data.channels : [];
    const paths = channels.map((channel) => ({ params: { channel } }));
    return { paths, fallback: false };
  } catch (error) {
    console.warn('Failed to generate dynamic update channels:', error);
    return { paths: [], fallback: false };
  }
}

export async function getStaticProps({ params }: { params: { channel: string } }) {
  const channel = params?.channel;
  if (!channel) {
    return { notFound: true };
  }

  try {
    const [chrome, updatesRes] = await Promise.all([
      loadSiteChrome(),
      fetch(`${API_URL}/content/updates?channel=${channel}`),
    ]);

    if (!updatesRes.ok) {
      throw new Error(`Failed to load updates for ${channel}`);
    }

    const updatesPayload = await updatesRes.json();
    const items = (updatesPayload?.items || []).map((item: any) => ({
      update_id: item.update_id,
      channel: item.channel,
      title: item.title_zh || item.title_en || item.title_ja,
      summary: (item.summary_zh || item.summary_en || item.summary_ja || '').replace(/<[^>]+>/g, '').slice(0, 160),
      coverImage: item.coverImage,
      publishedAt: item.publishedAt,
    }));

    return {
      props: {
        channel,
        items,
        initialNavigation: chrome.navigation,
        initialFooter: chrome.footer,
      },
    };
  } catch (error) {
    console.warn(`Failed to load updates for channel ${channel}:`, error);
    return { notFound: true };
  }
}
