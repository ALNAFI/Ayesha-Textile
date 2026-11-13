/*
 * Cache version: bump CACHE_VERSION to drop every previous ayesha-* cache.
 *
 * ayesha-static-<version> (STATIC_CACHE)
 *   /_next/static/*  cache-first. Hashed JS, CSS, and Next fonts are immutable.
 *   /icons/*, /manifest.webmanifest, and other font files
 *                    stale-while-revalidate.
 *   Only response.ok is stored. The cache is trimmed to about 150 entries.
 *
 * ayesha-pages-<version> (PAGES_CACHE)
 *   Document navigations, network-first with a 3s timeout.
 *   An OK response that was not redirected is stored under its URL.
 *   Timeout or network failure: retry once, then the cached URL, then any
 *   cached app page ("/" first), then the offline page.
 *   Redirects, 401/403/500, and /login are never stored.
 *
 * Not intercepted: /api/*, RSC fetches, non-GET, and cross-origin requests.
 * Customer data stays in IndexedDB, not in these caches.
 */
const CACHE_VERSION = "v3";
const STATIC_CACHE = `ayesha-static-${CACHE_VERSION}`;
const PAGES_CACHE = `ayesha-pages-${CACHE_VERSION}`;
const STATIC_CACHE_LIMIT = 150;
const NAV_TIMEOUT_MS = 3000;
const NAV_RETRY_MS = 500;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, PAGES_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("ayesha-") && !keep.has(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data.type !== "string") return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "CLEAR_PAGES") {
    event.waitUntil(
      caches.delete(PAGES_CACHE).then(() => {
        const port = event.ports && event.ports[0];
        if (port) port.postMessage({ type: "PAGES_CLEARED" });
        else if (event.source) event.source.postMessage({ type: "PAGES_CLEARED" });
      })
    );
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (isRscRequest(request, url)) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isRevalidatedAsset(url)) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigateWithRetry(request));
  }
});

function isRscRequest(request, url) {
  return (
    url.searchParams.has("_rsc") ||
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree")
  );
}

function isRevalidatedAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname)
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(cache, STATIC_CACHE_LIMIT);
    }
    return response;
  } catch {
    return new Response("", { status: 504 });
  }
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cache, STATIC_CACHE_LIMIT);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  const response = await refresh;
  if (response) return response;
  return new Response("", { status: 504 });
}

async function trimCache(cache, limit) {
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((key) => cache.delete(key)));
}

async function navigateWithRetry(request) {
  try {
    return await settleNavigation(request, await fetchNavigation(request));
  } catch {
    await delay(NAV_RETRY_MS);
    try {
      return await settleNavigation(request, await fetchNavigation(request));
    } catch {
      return cachedPage(request);
    }
  }
}

async function fetchNavigation(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NAV_TIMEOUT_MS);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function settleNavigation(request, response) {
  const path = new URL(request.url).pathname;
  const canStore =
    response.ok &&
    !response.redirected &&
    path !== "/login" &&
    response.status !== 401 &&
    response.status !== 403 &&
    response.status !== 500;
  if (!canStore) return response;

  const cache = await caches.open(PAGES_CACHE);
  await cache.put(request, response.clone());
  return response;
}

async function cachedPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  const exact = await cache.match(request);
  if (exact) return exact;

  const keys = await cache.keys();
  const home = keys.find((key) => new URL(key.url).pathname === "/");
  if (home) {
    const homeResponse = await cache.match(home);
    if (homeResponse) return homeResponse;
  }
  for (const key of keys) {
    if (new URL(key.url).pathname === "/login") continue;
    const response = await cache.match(key);
    if (response) return response;
  }
  return offlinePage();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function offlinePage() {
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Ayesha Textile</title><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:36rem"><h1>Ayesha Textile</h1><p>No connection. Showing saved data when available.</p><p><button type="button" onclick="location.reload()" style="font:inherit;padding:0.5rem 0.9rem">Retry</button></p></body></html>`,
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}
