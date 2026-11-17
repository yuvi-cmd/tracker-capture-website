let captures = [];
const MAX_CAPTURES = 2000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Serve static assets (index.html) for root path
    if (path === '/' && method === 'GET') {
      if (env.ASSETS) {
        try {
          return await env.ASSETS.fetch(request);
        } catch (e) {
          // Fall through to API if asset not found
        }
      }
      return new Response('index.html not found', { status: 404, headers: cors });
    }

    // API: Get captures
    if (path === '/api/captures' && method === 'GET') {
      return new Response(JSON.stringify(captures, null, 2), {
        headers: { ...cors, 'content-type': 'application/json' }
      });
    }

    // API: Clear captures
    if (path === '/api/clear' && method === 'POST') {
      captures = [];
      return new Response(JSON.stringify({ ok: true, message: 'All records cleared' }), {
        headers: { ...cors, 'content-type': 'application/json' }
      });
    }

    // Any POST - capture APK data
    if (method === 'POST') {
      let bodyPreview = null;
      let fields = {};
      let files = [];

      try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              files.push({
                fieldname: key,
                originalname: value.name,
                mimetype: value.type,
                size: value.size
              });
              fields[key] = '[FILE] ' + value.name;
            } else {
              fields[key] = value;
            }
          }
          bodyPreview = JSON.stringify(fields, null, 2);
        } else {
          const text = await request.text();
          bodyPreview = text;
          const params = new URLSearchParams(text);
          for (const [key, value] of params) fields[key] = value;
        }
      } catch (e) {
        bodyPreview = '[parse error] ' + String(e);
      }

      const cap = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        time: new Date().toISOString(),
        method: 'POST',
        path: path,
        query: Object.fromEntries(url.searchParams),
        headers: Object.fromEntries(request.headers.entries()),
        body: bodyPreview,
        fields: fields,
        files: files,
        ip: request.headers.get('cf-connecting-ip')
      };

      captures.unshift(cap);
      if (captures.length > MAX_CAPTURES) captures.pop();

      return new Response(JSON.stringify({ status: 'ok', captured_id: cap.id }), {
        headers: { ...cors, 'content-type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: cors });
  }
};
