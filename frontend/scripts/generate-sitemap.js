#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zunmingtea.com';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://new.zunmingtea.com').replace(/\/$/, '');

const ensurePath = (value) => {
  if (!value) return '/';
  if (value.startsWith('http')) {
    try {
      return new URL(value).pathname || '/';
    } catch {
      return '/';
    }
  }
  return value.startsWith('/') ? value : `/${value}`;
};

const buildUrl = (path) => `${SITE_URL}${ensurePath(path)}`;

const fetchJson = async (endpoint) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) {
      console.warn(`Failed to fetch ${endpoint}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.warn(`Error fetching ${endpoint}:`, error);
    return null;
  }
};

async function generateSitemap() {
  const urls = new Set();
  ['/', '/about', '/products'].forEach((route) => urls.add(buildUrl(route)));

  const [pages, products, updatesIds, navigation] = await Promise.all([
    fetchJson('/content/pages'),
    fetchJson('/content/products'),
    fetchJson('/content/updates/ids'),
    fetchJson('/navigation'),
  ]);

  (pages?.items || []).forEach((page) => {
    if (page.page_slug) {
      urls.add(buildUrl(`/pages/${page.page_slug}`));
    }
  });

  (products?.items || []).forEach((product) => {
    if (product.product_id) {
      urls.add(buildUrl(`/products/${product.product_id}`));
    }
  });

  const channelSet = new Set();
  (updatesIds?.items || []).forEach((item) => {
    if (item.channel) {
      channelSet.add(item.channel);
      if (item.update_id) {
        urls.add(buildUrl(`/updates/${item.channel}/${item.update_id}`));
      }
    }
  });
  channelSet.forEach((channel) => urls.add(buildUrl(`/updates/${channel}`)));

  const traverseNav = (nodes = []) => {
    nodes.forEach((node) => {
      if (node.type === 'section' && node.slug) {
        urls.add(buildUrl(`/sections/${node.slug}`));
      }
      if (node.customPath) {
        urls.add(buildUrl(node.customPath));
      }
      if (Array.isArray(node.children)) {
        traverseNav(node.children);
      }
    });
  };
  traverseNav(navigation?.tree || []);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls)
  .map((loc) => `<url><loc>${loc}</loc></url>`)
  .join('\n')}
</urlset>`;

  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✅ Generated sitemap with ${urls.size} entries at ${outputPath}`);
}

generateSitemap().catch((error) => {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
});
