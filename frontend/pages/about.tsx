import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { translations } from '../lib/translations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

interface PageData {
  title: string;
  content: string;
}

export default function About() {
  const { locale } = useI18n();
  const t = translations[locale].about;
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const response = await axios.get(`${API_URL}/content/pages/about-us`);
        const data = response.data;

        setPageData({
          title: data[`title_${locale}`] || data.title_zh || t.title,
          content: data[`content_${locale}`] || data.content_zh || t.content,
        });
      } catch (error) {
        console.error('Error fetching about page:', error);
        // Use fallback content
        setPageData({
          title: t.title,
          content: t.content,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [locale, t]);

  return (
    <Layout>
      <Head>
        <title>{pageData?.title || t.title} - 尊茗茶业</title>
        <meta name="description" content={pageData?.title || t.title} />
      </Head>

      {loading ? (
        <div className="py-32 text-center">
          <p className="text-gray-600 text-xl">
            {locale === 'zh' ? '加载中...' : locale === 'en' ? 'Loading...' : '読み込み中...'}
          </p>
        </div>
      ) : (
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto max-w-4xl px-6">
            <h1 className="text-5xl font-bold mb-8 text-center text-primary-800">
              {pageData?.title || t.title}
            </h1>
            <div 
              className="prose prose-lg max-w-none prose-headings:text-primary-800 prose-a:text-primary-600"
              dangerouslySetInnerHTML={{ __html: pageData?.content || `<p>${t.content}</p>` }}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
