import axios from 'axios';
import { translations } from './translations';

export type SupportedLocale = 'zh' | 'en' | 'ja';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';

export type NavigationNode = {
  id: string;
  title?: Record<string, string>;
  type: 'section' | 'page' | 'link' | 'dynamic';
  slug?: string;
  order?: number;
  visible?: boolean;
  pageSlug?: string;
  customPath?: string;
  externalUrl?: string;
  channel?: string;
  children?: NavigationNode[];
};

export type FooterLocale = {
  headline: string;
  description: string;
  legal: string;
  links: { label: string; url: string }[];
};

export type FooterSettings = Record<string, FooterLocale>;

export type LocalizedRichText = {
  title: string;
  content: string;
};

export type HomeAboutContent = Record<SupportedLocale, LocalizedRichText>;

const SUPPORTED_LOCALES: SupportedLocale[] = ['zh', 'en', 'ja'];

const wrapDefaultParagraph = (text: string) => (text ? `<p>${text}</p>` : '');

export const DEFAULT_HOME_ABOUT: HomeAboutContent = {
  zh: {
    title: translations.zh.home.about.title,
    content: wrapDefaultParagraph(translations.zh.home.about.content),
  },
  en: {
    title: translations.en.home.about.title,
    content: wrapDefaultParagraph(translations.en.home.about.content),
  },
  ja: {
    title: translations.ja.home.about.title,
    content: wrapDefaultParagraph(translations.ja.home.about.content),
  },
};

export const DEFAULT_NAVIGATION: NavigationNode[] = [
  {
    id: 'about',
    type: 'page',
    slug: 'about',
    pageSlug: 'about-us',
    customPath: '/about',
    visible: true,
    title: {
      zh: '关于我们',
      en: 'About',
      ja: '会社概要',
    },
  },
  {
    id: 'products',
    type: 'page',
    slug: 'products',
    pageSlug: 'products',
    customPath: '/products',
    visible: true,
    title: {
      zh: '产品中心',
      en: 'Products',
      ja: '製品',
    },
  },
];

export const DEFAULT_FOOTER: FooterSettings = {
  zh: {
    headline: '尊茗茶业',
    description: '源自云南古树的高山好茶。',
    legal: '© 2025 尊茗茶业有限公司｜滇ICP备00000000号',
    links: [{ label: '联系我们', url: 'mailto:info@zunmingtea.com' }],
  },
  en: {
    headline: 'Zunming Tea',
    description: 'Finest teas crafted from century-old trees in Yunnan.',
    legal: '© 2025 Zunming Tea. All rights reserved.',
    links: [{ label: 'Contact', url: 'mailto:info@zunmingtea.com' }],
  },
  ja: {
    headline: '尊茗茶業',
    description: '雲南の古樹から生まれた高山茶です。',
    legal: '© 2025 尊茗茶業株式会社｜すべての権利を保有します。',
    links: [{ label: 'お問い合わせ', url: 'mailto:info@zunmingtea.com' }],
  },
};

export async function fetchNavigation(): Promise<NavigationNode[]> {
  try {
    const response = await axios.get(`${API_URL}/navigation`);
    return response.data.tree || DEFAULT_NAVIGATION;
  } catch (error) {
    console.error('Failed to load navigation', error);
    return DEFAULT_NAVIGATION;
  }
}

export async function fetchFooterSettings(): Promise<FooterSettings> {
  try {
    const response = await axios.get(`${API_URL}/settings/public`);
    return response.data.footer || DEFAULT_FOOTER;
  } catch (error) {
    console.error('Failed to load footer settings', error);
    return DEFAULT_FOOTER;
  }
}

export async function loadSiteChrome(): Promise<{ navigation: NavigationNode[]; footer: FooterSettings }> {
  try {
    const [navigation, footer] = await Promise.all([fetchNavigation(), fetchFooterSettings()]);

    const normalizedFooter: FooterSettings = { ...DEFAULT_FOOTER };
    Object.entries(footer || {}).forEach(([locale, value]) => {
      if (!value) return;
      const base = DEFAULT_FOOTER[locale] || DEFAULT_FOOTER.zh;
      normalizedFooter[locale] = {
        ...base,
        ...value,
        links: Array.isArray(value.links)
          ? value.links.filter((link) => link && link.label && link.url)
          : base.links,
      };
    });

    return {
      navigation: navigation.length ? navigation : DEFAULT_NAVIGATION,
      footer: normalizedFooter,
    };
  } catch (error) {
    console.error('Failed to load site chrome', error);
    return {
      navigation: DEFAULT_NAVIGATION,
      footer: DEFAULT_FOOTER,
    };
  }
}

export const normalizeHomeAbout = (data?: any): HomeAboutContent => {
  const normalized = {} as Record<SupportedLocale, LocalizedRichText>;

  SUPPORTED_LOCALES.forEach((locale) => {
    const titleKey = `title_${locale}`;
    const contentKey = `content_${locale}`;
    const rawTitle = typeof data?.[titleKey] === 'string' ? data[titleKey].trim() : '';
    const rawContent = typeof data?.[contentKey] === 'string' ? data[contentKey].trim() : '';

    normalized[locale] = {
      title: rawTitle || DEFAULT_HOME_ABOUT[locale].title,
      content: rawContent || DEFAULT_HOME_ABOUT[locale].content,
    };
  });

  return normalized;
};

export async function fetchHomeAbout(): Promise<HomeAboutContent> {
  try {
    const response = await axios.get(`${API_URL}/content/pages/home-about`);
    return normalizeHomeAbout(response.data);
  } catch (error) {
    console.error('Failed to load home about content', error);
    return DEFAULT_HOME_ABOUT;
  }
}
