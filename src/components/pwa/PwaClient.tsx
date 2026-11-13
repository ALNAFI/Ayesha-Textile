"use client";

import { useEffect, useState } from "react";
import { clearCachedPages } from "@/lib/page-cache";

let sessionRedirectStarted = false;

export function PwaClient() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setOffline(!navigator.onLine), 0);
    function sync() {
      setOffline(!navigator.onLine);
    }
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    try {
      void navigator.storage?.persist?.().catch(() => {});
    } catch {
      // Persistence is optional and must not affect the page.
    }

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        })
        .catch(() => {
          // Installation can fail in private modes; the app still works online.
        });
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      if (
        response.status === 401 &&
        isSameOriginApi(input) &&
        window.location.pathname !== "/login"
      ) {
        void expireSession();
      }
      return response;
    };

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      window.fetch = originalFetch;
    };
  }, []);

  if (!offline) return null;

  return (
    <p
      role="status"
      className="border-b border-border bg-surface px-4 py-2 text-center text-sm text-muted"
    >
      No connection. Showing saved data when available.
    </p>
  );
}

function isSameOriginApi(input: RequestInfo | URL): boolean {
  const raw =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  try {
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

async function expireSession() {
  if (sessionRedirectStarted) return;
  sessionRedirectStarted = true;
  await clearCachedPages();
  // A full load must replace a cached app shell. Client-side routing would keep it.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}
