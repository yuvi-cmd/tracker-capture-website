let captures = [];
const MAX_CAPTURES = 1000;

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tracker POST Capture Dashboard</title>
<style>
* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 20px; }
h1 { color: #38bdf8; margin-top: 0; }
.container { max-width: 1200px; margin: 0 auto; }
.card { background: #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: #0f172a; border-radius: 8px; overflow: hidden; }
th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; vertical-align: top; }
th { background: #334155; position: sticky; top: 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; }
tr:hover { background: #1e293b; }
.method { font-weight: bold; color: #67e8f9; font-family: monospace; }
.path { color: #a5b4fc; font-family: monospace; word-break: break-all; }
.pre { background: #020617; padding: 8px; border-radius: 4px; overflow: auto; font-size: 11px; color: #86efac; white-space: pre-wrap; max-height: 200px; }
.btn { background: #3b82f6; color: #fff; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 13px; }
.btn:hover { background: #2563eb; }
.btn-danger { background: #ef4444; }
.btn-danger:hover { background: #dc2626; }
.empty { text-align: center; color: #64748b; padding: 40px; }
.alert { background: #7f1d1d; color: #fecaca; padding: 12px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
.time { color: #94a3b8; font-size: 12px; }
.files { color: #fbbf24; }
.badge { display: inline-block; background: #3b82f6; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <h1><span class="badge">Cloudflare Worker</span> Tracker POST Capture Dashboard</h1>
    <div class="alert">
      ⚠️ Sirf apne authorized device ke liye use karein. Kisi dusre ke phone par bina permission na lagayein.
    </div>
    <p>Worker URL: <code>https://tracker-capture-website.itsalihasan75.workers.dev/</code></p>
    <button class="btn btn-danger" onclick="clearAll()">Saare record clear karein</button>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Samay</th><th>Method</th><th>Endpoint</th><th>Files</th><th>Data / Body</th><th>IP</th></tr></thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>
  </div>
</div>
<script>
let captures = [];
async function load() {
  const r = await fetch('/api/captures');
  captures = await r.json();
  render();
}
function render() {
  const tb = document.getElementById('tbody');
  if (!captures.length) {
    tb.innerHTML = '<tr><td colspan="6" class="empty">Abhi tak koi request capture nahi hui. App se data aane ka intezar karein...</td></tr>';
    return;
  }
  tb.innerHTML = captures.map(c => `
    <tr>
      <td><span class="time">${new Date(c.time).toLocaleString()}</span></td>
      <td><span class="method">${c.method}</span></td>
      <td><span class="path">${c.path}${c.query ? '?' + new URLSearchParams(c.query).toString() : ''}</span></td>
      <td><span class="files">${c.files && c.files.length ? c.files.map(f => '📎 ' + f.originalname + ' (' + (f.size/1024).toFixed(1) + ' KB)').join('<br>') : '—'}</span></td>
      <td><div class="pre">${escapeHtml(typeof c.body === 'string' ? c.body : JSON.stringify(c.body, null, 2)).slice(0, 1500)}</div></td>
      <td>${c.ip}</td>
    </tr>
  `).join('');
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[m]));
}
async function clearAll() {
  if (!confirm('Saare records delete karna chahte ho?')) return;
  await fetch('/api/clear', { method: 'POST' });
  captures = [];
  render();
}
setInterval(load, 3000);
load();
</script>
</body>
</html>`;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
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

  // Root - HTML Dashboard
  if (path === '/') {
    if (method !== 'GET') return new Response('Method not allowed', { status: 405 });
    return new Response(DASHBOARD_HTML, {
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
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
