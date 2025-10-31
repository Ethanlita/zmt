const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate');
const axios = require('axios');

const translateClient = new TranslateClient({ region: process.env.REGION });

/**
 * Lambda handler for services (translate, publish)
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, body } = event;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  try {
    if (path.includes('/translate')) {
      return await handleTranslate(body, headers);
    } else if (path.includes('/publish')) {
      return await handlePublish(headers);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Service not found' })
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
 * Handle translation request
 */
async function handleTranslate(body, headers) {
  if (!body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  const { text, sourceLang = 'zh', targetLang = 'en' } = JSON.parse(body);

  if (!text) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing text to translate' })
    };
  }

  // Map language codes to AWS Translate format
  const langMap = {
    'zh': 'zh',
    'en': 'en',
    'ja': 'ja'
  };

  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: langMap[sourceLang] || sourceLang,
    TargetLanguageCode: langMap[targetLang] || targetLang
  });

  const result = await translateClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      translatedText: result.TranslatedText,
      sourceLang: result.SourceLanguageCode,
      targetLang: result.TargetLanguageCode
    })
  };
}

/**
 * Handle publish request - trigger GitHub Actions
 */
async function handlePublish(headers) {
  const githubPat = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubPat || !githubRepo) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GitHub configuration missing' })
    };
  }

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${githubRepo}/dispatches`,
      {
        event_type: 'content-published'
      },
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${githubPat}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Publish workflow triggered successfully',
        status: response.status
      })
    };
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to trigger publish workflow',
        details: error.response?.data || error.message
      })
    };
  }
}
