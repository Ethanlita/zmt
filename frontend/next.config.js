/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  // Note: i18n is not supported with static export
  // We'll handle internationalization client-side
  // Base path and asset prefix for GitHub Pages
  basePath: '',
  assetPrefix: '',
  trailingSlash: true,
};

module.exports = nextConfig;
