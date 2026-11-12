const STATIC_CACHE = "ayesha-static-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("ayesha-static-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirstIcon(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Offline · Ayesha Textile</title><body style=\"font-family:system-ui,sans-serif;padding:2rem;max-width:36rem\"><h1>Ayesha Textile</h1><p>You are offline. Customer balances and Excel files are not shown until the connection returns.</p></body></html>",
            {
              status: 503,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
              },
            }
          )
      )
    );
  }
});

async function cacheFirstIcon(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response("", { status: 504 });
  }
}
