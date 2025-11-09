import Link from 'next/link';
import Image from 'next/image';
import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { translations } from '../lib/translations';
import {
  fetchSiteSettings,
  fetchNavigation,
  DEFAULT_FOOTER,
  DEFAULT_NAVIGATION,
  FooterSettings,
  NavigationNode,
} from '../lib/siteConfig';

interface LayoutProps {
  children: ReactNode;
  initialNavigation?: NavigationNode[];
  initialFooter?: FooterSettings;
}

const mergeFooterSettings = (footer?: FooterSettings): FooterSettings => {
  const merged: FooterSettings = { ...DEFAULT_FOOTER };
  if (!footer) {
    return merged;
  }

  Object.entries(footer).forEach(([locale, value]) => {
    if (!value) return;
    const base = DEFAULT_FOOTER[locale] || DEFAULT_FOOTER.zh;
    merged[locale] = {
      ...base,
      ...value,
      links: Array.isArray(value.links)
        ? value.links.filter((link) => link && link.label && link.url)
        : base.links,
    };
  });

  return merged;
};

export default function Layout({ children, initialNavigation, initialFooter }: LayoutProps) {
  const { locale, setLocale } = useI18n();
  const t = translations[locale];
  const [navigation, setNavigation] = useState<NavigationNode[]>(initialNavigation ?? DEFAULT_NAVIGATION);
  const [footerConfig, setFooterConfig] = useState<FooterSettings>(mergeFooterSettings(initialFooter));
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [headerOpacity, setHeaderOpacity] = useState(0.8);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(88);
  const footerRef = useRef<HTMLElement | null>(null);
  const [footerHeight, setFooterHeight] = useState(160);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // 在前50px内从80%透明度快速升到100%
      const opacity = scrollY <= 50 ? 0.8 + (scrollY / 50) * 0.2 : 1;
      setHeaderOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const measureChrome = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
      if (footerRef.current) {
        setFooterHeight(footerRef.current.getBoundingClientRect().height);
      }
    };
    measureChrome();
    window.addEventListener('resize', measureChrome);
    return () => window.removeEventListener('resize', measureChrome);
  }, []);

  useEffect(() => {
    if (initialNavigation) {
      setNavigation(initialNavigation);
    }
  }, [initialNavigation]);

  useEffect(() => {
    if (initialFooter) {
      setFooterConfig(mergeFooterSettings(initialFooter));
    }
  }, [initialFooter]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [navTree, siteSettings] = await Promise.all([fetchNavigation(), fetchSiteSettings()]);
        if (!isMounted) return;
        setNavigation(navTree.length ? navTree : DEFAULT_NAVIGATION);
        setFooterConfig(mergeFooterSettings(siteSettings.footer));
      } catch (error) {
        console.error('Failed to refresh site chrome', error);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const cancelHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMenuEnter = (id: string) => {
    cancelHoverTimeout();
    setHoveredNav(id);
  };

  const handleMenuLeave = () => {
    cancelHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredNav(null);
      hoverTimeoutRef.current = null;
    }, 200);
  };

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => item.visible !== false),
    [navigation],
  );

  const footerLocale = useMemo(
    () => footerConfig[locale] || footerConfig.zh || DEFAULT_FOOTER.zh,
    [footerConfig, locale],
  );
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const filteredLinks = useMemo(
    () =>
      (footerLocale?.links || []).filter(
        (link) => link && link.label && link.url,
      ),
    [footerLocale?.links],
  );

  useEffect(() => {
    if (footerRef.current) {
      setFooterHeight(footerRef.current.getBoundingClientRect().height);
    }
  }, [footerLocale, filteredLinks.length]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={
        {
          '--header-height': `${headerHeight}px`,
          '--footer-height': `${footerHeight}px`,
        } as CSSProperties
      }
    >
      {/* Header */}
      <header 
        ref={headerRef}
        className="fixed top-0 w-full backdrop-blur-sm shadow-sm z-50 transition-colors duration-300"
        style={{
          backgroundColor: `rgba(255, 255, 255, ${0.95 * headerOpacity})`,
        }}
      >
        <nav className="container mx-auto max-w-7xl flex items-center justify-between py-4 px-6">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.png" 
              alt="尊茗茶业" 
              width={187.5} 
              height={36}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {visibleNavigation.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                locale={locale}
                hoveredNav={hoveredNav}
                onMenuEnter={handleMenuEnter}
                onMenuLeave={handleMenuLeave}
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 md:hidden overflow-y-auto">
            <div className="p-6">
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Language Switcher */}
              <div className="mb-6 pt-8">
                <p className="text-xs text-gray-500 mb-2">语言 / Language</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setLocale('zh');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                      locale === 'zh' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => {
                      setLocale('en');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                      locale === 'en' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => {
                      setLocale('ja');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                      locale === 'ja' 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    日本語
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {visibleNavigation.map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    locale={locale}
                    onClose={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main
        className="flex-1"
        style={{
          marginTop: headerHeight,
          minHeight: 'calc(100vh - var(--header-height, 88px) - var(--footer-height, 160px))',
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        ref={footerRef}
        className="text-white mt-auto"
        style={{
          backgroundImage: 'url(/f_bg.jpg)',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'top center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div className="container mx-auto max-w-7xl px-6 text-center space-y-2.5" style={{ paddingTop: '30px', paddingBottom: '24px' }}>
          {footerLocale?.headline?.trim() ? (
            <p className="text-lg font-serif font-semibold tracking-wide text-white">
              {footerLocale.headline.trim()}
            </p>
          ) : null}

          {footerLocale?.description?.trim() ? (
            <p className="text-white text-sm whitespace-pre-line leading-relaxed max-w-3xl mx-auto">
              {footerLocale.description.trim()}
            </p>
          ) : null}

          {filteredLinks.length ? (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs md:text-sm text-white/90">
              {filteredLinks.map((link) => (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}

          {footerLocale?.legal?.trim() ? (
            <p className="text-white/80 text-xs whitespace-pre-line">
              {footerLocale.legal.trim()}
            </p>
          ) : (
            <p className="text-white/80 text-xs">
              © {currentYear} Zunming Tea.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

interface NavItemProps {
  item: NavigationNode;
  locale: string;
  hoveredNav: string | null;
  onMenuEnter: (id: string) => void;
  onMenuLeave: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, locale, hoveredNav, onMenuEnter, onMenuLeave }) => {
  const label = resolveLabel(item, locale);
  const path = resolvePath(item);
  const isExternal = item.type === 'link' && /^https?:\/\//.test(path);
  const showDropdown = item.type === 'section' && item.children && item.children.some((child) => child.visible !== false);

  const handleMouseEnter = () => {
    if (showDropdown) {
      onMenuEnter(item.id);
    }
  };

  const handleMouseLeave = () => {
    if (showDropdown) {
      onMenuLeave();
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
        <div
          className="absolute left-0 mt-3 w-64 bg-white shadow-lg rounded-lg border border-gray-100 pt-4 pb-5"
          onMouseEnter={() => onMenuEnter(item.id)}
          onMouseLeave={onMenuLeave}
        >
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

interface MobileNavItemProps {
  item: NavigationNode;
  locale: string;
  onClose: () => void;
}

const MobileNavItem: React.FC<MobileNavItemProps> = ({ item, locale, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const label = resolveLabel(item, locale);
  const path = resolvePath(item);
  const isExternal = item.type === 'link' && /^https?:\/\//.test(path);
  const hasChildren = item.type === 'section' && item.children && item.children.some((child) => child.visible !== false);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <span className="font-medium">{label}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!
              .filter((child) => child.visible !== false)
              .map((child) => {
                const childLabel = resolveLabel(child, locale);
                const childPath = resolvePath(child, item);
                const childExternal = child.type === 'link' && /^https?:\/\//.test(childPath);
                return (
                  <div key={child.id}>
                    {childExternal ? (
                      <a
                        href={childPath}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={onClose}
                      >
                        {childLabel}
                      </a>
                    ) : (
                      <Link
                        href={childPath}
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
                        onClick={onClose}
                      >
                        {childLabel}
                      </Link>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {isExternal ? (
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
          onClick={onClose}
        >
          {label}
        </a>
      ) : (
        <Link
          href={path}
          className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
          onClick={onClose}
        >
          {label}
        </Link>
      )}
    </div>
  );
};

function resolveLabel(item: NavigationNode, locale: string): string {
  const title = item.title || {};
  return title[locale] || title.zh || title.en || title.ja || item.slug || '栏目';
}

const ensureTrailingSlash = (path: string) => {
  if (!path || path === '/') {
    return path || '/';
  }
  return path.endsWith('/') ? path : `${path}/`;
};

const formatInternalPath = (path: string) => {
  if (!path) return '#';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return ensureTrailingSlash(path);
};

function resolvePath(item: NavigationNode, parent?: NavigationNode): string {
  if (item.customPath) {
    return formatInternalPath(item.customPath);
  }
  if (item.type === 'page' && item.pageSlug) {
    return ensureTrailingSlash(`/pages/${item.pageSlug}`);
  }
  if (item.type === 'section') {
    return ensureTrailingSlash(`/sections/${item.slug || item.id}`);
  }
  if (item.type === 'dynamic' && item.channel) {
    return ensureTrailingSlash(`/updates/${item.channel}`);
  }
  if (item.type === 'link' && item.externalUrl) {
    return item.externalUrl;
  }
  if (parent?.type === 'section' && item.type === 'page' && item.pageSlug) {
    return ensureTrailingSlash(`/pages/${item.pageSlug}`);
  }
  return '#';
}
