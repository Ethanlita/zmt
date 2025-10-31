/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  // i18n configuration
  i18n: {
    locales: ['zh', 'en', 'ja'],
    defaultLocale: 'zh',
    localeDetection: true,
  },
  // Base path and asset prefix for GitHub Pages
  basePath: '',
  assetPrefix: '',
  trailingSlash: true,
};

module.exports = nextConfig;
