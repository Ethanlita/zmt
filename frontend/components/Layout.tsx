import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { translations } from '../lib/translations';
import { fetchFooterSettings, fetchNavigation, DEFAULT_FOOTER, DEFAULT_NAVIGATION, FooterSettings, NavigationNode } from '../lib/siteConfig';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { locale, setLocale } = useI18n();
  const t = translations[locale];
  const [navigation, setNavigation] = useState<NavigationNode[]>(DEFAULT_NAVIGATION);
  const [footerConfig, setFooterConfig] = useState<FooterSettings>(DEFAULT_FOOTER);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [navTree, footer] = await Promise.all([fetchNavigation(), fetchFooterSettings()]);
      setNavigation(navTree);
      setFooterConfig({ ...DEFAULT_FOOTER, ...footer });
    };
    load();
  }, []);

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => item.visible !== false),
    [navigation],
  );

  const footerLocale = useMemo(() => footerConfig[locale] || DEFAULT_FOOTER[locale] || DEFAULT_FOOTER.zh, [footerConfig, locale]);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <nav className="container mx-auto max-w-7xl flex items-center justify-between py-4 px-6">
          <Link href="/" className="text-2xl font-serif font-bold text-primary-700 hover:text-primary-800 transition-colors">
            尊茗茶业
          </Link>

          <div className="flex items-center gap-6">
            {visibleNavigation.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                locale={locale}
                hoveredNav={hoveredNav}
                setHoveredNav={setHoveredNav}
              />
            ))}

            {/* Language Switcher */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setLocale('zh')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  locale === 'zh' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  locale === 'en' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('ja')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  locale === 'ja' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                日本語
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12 mt-auto">
        <div className="container mx-auto max-w-7xl px-6 text-center">
          <p className="text-lg font-serif mb-4">{footerLocale?.headline || '尊茗茶业'}</p>
          <p className="text-cream-100 whitespace-pre-line mb-6">
            {footerLocale?.description || ''}
          </p>
          {footerLocale?.links?.length ? (
            <div className="flex flex-wrap justify-center gap-4 text-sm text-cream-200">
              {footerLocale.links.map((link) => (
                <a key={link.label + link.url} href={link.url} target="_blank" rel="noreferrer" className="hover:text-white">
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
          <p className="text-cream-200 text-sm mt-6 whitespace-pre-line">
            {footerLocale?.legal || `© ${currentYear} Zunming Tea.`}
          </p>
        </div>
      </footer>
    </div>
  );
}

interface NavItemProps {
  item: NavigationNode;
  locale: string;
  hoveredNav: string | null;
  setHoveredNav: (id: string | null) => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, locale, hoveredNav, setHoveredNav }) => {
  const label = resolveLabel(item, locale);
  const path = resolvePath(item);
  const isExternal = item.type === 'link' && /^https?:\/\//.test(path);
  const showDropdown = item.type === 'section' && item.children && item.children.some((child) => child.visible !== false);

  const handleMouseEnter = () => {
    if (showDropdown) {
      setHoveredNav(item.id);
    }
  };

  const handleMouseLeave = () => {
    if (showDropdown) {
      setHoveredNav(null);
    }
  };

  const linkClass = 'text-gray-700 hover:text-primary-600 transition-colors font-medium';

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {isExternal ? (
        <a href={path} target="_blank" rel="noreferrer" className={linkClass}>
          {label}
        </a>
      ) : (
        <Link href={path} className={linkClass}>
          {label}
        </Link>
      )}
      {showDropdown && hoveredNav === item.id && (
        <div className="absolute left-0 mt-3 w-64 bg-white shadow-lg rounded-lg border border-gray-100 py-3">
          <ul className="flex flex-col">
            {item.children!
              .filter((child) => child.visible !== false)
              .map((child) => {
                const childLabel = resolveLabel(child, locale);
                const childPath = resolvePath(child, item);
                const childExternal = child.type === 'link' && /^https?:\/\//.test(childPath);
                return (
                  <li key={child.id} className="px-4 py-2 hover:bg-primary-50">
                    {childExternal ? (
                      <a href={childPath} target="_blank" rel="noreferrer" className="block text-sm text-gray-700">
                        {childLabel}
                      </a>
                    ) : (
                      <Link href={childPath} className="block text-sm text-gray-700">
                        {childLabel}
                      </Link>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
};

function resolveLabel(item: NavigationNode, locale: string): string {
  const title = item.title || {};
  return title[locale] || title.zh || title.en || title.ja || item.slug || '栏目';
}

function resolvePath(item: NavigationNode, parent?: NavigationNode): string {
  if (item.customPath) {
    return item.customPath;
  }
  if (item.type === 'page' && item.pageSlug) {
    return `/pages/${item.pageSlug}`;
  }
  if (item.type === 'section') {
    return `/sections/${item.slug || item.id}`;
  }
  if (item.type === 'link' && item.externalUrl) {
    return item.externalUrl;
  }
  if (parent?.type === 'section' && item.type === 'page' && item.pageSlug) {
    return `/pages/${item.pageSlug}`;
  }
  return '#';
}
