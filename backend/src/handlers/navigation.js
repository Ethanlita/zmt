const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const NAV_TABLE = process.env.NAVIGATION_TABLE;
const SETTINGS_TABLE = process.env.SETTINGS_TABLE;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const DEFAULT_NAVIGATION = [
  {
    id: 'about',
    slug: 'about',
    type: 'page',
    order: 0,
    visible: true,
    title: {
      zh: '关于我们',
      en: 'About',
      ja: '会社概要',
    },
    pageSlug: 'about-us',
    customPath: '/about',
    children: [],
  },
  {
    id: 'products',
    slug: 'products',
    type: 'page',
    order: 1,
    visible: true,
    title: {
      zh: '产品',
      en: 'Products',
      ja: '製品',
    },
    pageSlug: 'products',
    customPath: '/products',
    children: [],
  },
];

const DEFAULT_SETTINGS = {
  footer: {
    zh: {
      headline: '尊茗茶业',
      description: '源自云南高山古树，传承百年制茶工艺。',
      legal: '© 2025 尊茗茶业有限公司｜滇ICP备00000000号',
      links: [
        { label: '联系我们', url: 'mailto:info@zunmingtea.com' },
      ],
    },
    en: {
      headline: 'Zunming Tea',
      description: 'Crafted from century-old trees in Yunnan with heritage techniques.',
      legal: '© 2025 Zunming Tea. All rights reserved.',
      links: [
        { label: 'Contact', url: 'mailto:info@zunmingtea.com' },
      ],
    },
    ja: {
      headline: '尊茗茶業',
      description: '雲南の古樹から受け継がれる百年の製茶技術。',
      legal: '© 2025 尊茗茶業株式会社｜すべての権利を保有します。',
      links: [
        { label: 'お問い合わせ', url: 'mailto:info@zunmingtea.com' },
      ],
    },
  },
};

exports.handler = async (event) => {
  console.log('Navigation event:', JSON.stringify(event, null, 2));
  const { httpMethod, path } = event;

  try {
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true }),
      };
    }

    if (path.endsWith('/navigation')) {
      if (httpMethod === 'GET') {
        return await getNavigation();
      }

      if (httpMethod === 'POST') {
        return await saveNavigation(event.body);
      }
    }

    if (path.endsWith('/settings') && httpMethod === 'GET') {
      return await getSettings(false);
    }

    if (path.endsWith('/settings/public') && httpMethod === 'GET') {
      return await getSettings(true);
    }

    if (path.endsWith('/settings/footer') && httpMethod === 'POST') {
      return await saveFooter(event.body);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Navigation handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};

async function getNavigation() {
  const command = new GetCommand({
    TableName: NAV_TABLE,
    Key: { nav_id: 'primary' },
  });

  const result = await docClient.send(command);
  const tree = result.Item?.tree || DEFAULT_NAVIGATION;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ tree, updatedAt: result.Item?.updatedAt || null }),
  };
}

async function saveNavigation(body) {
  if (!body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing request body' }),
    };
  }

  const payload = JSON.parse(body);
  if (!Array.isArray(payload.tree)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Navigation tree must be an array' }),
    };
  }

  const validationError = validateNavigationTree(payload.tree);
  if (validationError) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: validationError }),
    };
  }

  const command = new PutCommand({
    TableName: NAV_TABLE,
    Item: {
      nav_id: 'primary',
      tree: payload.tree,
      updatedAt: new Date().toISOString(),
    },
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Navigation updated successfully' }),
  };
}

function validateNavigationTree(nodes, parentPath = '') {
  const slugSet = new Set();

  for (const node of nodes) {
    if (!node.id || !node.slug) {
      return 'Each node must include id and slug';
    }

    if (slugSet.has(node.slug)) {
      return `Duplicate slug detected under ${parentPath || 'root'}: ${node.slug}`;
    }
    slugSet.add(node.slug);

    if (!node.title || typeof node.title !== 'object') {
      return `Node ${node.id} is missing multi-language title`;
    }

    if (!['section', 'page', 'link', 'dynamic'].includes(node.type)) {
      return `Node ${node.id} has invalid type ${node.type}`;
    }

    if (node.type === 'page' && !node.pageSlug) {
      return `Page node ${node.id} must include pageSlug`;
    }

    if (node.type === 'link' && !node.externalUrl) {
      return `Link node ${node.id} must include externalUrl`;
    }

    if (node.type === 'dynamic' && !node.channel) {
      return `Dynamic node ${node.id} must include channel`;
    }

    if (node.children && node.children.length > 0) {
      const childError = validateNavigationTree(node.children, `${parentPath}/${node.slug}`);
      if (childError) {
        return childError;
      }
    }
  }

  return null;
}

async function getSettings(publicOnly) {
  const command = new GetCommand({
    TableName: SETTINGS_TABLE,
    Key: { settings_id: 'site' },
  });

  const result = await docClient.send(command);
  const settings = result.Item || { settings_id: 'site', ...DEFAULT_SETTINGS };

  if (publicOnly) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ footer: settings.footer || DEFAULT_SETTINGS.footer }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(settings),
  };
}

async function saveFooter(body) {
  if (!body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing request body' }),
    };
  }

  const payload = JSON.parse(body);
  if (!payload.footer || typeof payload.footer !== 'object') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Footer payload must include footer object' }),
    };
  }

  const normalizedFooter = normalizeFooter(payload.footer);

  const command = new PutCommand({
    TableName: SETTINGS_TABLE,
    Item: {
      settings_id: 'site',
      footer: normalizedFooter,
      updatedAt: new Date().toISOString(),
    },
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Footer settings saved successfully' }),
  };
}

function normalizeFooter(footer) {
  const locales = ['zh', 'en', 'ja'];
  const normalized = {};

  locales.forEach((locale) => {
    if (!footer[locale]) {
      return;
    }

    const data = footer[locale];
    normalized[locale] = {
      headline: data.headline || '',
      description: data.description || '',
      legal: data.legal || '',
      links: Array.isArray(data.links)
        ? data.links
            .filter((link) => link && (link.label || link.url))
            .map((link, index) => ({
              label: link.label || `链接${index + 1}`,
              url: link.url || '#',
            }))
        : [],
    };
  });

  return normalized;
}
