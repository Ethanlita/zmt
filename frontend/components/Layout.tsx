import Link from 'next/link';
import { useI18n } from '../lib/i18n';
import { translations } from '../lib/translations';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { locale, setLocale } = useI18n();
  const t = translations[locale];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <nav className="container mx-auto max-w-7xl flex items-center justify-between py-4 px-6">
          <Link href="/" className="text-2xl font-serif font-bold text-primary-700 hover:text-primary-800 transition-colors">
            尊茗茶业
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              {t.nav.about}
            </Link>
            <Link 
              href="/products" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              {t.nav.products}
            </Link>
            
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
          <p className="text-lg font-serif mb-4">尊茗茶业</p>
          <p className="text-cream-100">
            © 2025 Zunming Tea. {t.footer.copyright}.
          </p>
        </div>
      </footer>
    </div>
  );
}
