const CLEAR_TIMEOUT_MS = 1000;

/** Deletes saved page shells. Waits for the service worker, but never longer than a second. */
export async function clearCachedPages(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) {
    await deletePageCaches();
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const worker = registration?.active ?? navigator.serviceWorker.controller;
  if (!worker) {
    await deletePageCaches();
    return;
  }

  await Promise.race([
    new Promise<void>((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve();
      worker.postMessage({ type: "CLEAR_PAGES" }, [channel.port2]);
    }),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, CLEAR_TIMEOUT_MS);
    }),
  ]);
}

async function deletePageCaches(): Promise<void> {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("ayesha-pages-"))
      .map((key) => caches.delete(key))
  );
}
