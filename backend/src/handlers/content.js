const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TABLES = {
  pages: process.env.PAGES_TABLE,
  products: process.env.PRODUCTS_TABLE
};

const KEYS = {
  pages: 'page_slug',
  products: 'product_id'
};

/**
 * Lambda handler for content operations
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, pathParameters = {}, queryStringParameters = {}, body, resource = '', path = '' } = event;
  let contentType = pathParameters?.type; // 'pages' or 'products'
  const contentId = pathParameters?.id;

  if (!contentType) {
    if ((resource && resource.startsWith('/public/pages')) || path.startsWith('/public/pages')) {
      contentType = 'pages';
    } else if ((resource && resource.startsWith('/public/products')) || path.startsWith('/public/products')) {
      contentType = 'products';
    }
  }

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
  };

  try {
    // Validate content type
    if (!TABLES[contentType]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid content type. Must be "pages" or "products".' })
      };
    }

    const tableName = TABLES[contentType];
    const keyName = KEYS[contentType];

    // Route based on HTTP method and path
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id === 'ids') {
          // GET /content/{type}/ids - Get all IDs
          return await getContentIds(tableName, keyName, headers);
        } else if (contentId) {
          // GET /content/{type}/{id} - Get single item
          return await getContentById(tableName, keyName, contentId, headers);
        } else {
          // GET /content/{type}?lang=en - Get all items with optional language/parent filters
          const lang = queryStringParameters?.lang;
          const parentId = queryStringParameters?.parentId;
          return await getContentList(tableName, keyName, { lang, parentId }, headers);
        }

      case 'POST':
        // POST /content/{type}/{id} - Create or update item
        if (!contentId || !body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing content ID or body' })
          };
        }
        return await createOrUpdateContent(tableName, keyName, contentId, JSON.parse(body), headers);

      case 'DELETE':
        // DELETE /content/{type}/{id} - Delete item
        if (!contentId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing content ID' })
          };
        }
        return await deleteContent(tableName, keyName, contentId, headers);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Get all content IDs (for Next.js getStaticPaths)
 */
async function getContentIds(tableName, keyName, headers) {
  const command = new ScanCommand({
    TableName: tableName,
    ProjectionExpression: keyName
  });

  const result = await docClient.send(command);
  const ids = result.Items.map(item => item[keyName]);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ids })
  };
}

/**
 * Get single content by ID
 */
async function getContentById(tableName, keyName, contentId, headers) {
  const command = new GetCommand({
    TableName: tableName,
    Key: { [keyName]: contentId }
  });

  const result = await docClient.send(command);

  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Content not found' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Item)
  };
}

/**
 * Get all content items (with optional language filter)
 */
async function getContentList(tableName, keyName, options, headers) {
  const command = new ScanCommand({
    TableName: tableName
  });

  const result = await docClient.send(command);
  let items = result.Items || [];

  const { lang, parentId } = options || {};

  if (parentId) {
    items = items.filter((item) => item.navigationParentId === parentId);
  }

  // If language is specified, format the response with only that language
  if (lang) {
    items = items.map(item => {
      const filtered = { [keyName]: item[keyName] };

      // Include non-localized metadata fields
      Object.keys(item).forEach((key) => {
        if (!key.endsWith('_zh') && !key.endsWith('_en') && !key.endsWith('_ja') && key !== keyName) {
          filtered[key] = item[key];
        }
      });

      // Extract fields for the specified language
      Object.keys(item).forEach(key => {
        if (key.endsWith(`_${lang}`)) {
          const baseKey = key.replace(`_${lang}`, '');
          filtered[baseKey] = item[key];
        }
      });

      return filtered;
    });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ items })
  };
}

/**
 * Create or update content
 */
async function createOrUpdateContent(tableName, keyName, contentId, data, headers) {
  const item = {
    [keyName]: contentId,
    ...data,
    updatedAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: item
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Content saved successfully', item })
  };
}

/**
 * Delete content
 */
async function deleteContent(tableName, keyName, contentId, headers) {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: { [keyName]: contentId }
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Content deleted successfully' })
  };
}
