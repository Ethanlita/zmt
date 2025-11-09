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
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };

  try {
    if (path.includes('/translate')) {
      return await handleTranslate(body, headers);
    } else if (path.includes('/publish')) {
      return await handlePublish(headers);
    } else if (path.includes('/actions/status')) {
      if (httpMethod !== 'GET') {
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
      }
      return await handleActionsStatus(headers);
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

async function handleActionsStatus(headers) {
  const githubPat = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubPat || !githubRepo) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GitHub configuration missing' })
    };
  }

  const targetWorkflows = [
    { name: 'Deploy Frontend to GitHub Pages', key: 'deploy-frontend' },
    { name: 'pages build and deployment', key: 'pages-build' },
  ];

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${githubRepo}/actions/runs?per_page=30`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${githubPat}`,
        },
      },
    );

    const runs = response.data?.workflow_runs || [];
    const statuses = targetWorkflows.map(({ name, key }) => {
      const matched = runs.find((run) => run.name === name);
      if (!matched) {
        return { name, key, found: false };
      }

      const startedAt = matched.run_started_at || matched.created_at;
      const updatedAt = matched.updated_at || matched.created_at;
      const durationMs =
        startedAt && updatedAt ? new Date(updatedAt).getTime() - new Date(startedAt).getTime() : null;

      return {
        name,
        key,
        found: true,
        status: matched.status,
        conclusion: matched.conclusion,
        run_id: matched.id,
        html_url: matched.html_url,
        created_at: matched.created_at,
        run_started_at: matched.run_started_at,
        updated_at: matched.updated_at,
        duration_ms: durationMs,
        actor: matched.actor
          ? {
              login: matched.actor.login,
              avatar_url: matched.actor.avatar_url,
              html_url: matched.actor.html_url,
            }
          : undefined,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ statuses }),
    };
  } catch (error) {
    console.error('GitHub Actions status error:', error.response?.data || error.message);
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch workflow status',
        details: error.response?.data || error.message,
      }),
    };
  }
}
