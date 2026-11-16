import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Open /logout once on a device that is stuck on an old version.
 * It signs out, wipes the saved app copy, and goes to the login page.
 */
export async function GET() {
  await destroySession();

  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signing out · Ayesha Textile</title><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:36rem"><h1>Signing out…</h1><p>Clearing saved data on this device.</p><noscript><p><a href="/login">Continue to sign in</a></p></noscript><script>
(async function () {
  try {
    if (navigator.serviceWorker) {
      var regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(function (r) { return r.unregister(); }));
    }
  } catch (e) {}
  try {
    if (window.caches) {
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }
  } catch (e) {}
  try {
    if (indexedDB.databases) {
      var dbs = await indexedDB.databases();
      dbs.forEach(function (d) { if (d.name) indexedDB.deleteDatabase(d.name); });
    }
  } catch (e) {}
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  location.replace("/login");
})();
</script></body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Clear-Site-Data": '"cache", "storage"',
    },
  });
}
