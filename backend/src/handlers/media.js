const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: process.env.REGION });
const MEDIA_BUCKET = process.env.MEDIA_BUCKET;
const MEDIA_CDN_URL = (process.env.MEDIA_CDN_URL || '').replace(/\/$/, '');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const sanitizeSegment = (value = '') =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';

const buildObjectKey = (folder, fileName) => {
  const prefix = sanitizeSegment(folder) || 'uploads';
  const base = sanitizeSegment(fileName);
  const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : crypto.randomBytes(8).toString('hex');
  return `${prefix}/${Date.now()}-${uuid}-${base}`;
};

exports.handler = async (event) => {
  console.log('Media handler event:', event.httpMethod, event.path);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!MEDIA_BUCKET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Media bucket is not configured' }) };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    console.error('Invalid JSON payload', error);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { fileName, contentType, folder = 'uploads' } = payload;
  if (!fileName || !contentType) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'fileName and contentType are required' }) };
  }

  const key = buildObjectKey(folder, fileName);

  try {
    const command = new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });
    const expiresIn = 900;
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    const baseUrl = MEDIA_CDN_URL || `https://${MEDIA_BUCKET}.s3.amazonaws.com`;
    const fileUrl = `${baseUrl}/${key}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl,
        fileUrl,
        key,
        expiresIn,
        bucket: MEDIA_BUCKET,
      }),
    };
  } catch (error) {
    console.error('Failed to generate upload URL', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate upload URL', detail: error.message }),
    };
  }
};
